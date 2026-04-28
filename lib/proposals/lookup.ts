import type { ProposalStatus } from "./state";

export interface ProposalRow {
  id: string;
  lead_id: string;
  token: string;
  status: ProposalStatus;
  valor_eur_cents: number;
  sent_at: string;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  expires_at: string;
  notes_internal: string | null;
}

export type ViewDecision =
  | { action: "SHOW"; proposal: ProposalRow }
  | { action: "REDIRECT"; target: string };

export function decideProposalView(p: ProposalRow): ViewDecision {
  const now = Date.now();
  const expiresMs = new Date(p.expires_at).getTime();

  if (p.status === "EXPIRED" || expiresMs < now) {
    return { action: "REDIRECT", target: `/proposta/${p.token}/expirada` };
  }
  if (p.status === "REJECTED") {
    return { action: "REDIRECT", target: `/proposta/${p.token}/recusada` };
  }
  if (p.status === "ACCEPTED") {
    return { action: "REDIRECT", target: `/proposta/${p.token}/aceite` };
  }
  return { action: "SHOW", proposal: p };
}
