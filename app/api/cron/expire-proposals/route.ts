import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) return false;
  return auth === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data: expiring, error: selErr } = await supabase
    .from("proposals")
    .select("id, lead_id")
    .in("status", ["SENT", "VIEWED"])
    .lt("expires_at", now);

  if (selErr) {
    log.error("expire-proposals select failed", { error: selErr.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  if (!expiring || expiring.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  const ids = expiring.map((p) => p.id);

  await supabase
    .from("proposals")
    .update({ status: "EXPIRED" })
    .in("id", ids);

  const leadIds = expiring.map((p) => p.lead_id);
  await supabase
    .from("leads")
    .update({ status: "EXPIRED", updated_at: now })
    .in("id", leadIds)
    .eq("status", "PROPOSED");

  const events = expiring.map((p) => ({
    lead_id: p.lead_id,
    proposal_id: p.id,
    type: "PROPOSAL_EXPIRED",
    actor: "system",
    payload: { requestId, expiredAt: now },
  }));
  await supabase.from("events").insert(events);

  log.info("expire-proposals batch", { count: expiring.length });
  return NextResponse.json({ ok: true, expired: expiring.length });
}
