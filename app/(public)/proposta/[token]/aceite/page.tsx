import Link from "next/link";
import {
  CircleCheck,
  CalendarCheck,
  MapPin,
  Banknote,
  BatteryCharging,
  Gauge,
  FileCheck,
  Clock,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposta aceite — compramososeueletrico",
  description:
    "Aceitaste a nossa proposta. Marca agora uma visita rápida ao nosso local e recebe o pagamento no próprio dia.",
};

interface Props {
  params: Promise<{ token: string }>;
}

const steps = [
  {
    icon: CalendarCheck,
    label: "Marca a visita",
    detail: "Escolhe o dia e hora que te for mais conveniente",
  },
  {
    icon: MapPin,
    label: "Validamos no local",
    detail: "Inspeção rápida de ~30 min no nosso espaço",
  },
  {
    icon: Banknote,
    label: "Pagamos no próprio dia",
    detail: "Transferência bancária imediata após validação",
  },
];

const inspectionPoints = [
  { icon: BatteryCharging, label: "Saúde da bateria" },
  { icon: Gauge, label: "Autonomia real" },
  { icon: CircleCheck, label: "Condição visual" },
  { icon: FileCheck, label: "Documentação" },
];

export default async function PropostaAceitePage({ params }: Props) {
  const { token } = await params;
  const ref = token.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg mx-auto space-y-10">

        {/* Hero — celebratory teal ring */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-primary/8 p-5 ring-2 ring-primary/20">
            <CircleCheck
              className="size-14 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Headline + subtext */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Proposta aceite!
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Próximo passo: marca uma visita rápida ao nosso local para
            inspecionarmos o teu carro.
          </p>
        </div>

        {/* 3-step visual sequence */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono mb-4">
            O que acontece a seguir
          </p>
          <ol className="space-y-0">
            {steps.map(({ icon: Icon, label, detail }, index) => (
              <li key={label} className="flex gap-4">
                {/* Step connector */}
                <div className="flex flex-col items-center">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Icon
                      className="size-4 text-primary"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-1 my-1.5 bg-border" />
                  )}
                </div>
                {/* Step content */}
                <div className={cn("pb-5 min-w-0", index === steps.length - 1 && "pb-0")}>
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Primary CTA */}
        <div className="space-y-3">
          <Link
            href={`/proposta/${token}/marcar`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-center py-3 h-auto text-base"
            )}
          >
            Marcar visita agora
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Recebes confirmação por SMS após a marcação.
          </p>
        </div>

        {/* Reassurance — what we inspect */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
            O que vamos validar na inspeção
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
            {inspectionPoints.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon
                  className="size-4 text-primary shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="text-sm text-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reference footer */}
        <p className="text-center text-xs font-mono opacity-40 tracking-widest">
          Refª da proposta: {ref}
        </p>

      </div>
    </div>
  );
}
