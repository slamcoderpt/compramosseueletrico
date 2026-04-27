const dt = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeStyle: "short",
});

const rel = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

export function formatPtDateTime(d: Date): string {
  return dt.format(d);
}

export function formatPtRelative(d: Date, now: Date = new Date()): string {
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rel.format(diffSec, "second");
  if (abs < 3600) return rel.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rel.format(Math.round(diffSec / 3600), "hour");
  return rel.format(Math.round(diffSec / 86400), "day");
}
