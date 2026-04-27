"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Identificação", short: "ID" },
  { label: "Estado", short: "Est" },
  { label: "Bateria", short: "Bat" },
  { label: "Contacto", short: "Con" },
];

export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const stepName = STEPS[current - 1]?.label ?? "";

  return (
    <div className="mb-8 space-y-3">
      {/* Step label */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Passo{" "}
          <span className="text-primary font-semibold">{current}</span>
          {" "}de{" "}
          <span className="font-semibold">{total}</span>
          {" "}—{" "}
          <span className="text-muted-foreground">{stepName}</span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(((current - 1) / total) * 100)}%
        </span>
      </div>

      {/* Segment track */}
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          const isPending = stepNum > current;

          return (
            <div
              key={step.label}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              {/* Segment bar */}
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-all duration-500",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-primary",
                  isPending && "bg-muted"
                )}
              />

              {/* Step dot + icon */}
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  isPending && "border-muted-foreground/30 bg-background text-muted-foreground/50"
                )}
              >
                {isCompleted ? (
                  <Check className="size-3 stroke-[2.5]" />
                ) : (
                  <span className="leading-none">{stepNum}</span>
                )}
              </div>

              {/* Step name — hidden on smallest screens */}
              <span
                className={cn(
                  "hidden text-[10px] font-medium leading-none sm:block",
                  isCompleted && "text-primary",
                  isCurrent && "text-primary",
                  isPending && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
