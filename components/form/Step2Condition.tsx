"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── Pill option button ─────────────────────────────────────────── */
interface PillOptionProps {
  value: string;
  label: string;
  selected: boolean;
  onSelect: (value: string) => void;
  hint?: "positive" | "caution" | "negative" | "neutral";
  className?: string;
}

function PillOption({
  value,
  label,
  selected,
  onSelect,
  hint = "neutral",
  className,
}: PillOptionProps) {
  const hintClasses: Record<string, string> = {
    positive:
      "data-[selected=true]:bg-[oklch(0.92_0.06_185)] data-[selected=true]:border-[oklch(0.48_0.13_185)] data-[selected=true]:text-[oklch(0.28_0.10_185)]",
    caution:
      "data-[selected=true]:bg-[oklch(0.96_0.07_75)] data-[selected=true]:border-[oklch(0.70_0.14_75)] data-[selected=true]:text-[oklch(0.38_0.10_75)]",
    negative:
      "data-[selected=true]:bg-[oklch(0.95_0.04_20)] data-[selected=true]:border-[oklch(0.65_0.12_20)] data-[selected=true]:text-[oklch(0.40_0.10_20)]",
    neutral:
      "data-[selected=true]:bg-[oklch(0.92_0.06_185)] data-[selected=true]:border-[oklch(0.48_0.13_185)] data-[selected=true]:text-[oklch(0.28_0.10_185)]",
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-selected={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "relative flex-1 min-w-0 py-2.5 px-2 text-sm font-medium rounded-lg border transition-all duration-150 cursor-pointer",
        "border-border bg-background text-muted-foreground",
        "hover:border-[oklch(0.48_0.13_185)]/60 hover:text-foreground hover:bg-[oklch(0.97_0.02_185)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hintClasses[hint],
        className
      )}
    >
      {selected && (
        <span
          className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {label}
    </button>
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

/* ─── Step 2 ─────────────────────────────────────────────────────── */
export function Step2Condition() {
  const { control, formState } = useFormContext();

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Estado do carro
        </h2>
        <p className="text-sm text-muted-foreground">
          Sê honesto — confirmamos no local.
        </p>
      </div>

      {/* km + num_donos_anteriores — paired on ≥768px */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* km */}
        <FormField
          control={control}
          name="km"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Quilómetros
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={999999}
                    placeholder="ex: 45000"
                    className={cn(
                      "h-11 pr-10",
                      formState.errors.km &&
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

        {/* num_donos_anteriores */}
        <FormField
          control={control}
          name="num_donos_anteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Donos anteriores
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  placeholder="1"
                  className={cn(
                    "h-11",
                    formState.errors.num_donos_anteriores &&
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* cor */}
      <FormField
        control={control}
        name="cor"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Cor{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="ex: Branco Pérola, Azul Metálico"
                className="h-11"
                maxLength={40}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* estado_geral — 4 pills */}
      <FormField
        control={control}
        name="estado_geral"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Estado geral</FormLabel>
            <FormControl>
              <div
                role="radiogroup"
                aria-label="Estado geral"
                className={cn(
                  "flex gap-2",
                  formState.errors.estado_geral && "ring-1 ring-destructive rounded-lg p-0.5"
                )}
              >
                {(
                  [
                    { value: "OPTIMO", label: "Ótimo", hint: "positive" },
                    { value: "BOM", label: "Bom", hint: "positive" },
                    { value: "RAZOAVEL", label: "Razoável", hint: "caution" },
                    { value: "MAU", label: "Mau", hint: "negative" },
                  ] as { value: string; label: string; hint: "positive" | "caution" | "negative" }[]
                ).map((opt) => (
                  <PillOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={field.value === opt.value}
                    onSelect={field.onChange}
                    hint={opt.hint}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* sinistros — 3 pills */}
      <FormField
        control={control}
        name="sinistros"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Sinistros</FormLabel>
            <FormControl>
              <div
                role="radiogroup"
                aria-label="Sinistros"
                className={cn(
                  "flex gap-2",
                  formState.errors.sinistros && "ring-1 ring-destructive rounded-lg p-0.5"
                )}
              >
                {(
                  [
                    { value: "NUNCA", label: "Nunca", hint: "positive" },
                    { value: "LIGEIROS", label: "Ligeiros", hint: "caution" },
                    { value: "GRAVES", label: "Graves", hint: "negative" },
                  ] as { value: string; label: string; hint: "positive" | "caution" | "negative" }[]
                ).map((opt) => (
                  <PillOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={field.value === opt.value}
                    onSelect={field.onChange}
                    hint={opt.hint}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* livro_manutencao — bool pill toggle */}
      <FormField
        control={control}
        name="livro_manutencao"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Livro de manutenção
            </FormLabel>
            <FormControl>
              <div className="mt-1">
                <Controller
                  control={control}
                  name="livro_manutencao"
                  render={({ field: f }) => (
                    <BoolPillToggle
                      value={!!f.value}
                      onChange={f.onChange}
                      hasError={!!formState.errors.livro_manutencao}
                    />
                  )}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
