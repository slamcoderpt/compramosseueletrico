import Link from "next/link";
import { ClockFading, RefreshCw, Clock, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PropostaExpiradaPage({ params }: Props) {
  await params; // good hygiene — token available if needed in future

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg mx-auto space-y-10">

        {/* Hero icon */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-muted p-5 ring-1 ring-border">
            <ClockFading
              className="size-12 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Headline + subtext */}
        <div className="space-y-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Esta proposta já expirou.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            As nossas propostas são válidas durante 48 horas. Mas isto não é o
            fim — podes pedir uma avaliação nova em poucos minutos.
          </p>
        </div>

        {/* Breakdown card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
            Como funciona
          </p>
          <ul className="space-y-3">
            {[
              { icon: Clock, label: "Proposta válida por", value: "48 horas" },
              { icon: Zap, label: "Avaliação demora", value: "1 minuto" },
              { icon: RefreshCw, label: "Resposta em", value: "1 hora útil" },
            ].map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon
                    className="size-4 text-primary shrink-0"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </div>
                <span className="text-sm font-medium text-foreground font-mono tabular-nums">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/avaliar"
            className={cn(buttonVariants({ size: "lg" }), "w-full justify-center py-3 h-auto text-base")}
          >
            Pedir nova avaliação
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full justify-center py-3 h-auto text-base"
            )}
          >
            Voltar à página inicial
          </Link>
        </div>

      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Proposta expirada — compramososeueletrico",
  description:
    "Esta proposta expirou após 48 horas. Pede uma nova avaliação gratuita do teu veículo elétrico em poucos minutos.",
};
