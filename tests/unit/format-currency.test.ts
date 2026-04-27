import { describe, it, expect } from "vitest";
import { formatEur, eurToCents, centsToEur } from "@/lib/format/currency";

describe("formatEur", () => {
  it.each([
    [1234567, "12 345,67 €"],
    [100, "1,00 €"],
    [0, "0,00 €"],
  ])("formats %d cents as %s", (cents, expected) => {
    const norm = (s: string) => s.replace(/\s/g, " ");
    expect(norm(formatEur(cents))).toBe(norm(expected));
  });
});

describe("eurToCents", () => {
  it("converts whole euros", () => {
    expect(eurToCents(150)).toBe(15000);
  });
  it("rounds to nearest cent", () => {
    expect(eurToCents(1.005)).toBe(101);
  });
});

describe("centsToEur", () => {
  it("converts back", () => {
    expect(centsToEur(15000)).toBe(150);
  });
});
