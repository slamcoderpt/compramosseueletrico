import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

describe("migration 00001", () => {
  it("creates all 7 tables", async () => {
    const expected = [
      "leads",
      "proposals",
      "events",
      "bookings",
      "sms_log",
      "profiles",
      "gdpr_deletions",
    ];
    // PostgREST only exposes public schema; information_schema is not accessible.
    // Verify each table exists by doing a limit-0 SELECT — PGRST205 means table missing.
    for (const t of expected) {
      const { error } = await supabase.from(t as any).select("*").limit(0);
      expect(error, `table '${t}' should exist but got: ${error?.message}`).toBeNull();
    }
  });

  it("rejects duplicate active lead with same matricula+telefone", async () => {
    const payload = {
      matricula: "AA-11-BB",
      marca: "Tesla",
      modelo: "Model 3",
      versao: "LR",
      ano: 2021,
      km: 50000,
      cor: "branco",
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 92,
      autonomia_real_km: 380,
      carregador_incluido: true,
      nome: "João Teste",
      telefone: "+351912000001",
      email: "joao@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    };
    const a = await supabase.from("leads").insert(payload);
    expect(a.error).toBeNull();
    const b = await supabase.from("leads").insert(payload);
    expect(b.error).not.toBeNull();
    expect(b.error?.code).toBe("23505");
    // cleanup
    await supabase.from("leads").delete().eq("matricula", "AA-11-BB");
  });
});
