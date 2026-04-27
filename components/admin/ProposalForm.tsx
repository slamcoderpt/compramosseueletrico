"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  valor: z
    .number({ error: "Insira um valor válido" })
    .int("Apenas valores inteiros")
    .min(100, "Mínimo 100 €")
    .max(200000, "Máximo 200 000 €"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProposalFormProps {
  leadId: string;
  firstName: string;
  marca: string;
  modelo: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProposalForm({ leadId, firstName, marca, modelo }: ProposalFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { valor: undefined, notes: "" },
  });

  const valorWatch = useWatch({ control, name: "valor" });

  const smsPreview =
    `Olá ${firstName || "cliente"}, a nossa proposta para o seu ${marca} ${modelo}: ` +
    `https://compramososeueletrico.pt/p/{token-será-gerado} (válida 48h)`;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          valor: values.valor, // euros — server converts to cents
          notes: values.notes ?? "",
        }),
      });

      if (res.status === 404) {
        const msg = "API endpoint não existe (Task 13 pendente)";
        toast.error(msg);
        setServerError(msg);
        return;
      }

      if (!res.ok) {
        let msg = "Erro ao enviar proposta";
        try {
          const body = await res.json();
          msg = body?.error?.message ?? msg;
        } catch {
          // ignore
        }
        toast.error(msg);
        setServerError(msg);
        return;
      }

      toast.success("Proposta enviada");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      toast.error(msg);
      setServerError(msg);
    }
  };

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-5"
      style={{ background: "oklch(0.145 0.013 220)", border: "1px solid oklch(1 0 0 / 7%)" }}
    >
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-0.5"
          style={{ fontFamily: "var(--font-mono)", color: "oklch(0.48 0.13 185)" }}
        >
          Nova proposta
        </p>
        <p className="text-xs" style={{ color: "oklch(0.50 0.006 220)" }}>
          Será enviada por SMS ao cliente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Valor */}
        <div className="flex flex-col gap-1.5">
          <Label
            className="text-xs"
            style={{ color: "oklch(0.65 0.008 220)" }}
          >
            Valor da proposta
          </Label>
          <InputGroup>
            <InputGroupInput
              type="number"
              step={1}
              min={100}
              max={200000}
              placeholder="0"
              className="text-right"
              style={{ fontFamily: "var(--font-mono)", fontSize: "15px" }}
              aria-invalid={!!errors.valor}
              onChange={(e) => {
                const v = e.target.value;
                setValue("valor", v === "" ? (undefined as unknown as number) : parseInt(v, 10), {
                  shouldValidate: true,
                });
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>€</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {errors.valor && (
            <p className="text-xs" style={{ color: "oklch(0.65 0.15 25)" }}>
              {errors.valor.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label
            className="text-xs"
            style={{ color: "oklch(0.65 0.008 220)" }}
          >
            Notas internas{" "}
            <span style={{ color: "oklch(0.42 0.005 220)" }}>
              (não visíveis ao cliente)
            </span>
          </Label>
          <Textarea
            {...register("notes")}
            maxLength={500}
            rows={3}
            placeholder="Observações, condições especiais…"
            className="text-xs resize-none"
            style={{ color: "oklch(0.82 0.008 220)" }}
            aria-invalid={!!errors.notes}
          />
          {errors.notes && (
            <p className="text-xs" style={{ color: "oklch(0.65 0.15 25)" }}>
              {errors.notes.message}
            </p>
          )}
        </div>

        {/* SMS Preview */}
        <div
          className="rounded p-3"
          style={{ background: "oklch(0.12 0.010 220)", border: "1px solid oklch(1 0 0 / 6%)" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare size={11} style={{ color: "oklch(0.48 0.13 185)" }} />
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "oklch(0.42 0.006 220)" }}
            >
              Pré-visualização SMS
            </span>
          </div>
          <p
            className="text-xs leading-relaxed break-words"
            style={{ fontFamily: "var(--font-mono)", color: "oklch(0.65 0.008 220)" }}
          >
            Olá <span style={{ color: "oklch(0.82 0.008 220)" }}>{firstName || "cliente"}</span>, a
            nossa proposta para o seu{" "}
            <span style={{ color: "oklch(0.82 0.008 220)" }}>
              {marca} {modelo}
            </span>
            {valorWatch ? (
              <>
                {" "}
                <span style={{ color: "oklch(0.75 0.16 75)", fontFamily: "var(--font-mono)" }}>
                  {valorWatch.toLocaleString("pt-PT")} €
                </span>
              </>
            ) : null}
            :{" "}
            <span style={{ color: "oklch(0.48 0.13 185)" }}>
              https://compramososeueletrico.pt/p/
              <span style={{ color: "oklch(0.55 0.10 185)" }}>{"{token-será-gerado}"}</span>
            </span>{" "}
            (válida 48h)
          </p>
          <p className="text-[10px] mt-1" style={{ color: "oklch(0.35 0.005 220)" }}>
            {smsPreview.length} caracteres aprox.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertDescription className="text-xs">{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2"
          style={{
            background: isSubmitting ? "oklch(0.35 0.08 185)" : "oklch(0.48 0.13 185)",
            color: "oklch(0.95 0.005 185)",
            border: "none",
          }}
        >
          <Send size={14} />
          {isSubmitting ? "A enviar…" : "Enviar proposta por SMS"}
        </Button>
      </form>
    </div>
  );
}
