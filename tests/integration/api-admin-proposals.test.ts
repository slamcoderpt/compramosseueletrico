// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

let leadId: string;
let operatorId: string;

async function seedLeadAndOperator() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", "Operador Principal")
    .single();
  operatorId = profile!.id;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "TT-99-AA",
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
      nome: "Test Operator Lead",
      telefone: "+351912000099",
      email: "test99@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    })
    .select("id")
    .single();
  leadId = lead!.id;
}

async function callApi(body: any, opts: { authedAs?: string | null } = {}) {
  const { POST } = await import("@/app/api/admin/proposals/route");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.authedAs !== null) {
    headers["x-test-user"] = opts.authedAs ?? operatorId;
  }
  const req = new Request("http://localhost:3000/api/admin/proposals", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("proposals").delete().eq("lead_id", leadId ?? "00000000-0000-0000-0000-000000000000");
  await supabase.from("leads").delete().eq("matricula", "TT-99-AA");
  await seedLeadAndOperator();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "TT-99-AA");
});

describe("POST /api/admin/proposals", () => {
  it("creates a proposal, sends SMS, updates lead to PROPOSED, logs event", async () => {
    const res = await callApi({ leadId, valor: 18500, notes: "carro impecável" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.proposalId).toBeDefined();
    expect(json.token).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const { data: prop } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", json.proposalId)
      .single();
    expect(prop?.valor_eur_cents).toBe(1850000);
    expect(prop?.status).toBe("SENT");
    expect(prop?.sent_by).toBe(operatorId);
    expect(prop?.notes_internal).toBe("carro impecável");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("PROPOSED");

    const { data: events } = await supabase.from("events").select("*").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_SENT")).toBe(true);

    const { data: smsLog } = await supabase.from("sms_log").select("*").eq("lead_id", leadId);
    expect(smsLog?.length).toBe(1);
    expect(smsLog?.[0].body).toContain("Tesla Model 3");
    expect(smsLog?.[0].body).toContain(json.token);
  });

  it("rejects valor < 100", async () => {
    const res = await callApi({ leadId, valor: 50 });
    expect(res.status).toBe(400);
  });

  it("rejects without auth header", async () => {
    const res = await callApi({ leadId, valor: 1000 }, { authedAs: null });
    expect(res.status).toBe(401);
  });

  it("blocks second active proposal for same lead (409)", async () => {
    const a = await callApi({ leadId, valor: 1000 });
    expect(a.status).toBe(201);
    const b = await callApi({ leadId, valor: 2000 });
    expect(b.status).toBe(409);
  });
});
