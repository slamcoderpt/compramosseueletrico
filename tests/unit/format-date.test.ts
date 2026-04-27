import { describe, it, expect } from "vitest";
import { formatPtDateTime, formatPtRelative } from "@/lib/format/date";

describe("formatPtDateTime", () => {
  it("formats date and time in pt-PT", () => {
    const d = new Date("2026-04-27T14:30:00Z");
    const out = formatPtDateTime(d);
    expect(out).toMatch(/27.*abril.*2026/i);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatPtRelative", () => {
  it("renders 'há X minutos' for past", () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatPtRelative(past)).toMatch(/há.*minuto/);
  });
});
