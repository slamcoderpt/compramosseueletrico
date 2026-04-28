"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  expiresAt: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ expiresAt }: CountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    function tick() {
      const diff = Math.max(0, target - Date.now());
      setRemaining(diff);
      if (diff === 0) {
        window.location.reload();
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === null) return null;

  if (remaining === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-sm text-destructive font-medium">
        <Clock className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        Expirada
      </span>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground tabular-nums">
      <Clock className="size-3.5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
      expira em{" "}
      <span className="text-foreground font-medium">
        {h > 0 && `${h}h `}{pad(m)}m {pad(s)}s
      </span>
    </span>
  );
}
