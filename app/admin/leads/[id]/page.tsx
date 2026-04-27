import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Calendar,
  ThumbsDown,
  Clock,
  XCircle,
  Package,
  ChevronLeft,
  Copy,
} from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatEur } from "@/lib/format/currency";
import { formatPtDateTime } from "@/lib/format/date";
import { LeadDeclaration } from "@/components/admin/LeadDeclaration";
import { ProposalForm } from "@/components/admin/ProposalForm";
import { Timeline } from "@/components/admin/Timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// ─── Status badge colours ─────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "oklch(0.48 0.13 185 / 0.15)", color: "oklch(0.65 0.14 185)" },
  IN_REVIEW: { bg: "oklch(0.50 0.12 240 / 0.15)", color: "oklch(0.65 0.12 240)" },
  PROPOSED: { bg: "oklch(0.50 0.12 75 / 0.18)", color: "oklch(0.80 0.16 75)" },
  ACCEPTED: { bg: "oklch(0.35 0.09 145 / 0.20)", color: "oklch(0.72 0.15 145)" },
  SCHEDULED: { bg: "oklch(0.42 0.10 185 / 0.20)", color: "oklch(0.72 0.12 185)" },
  REJECTED: { bg: "oklch(0.45 0.18 25 / 0.18)", color: "oklch(0.72 0.18 25)" },
  EXPIRED: { bg: "oklch(0.35 0.004 220 / 0.18)", color: "oklch(0.55 0.006 220)" },
  LOST: { bg: "oklch(0.30 0.004 220 / 0.18)", color: "oklch(0.48 0.006 220)" },
  COMPLETED: { bg: "oklch(0.35 0.09 145 / 0.25)", color: "oklch(0.70 0.12 145)" },
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  IN_REVIEW: "Em análise",
  PROPOSED: "Proposta enviada",
  ACCEPTED: "Aceite",
  SCHEDULED: "Agendado",
  REJECTED: "Recusado",
  EXPIRED: "Expirado",
  LOST: "Perdido",
  COMPLETED: "Concluído",
};

// ─── Countdown helper ─────────────────────────────────────────────────────────
function expiresCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expirou";
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `expira em ${h}h ${m}m`;
  return `expira em ${m}m`;
}

// ─── Proposal Active Panel (for PROPOSED status) ──────────────────────────────
function ProposedPanel({ proposal }: { proposal: Record<string, unknown> }) {
  const valor = proposal.valor as number | null;
  const expiresAt = proposal.expires_at as string | null;
  const token = proposal.token as string | null;
  const notesInternal = proposal.notes_internal as string | null;

  return (
    <TooltipProvider>
      <div
        className="rounded-lg p-4 flex flex-col gap-4"
        style={{ background: "oklch(0.145 0.013 220)", border: "1px solid oklch(1 0 0 / 7%)" }}
      >
        <div>
          <p
            className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1"
            style={{ fontFamily: "var(--font-mono)", color: "oklch(0.80 0.16 75)" }}
          >
            Proposta ativa
          </p>
          {valor != null && (
            <p
              className="text-2xl font-semibold tabular-nums"
              style={{ fontFamily: "var(--font-mono)", color: "oklch(0.88 0.008 220)" }}
            >
              {formatEur(valor)}
            </p>
          )}
          {expiresAt && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.55 0.006 220)", fontFamily: "var(--font-mono)" }}
            >
              {expiresCountdown(expiresAt)}
            </p>
          )}
        </div>

        {/* Token */}
        {token && (
          <div>
            <p
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "oklch(0.42 0.006 220)" }}
            >
              Token
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs tracking-widest break-all"
                style={{ fontFamily: "var(--font-mono)", color: "oklch(0.65 0.14 185)" }}
              >
                {token}
              </span>
              <button
                type="button"
                data-copy={token}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "oklch(0.48 0.13 185 / 0.12)",
                  color: "oklch(0.65 0.14 185)",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Copiar token"
              >
                <Copy size={10} />
                copiar
              </button>
            </div>
          </div>
        )}

        {/* Disabled action buttons */}
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger className="w-full">
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full opacity-50 cursor-not-allowed pointer-events-none"
                style={{ color: "oklch(0.60 0.008 220)" }}
              >
                Reenviar SMS
              </Button>
            </TooltipTrigger>
            <TooltipContent>Disponível no Plano 3</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="w-full">
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full opacity-50 cursor-not-allowed pointer-events-none"
                style={{ color: "oklch(0.65 0.18 25)" }}
              >
                Cancelar proposta
              </Button>
            </TooltipTrigger>
            <TooltipContent>Disponível no Plano 3</TooltipContent>
          </Tooltip>
        </div>

        {/* Notes internal */}
        {notesInternal && (
          <div
            className="rounded p-3"
            style={{ background: "oklch(0.12 0.010 220)", border: "1px solid oklch(1 0 0 / 6%)" }}
          >
            <p
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "oklch(0.42 0.006 220)" }}
            >
              Notas internas
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 220)" }}>
              {notesInternal}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Status info panel for terminal-state leads ───────────────────────────────
function StatusPanel({
  status,
  proposal,
  booking,
}: {
  status: string;
  proposal: Record<string, unknown> | null;
  booking: Record<string, unknown> | null;
}) {
  const cardStyle = {
    background: "oklch(0.145 0.013 220)",
    border: "1px solid oklch(1 0 0 / 7%)",
    borderRadius: "8px",
    padding: "1rem",
  };

  function formatHour(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("pt-PT", { timeStyle: "short" }).format(new Date(iso));
  }

  function formatDateTime(iso: string | null | undefined) {
    if (!iso) return "—";
    return formatPtDateTime(new Date(iso));
  }

  if (status === "ACCEPTED") {
    const updatedAt = proposal?.updated_at as string | null;
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.35 0.09 145 / 0.20)" }}
          >
            <Check size={16} style={{ color: "oklch(0.72 0.15 145)" }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: "oklch(0.82 0.008 220)" }}
            >
              Cliente aceitou às {formatHour(updatedAt)}, a aguardar marcação.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "SCHEDULED") {
    const scheduledAt = booking?.scheduled_at as string | null;
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.42 0.10 185 / 0.20)" }}
          >
            <Calendar size={16} style={{ color: "oklch(0.72 0.12 185)" }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: "oklch(0.82 0.008 220)" }}
            >
              {scheduledAt
                ? `Visita marcada para ${formatDateTime(scheduledAt)}`
                : "Visita agendada (sem data definida)"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    const updatedAt = proposal?.updated_at as string | null;
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.45 0.18 25 / 0.18)" }}
          >
            <ThumbsDown size={16} style={{ color: "oklch(0.72 0.18 25)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "oklch(0.82 0.008 220)" }}>
              Cliente recusou às {formatHour(updatedAt)}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "EXPIRED") {
    const expiresAt = proposal?.expires_at as string | null;
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.35 0.004 220 / 0.18)" }}
          >
            <Clock size={16} style={{ color: "oklch(0.55 0.006 220)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "oklch(0.82 0.008 220)" }}>
              Proposta expirou em {formatDateTime(expiresAt)}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "LOST") {
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.30 0.004 220 / 0.18)" }}
          >
            <XCircle size={16} style={{ color: "oklch(0.48 0.006 220)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "oklch(0.82 0.008 220)" }}>
              Lead perdido.{" "}
              <span style={{ color: "oklch(0.55 0.006 220)" }}>
                Motivo: sem motivo.
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: "oklch(0.35 0.09 145 / 0.25)" }}
          >
            <Package size={16} style={{ color: "oklch(0.70 0.12 145)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "oklch(0.82 0.008 220)" }}>
              Venda concluída.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceRoleClient();

  // Fetch lead
  const { data: lead } = await service
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  // Parallel data fetches
  const [
    { data: proposalData },
    { data: eventsData },
    { data: bookingsData },
    { data: smsLogData },
  ] = await Promise.all([
    service
      .from("proposals")
      .select("*")
      .eq("lead_id", id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("lead_events")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    service
      .from("bookings")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    service
      .from("sms_log")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const proposal = proposalData ?? null;
  const events = eventsData ?? [];
  const bookings = bookingsData ?? [];
  const smsLog = smsLogData ?? [];
  const latestBooking = bookings[0] ?? null;

  const status: string = lead.status ?? "NEW";
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.NEW;
  const statusLabel = STATUS_LABELS[status] ?? status;

  // Extract name parts for ProposalForm
  const fullName: string = lead.nome ?? "";
  const firstName = fullName.split(" ")[0] ?? fullName;
  const marca: string = lead.marca ?? "";
  const modelo: string = lead.modelo ?? "";

  return (
    <div
      className="min-h-full"
      style={{ background: "oklch(0.11 0.012 220)" }}
    >
      {/* Sub-header / breadcrumb */}
      <div
        className="flex items-center gap-3 px-4 h-9 border-b shrink-0"
        style={{
          background: "oklch(0.13 0.012 220)",
          borderColor: "oklch(1 0 0 / 7%)",
        }}
      >
        <Link
          href="/admin"
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "oklch(0.50 0.008 220)", fontFamily: "var(--font-mono)" }}
        >
          <ChevronLeft size={12} />
          Inbox
        </Link>
        <span style={{ color: "oklch(0.28 0.005 220)" }}>/</span>
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "oklch(0.65 0.14 185)" }}
        >
          {lead.matricula ?? id.slice(0, 8)}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded ml-1"
          style={{
            fontFamily: "var(--font-mono)",
            background: statusStyle.bg,
            color: statusStyle.color,
            letterSpacing: "0.05em",
          }}
        >
          {statusLabel}
        </span>
        <span
          className="ml-auto text-[10px] tabular-nums"
          style={{ fontFamily: "var(--font-mono)", color: "oklch(0.35 0.005 220)" }}
        >
          {id.slice(0, 8)}
        </span>
      </div>

      {/* Main body */}
      <div className="p-4 max-w-[1400px] mx-auto">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* LEFT — Lead declaration (60%) */}
          <div className="flex-1 lg:w-3/5 min-w-0">
            <LeadDeclaration lead={lead} />
          </div>

          {/* RIGHT — Action panel (40%) */}
          <div className="lg:w-2/5 shrink-0">
            {(status === "NEW" || status === "IN_REVIEW") && (
              <ProposalForm
                leadId={lead.id}
                firstName={firstName}
                marca={marca}
                modelo={modelo}
              />
            )}

            {status === "PROPOSED" && proposal && (
              <ProposedPanel proposal={proposal as Record<string, unknown>} />
            )}

            {(status === "ACCEPTED" ||
              status === "SCHEDULED" ||
              status === "REJECTED" ||
              status === "EXPIRED" ||
              status === "LOST" ||
              status === "COMPLETED") && (
              <StatusPanel
                status={status}
                proposal={proposal as Record<string, unknown> | null}
                booking={latestBooking as Record<string, unknown> | null}
              />
            )}
          </div>
        </div>

        {/* Full-width timeline */}
        <Timeline
          events={events as Parameters<typeof Timeline>[0]["events"]}
          sms_log={smsLog as Parameters<typeof Timeline>[0]["sms_log"]}
          bookings={bookings as Parameters<typeof Timeline>[0]["bookings"]}
        />
      </div>
    </div>
  );
}
