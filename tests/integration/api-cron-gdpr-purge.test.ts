// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();
let leadIdsToDelete: string[] = [];

async function seed() {
  const oldDate = new Date();
  oldDate.setMonth(oldDate.getMonth() - 13);

  const { data: oldLead } = await supabase
    .from("leads")
    .insert({
      matricula: "OL-PG-01",
      marca: "Renault",
      modelo: "Zoe",
      ano: 2018,
      km: 100000,
      num_donos_anteriores: 2,
      estado_geral: "RAZOAVEL",
      sinistros: "NUNCA",
      livro_manutencao: false,
      bateria_soh_pct: 75,
      autonomia_real_km: 150,
      carregador_incluido: true,
      nome: "Old Rejected",
      telefone: "+351912000222",
      email: "old@test.com",
      rgpd_consent_at: oldDate.toISOString(),
      status: "REJECTED",
      created_at: oldDate.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(oldLead!.id);

  const { data: completedLead } = await supabase
    .from("leads")
    .insert({
      matricula: "RE-CP-01",
      marca: "Tesla",
      modelo: "Model Y",
      ano: 2023,
      km: 5000,
      num_donos_anteriores: 1,
      estado_geral: "OPTIMO",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 99,
      autonomia_real_km: 500,
      carregador_incluido: true,
      nome: "Completed Recent",
      telefone: "+351912000333",
      email: "completed@test.com",
      rgpd_consent_at: oldDate.toISOString(),
      status: "COMPLETED",
      created_at: oldDate.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(completedLead!.id);

  const { data: recent } = await supabase
    .from("leads")
    .insert({
      matricula: "RC-NW-01",
      marca: "Nissan",
      modelo: "Leaf",
      ano: 2021,
      km: 40000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 90,
      autonomia_real_km: 250,
      carregador_incluido: true,
      nome: "Recent New",
      telefone: "+351912000444",
      email: "recent@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    })
    .select("id")
    .single();
  leadIdsToDelete.push(recent!.id);
}

async function call(opts: { authValid?: boolean } = {}) {
  const { GET } = await import("@/app/api/cron/gdpr-purge/route");
  const headers: Record<string, string> = {};
  if (opts.authValid !== false) headers["authorization"] = `Bearer ${SECRET}`;
  const req = new Request("http://localhost:3000/api/cron/gdpr-purge", {
    method: "GET",
    headers,
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
  leadIdsToDelete = [];
  await seed();
});

afterAll(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/gdpr-purge", () => {
  it("deletes old REJECTED/EXPIRED/LOST leads", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.purged).toBeGreaterThanOrEqual(1);

    const { data: old } = await supabase.from("leads").select("id").eq("matricula", "OL-PG-01").maybeSingle();
    expect(old).toBeNull();
  });

  it("preserves COMPLETED leads even if old (10y retention)", async () => {
    await call();
    const { data: completed } = await supabase.from("leads").select("id").eq("matricula", "RE-CP-01").maybeSingle();
    expect(completed).not.toBeNull();
  });

  it("preserves recent leads", async () => {
    await call();
    const { data: recent } = await supabase.from("leads").select("id").eq("matricula", "RC-NW-01").maybeSingle();
    expect(recent).not.toBeNull();
  });

  it("rejects without bearer token", async () => {
    const res = await call({ authValid: false });
    expect(res.status).toBe(401);
  });
});
