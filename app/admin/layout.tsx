import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  viewer: "Visualizador",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .single();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.11 0.012 220)" }}
    >
      {/* Primary header */}
      <header
        className="h-10 flex items-center justify-between px-4 shrink-0 border-b"
        style={{
          background: "oklch(0.14 0.014 220)",
          borderColor: "oklch(1 0 0 / 8%)",
        }}
      >
        {/* Left: Brand + Admin label */}
        <div className="flex items-center gap-2">
          {/* Battery motif — same as public but smaller, teal on dark */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
            style={{ color: "oklch(0.65 0.14 185)" }}
          >
            <rect
              x="3"
              y="4"
              width="16"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect x="19" y="9" width="2" height="5" rx="1" fill="currentColor" />
            <rect x="5" y="6" width="6" height="10" rx="1" fill="currentColor" />
          </svg>
          <span
            className="text-xs font-semibold tracking-tight"
            style={{ color: "oklch(0.85 0.008 220)", fontFamily: "var(--font-sans)" }}
          >
            compramososeueletrico
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              fontFamily: "var(--font-mono)",
              background: "oklch(0.48 0.13 185 / 0.18)",
              color: "oklch(0.65 0.14 185)",
              letterSpacing: "0.08em",
            }}
          >
            ADMIN
          </span>
        </div>

        {/* Right: operator info + sign out */}
        <div className="flex items-center gap-2">
          {profile && (
            <>
              <span
                className="text-xs"
                style={{
                  color: "oklch(0.65 0.008 220)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {profile.display_name}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "oklch(0.48 0.13 185 / 0.12)",
                  color: "oklch(0.65 0.14 185)",
                  letterSpacing: "0.05em",
                }}
              >
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
              <div
                className="w-px h-4"
                style={{ background: "oklch(1 0 0 / 10%)" }}
              />
            </>
          )}
          {/* wired in Task 16 */}
          <Button
            variant="ghost"
            size="xs"
            disabled
            className="text-xs"
            style={{
              color: "oklch(0.50 0.008 220)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Sub-header — reserved for future breadcrumbs/nav */}
      <div
        className="h-0 shrink-0 border-b"
        style={{ borderColor: "oklch(1 0 0 / 5%)" }}
      />

      {/* Body */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
