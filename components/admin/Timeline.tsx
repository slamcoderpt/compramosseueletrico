import {
  Send,
  Check,
  CheckCheck,
  Plus,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  Clock,
  AlertTriangle,
  MessageSquare,
  Star,
} from "lucide-react";
import { formatPtRelative } from "@/lib/format/date";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeadEvent {
  id: string;
  type: string;
  actor: string | null;
  payload: unknown;
  created_at: string;
}

interface SmsLog {
  id: string;
  status: string | null;
  body: string | null;
  error: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  scheduled_at: string | null;
  status: string | null;
  created_at: string;
}

interface TimelineProps {
  events: LeadEvent[];
  sms_log: SmsLog[];
  bookings: Booking[];
}

// ─── Unified entry type ───────────────────────────────────────────────────────
type EntryKind = "event" | "sms" | "booking";

interface TimelineEntry {
  id: string;
  kind: EntryKind;
  type: string;
  actor: string | null;
  payload: unknown;
  created_at: string;
  // sms extras
  smsBody?: string | null;
  smsError?: string | null;
  // booking extras
  scheduledAt?: string | null;
  bookingStatus?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  LEAD_CREATED: "Lead criado",
  LEAD_UPDATED: "Lead atualizado",
  PROPOSAL_SENT: "Proposta enviada",
  PROPOSAL_VIEWED: "Proposta vista",
  PROPOSAL_ACCEPTED: "Proposta aceite",
  PROPOSAL_REJECTED: "Proposta recusada",
  PROPOSAL_EXPIRED: "Proposta expirou",
  BOOKING_CREATED: "Visita agendada",
  BOOKING_CONFIRMED: "Visita confirmada",
  BOOKING_CANCELLED: "Visita cancelada",
  LEAD_LOST: "Lead perdido",
  LEAD_COMPLETED: "Venda concluída",
  SMS_SENT: "SMS enviado",
  SMS_DELIVERED: "SMS entregue",
  SMS_FAILED: "SMS falhou",
};

function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

function smsStatusLabel(status: string | null): string {
  if (!status) return "SMS";
  const map: Record<string, string> = {
    sent: "SMS enviado",
    delivered: "SMS entregue",
    failed: "SMS falhou",
    undelivered: "SMS não entregue",
    queued: "SMS em fila",
  };
  return map[status.toLowerCase()] ?? `SMS: ${status}`;
}

function bookingLabel(status: string | null): string {
  if (!status) return "Visita";
  const map: Record<string, string> = {
    confirmed: "Visita confirmada",
    cancelled: "Visita cancelada",
    completed: "Visita concluída",
    pending: "Visita pendente",
  };
  return map[status.toLowerCase()] ?? `Visita: ${status}`;
}

function actorDisplay(actor: string | null): string {
  if (!actor) return "sistema";
  if (actor === "system") return "sistema";
  if (actor === "customer") return "cliente";
  if (actor.startsWith("operator:")) {
    const uuid = actor.replace("operator:", "");
    return uuid.slice(0, 8);
  }
  if (actor.length > 20) return actor.slice(0, 8);
  return actor;
}

function isUuidActor(actor: string | null): boolean {
  if (!actor) return false;
  return actor.startsWith("operator:") || actor.length === 36;
}

// ─── Icon resolver ────────────────────────────────────────────────────────────
function EventIcon({ type, kind }: { type: string; kind: EntryKind }) {
  const size = 13;
  const color = "oklch(0.65 0.14 185)";

  if (kind === "sms") {
    if (type === "delivered") return <CheckCheck size={size} style={{ color }} />;
    if (type === "failed" || type === "undelivered") return <AlertTriangle size={size} style={{ color: "oklch(0.65 0.18 25)" }} />;
    return <MessageSquare size={size} style={{ color }} />;
  }

  if (kind === "booking") {
    return <Calendar size={size} style={{ color }} />;
  }

  // events
  const iconMap: Record<string, React.ReactElement> = {
    LEAD_CREATED: <Plus size={size} style={{ color }} />,
    LEAD_UPDATED: <Clock size={size} style={{ color }} />,
    PROPOSAL_SENT: <Send size={size} style={{ color }} />,
    PROPOSAL_VIEWED: <Eye size={size} style={{ color }} />,
    PROPOSAL_ACCEPTED: <ThumbsUp size={size} style={{ color: "oklch(0.65 0.15 145)" }} />,
    PROPOSAL_REJECTED: <ThumbsDown size={size} style={{ color: "oklch(0.65 0.18 25)" }} />,
    PROPOSAL_EXPIRED: <Clock size={size} style={{ color: "oklch(0.50 0.006 220)" }} />,
    BOOKING_CREATED: <Calendar size={size} style={{ color }} />,
    BOOKING_CONFIRMED: <Calendar size={size} style={{ color: "oklch(0.65 0.15 145)" }} />,
    BOOKING_CANCELLED: <X size={size} style={{ color: "oklch(0.65 0.18 25)" }} />,
    LEAD_LOST: <X size={size} style={{ color: "oklch(0.65 0.18 25)" }} />,
    LEAD_COMPLETED: <Star size={size} style={{ color: "oklch(0.75 0.16 75)" }} />,
    SMS_SENT: <Send size={size} style={{ color }} />,
    SMS_DELIVERED: <Check size={size} style={{ color: "oklch(0.65 0.15 145)" }} />,
    SMS_FAILED: <AlertTriangle size={size} style={{ color: "oklch(0.65 0.18 25)" }} />,
  };

  return iconMap[type] ?? <Clock size={size} style={{ color }} />;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Timeline({ events, sms_log, bookings }: TimelineProps) {
  // Merge all entries
  const entries: TimelineEntry[] = [
    ...events.map((e) => ({
      id: `event-${e.id}`,
      kind: "event" as EntryKind,
      type: e.type,
      actor: e.actor,
      payload: e.payload,
      created_at: e.created_at,
    })),
    ...sms_log.map((s) => ({
      id: `sms-${s.id}`,
      kind: "sms" as EntryKind,
      type: s.status ?? "sent",
      actor: "system",
      payload: { body: s.body, error: s.error },
      created_at: s.created_at,
      smsBody: s.body,
      smsError: s.error,
    })),
    ...bookings.map((b) => ({
      id: `booking-${b.id}`,
      kind: "booking" as EntryKind,
      type: b.status ?? "pending",
      actor: "system",
      payload: { scheduled_at: b.scheduled_at, status: b.status },
      created_at: b.created_at,
      scheduledAt: b.scheduled_at,
      bookingStatus: b.status,
    })),
  ];

  // Sort DESC by created_at
  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-10 text-xs rounded-lg"
        style={{
          fontFamily: "var(--font-mono)",
          color: "oklch(0.38 0.005 220)",
          background: "oklch(0.13 0.012 220)",
          border: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        Sem actividade registada.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid oklch(1 0 0 / 7%)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-2"
        style={{
          background: "oklch(0.15 0.013 220)",
          borderColor: "oklch(1 0 0 / 7%)",
        }}
      >
        <p
          className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "oklch(0.48 0.13 185)" }}
        >
          Histórico
        </p>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            background: "oklch(0.48 0.13 185 / 0.12)",
            color: "oklch(0.55 0.10 185)",
          }}
        >
          {entries.length}
        </span>
      </div>

      {/* Entries */}
      <div style={{ background: "oklch(0.13 0.012 220)" }}>
        {entries.map((entry, idx) => {
          const isActor = isUuidActor(entry.actor);
          const label =
            entry.kind === "event"
              ? eventLabel(entry.type)
              : entry.kind === "sms"
              ? smsStatusLabel(entry.type)
              : bookingLabel(entry.bookingStatus ?? null);

          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
              style={{
                borderColor: "oklch(1 0 0 / 4%)",
                background:
                  idx % 2 === 0 ? "oklch(0.13 0.012 220)" : "oklch(0.12 0.010 220)",
              }}
            >
              {/* Icon */}
              <div
                className="shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded"
                style={{ background: "oklch(0.18 0.012 220)" }}
              >
                <EventIcon type={entry.type} kind={entry.kind} />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "oklch(0.82 0.008 220)" }}
                  >
                    {label}
                  </span>

                  {/* Actor */}
                  {entry.actor && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        fontFamily: isActor ? "var(--font-mono)" : undefined,
                        background: "oklch(0.20 0.012 220)",
                        color: "oklch(0.48 0.006 220)",
                        letterSpacing: isActor ? "0.04em" : undefined,
                      }}
                    >
                      {actorDisplay(entry.actor)}
                    </span>
                  )}

                  {/* Relative time */}
                  <span
                    className="text-[10px] ml-auto shrink-0"
                    style={{ fontFamily: "var(--font-mono)", color: "oklch(0.38 0.005 220)" }}
                  >
                    {formatPtRelative(new Date(entry.created_at))}
                  </span>
                </div>

                {/* SMS body */}
                {entry.kind === "sms" && entry.smsBody && (
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "oklch(0.55 0.006 220)" }}
                  >
                    {entry.smsBody}
                  </p>
                )}

                {/* SMS error */}
                {entry.kind === "sms" && entry.smsError && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.65 0.18 25)" }}
                  >
                    Erro: {entry.smsError}
                  </p>
                )}

                {/* Booking scheduled_at */}
                {entry.kind === "booking" && entry.scheduledAt && (
                  <p
                    className="text-xs mt-1"
                    style={{ fontFamily: "var(--font-mono)", color: "oklch(0.55 0.006 220)" }}
                  >
                    {new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "long",
                      timeStyle: "short",
                    }).format(new Date(entry.scheduledAt))}
                  </p>
                )}

                {/* Payload collapsible — only for events */}
                {entry.kind === "event" && entry.payload != null && (
                  <details className="mt-1">
                    <summary
                      className="text-[10px] cursor-pointer select-none"
                      style={{ fontFamily: "var(--font-mono)", color: "oklch(0.38 0.005 220)" }}
                    >
                      JSON
                    </summary>
                    <pre
                      className="text-[10px] mt-1 overflow-x-auto leading-relaxed p-2 rounded"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "oklch(0.55 0.006 220)",
                        background: "oklch(0.10 0.010 220)",
                      }}
                    >
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
