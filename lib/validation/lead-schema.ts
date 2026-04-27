import { z } from "zod";
import { isPtMobile, normalizePtMobile } from "@/lib/format/phone";

const matriculaRegex = /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;

export const step1Schema = z.object({
  matricula: z
    .string()
    .trim()
    .toUpperCase()
    .regex(matriculaRegex, "Matrícula inválida (formato XX-XX-XX)"),
  marca: z.string().trim().min(1).max(50),
  modelo: z.string().trim().min(1).max(50),
  versao: z.string().trim().max(80).optional().nullable(),
  ano: z.number().int().min(2010).max(new Date().getFullYear() + 1),
});
export type Step1 = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  km: z.number().int().min(0).max(999999),
  cor: z.string().trim().max(40).optional().nullable(),
  num_donos_anteriores: z.number().int().min(0).max(20),
  estado_geral: z.enum(["OPTIMO", "BOM", "RAZOAVEL", "MAU"]),
  sinistros: z.enum(["NUNCA", "LIGEIROS", "GRAVES"]),
  livro_manutencao: z.boolean(),
});
export type Step2 = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  bateria_soh_pct: z.number().int().min(0).max(100),
  autonomia_real_km: z.number().int().min(0).max(2000),
  carregador_incluido: z.boolean(),
});
export type Step3 = z.infer<typeof step3Schema>;

export const step4Schema = z.object({
  nome: z.string().trim().min(2).max(80),
  telefone: z
    .string()
    .trim()
    .refine((v) => isPtMobile(v), "Apenas aceitamos telemóveis portugueses")
    .transform((v) => normalizePtMobile(v)),
  email: z.string().trim().email().max(120),
  rgpd: z.literal(true, { error: "É obrigatório aceitar a política de privacidade" }),
});
export type Step4 = z.infer<typeof step4Schema>;

export const fullLeadSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);
export type FullLead = z.infer<typeof fullLeadSchema>;
