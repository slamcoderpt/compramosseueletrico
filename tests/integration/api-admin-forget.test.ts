// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();
let leadId: string;
let operatorId: string;

async function seed() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", "Operador Principal")
    .single();
  operatorId = profile!.id;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "FG-PT-01",
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
      nome: "Forget Test",
      telefone: "+351912000666",
      email: "forget@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "REJECTED",
    })
    .select("id")
    .single();
  leadId = lead!.id;
}

async function call(opts: { authedAs?: string | null; reason?: string } = {}) {
  const { POST } = await import("@/app/api/admin/leads/[id]/forget/route");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.authedAs !== null) headers["x-test-user"] = opts.authedAs ?? operatorId;

  const req = new Request(`http://localhost:3000/api/admin/leads/${leadId}/forget`, {
    method: "POST",
    headers,
    body: JSON.stringify({ reason: opts.reason ?? "user_request" }),
  });
  return POST(req as any, { params: Promise.resolve({ id: leadId }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "FG-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "FG-PT-01");
});

describe("POST /api/admin/leads/[id]/forget", () => {
  it("deletes lead and writes gdpr_deletions audit row", async () => {
    const res = await call({ reason: "customer_request" });
    expect(res.status).toBe(200);

    const { data: lead } = await supabase.from("leads").select("id").eq("id", leadId).maybeSingle();
    expect(lead).toBeNull();

    const { data: audit } = await supabase
      .from("gdpr_deletions")
      .select("*")
      .eq("deleted_lead_id", leadId)
      .single();
    expect(audit?.reason).toBe("customer_request");
    expect(audit?.deleted_by).toBe(operatorId);
  });

  it("rejects without auth", async () => {
    const res = await call({ authedAs: null });
    expect(res.status).toBe(401);
  });
});
