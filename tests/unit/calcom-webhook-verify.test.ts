import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyCalcomSignature } from "@/lib/calcom/webhook-verify";

const SECRET = "test_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyCalcomSignature", () => {
  it("returns true for a valid signature (hex)", () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} });
    const sig = sign(body, SECRET);
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: body })).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} });
    const sig = sign(body, SECRET);
    const tampered = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: { evil: true } });
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: tampered })).toBe(false);
  });

  it("returns false for a wrong secret", () => {
    const body = "x";
    const sig = sign(body, "other_secret_xxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: body })).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(verifyCalcomSignature({ secret: "", signature: "abc", rawBody: "x" })).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(verifyCalcomSignature({ secret: SECRET, signature: "", rawBody: "x" })).toBe(false);
  });

  it("returns false when signature length differs (avoids timingSafeEqual throw)", () => {
    expect(verifyCalcomSignature({ secret: SECRET, signature: "shorthex", rawBody: "x" })).toBe(false);
  });
});
