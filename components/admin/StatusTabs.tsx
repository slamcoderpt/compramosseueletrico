"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type LeadStatus =
  | "NEW"
  | "IN_REVIEW"
  | "PROPOSED"
  | "ACCEPTED"
  | "SCHEDULED"
  | "REJECTED"
  | "EXPIRED"
  | "LOST";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Novos",
  IN_REVIEW: "Em revisão",
  PROPOSED: "Proposta enviada",
  ACCEPTED: "Aceites",
  SCHEDULED: "Marcados",
  REJECTED: "Recusados",
  EXPIRED: "Expirados",
  LOST: "Perdidos",
};

export const VISIBLE_STATUSES = Object.keys(STATUS_LABELS) as LeadStatus[];

interface StatusTabsProps {
  activeStatus: LeadStatus;
  counts: Record<string, number>;
  onStatusChange: (status: LeadStatus) => void;
}

export function StatusTabs({
  activeStatus,
  counts,
  onStatusChange,
}: StatusTabsProps) {
  return (
    <Tabs
      value={activeStatus}
      onValueChange={(v) => onStatusChange(v as LeadStatus)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="w-full justify-start gap-0 rounded-none h-9 px-4"
        style={{
          background: "oklch(0.13 0.012 220)",
          borderBottom: "1px solid oklch(1 0 0 / 8%)",
        }}
      >
        {VISIBLE_STATUSES.map((status) => {
          const count = counts[status] ?? 0;
          const isActive = activeStatus === status;
          return (
            <TabsTrigger
              key={status}
              value={status}
              className="h-full rounded-none px-3 text-xs gap-1.5 shrink-0"
              style={
                isActive
                  ? {
                      fontFamily: "var(--font-sans)",
                      color: "oklch(0.90 0.008 220)",
                      borderBottom: "2px solid oklch(0.65 0.14 185)",
                      background: "transparent",
                    }
                  : {
                      fontFamily: "var(--font-sans)",
                      color: "oklch(0.50 0.008 220)",
                    }
              }
            >
              {STATUS_LABELS[status]}
              {count > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded px-1 min-w-[18px] h-4 text-[10px] font-semibold tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: isActive
                      ? "oklch(0.48 0.13 185 / 0.22)"
                      : "oklch(1 0 0 / 0.06)",
                    color: isActive
                      ? "oklch(0.65 0.14 185)"
                      : "oklch(0.45 0.006 220)",
                  }}
                >
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
