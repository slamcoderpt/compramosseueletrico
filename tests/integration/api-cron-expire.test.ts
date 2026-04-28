// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();

let leadIds: string[] = [];

async function seedExpired() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "EX-PI-01",
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
      nome: "Expire Test",
      telefone: "+351912000111",
      email: "expire@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "PROPOSED",
    })
    .select("id")
    .single();
  leadIds.push(lead!.id);

  await supabase
    .from("proposals")
    .insert({
      lead_id: lead!.id,
      valor_eur_cents: 1000000,
      token: generateProposalToken(),
      status: "SENT",
      sent_at: new Date(Date.now() - 50 * 60 * 60_000).toISOString(),
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
}

async function call(opts: { authValid?: boolean } = {}) {
  const { GET } = await import("@/app/api/cron/expire-proposals/route");
  const headers: Record<string, string> = {};
  if (opts.authValid !== false) headers["authorization"] = `Bearer ${SECRET}`;
  const req = new Request("http://localhost:3000/api/cron/expire-proposals", {
    method: "GET",
    headers,
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIds) await supabase.from("leads").delete().eq("id", id);
  leadIds = [];
  await seedExpired();
});

afterAll(async () => {
  for (const id of leadIds) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/expire-proposals", () => {
  it("expires proposals with expires_at < now(), updates lead", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.expired).toBeGreaterThanOrEqual(1);

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadIds[0]).single();
    expect(lead?.status).toBe("EXPIRED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadIds[0]);
    expect(events?.some((e) => e.type === "PROPOSAL_EXPIRED")).toBe(true);
  });

  it("rejects without bearer token (401)", async () => {
    const res = await call({ authValid: false });
    expect(res.status).toBe(401);
  });

  it("idempotent — second run doesn't re-expire", async () => {
    await call();
    const res2 = await call();
    expect(res2.status).toBe(200);
    const json = await res2.json();
    expect(json.expired).toBe(0);
  });
});
