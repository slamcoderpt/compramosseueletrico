import { NextRequest, NextResponse } from "next/server";
import { fullLeadSchema } from "@/lib/validation/lead-schema";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOperatorEmail, renderNewLeadHtml } from "@/lib/email/resend";
import { logger, withRequestId } from "@/lib/logger";
import { leadsRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  // rate-limit (skip if Upstash env empty)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rl = await leadsRateLimit().limit(`ip:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas submissões. Tenta dentro de uma hora." } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON inválido" } },
      { status: 400 },
    );
  }

  const parsed = fullLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const supabase = createServiceRoleClient();

  const insertPayload = {
    matricula: data.matricula,
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao ?? null,
    ano: data.ano,
    km: data.km,
    cor: data.cor ?? null,
    num_donos_anteriores: data.num_donos_anteriores,
    estado_geral: data.estado_geral,
    sinistros: data.sinistros,
    livro_manutencao: data.livro_manutencao,
    bateria_soh_pct: data.bateria_soh_pct,
    autonomia_real_km: data.autonomia_real_km,
    carregador_incluido: data.carregador_incluido,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    rgpd_consent_at: new Date().toISOString(),
    status: "NEW" as const,
  };

  const { data: lead, error } = await supabase
    .from("leads")
    .insert(insertPayload)
    .select("id, marca, modelo, ano, nome")
    .single();

  if (error) {
    if (error.code === "23505") {
      log.info("duplicate active lead", { matricula: data.matricula });
      return NextResponse.json(
        { ref: "duplicate", message: "Já recebemos a tua avaliação. Vais receber SMS em breve." },
        { status: 200 },
      );
    }
    log.error("lead insert failed", { error: error.message });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Erro interno. Tenta de novo." } },
      { status: 500 },
    );
  }

  await supabase.from("events").insert({
    lead_id: lead.id,
    type: "LEAD_CREATED",
    actor: "customer",
    payload: { ip, requestId },
  });

  // email operador (best-effort — falhas não bloqueiam o cliente)
  try {
    await sendOperatorEmail({
      subject: `novo lead • ${lead.marca} ${lead.modelo} ${lead.ano}`,
      html: renderNewLeadHtml(lead),
    });
  } catch (e) {
    log.warn("operator email failed (non-fatal)", { error: (e as Error).message });
  }

  // ref opaco — não revela id real
  const ref = lead.id.slice(0, 8);
  return NextResponse.json({ ref }, { status: 201 });
}
