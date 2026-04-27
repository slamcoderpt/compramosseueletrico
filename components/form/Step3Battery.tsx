"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, HelpCircle } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ─── SoH battery bar ───────────────────────────────────────────── */
function SoHBar({ value }: { value: number | undefined }) {
  const pct = typeof value === "number" && !isNaN(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  const color =
    pct >= 80
      ? "bg-[oklch(0.48_0.13_185)]"
      : pct >= 60
      ? "bg-[oklch(0.62_0.12_145)]"
      : pct >= 40
      ? "bg-[oklch(0.75_0.16_75)]"
      : "bg-destructive";

  const BatteryIcon =
    pct >= 75
      ? BatteryFull
      : pct >= 50
      ? BatteryMedium
      : pct >= 25
      ? BatteryLow
      : BatteryWarning;

  return (
    <div className="flex items-center gap-3 mt-2.5">
      <BatteryIcon
        className={cn(
          "size-5 shrink-0 transition-colors duration-300",
          pct >= 80
            ? "text-[oklch(0.48_0.13_185)]"
            : pct >= 60
            ? "text-[oklch(0.62_0.12_145)]"
            : pct >= 40
            ? "text-[oklch(0.75_0.16_75)]"
            : "text-destructive"
        )}
      />
      <div className="flex-1 relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
            color
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-xs tabular-nums w-10 text-right transition-colors duration-300",
          pct >= 80
            ? "text-[oklch(0.48_0.13_185)]"
            : pct >= 60
            ? "text-[oklch(0.62_0.12_145)]"
            : pct >= 40
            ? "text-[oklch(0.75_0.16_75)]"
            : "text-destructive"
        )}
      >
        {pct > 0 ? `${pct}%` : "—"}
      </span>
    </div>
  );
}

/* ─── Help popover button ────────────────────────────────────────── */
function HelpPopover({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center size-4 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        aria-label="Ajuda"
      >
        <HelpCircle className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm text-muted-foreground leading-relaxed"
        side="top"
        align="start"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Bool pill toggle ───────────────────────────────────────────── */
interface BoolPillProps {
  value: boolean;
  onChange: (v: boolean) => void;
  hasError?: boolean;
}

function BoolPillToggle({ value, onChange, hasError }: BoolPillProps) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex rounded-lg border overflow-hidden",
        hasError ? "border-destructive" : "border-border"
      )}
    >
      {(
        [
          { label: "Sim", val: true },
          { label: "Não", val: false },
        ] as { label: string; val: boolean }[]
      ).map(({ label, val }) => {
        const active = value === val;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(val)}
            className={cn(
              "px-5 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-[oklch(0.48_0.13_185)] text-[oklch(0.98_0.005_185)]"
                : "bg-background text-muted-foreground hover:bg-[oklch(0.97_0.02_185)] hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Step 3 ─────────────────────────────────────────────────────── */
export function Step3Battery() {
  const { control, formState, watch } = useFormContext();
  const sohValue = watch("bateria_soh_pct");

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Bateria e EV
        </h2>
        <p className="text-sm text-muted-foreground">
          A parte que torna a tua avaliação justa.
        </p>
      </div>

      {/* bateria_soh_pct */}
      <FormField
        control={control}
        name="bateria_soh_pct"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1.5">
              <FormLabel className="text-sm font-medium">
                Saúde da bateria (SoH)
              </FormLabel>
              <HelpPopover>
                <p>
                  <span className="font-medium text-foreground">O SoH (State of Health)</span> é a saúde da tua bateria.
                </p>
                <p className="mt-2">Encontra-o em:</p>
                <ul className="mt-1 space-y-1 list-none">
                  <li>• <span className="font-medium text-foreground">Tesla</span> → Service Mode</li>
                  <li>• <span className="font-medium text-foreground">Renault Zoe</span> → app My Renault</li>
                  <li>• <span className="font-medium text-foreground">Outros</span> → menu de bateria do carro ou pede a alguém da marca</li>
                </ul>
                <p className="mt-2 text-xs bg-[oklch(0.96_0.006_185)] text-[oklch(0.28_0.10_185)] rounded-md px-2.5 py-2">
                  Se não souberes, escreve <span className="font-mono font-semibold">90</span>.
                </p>
              </HelpPopover>
            </div>
            <FormControl>
              <div className="space-y-0.5">
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    placeholder="90"
                    className={cn(
                      "h-11 pr-10",
                      formState.errors.bateria_soh_pct &&
                        "border-destructive focus-visible:ring-destructive/20"
                    )}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                    %
                  </span>
                </div>
                <SoHBar value={sohValue} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* autonomia_real_km */}
      <FormField
        control={control}
        name="autonomia_real_km"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1.5">
              <FormLabel className="text-sm font-medium">
                Autonomia real
              </FormLabel>
              <HelpPopover>
                <p>
                  A autonomia real que fazes hoje, com condução normal.
                </p>
                <p className="mt-2 text-xs bg-[oklch(0.96_0.006_185)] text-[oklch(0.28_0.10_185)] rounded-md px-2.5 py-2">
                  Exemplo: se carregas a 100% e fazes 350&nbsp;km, escreve{" "}
                  <span className="font-mono font-semibold">350</span>.
                </p>
              </HelpPopover>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={2000}
                  placeholder="ex: 350"
                  className={cn(
                    "h-11 pr-10",
                    formState.errors.autonomia_real_km &&
                      "border-destructive focus-visible:ring-destructive/20"
                  )}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value)
                    )
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  km
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* carregador_incluido */}
      <FormField
        control={control}
        name="carregador_incluido"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Carregador portátil incluído
            </FormLabel>
            <FormControl>
              <div className="mt-1">
                <Controller
                  control={control}
                  name="carregador_incluido"
                  render={({ field: f }) => (
                    <BoolPillToggle
                      value={!!f.value}
                      onChange={f.onChange}
                      hasError={!!formState.errors.carregador_incluido}
                    />
                  )}
                />
              </div>
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1.5">
              Estás a entregar o carregador portátil junto com o carro?
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
