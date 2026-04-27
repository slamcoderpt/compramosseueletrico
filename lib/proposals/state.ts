export const PROPOSAL_STATUSES = ["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "PROPOSED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "SCHEDULED",
  "COMPLETED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const PROPOSAL_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransitionProposal(from: ProposalStatus, to: ProposalStatus): boolean {
  return PROPOSAL_TRANSITIONS[from].includes(to);
}

const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["IN_REVIEW", "PROPOSED", "LOST"],
  IN_REVIEW: ["PROPOSED", "LOST"],
  PROPOSED: ["ACCEPTED", "REJECTED", "EXPIRED", "LOST"],
  ACCEPTED: ["SCHEDULED", "LOST"],
  REJECTED: ["LOST"],
  EXPIRED: ["LOST"],
  SCHEDULED: ["COMPLETED", "LOST"],
  COMPLETED: [],
  LOST: [],
};

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}
