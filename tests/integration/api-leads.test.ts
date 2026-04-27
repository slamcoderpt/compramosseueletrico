// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

const validPayload = {
  matricula: "BB-22-CC",
  marca: "Renault",
  modelo: "Zoe",
  versao: "Z.E. 50",
  ano: 2020,
  km: 60000,
  cor: "azul",
  num_donos_anteriores: 1,
  estado_geral: "BOM",
  sinistros: "NUNCA",
  livro_manutencao: true,
  bateria_soh_pct: 88,
  autonomia_real_km: 280,
  carregador_incluido: true,
  nome: "Maria Teste",
  telefone: "912000002",
  email: "maria@test.com",
  rgpd: true,
};

async function callApi(body: any) {
  const { POST } = await import("@/app/api/leads/route");
  const req = new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "BB-22-CC");
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "BB-22-CC");
});

describe("POST /api/leads", () => {
  it("creates a lead and returns ref", async () => {
    const res = await callApi(validPayload);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ref).toBeDefined();
    const { data } = await supabase.from("leads").select("*").eq("matricula", "BB-22-CC").single();
    expect(data?.telefone).toBe("+351912000002");
    expect(data?.status).toBe("NEW");
  });

  it("rejects payload without RGPD consent", async () => {
    const res = await callApi({ ...validPayload, rgpd: false });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects fixed-line phone", async () => {
    const res = await callApi({ ...validPayload, telefone: "212345678" });
    expect(res.status).toBe(400);
  });

  it("returns 200 with same-payload duplicate (idempotent UX)", async () => {
    const a = await callApi(validPayload);
    expect(a.status).toBe(201);
    const b = await callApi(validPayload);
    expect([200, 409]).toContain(b.status);
  });

  it("logs LEAD_CREATED event", async () => {
    await callApi(validPayload);
    const { data: leads } = await supabase.from("leads").select("id").eq("matricula", "BB-22-CC").single();
    const { data: events } = await supabase.from("events").select("*").eq("lead_id", leads!.id);
    expect(events?.some((e) => e.type === "LEAD_CREATED")).toBe(true);
  });
});
