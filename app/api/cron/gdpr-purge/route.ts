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

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const cutoffIso = cutoff.toISOString();

  const { data: deleted, error } = await supabase
    .from("leads")
    .delete()
    .in("status", ["REJECTED", "EXPIRED", "LOST"])
    .lt("created_at", cutoffIso)
    .select("id");

  if (error) {
    log.error("gdpr-purge delete failed", { error: error.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  const purged = deleted?.length ?? 0;
  log.info("gdpr-purge complete", { purged, cutoff: cutoffIso });
  return NextResponse.json({ ok: true, purged });
}
