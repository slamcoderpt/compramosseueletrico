"use client";

import * as React from "react";
import Link from "next/link";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Car, Clock, ShieldCheck } from "lucide-react";

/* ─── Phone mask helper ──────────────────────────────────────────── */
function applyPhoneMask(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function stripPhoneMask(masked: string): string {
  return masked.replace(/\D/g, "");
}

/* ─── Vehicle recap card ─────────────────────────────────────────── */
function VehicleRecapCard() {
  const marca = useWatch({ name: "marca" });
  const modelo = useWatch({ name: "modelo" });
  const ano = useWatch({ name: "ano" });

  if (!marca || !modelo || !ano) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3.5",
        "bg-[oklch(0.94_0.04_185)] border border-[oklch(0.82_0.08_185)]",
        "text-[oklch(0.28_0.10_185)]"
      )}
      aria-label="Resumo do veículo"
    >
      <Car
        className="mt-0.5 size-4 shrink-0 text-[oklch(0.48_0.13_185)]"
        aria-hidden="true"
      />
      <p className="text-sm leading-snug">
        Vais receber proposta para o teu{" "}
        <span className="font-semibold">
          {marca} {modelo}
        </span>{" "}
        <span className="opacity-75">({ano})</span>.
      </p>
    </div>
  );
}

/* ─── Consent block ──────────────────────────────────────────────── */
function ConsentBlock() {
  const { control, formState } = useFormContext();
  const rgpdError = formState.errors.rgpd;

  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-4 space-y-3",
        "bg-[oklch(0.97_0.015_75)] dark:bg-[oklch(0.20_0.015_75)]",
        rgpdError
          ? "border-destructive"
          : "border-[oklch(0.75_0.16_75)/40%]"
      )}
    >
      {/* Security header */}
      <div className="flex items-center gap-2 text-[oklch(0.38_0.10_75)]">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Privacidade & Consentimento
        </span>
      </div>

      <FormField
        control={control}
        name="rgpd"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 space-y-0">
            <FormControl>
              <Controller
                control={control}
                name="rgpd"
                render={({ field: f }) => (
                  <Checkbox
                    id="rgpd"
                    checked={f.value === true}
                    onCheckedChange={(checked) => f.onChange(checked === true)}
                    aria-invalid={!!rgpdError}
                    className="mt-0.5 shrink-0"
                  />
                )}
              />
            </FormControl>
            <label
              htmlFor="rgpd"
              className={cn(
                "text-sm leading-relaxed cursor-pointer select-none",
                rgpdError
                  ? "text-destructive"
                  : "text-[oklch(0.32_0.06_75)] dark:text-[oklch(0.82_0.08_75)]"
              )}
            >
              Li e aceito a{" "}
              <Link
                href="/politica-privacidade"
                className="font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                política de privacidade
              </Link>{" "}
              e os{" "}
              <Link
                href="/termos"
                className="font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                termos
              </Link>
              . Os meus dados serão usados exclusivamente para avaliar o veículo
              e contactar-me com a proposta.
            </label>
          </FormItem>
        )}
      />

      {rgpdError && (
        <p className="text-destructive text-xs flex items-center gap-1.5" role="alert">
          <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
          {String(rgpdError.message ?? "É obrigatório aceitar a política de privacidade")}
        </p>
      )}
    </div>
  );
}

/* ─── Step 4 ─────────────────────────────────────────────────────── */
export function Step4Contact() {
  const { control, formState } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Onde te encontramos?
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          <p>Vais receber a proposta por SMS dentro de 1 hora útil.</p>
        </div>
      </div>

      {/* Vehicle recap — shown only if steps 1 data is present */}
      <VehicleRecapCard />

      {/* nome */}
      <FormField
        control={control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Nome</FormLabel>
            <FormControl>
              <Input
                {...field}
                id="nome"
                className={cn(
                  "h-11",
                  formState.errors.nome &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                placeholder="ex: João Silva"
                autoComplete="name"
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* telefone — with +351 prefix via input-group */}
      <FormField
        control={control}
        name="telefone"
        render={({ field }) => {
          const displayValue = applyPhoneMask(
            typeof field.value === "string" ? field.value : ""
          );

          return (
            <FormItem>
              <FormLabel className="text-sm font-medium">Telemóvel</FormLabel>
              <FormControl>
                <InputGroup
                  className={cn(
                    "h-11",
                    formState.errors.telefone &&
                      "[&]:border-destructive [&]:ring-destructive/20"
                  )}
                >
                  <InputGroupAddon align="inline-start">
                    <InputGroupText className="text-sm font-mono font-medium select-none">
                      +351
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="telefone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="9XX XXX XXX"
                    autoComplete="tel-national"
                    aria-invalid={!!formState.errors.telefone}
                    value={displayValue}
                    onChange={(e) => {
                      const raw = stripPhoneMask(e.target.value).slice(0, 9);
                      field.onChange(raw);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-full"
                  />
                </InputGroup>
              </FormControl>
              {formState.errors.telefone ? (
                <p className="text-destructive text-sm" role="alert">
                  Apenas aceitamos telemóveis portugueses.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Número português com 9 dígitos, a começar por 9.
                </p>
              )}
            </FormItem>
          );
        }}
      />

      {/* email */}
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Email</FormLabel>
            <FormControl>
              <Input
                {...field}
                id="email"
                type="email"
                className={cn(
                  "h-11",
                  formState.errors.email &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                placeholder="ex: joao@email.com"
                autoComplete="email"
                inputMode="email"
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Divider before consent */}
      <div className="border-t border-border" aria-hidden="true" />

      {/* Consent block — visually prominent */}
      <ConsentBlock />
    </div>
  );
}
