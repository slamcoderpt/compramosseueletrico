import { describe, it, expect } from "vitest";
import { decideProposalView, type ProposalRow } from "@/lib/proposals/lookup";

const base: ProposalRow = {
  id: "p1",
  lead_id: "l1",
  token: "tok",
  status: "SENT",
  valor_eur_cents: 1850000,
  sent_at: new Date(Date.now() - 60_000).toISOString(),
  viewed_at: null,
  accepted_at: null,
  rejected_at: null,
  expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  notes_internal: null,
};

describe("decideProposalView", () => {
  it("returns SHOW for SENT and not expired", () => {
    expect(decideProposalView(base).action).toBe("SHOW");
  });

  it("returns SHOW for VIEWED and not expired", () => {
    expect(decideProposalView({ ...base, status: "VIEWED" }).action).toBe("SHOW");
  });

  it("returns REDIRECT to /aceite for ACCEPTED", () => {
    const r = decideProposalView({ ...base, status: "ACCEPTED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/aceite$/);
  });

  it("returns REDIRECT to /recusada for REJECTED", () => {
    const r = decideProposalView({ ...base, status: "REJECTED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/recusada$/);
  });

  it("returns REDIRECT to /expirada for EXPIRED status", () => {
    const r = decideProposalView({ ...base, status: "EXPIRED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/expirada$/);
  });

  it("returns REDIRECT to /expirada when expires_at is in the past", () => {
    const r = decideProposalView({
      ...base,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/expirada$/);
  });
});
