import { formatPtRelative } from "@/lib/format/date";

interface AgeBadgeProps {
  createdAt: string | Date;
}

export function AgeBadge({ createdAt }: AgeBadgeProps) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMin = (now.getTime() - date.getTime()) / 60000;

  let bg: string;
  let color: string;

  if (diffMin < 30) {
    bg = "oklch(0.35 0.09 145 / 0.25)";
    color = "oklch(0.75 0.15 145)";
  } else if (diffMin < 50) {
    bg = "oklch(0.50 0.12 75 / 0.25)";
    color = "oklch(0.80 0.16 75)";
  } else if (diffMin < 60) {
    bg = "oklch(0.45 0.18 25 / 0.25)";
    color = "oklch(0.78 0.18 25)";
  } else {
    bg = "oklch(0.35 0.004 220 / 0.25)";
    color = "oklch(0.60 0.006 220)";
  }

  const label = formatPtRelative(date);

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
      style={{
        fontFamily: "var(--font-mono)",
        background: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
