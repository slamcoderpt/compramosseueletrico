import { describe, it, expect } from "vitest";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  fullLeadSchema,
} from "@/lib/validation/lead-schema";

const validStep1 = {
  matricula: "AA-11-BB",
  marca: "Tesla",
  modelo: "Model 3",
  versao: "Long Range",
  ano: 2021,
};
const validStep2 = {
  km: 50000,
  cor: "branco",
  num_donos_anteriores: 1,
  estado_geral: "BOM" as const,
  sinistros: "NUNCA" as const,
  livro_manutencao: true,
};
const validStep3 = {
  bateria_soh_pct: 92,
  autonomia_real_km: 380,
  carregador_incluido: true,
};
const validStep4 = {
  nome: "João Silva",
  telefone: "+351912345678",
  email: "joao@test.com",
  rgpd: true,
};

describe("step schemas", () => {
  it("step1 accepts valid", () => {
    expect(step1Schema.safeParse(validStep1).success).toBe(true);
  });
  it("step1 rejects bad matricula", () => {
    expect(step1Schema.safeParse({ ...validStep1, matricula: "1234" }).success).toBe(false);
  });
  it("step1 rejects ano in future", () => {
    expect(step1Schema.safeParse({ ...validStep1, ano: 2099 }).success).toBe(false);
  });
  it("step2 rejects km > 999999", () => {
    expect(step2Schema.safeParse({ ...validStep2, km: 1000001 }).success).toBe(false);
  });
  it("step2 rejects unknown estado_geral", () => {
    expect(step2Schema.safeParse({ ...validStep2, estado_geral: "OK" as any }).success).toBe(false);
  });
  it("step3 rejects soh > 100", () => {
    expect(step3Schema.safeParse({ ...validStep3, bateria_soh_pct: 150 }).success).toBe(false);
  });
  it("step4 requires rgpd consent", () => {
    expect(step4Schema.safeParse({ ...validStep4, rgpd: false }).success).toBe(false);
  });
  it("step4 rejects fixed-line phone", () => {
    expect(step4Schema.safeParse({ ...validStep4, telefone: "+351212345678" }).success).toBe(false);
  });
  it("full schema combines all + normalizes phone", () => {
    const all = { ...validStep1, ...validStep2, ...validStep3, ...validStep4, telefone: "912345678" };
    const r = fullLeadSchema.safeParse(all);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.telefone).toBe("+351912345678");
  });
});
