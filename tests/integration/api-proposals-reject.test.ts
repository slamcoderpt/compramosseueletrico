// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const supabase = createServiceRoleClient();
let leadId: string;
let proposalId: string;
let token: string;

async function seed() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "RJ-PT-01",
      marca: "Renault",
      modelo: "Zoe",
      ano: 2020,
      km: 60000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 88,
      autonomia_real_km: 280,
      carregador_incluido: true,
      nome: "Reject Test",
      telefone: "+351912000088",
      email: "reject@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "PROPOSED",
    })
    .select("id")
    .single();
  leadId = lead!.id;

  token = generateProposalToken();
  const { data: prop } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      valor_eur_cents: 1200000,
      token,
      status: "SENT",
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

async function call(t: string) {
  const { POST } = await import("@/app/api/proposals/[token]/reject/route");
  const req = new Request(`http://localhost:3000/api/proposals/${t}/reject`, {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  return POST(req as any, { params: Promise.resolve({ token: t }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "RJ-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "RJ-PT-01");
});

describe("POST /api/proposals/[token]/reject", () => {
  it("redirects to /recusada and updates state", async () => {
    const res = await call(token);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(new RegExp(`/proposta/${token}/recusada$`));

    const { data: prop } = await supabase.from("proposals").select("status, rejected_at").eq("id", proposalId).single();
    expect(prop?.status).toBe("REJECTED");
    expect(prop?.rejected_at).not.toBeNull();

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("REJECTED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_REJECTED")).toBe(true);
  });

  it("returns 404 for unknown token", async () => {
    const res = await call("yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");
    expect(res.status).toBe(404);
  });

  it("idempotent — second call also redirects to /recusada", async () => {
    await call(token);
    const res2 = await call(token);
    expect(res2.status).toBe(303);
    expect(res2.headers.get("location")).toMatch(/\/recusada$/);
  });
});
