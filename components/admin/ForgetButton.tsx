"use client";

import { useState, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  leadId: string;
  onForgotten?: () => void;
}

const MIN_REASON_CHARS = 3;
const MAX_REASON_CHARS = 200;

export function ForgetButton({ leadId, onForgotten }: Props) {
  const router = useRouter();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= MIN_REASON_CHARS && !isPending;

  function handleConfirm() {
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/leads/${leadId}/forget`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: trimmed }),
        });
        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }
        setOpen(false);
        setReason("");
        onForgotten?.();
        router.replace("/admin");
      } catch (e) {
        console.error(e);
        toast.error("Falhou apagar — vê os logs");
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <AlertDialogTrigger
        className="group inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors hover:brightness-110"
        style={{
          fontFamily: "var(--font-mono)",
          background: "transparent",
          color: "oklch(0.62 0.14 25)",
          border: "1px solid oklch(0.45 0.18 25 / 0.35)",
          letterSpacing: "0.04em",
        }}
      >
        <Trash2
          size={13}
          className="transition-transform group-hover:rotate-[6deg]"
        />
        Apagar dados (RGPD)
      </AlertDialogTrigger>

      <AlertDialogContent
        className="sm:max-w-[480px] gap-0 overflow-hidden p-0"
        style={{
          background: "oklch(0.13 0.012 220)",
          border: "1px solid oklch(0.45 0.18 25 / 0.30)",
          color: "oklch(0.88 0.008 220)",
          boxShadow:
            "0 24px 60px -20px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.45 0.18 25 / 0.10)",
        }}
        onKeyDownCapture={(e) => {
          // Prevent accidental Enter submission from the reason input
          if (
            e.key === "Enter" &&
            (e.target as HTMLElement).tagName === "INPUT"
          ) {
            e.preventDefault();
          }
        }}
      >
        {/* Caution band — like industrial warning tape, but tasteful */}
        <div
          className="relative h-[3px] w-full"
          style={{
            background:
              "repeating-linear-gradient(135deg, oklch(0.45 0.18 25 / 0.45) 0 8px, transparent 8px 16px)",
          }}
        />

        <div className="px-6 pt-6 pb-5">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] rounded-sm"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "oklch(0.45 0.18 25 / 0.16)",
                  color: "oklch(0.78 0.16 25)",
                  border: "1px solid oklch(0.45 0.18 25 / 0.30)",
                }}
              >
                <AlertTriangle size={10} />
                RGPD · Irreversível
              </span>
            </div>

            <AlertDialogTitle
              className="text-[18px] font-semibold leading-tight"
              style={{ color: "oklch(0.92 0.008 220)" }}
            >
              Apagar dados deste lead?
            </AlertDialogTitle>

            <AlertDialogDescription
              className="text-[13px] leading-relaxed"
              style={{ color: "oklch(0.62 0.008 220)" }}
            >
              Vais apagar permanentemente todos os dados deste lead (formulário,
              propostas, eventos, SMS log). Fica registado no audit log de RGPD
              com a razão fornecida. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Reason field */}
          <div className="mt-5 space-y-2">
            <div className="flex items-baseline justify-between">
              <Label
                htmlFor={reasonId}
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "oklch(0.55 0.008 220)",
                }}
              >
                Razão (obrigatória)
              </Label>
              <span
                className="text-[10px] tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color:
                    trimmed.length >= MIN_REASON_CHARS
                      ? "oklch(0.65 0.14 185)"
                      : "oklch(0.42 0.006 220)",
                }}
              >
                {trimmed.length}/{MAX_REASON_CHARS}
              </span>
            </div>
            <Input
              id={reasonId}
              type="text"
              autoComplete="off"
              autoFocus
              maxLength={MAX_REASON_CHARS}
              placeholder="ex: pedido do titular dos dados"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              disabled={isPending}
              className="h-9 text-[13px]"
              style={{
                background: "oklch(0.10 0.010 220)",
                border: "1px solid oklch(1 0 0 / 8%)",
                color: "oklch(0.92 0.008 220)",
                fontFamily: "var(--font-mono)",
              }}
              aria-describedby={`${reasonId}-hint`}
            />
            <p
              id={`${reasonId}-hint`}
              className="text-[10px] leading-snug"
              style={{
                fontFamily: "var(--font-mono)",
                color: "oklch(0.42 0.006 220)",
              }}
            >
              Esta razão fica preservada no audit log mesmo após a eliminação.
            </p>
          </div>
        </div>

        <AlertDialogFooter
          className="gap-2 px-6 py-4 border-t sm:gap-2 flex-col-reverse sm:flex-row"
          style={{
            borderColor: "oklch(1 0 0 / 6%)",
            background: "oklch(0.115 0.011 220)",
          }}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
            style={{
              background: "transparent",
              borderColor: "oklch(1 0 0 / 12%)",
              color: "oklch(0.78 0.008 220)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="font-medium"
            style={{
              background: canSubmit
                ? "oklch(0.45 0.18 25)"
                : "oklch(0.30 0.05 25 / 0.6)",
              color: canSubmit ? "oklch(0.98 0.008 25)" : "oklch(0.62 0.04 25)",
              border: "1px solid oklch(0.55 0.18 25 / 0.5)",
              fontFamily: "var(--font-mono)",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                A eliminar…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Confirmar eliminação
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
