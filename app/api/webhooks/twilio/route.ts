import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTwilioSignature } from "@/lib/sms/webhook-verify";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const STATUS_MAP: Record<string, "QUEUED" | "SENT" | "DELIVERED" | "FAILED"> = {
  queued: "QUEUED",
  sending: "SENT",
  sent: "SENT",
  delivered: "DELIVERED",
  undelivered: "FAILED",
  failed: "FAILED",
};

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const signature = req.headers.get("x-twilio-signature") ?? "";
  const parsedUrl = new URL(req.url);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}${parsedUrl.pathname}${parsedUrl.search}`;

  const text = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => (params[k] = v));

  const ok = verifyTwilioSignature({
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    signature,
    url,
    params,
  });
  if (!ok) {
    log.warn("twilio webhook bad signature");
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const messageSid = params.MessageSid;
  const messageStatus = (params.MessageStatus ?? "").toLowerCase();
  const errorMessage = params.ErrorMessage ?? null;

  const newStatus = STATUS_MAP[messageStatus];
  if (!newStatus) {
    log.info("twilio webhook unhandled status", { messageStatus });
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  const { data: row, error } = await supabase
    .from("sms_log")
    .update({ status: newStatus, error: errorMessage })
    .eq("twilio_sid", messageSid)
    .neq("status", newStatus)
    .select("id, lead_id, proposal_id")
    .maybeSingle();

  if (error) {
    log.error("twilio webhook update failed", { error: error.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  if (row && newStatus === "DELIVERED" && row.lead_id) {
    await supabase.from("events").insert({
      lead_id: row.lead_id,
      proposal_id: row.proposal_id,
      type: "SMS_DELIVERED",
      actor: "system",
      payload: { messageSid, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}
