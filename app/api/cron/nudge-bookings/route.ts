import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms/twilio";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) return false;
  return auth === expected;
}

const NUDGE_AFTER_HOURS = 24;
const LOST_AFTER_DAYS = 7;

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);
  const supabase = createServiceRoleClient();
  const now = Date.now();

  const { data: acceptedLeads, error } = await supabase
    .from("leads")
    .select(
      "id, nome, telefone, marca, modelo, updated_at, proposals(id, token, status, accepted_at, bookings(id))",
    )
    .eq("status", "ACCEPTED");

  if (error) {
    log.error("nudge-bookings select failed", { error: error.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  let nudged = 0;
  let lost = 0;

  for (const lead of acceptedLeads ?? []) {
    const proposals = ((lead as any).proposals ?? []) as Array<{
      id: string;
      token: string;
      status: string;
      accepted_at: string | null;
      bookings: Array<{ id: string }>;
    }>;
    const hasBooking = proposals.some((p) => (p.bookings ?? []).length > 0);
    if (hasBooking) continue;

    const acceptedMs = new Date(lead.updated_at).getTime();
    const ageHours = (now - acceptedMs) / (60 * 60_000);
    const ageDays = ageHours / 24;

    const acceptedProposal = proposals.find((p) => p.status === "ACCEPTED") ?? proposals[0];
    const proposalId = acceptedProposal?.id ?? null;
    const token = acceptedProposal?.token ?? null;

    if (ageDays >= LOST_AFTER_DAYS) {
      await supabase
        .from("leads")
        .update({ status: "LOST", lost_reason: "accepted_no_show_booking" })
        .eq("id", lead.id);
      await supabase.from("events").insert({
        lead_id: lead.id,
        proposal_id: proposalId,
        type: "STATUS_CHANGED",
        actor: "system",
        payload: { from: "ACCEPTED", to: "LOST", reason: "accepted_no_show_booking", requestId },
      });
      lost++;
      continue;
    }

    if (ageHours >= NUDGE_AFTER_HOURS) {
      const { data: recentNudge } = await supabase
        .from("events")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("type", "OPERATOR_NOTE")
        .gte("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
        .limit(1);
      if (recentNudge && recentNudge.length > 0) continue;

      if (token) {
        const firstName = (lead.nome ?? "").split(/\s+/)[0];
        const url = `${process.env.NEXT_PUBLIC_SITE_URL}/proposta/${token}/marcar`;
        const body = `Olá ${firstName}, falta marcares a visita ao nosso local para finalizar a venda do ${lead.marca} ${lead.modelo}. Marca aqui: ${url}`;
        try {
          await sendSms({
            to: lead.telefone,
            body,
            leadId: lead.id,
            proposalId,
          });
        } catch (e) {
          log.warn("nudge SMS failed (non-fatal)", { error: (e as Error).message });
        }
        await supabase.from("events").insert({
          lead_id: lead.id,
          proposal_id: proposalId,
          type: "OPERATOR_NOTE",
          actor: "system",
          payload: { kind: "nudge_booking", requestId },
        });
        nudged++;
      }
    }
  }

  log.info("nudge-bookings batch", { nudged, lost });
  return NextResponse.json({ ok: true, nudged, lost });
}
