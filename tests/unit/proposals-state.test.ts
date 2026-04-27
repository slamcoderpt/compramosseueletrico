import { describe, it, expect } from "vitest";
import {
  canTransitionProposal,
  canTransitionLead,
  PROPOSAL_STATUSES,
  LEAD_STATUSES,
  type ProposalStatus,
  type LeadStatus,
} from "@/lib/proposals/state";

describe("PROPOSAL_STATUSES", () => {
  it("has all 5 statuses", () => {
    expect(PROPOSAL_STATUSES).toEqual(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"]);
  });
});

describe("canTransitionProposal", () => {
  it.each<[ProposalStatus, ProposalStatus, boolean]>([
    ["SENT", "VIEWED", true],
    ["SENT", "ACCEPTED", true],
    ["SENT", "REJECTED", true],
    ["SENT", "EXPIRED", true],
    ["VIEWED", "ACCEPTED", true],
    ["VIEWED", "REJECTED", true],
    ["VIEWED", "EXPIRED", true],
    ["ACCEPTED", "REJECTED", false],
    ["REJECTED", "ACCEPTED", false],
    ["EXPIRED", "ACCEPTED", false],
    ["VIEWED", "SENT", false],
  ])("%s -> %s = %s", (from, to, expected) => {
    expect(canTransitionProposal(from, to)).toBe(expected);
  });
});

describe("canTransitionLead", () => {
  it.each<[LeadStatus, LeadStatus, boolean]>([
    ["NEW", "IN_REVIEW", true],
    ["NEW", "PROPOSED", true],
    ["IN_REVIEW", "PROPOSED", true],
    ["PROPOSED", "ACCEPTED", true],
    ["PROPOSED", "REJECTED", true],
    ["PROPOSED", "EXPIRED", true],
    ["ACCEPTED", "SCHEDULED", true],
    ["SCHEDULED", "COMPLETED", true],
    ["NEW", "LOST", true],
    ["PROPOSED", "LOST", true],
    ["SCHEDULED", "LOST", true],
    ["COMPLETED", "NEW", false],
    ["LOST", "PROPOSED", false],
  ])("%s -> %s = %s", (from, to, expected) => {
    expect(canTransitionLead(from, to)).toBe(expected);
  });
});
