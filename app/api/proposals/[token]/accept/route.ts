import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { proposalActionRateLimit } from "@/lib/ratelimit";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const { token } = await params;
  if (!isValidTokenShape(token)) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rl = await proposalActionRateLimit().limit(`ip:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas tentativas. Tenta de novo em alguns segundos." } },
        { status: 429 },
      );
    }
  }

  const supabase = createServiceRoleClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  if (proposal.status === "ACCEPTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
  }
  if (proposal.status === "REJECTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/recusada`, req.url), 303);
  }
  if (proposal.status === "EXPIRED" || new Date(proposal.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL(`/proposta/${token}/expirada`, req.url), 303);
  }

  const { data: updated } = await supabase
    .from("proposals")
    .update({ status: "ACCEPTED", accepted_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .in("status", ["SENT", "VIEWED"])
    .gt("expires_at", new Date().toISOString())
    .select("id, lead_id")
    .maybeSingle();

  if (!updated) {
    const { data: now } = await supabase
      .from("proposals")
      .select("status")
      .eq("id", proposal.id)
      .single();
    if (now?.status === "ACCEPTED") {
      return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
    }
    return NextResponse.redirect(new URL(`/proposta/${token}/expirada`, req.url), 303);
  }

  await supabase
    .from("leads")
    .update({ status: "ACCEPTED", updated_at: new Date().toISOString() })
    .eq("id", updated.lead_id);

  await supabase.from("events").insert({
    lead_id: updated.lead_id,
    proposal_id: updated.id,
    type: "PROPOSAL_ACCEPTED",
    actor: "customer",
    payload: { ip, requestId },
  });

  log.info("proposal accepted", { proposalId: updated.id });
  return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
}
