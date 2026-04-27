import { describe, it, expect } from "vitest";
import { generateProposalToken, isValidTokenShape } from "@/lib/proposals/tokens";

describe("generateProposalToken", () => {
  it("returns a 32-char URL-safe string", () => {
    const t = generateProposalToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
  it("returns unique tokens", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateProposalToken());
    expect(set.size).toBe(1000);
  });
});

describe("isValidTokenShape", () => {
  it.each([
    [generateProposalToken(), true],
    ["short", false],
    ["with spaces 12345678901234567890123", false],
    ["thirty-two-chars-but-has-no-token-format!", false],
    ["", false],
  ])("validates %s as %s", (input, expected) => {
    expect(isValidTokenShape(input)).toBe(expected);
  });
});
