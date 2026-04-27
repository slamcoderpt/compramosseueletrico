import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";
import { sendSms } from "@/lib/sms/twilio";
import { eurToCents } from "@/lib/format/currency";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  leadId: z.string().uuid(),
  valor: z.number().int().min(100).max(200000),
  notes: z.string().max(500).optional(),
});

async function getOperatorId(req: NextRequest): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") {
    const testUser = req.headers.get("x-test-user");
    if (testUser !== null) return testUser || null;
    // No x-test-user header at all in test env → unauthenticated
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["operator", "admin"].includes(profile.role)) return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const operatorId = await getOperatorId(req);
  if (!operatorId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sessão inválida." } },
      { status: 401 },
    );
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: parsed.error.issues } },
      { status: 400 },
    );
  }
  const { leadId, valor, notes } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, marca, modelo, telefone, nome, status")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Lead não encontrado." } },
      { status: 404 },
    );
  }

  const token = generateProposalToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .insert({
      lead_id: lead.id,
      valor_eur_cents: eurToCents(valor),
      token,
      status: "SENT",
      sent_by: operatorId,
      expires_at: expiresAt,
      notes_internal: notes ?? null,
    })
    .select("id, token")
    .single();

  if (propErr) {
    if (propErr.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Já existe uma proposta ativa para este lead." } },
        { status: 409 },
      );
    }
    log.error("proposal insert failed", { error: propErr.message });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Erro interno." } },
      { status: 500 },
    );
  }

  await supabase.from("leads").update({ status: "PROPOSED", updated_at: new Date().toISOString() }).eq("id", lead.id);

  await supabase.from("events").insert({
    lead_id: lead.id,
    proposal_id: proposal.id,
    type: "PROPOSAL_SENT",
    actor: `operator:${operatorId}`,
    payload: { valor, requestId },
  });

  const firstName = lead.nome.split(/\s+/)[0];
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${proposal.token}`;
  const sms_body = `Olá ${firstName}, a nossa proposta para o seu ${lead.marca} ${lead.modelo}: ${url} (válida 48h)`;

  try {
    await sendSms({
      to: lead.telefone,
      body: sms_body,
      leadId: lead.id,
      proposalId: proposal.id,
    });
  } catch (e) {
    log.warn("SMS send failed (non-fatal)", { error: (e as Error).message });
  }

  return NextResponse.json({ proposalId: proposal.id, token: proposal.token }, { status: 201 });
}
