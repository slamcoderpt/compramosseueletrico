import { describe, it, expect } from "vitest";
import { sendOperatorEmail } from "@/lib/email/resend";

process.env.RESEND_API_KEY = "test_key";
process.env.RESEND_FROM = "noreply@test.dev";
process.env.OPERATOR_EMAIL = "ops@test.dev";

describe("sendOperatorEmail", () => {
  it("sends an email and returns id", async () => {
    const result = await sendOperatorEmail({
      subject: "novo lead Tesla Model 3",
      html: "<p>lead test</p>",
    });
    expect(result.id).toBe("test-email-id");
  });
});
