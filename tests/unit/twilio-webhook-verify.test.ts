import { describe, it, expect, vi } from "vitest";
import { verifyTwilioSignature } from "@/lib/sms/webhook-verify";
import twilio from "twilio";

describe("verifyTwilioSignature", () => {
  it("returns true for a valid signature", () => {
    const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(true);
    const ok = verifyTwilioSignature({
      authToken: "test_token",
      signature: "sig",
      url: "https://example.com/api/webhooks/twilio",
      params: { MessageSid: "SM123", MessageStatus: "delivered" },
    });
    expect(ok).toBe(true);
    spy.mockRestore();
  });

  it("returns false for an invalid signature", () => {
    const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(false);
    const ok = verifyTwilioSignature({
      authToken: "x",
      signature: "bad",
      url: "https://example.com/api/webhooks/twilio",
      params: { MessageSid: "SM123" },
    });
    expect(ok).toBe(false);
    spy.mockRestore();
  });

  it("returns false when authToken is missing", () => {
    const ok = verifyTwilioSignature({
      authToken: "",
      signature: "sig",
      url: "https://example.com",
      params: {},
    });
    expect(ok).toBe(false);
  });
});
