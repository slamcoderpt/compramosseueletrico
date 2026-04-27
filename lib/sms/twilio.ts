import twilio from "twilio";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

let client: ReturnType<typeof twilio> | null = null;
function getClient(): ReturnType<typeof twilio> {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio env missing");
    client = twilio(sid, token);
  }
  return client;
}

export interface SendSmsArgs {
  to: string;
  body: string;
  leadId?: string | null;
  proposalId?: string | null;
}

export interface SendSmsResult {
  smsLogId: string;
  twilioSid: string;
}

export async function sendSms({ to, body, leadId, proposalId }: SendSmsArgs): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient();

  const { data: log, error: logErr } = await supabase
    .from("sms_log")
    .insert({
      lead_id: leadId ?? null,
      proposal_id: proposalId ?? null,
      to_phone: to,
      body,
      status: "QUEUED",
    })
    .select("id")
    .single();
  if (logErr || !log) throw new Error(`sms_log insert failed: ${logErr?.message}`);

  const from = process.env.TWILIO_FROM;
  if (!from) throw new Error("TWILIO_FROM missing");

  const statusCallback = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio?logId=${log.id}`;

  try {
    const msg = await getClient().messages.create({
      from,
      to,
      body,
      statusCallback,
    });
    await supabase
      .from("sms_log")
      .update({ twilio_sid: msg.sid, status: "SENT" })
      .eq("id", log.id);
    return { smsLogId: log.id, twilioSid: msg.sid };
  } catch (e) {
    const err = e as Error;
    logger.error("twilio send failed", { error: err.message, smsLogId: log.id });
    await supabase
      .from("sms_log")
      .update({ status: "FAILED", error: err.message })
      .eq("id", log.id);
    throw err;
  }
}
