import { createServiceRoleClient } from "@/lib/supabase/server";
import { InboxTable } from "@/components/admin/InboxTable";
import { VISIBLE_STATUSES } from "@/components/admin/StatusTabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const service = createServiceRoleClient();

  // Fetch 200 most recent leads
  const { data: leads } = await service
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch counts per visible status
  const countResults = await Promise.all(
    VISIBLE_STATUSES.map(async (status) => {
      const { count } = await service
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      return [status, count ?? 0] as const;
    })
  );

  const initialCounts = Object.fromEntries(countResults);

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 40px)" }}
    >
      <div
        className="flex items-center justify-between px-4 h-9 shrink-0 border-b"
        style={{
          background: "oklch(0.13 0.012 220)",
          borderColor: "oklch(1 0 0 / 7%)",
        }}
      >
        <h1
          className="text-xs font-semibold tracking-wide"
          style={{
            fontFamily: "var(--font-mono)",
            color: "oklch(0.65 0.008 220)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "10px",
          }}
        >
          Caixa de entrada
        </h1>
        <span
          className="text-[10px] tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: "oklch(0.38 0.005 220)",
          }}
        >
          últimos {leads?.length ?? 0} registos
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <InboxTable
          initialLeads={leads ?? []}
          initialCounts={initialCounts}
        />
      </div>
    </div>
  );
}
