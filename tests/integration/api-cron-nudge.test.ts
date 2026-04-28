// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();
let leadIdsToDelete: string[] = [];

async function seedAcceptedNoBooking(opts: { hoursAgo: number; matricula: string }) {
  const acceptedAt = new Date(Date.now() - opts.hoursAgo * 60 * 60_000);
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: opts.matricula,
      marca: "Tesla",
      modelo: "Model 3",
      ano: 2022,
      km: 30000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 95,
      autonomia_real_km: 450,
      carregador_incluido: true,
      nome: "Nudge Test",
      telefone: "+351912000555",
      email: "nudge@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "ACCEPTED",
      updated_at: acceptedAt.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(lead!.id);

  await supabase.from("proposals").insert({
    lead_id: lead!.id,
    valor_eur_cents: 1500000,
    token: generateProposalToken(),
    status: "ACCEPTED",
    sent_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    accepted_at: acceptedAt.toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
  });

  return lead!.id;
}

async function call() {
  const { GET } = await import("@/app/api/cron/nudge-bookings/route");
  const req = new Request("http://localhost:3000/api/cron/nudge-bookings", {
    method: "GET",
    headers: { authorization: `Bearer ${SECRET}` },
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
  leadIdsToDelete = [];
});

afterAll(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/nudge-bookings", () => {
  it("nudges leads ACCEPTED >24h without booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 30, matricula: "ND-30-AA" });

    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nudged).toBeGreaterThanOrEqual(1);

    const { data: smsLog } = await supabase.from("sms_log").select("*").eq("lead_id", id);
    expect(smsLog?.length).toBeGreaterThanOrEqual(1);
  });

  it("auto-LOSTs leads ACCEPTED >7d without booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 8 * 24, matricula: "ND-8D-AA" });

    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.lost).toBeGreaterThanOrEqual(1);

    const { data: lead } = await supabase.from("leads").select("status, lost_reason").eq("id", id).single();
    expect(lead?.status).toBe("LOST");
    expect(lead?.lost_reason).toBe("accepted_no_show_booking");
  });

  it("ignores leads with booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 30, matricula: "ND-WB-AA" });
    const { data: prop } = await supabase.from("proposals").select("id").eq("lead_id", id).single();
    await supabase.from("bookings").insert({
      proposal_id: prop!.id,
      calcom_booking_id: `nudge_test_${Date.now()}`,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      status: "CONFIRMED",
    });

    const res = await call();
    const { data: lead } = await supabase.from("leads").select("status").eq("id", id).single();
    expect(lead?.status).toBe("ACCEPTED");
  });
});
