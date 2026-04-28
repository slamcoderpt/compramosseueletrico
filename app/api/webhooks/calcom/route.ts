import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyCalcomSignature } from "@/lib/calcom/webhook-verify";
import { sendSms } from "@/lib/sms/twilio";
import { sendOperatorEmail } from "@/lib/email/resend";
import { withRequestId } from "@/lib/logger";
import { formatPtDateTime } from "@/lib/format/date";

export const runtime = "nodejs";

interface CalcomPayload {
  triggerEvent: string;
  payload?: {
    uid?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ email?: string; name?: string }>;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const signature = req.headers.get("x-cal-signature-256") ?? "";
  const rawBody = await req.text();

  const ok = verifyCalcomSignature({
    secret: process.env.CALCOM_WEBHOOK_SECRET ?? "",
    signature,
    rawBody,
  });
  if (!ok) {
    log.warn("calcom webhook bad signature");
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  let body: CalcomPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 200 });
  }

  const { triggerEvent, payload } = body;
  if (!payload?.uid) {
    log.warn("calcom webhook without uid");
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  if (triggerEvent === "BOOKING_CREATED") {
    return await handleCreated(supabase, payload, requestId, log);
  }
  if (triggerEvent === "BOOKING_RESCHEDULED") {
    return await handleRescheduled(supabase, payload, requestId, log);
  }
  if (triggerEvent === "BOOKING_CANCELLED") {
    return await handleCancelled(supabase, payload, requestId, log);
  }

  log.info("calcom webhook ignored event", { triggerEvent });
  return NextResponse.json({ ok: true });
}

async function handleCreated(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const proposalToken = (payload.metadata?.proposalToken ?? "") as string;
  if (!proposalToken) {
    log.warn("calcom webhook missing proposalToken metadata", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, leads:lead_id(nome, telefone, marca, modelo)")
    .eq("token", proposalToken)
    .maybeSingle();

  if (!proposal) {
    log.warn("calcom webhook proposal not found", { proposalToken });
    return NextResponse.json({ ok: true });
  }

  const lead = (proposal as any).leads;
  const startTime = payload.startTime ?? new Date().toISOString();

  const { error: insertErr } = await supabase
    .from("bookings")
    .insert({
      proposal_id: proposal.id,
      calcom_booking_id: payload.uid!,
      scheduled_at: startTime,
      status: "CONFIRMED",
    });

  if (insertErr) {
    if (insertErr.code === "23505") {
      log.info("calcom webhook duplicate booking ignored", { uid: payload.uid });
      return NextResponse.json({ ok: true });
    }
    log.error("booking insert failed", { error: insertErr.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  await supabase.from("leads").update({ status: "SCHEDULED" }).eq("id", proposal.lead_id);

  await supabase.from("events").insert({
    lead_id: proposal.lead_id,
    proposal_id: proposal.id,
    type: "BOOKING_CONFIRMED",
    actor: "system",
    payload: { calcom_uid: payload.uid, startTime, requestId },
  });

  if (lead?.telefone) {
    const firstName = (lead.nome ?? "").split(/\s+/)[0] || "";
    const when = formatPtDateTime(new Date(startTime));
    const sms_body = `Olá ${firstName}, a tua marcação para inspecionar o ${lead.marca} ${lead.modelo} está confirmada para ${when}. Vemo-nos lá!`;
    try {
      await sendSms({
        to: lead.telefone,
        body: sms_body,
        leadId: proposal.lead_id,
        proposalId: proposal.id,
      });
    } catch (e) {
      log.warn("confirmation SMS failed (non-fatal)", { error: (e as Error).message });
    }
  }

  try {
    await sendOperatorEmail({
      subject: `marcação confirmada • ${lead?.marca ?? ""} ${lead?.modelo ?? ""}`,
      html: `<p>Marcação confirmada.</p><p>Cliente: ${lead?.nome ?? ""} (${lead?.telefone ?? ""})</p><p>Data: ${formatPtDateTime(new Date(startTime))}</p><p>Booking UID: ${payload.uid}</p>`,
    });
  } catch (e) {
    log.warn("operator email failed (non-fatal)", { error: (e as Error).message });
  }

  return NextResponse.json({ ok: true });
}

async function handleRescheduled(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const startTime = payload.startTime;
  if (!startTime) {
    log.warn("calcom rescheduled without startTime", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .update({ scheduled_at: startTime, status: "RESCHEDULED" })
    .eq("calcom_booking_id", payload.uid!)
    .select("id, proposal_id, proposals:proposal_id(lead_id)")
    .maybeSingle();

  if (!booking) {
    log.warn("calcom rescheduled for unknown booking", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const leadId = (booking as any).proposals?.lead_id;
  if (leadId) {
    await supabase.from("events").insert({
      lead_id: leadId,
      proposal_id: booking.proposal_id,
      type: "BOOKING_RESCHEDULED",
      actor: "customer",
      payload: { calcom_uid: payload.uid, startTime, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}

async function handleCancelled(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("calcom_booking_id", payload.uid!)
    .select("id, proposal_id, proposals:proposal_id(lead_id)")
    .maybeSingle();

  if (!booking) {
    log.warn("calcom cancelled for unknown booking", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const leadId = (booking as any).proposals?.lead_id;
  if (leadId) {
    await supabase.from("leads").update({ status: "ACCEPTED" }).eq("id", leadId);

    await supabase.from("events").insert({
      lead_id: leadId,
      proposal_id: booking.proposal_id,
      type: "BOOKING_CANCELLED",
      actor: "customer",
      payload: { calcom_uid: payload.uid, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}
