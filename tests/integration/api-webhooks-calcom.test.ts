// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createHmac } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_calcom_secret";
process.env.CALCOM_WEBHOOK_SECRET = SECRET;

const supabase = createServiceRoleClient();

let leadId: string;
let proposalId: string;
let token: string;

async function seed() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "CC-44-DD",
      marca: "Tesla",
      modelo: "Model Y",
      ano: 2023,
      km: 20000,
      num_donos_anteriores: 1,
      estado_geral: "OPTIMO",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 98,
      autonomia_real_km: 480,
      carregador_incluido: true,
      nome: "Booking Test",
      telefone: "+351912000044",
      email: "booking@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "ACCEPTED",
    })
    .select("id")
    .single();
  leadId = lead!.id;

  token = generateProposalToken();
  const { data: prop } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      valor_eur_cents: 2200000,
      token,
      status: "ACCEPTED",
      sent_at: new Date(Date.now() - 60_000).toISOString(),
      accepted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 47 * 60 * 60_000).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

async function call(payload: any, opts: { signValid?: boolean } = {}) {
  const body = JSON.stringify(payload);
  const sig = (opts.signValid ?? true) ? sign(body) : "deadbeef".repeat(8);

  const { POST } = await import("@/app/api/webhooks/calcom/route");
  const req = new Request("http://localhost:3000/api/webhooks/calcom", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cal-signature-256": sig,
    },
    body,
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "CC-44-DD");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "CC-44-DD");
});

describe("POST /api/webhooks/calcom", () => {
  it("BOOKING_CREATED: inserts booking, updates lead to SCHEDULED, logs event", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_001",
        startTime: scheduledAt,
        attendees: [{ email: "booking@test.com", name: "Booking Test" }],
        metadata: { proposalToken: token },
      },
    });
    expect(res.status).toBe(200);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("proposal_id", proposalId);
    expect(bookings?.length).toBe(1);
    expect(bookings?.[0].calcom_booking_id).toBe("calcom_uid_001");
    expect(bookings?.[0].status).toBe("CONFIRMED");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("SCHEDULED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "BOOKING_CONFIRMED")).toBe(true);

    const { data: smsLog } = await supabase
      .from("sms_log")
      .select("*")
      .eq("lead_id", leadId);
    expect(smsLog?.length).toBeGreaterThanOrEqual(1);
  });

  it("BOOKING_CREATED: idempotent — second delivery is noop", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const payload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_002",
        startTime: scheduledAt,
        metadata: { proposalToken: token },
      },
    };
    await call(payload);
    const res2 = await call(payload);
    expect(res2.status).toBe(200);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("calcom_booking_id", "calcom_uid_002");
    expect(bookings?.length).toBe(1);
  });

  it("BOOKING_CANCELLED: updates booking + reverts lead to ACCEPTED", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_003", startTime: scheduledAt, metadata: { proposalToken: token } },
    });

    const res = await call({
      triggerEvent: "BOOKING_CANCELLED",
      payload: { uid: "calcom_uid_003" },
    });
    expect(res.status).toBe(200);

    const { data: booking } = await supabase
      .from("bookings")
      .select("status")
      .eq("calcom_booking_id", "calcom_uid_003")
      .single();
    expect(booking?.status).toBe("CANCELLED");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("ACCEPTED");
  });

  it("BOOKING_RESCHEDULED: updates scheduled_at", async () => {
    const t1 = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_004", startTime: t1, metadata: { proposalToken: token } },
    });

    const t2 = new Date(Date.now() + 48 * 60 * 60_000).toISOString();
    const res = await call({
      triggerEvent: "BOOKING_RESCHEDULED",
      payload: { uid: "calcom_uid_004", startTime: t2 },
    });
    expect(res.status).toBe(200);

    const { data: booking } = await supabase
      .from("bookings")
      .select("scheduled_at, status")
      .eq("calcom_booking_id", "calcom_uid_004")
      .single();
    expect(new Date(booking!.scheduled_at).toISOString()).toBe(t2);
    expect(booking?.status).toBe("RESCHEDULED");
  });

  it("rejects invalid signature with 403", async () => {
    const res = await call(
      {
        triggerEvent: "BOOKING_CREATED",
        payload: { uid: "calcom_uid_005", startTime: new Date().toISOString(), metadata: { proposalToken: token } },
      },
      { signValid: false },
    );
    expect(res.status).toBe(403);
  });

  it("returns 200 (warning) when proposalToken is missing", async () => {
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_006", startTime: new Date().toISOString() },
    });
    expect(res.status).toBe(200);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("calcom_booking_id", "calcom_uid_006");
    expect(bookings?.length).toBe(0);
  });

  it("returns 200 (warning) when proposalToken doesn't match any proposal", async () => {
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_007",
        startTime: new Date().toISOString(),
        metadata: { proposalToken: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      },
    });
    expect(res.status).toBe(200);
  });
});
