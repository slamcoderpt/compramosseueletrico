import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().max(200).optional(),
});

async function getOperatorId(req: NextRequest): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") {
    const testUser = req.headers.get("x-test-user");
    if (testUser !== null) return testUser || null;
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceRoleClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["operator", "admin"].includes(profile.role)) return null;
  return user.id;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const operatorId = await getOperatorId(req);
  if (!operatorId) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const { id: leadId } = await params;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {}
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
  }
  const reason = parsed.data.reason ?? "operator_initiated";

  const supabase = createServiceRoleClient();

  await supabase.from("gdpr_deletions").insert({
    deleted_lead_id: leadId,
    reason,
    deleted_by: operatorId,
  });

  const { error: delErr } = await supabase.from("leads").delete().eq("id", leadId);
  if (delErr) {
    log.error("forget lead delete failed", { error: delErr.message, leadId });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  log.info("lead forgotten via RGPD", { leadId, operatorId, reason });
  return NextResponse.json({ ok: true });
}
