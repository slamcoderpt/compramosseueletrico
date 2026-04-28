// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const supabase = createServiceRoleClient();

let leadId: string;
let proposalId: string;
let token: string;

async function seed(opts: { status?: "SENT" | "VIEWED" | "EXPIRED"; expiresInMs?: number } = {}) {
  const status = opts.status ?? "SENT";
  const expiresInMs = opts.expiresInMs ?? 60 * 60_000;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "AC-PT-01",
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
      nome: "Accept Test",
      telefone: "+351912000077",
      email: "accept@test.com",
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
      valor_eur_cents: 1850000,
      token,
      status,
      expires_at: new Date(Date.now() + expiresInMs).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

async function call(t: string) {
  const { POST } = await import("@/app/api/proposals/[token]/accept/route");
  const req = new Request(`http://localhost:3000/api/proposals/${t}/accept`, {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  return POST(req as any, { params: Promise.resolve({ token: t }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
});

describe("POST /api/proposals/[token]/accept", () => {
  it("redirects to /aceite on success and updates state", async () => {
    const res = await call(token);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(new RegExp(`/proposta/${token}/aceite$`));

    const { data: prop } = await supabase.from("proposals").select("status, accepted_at").eq("id", proposalId).single();
    expect(prop?.status).toBe("ACCEPTED");
    expect(prop?.accepted_at).not.toBeNull();

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("ACCEPTED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_ACCEPTED")).toBe(true);
  });

  it("returns 404 for unknown token", async () => {
    const res = await call("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(res.status).toBe(404);
  });

  it("redirects to /expirada if proposal already expired", async () => {
    await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
    await seed({ expiresInMs: -1000 });
    const res = await call(token);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(/\/expirada$/);
  });

  it("idempotent — second call still redirects to /aceite", async () => {
    await call(token);
    const res2 = await call(token);
    expect(res2.status).toBe(303);
    expect(res2.headers.get("location")).toMatch(/\/aceite$/);
  });
});
