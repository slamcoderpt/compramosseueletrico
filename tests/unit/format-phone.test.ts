import { describe, it, expect } from "vitest";
import { normalizePtMobile, isPtMobile, maskPhone } from "@/lib/format/phone";

describe("normalizePtMobile", () => {
  it.each([
    ["912345678", "+351912345678"],
    ["+351912345678", "+351912345678"],
    ["00351912345678", "+351912345678"],
    ["351 912 345 678", "+351912345678"],
    [" +351 912-345-678 ", "+351912345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePtMobile(input)).toBe(expected);
  });

  it.each([
    "21 234 5678",
    "212345678",
    "812345678",
    "9123",
    "abcdefghi",
    "",
  ])("rejects %s as not a PT mobile", (input) => {
    expect(() => normalizePtMobile(input)).toThrow();
  });
});

describe("isPtMobile", () => {
  it("returns true for valid mobile", () => {
    expect(isPtMobile("+351912345678")).toBe(true);
  });
  it("returns false for fixed line", () => {
    expect(isPtMobile("+351212345678")).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks middle digits", () => {
    expect(maskPhone("+351912345678")).toBe("+351 9XX XXX 678");
  });
});
