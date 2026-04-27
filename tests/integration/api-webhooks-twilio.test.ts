// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import twilio from "twilio";

const supabase = createServiceRoleClient();
let smsLogId: string;

async function seedSmsLog() {
  const { data } = await supabase
    .from("sms_log")
    .insert({
      to_phone: "+351912000099",
      body: "test body",
      twilio_sid: "SM_webhook_test",
      status: "SENT",
    })
    .select("id")
    .single();
  smsLogId = data!.id;
}

async function call(body: URLSearchParams, signatureValid = true) {
  const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(signatureValid);
  const { POST } = await import("@/app/api/webhooks/twilio/route");
  const req = new Request(`http://localhost:3000/api/webhooks/twilio?logId=${smsLogId}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": "anything",
    },
    body: body.toString(),
  });
  const res = await POST(req as any);
  spy.mockRestore();
  return res;
}

beforeEach(async () => {
  await supabase.from("sms_log").delete().eq("twilio_sid", "SM_webhook_test");
  await seedSmsLog();
});

afterAll(async () => {
  await supabase.from("sms_log").delete().eq("twilio_sid", "SM_webhook_test");
});

describe("POST /api/webhooks/twilio", () => {
  it("updates sms_log status to delivered with valid signature", async () => {
    const params = new URLSearchParams({ MessageSid: "SM_webhook_test", MessageStatus: "delivered" });
    const res = await call(params, true);
    expect(res.status).toBe(200);
    const { data } = await supabase.from("sms_log").select("status").eq("id", smsLogId).single();
    expect(data?.status).toBe("DELIVERED");
  });

  it("rejects invalid signature with 403", async () => {
    const params = new URLSearchParams({ MessageSid: "SM_webhook_test", MessageStatus: "delivered" });
    const res = await call(params, false);
    expect(res.status).toBe(403);
  });

  it("idempotent — same status applied twice doesn't duplicate", async () => {
    const params = new URLSearchParams({ MessageSid: "SM_webhook_test", MessageStatus: "delivered" });
    await call(params, true);
    await call(params, true);
    const { data } = await supabase.from("sms_log").select("status").eq("id", smsLogId).single();
    expect(data?.status).toBe("DELIVERED");
  });

  it("maps failed status correctly", async () => {
    const params = new URLSearchParams({
      MessageSid: "SM_webhook_test",
      MessageStatus: "failed",
      ErrorMessage: "no such number",
    });
    const res = await call(params, true);
    expect(res.status).toBe(200);
    const { data } = await supabase.from("sms_log").select("status, error").eq("id", smsLogId).single();
    expect(data?.status).toBe("FAILED");
    expect(data?.error).toContain("no such number");
  });
});
