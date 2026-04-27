"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronRight, Circle, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { maskPhone } from "@/lib/format/phone";
import { AgeBadge } from "./AgeBadge";
import { StatusTabs, type LeadStatus, STATUS_LABELS, VISIBLE_STATUSES } from "./StatusTabs";
import { Badge } from "@/components/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Lead = Record<string, any>;

interface InboxTableProps {
  initialLeads: Lead[];
  initialCounts: Record<string, number>;
}

const STATUS_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
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

function useSearch(leads: Lead[], query: string) {
  if (!query.trim()) return leads;
  const q = query.toLowerCase();
  return leads.filter((lead) => {
    return (
      lead.matricula?.toLowerCase().includes(q) ||
      lead.telefone?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.marca?.toLowerCase().includes(q) ||
      lead.modelo?.toLowerCase().includes(q)
    );
  });
}

export function InboxTable({ initialLeads, initialCounts }: InboxTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [activeStatus, setActiveStatus] = useState<LeadStatus>("NEW");
  const [query, setQuery] = useState("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const supabaseRef = useRef(createBrowserSupabase());

  // Realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLead = payload.new as Lead;
            setLeads((prev) => [newLead, ...prev]);
            setCounts((prev) => ({
              ...prev,
              [newLead.status]: (prev[newLead.status] ?? 0) + 1,
            }));
            // Highlight for 1.5s
            setNewIds((prev) => new Set(prev).add(newLead.id));
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(newLead.id);
                return next;
              });
            }, 1500);
          } else if (payload.eventType === "UPDATE") {
            const updatedLead = payload.new as Lead;
            const oldLead = payload.old as Lead;
            setLeads((prev) =>
              prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
            );
            if (oldLead.status && updatedLead.status !== oldLead.status) {
              setCounts((prev) => {
                const next = { ...prev };
                if (oldLead.status) {
                  next[oldLead.status] = Math.max(0, (next[oldLead.status] ?? 0) - 1);
                }
                next[updatedLead.status] = (next[updatedLead.status] ?? 0) + 1;
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredByStatus = leads.filter((l) => l.status === activeStatus);
  const searchFiltered = useSearch(filteredByStatus, query);

  const handleClear = useCallback(() => setQuery(""), []);

  return (
    <div
      className="flex flex-col h-full"
      style={{ minHeight: 0 }}
    >
      {/* Tabs */}
      <StatusTabs
        activeStatus={activeStatus}
        counts={counts}
        onStatusChange={setActiveStatus}
      />

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
        style={{
          background: "oklch(0.12 0.012 220)",
          borderColor: "oklch(1 0 0 / 6%)",
        }}
      >
        {/* Search */}
        <div className="relative flex items-center flex-1 max-w-xs">
          <Search
            size={13}
            className="absolute left-2 pointer-events-none"
            style={{ color: "oklch(0.45 0.006 220)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar matrícula, tel, email, marca…"
            className="w-full h-7 rounded text-xs pl-7 pr-6 outline-none"
            style={{
              fontFamily: "var(--font-mono)",
              background: "oklch(0.18 0.012 220)",
              color: "oklch(0.85 0.008 220)",
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-1.5 p-0.5 rounded"
              style={{ color: "oklch(0.45 0.006 220)" }}
              aria-label="Limpar pesquisa"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "oklch(0.65 0.14 185)" }}
            />
            <Circle
              size={8}
              fill="oklch(0.65 0.14 185)"
              strokeWidth={0}
              style={{ color: "oklch(0.65 0.14 185)" }}
              className="relative"
            />
          </span>
          <span
            className="text-[10px] font-medium tracking-wider"
            style={{
              fontFamily: "var(--font-mono)",
              color: "oklch(0.55 0.008 220)",
              letterSpacing: "0.1em",
            }}
          >
            live
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {searchFiltered.length === 0 ? (
          <div
            className="flex items-center justify-center py-16 text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "oklch(0.40 0.006 220)",
            }}
          >
            Sem leads neste estado.
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr
                style={{
                  background: "oklch(0.15 0.012 220)",
                  borderBottom: "1px solid oklch(1 0 0 / 6%)",
                }}
              >
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.42 0.006 220)",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Carro
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.42 0.006 220)",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Cliente
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.42 0.006 220)",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Idade
                </th>
                <th
                  className="text-left px-4 py-2 font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.42 0.006 220)",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Estado
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {searchFiltered.map((lead, idx) => {
                const isNew = newIds.has(lead.id);
                const isEven = idx % 2 === 0;
                const statusStyle = STATUS_BADGE_STYLE[lead.status] ?? {
                  bg: "oklch(0.30 0.004 220 / 0.18)",
                  color: "oklch(0.55 0.006 220)",
                };
                const statusLabel =
                  STATUS_LABELS[lead.status as LeadStatus] ?? lead.status;

                return (
                  <tr
                    key={lead.id}
                    className="group transition-colors"
                    style={{
                      background: isNew
                        ? "oklch(0.65 0.16 75 / 0.08)"
                        : isEven
                        ? "oklch(0.12 0.010 220)"
                        : "oklch(0.13 0.012 220)",
                      borderBottom: "1px solid oklch(1 0 0 / 4%)",
                      animation: isNew
                        ? "lead-highlight 1.5s ease-out forwards"
                        : undefined,
                    }}
                  >
                    {/* Carro */}
                    <td className="px-4 py-2.5 align-middle">
                      <div
                        className="font-medium leading-tight"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: "oklch(0.88 0.008 220)",
                          fontSize: "12px",
                        }}
                      >
                        {[lead.marca, lead.modelo, lead.ano]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                      {lead.versao && (
                        <div
                          className="leading-tight mt-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "oklch(0.48 0.006 220)",
                            fontSize: "11px",
                          }}
                        >
                          {lead.versao}
                        </div>
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-2.5 align-middle">
                      <div
                        className="font-medium leading-tight"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: "oklch(0.85 0.008 220)",
                          fontSize: "12px",
                        }}
                      >
                        {lead.nome ?? lead.name ?? "—"}
                      </div>
                      {lead.telefone && (
                        <div
                          className="leading-tight mt-0.5 tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "oklch(0.50 0.006 220)",
                            fontSize: "11px",
                          }}
                        >
                          {maskPhone(lead.telefone)}
                        </div>
                      )}
                    </td>

                    {/* Idade */}
                    <td className="px-4 py-2.5 align-middle">
                      <AgeBadge createdAt={lead.created_at} />
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-2.5 align-middle">
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {statusLabel}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="pr-3 align-middle">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="flex items-center justify-center w-6 h-6 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          color: "oklch(0.65 0.14 185)",
                          background: "oklch(0.48 0.13 185 / 0.12)",
                        }}
                        aria-label={`Ver lead ${lead.id}`}
                      >
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count footer */}
      <div
        className="shrink-0 px-4 py-1.5 border-t flex items-center"
        style={{
          background: "oklch(0.12 0.010 220)",
          borderColor: "oklch(1 0 0 / 6%)",
        }}
      >
        <span
          className="text-[10px] tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: "oklch(0.38 0.005 220)",
          }}
        >
          {searchFiltered.length} resultado{searchFiltered.length !== 1 ? "s" : ""}
          {query && ` para "${query}"`}
        </span>
      </div>

      <style>{`
        @keyframes lead-highlight {
          0%   { background: oklch(0.65 0.16 75 / 0.18); }
          100% { background: transparent; }
        }
      `}</style>
    </div>
  );
}
