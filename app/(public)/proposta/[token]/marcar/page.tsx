import Link from "next/link";
import { Calendar, Phone, Mail, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marcar visita — compramososeueletrico",
  description:
    "Marca uma visita ao nosso espaço para validarmos o teu carro elétrico e pagarmos no próprio dia.",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MarcarVisitaPage({ params }: Props) {
  const { token } = await params;
  const ref = token.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg mx-auto space-y-10">

        {/* Hero icon */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-primary/8 p-5 ring-2 ring-primary/20">
            <Calendar
              className="size-14 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Headline + subtext */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Marcação de visita
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            A marcação online estará disponível em breve. Por agora,
            contacta-nos para combinar.
          </p>
        </div>

        {/* Contact card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
            Contacta-nos
          </p>
          <div className="space-y-4">
            <a
              href="tel:+351210000000"
              className="flex items-center gap-3 group"
              aria-label="Ligar para +351 21X XXX XXX"
            >
              <Phone
                className="size-4 text-primary shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-sm font-mono tracking-wide text-foreground group-hover:text-primary transition-colors">
                +351 21X XXX XXX
              </span>
            </a>
            <a
              href="mailto:ola@compramososeueletrico.pt"
              className="flex items-center gap-3 group"
              aria-label="Enviar email para ola@compramososeueletrico.pt"
            >
              <Mail
                className="size-4 text-primary shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                ola@compramososeueletrico.pt
              </span>
            </a>
            <div className="flex items-center gap-3">
              <Clock
                className="size-4 text-primary shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">
                9h–19h, dias úteis
              </span>
            </div>
          </div>
        </div>

        {/* Info alert */}
        <Alert>
          <AlertTitle>Aceitação recebida</AlertTitle>
          <AlertDescription>
            Recebemos a tua aceitação. Vamos contactar-te dentro de 24h se não
            nos contactares antes.
          </AlertDescription>
        </Alert>

        {/* Back CTA */}
        <Link
          href={`/proposta/${token}/aceite`}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full justify-center py-3 h-auto text-base"
          )}
        >
          Voltar
        </Link>

        {/* Reference footer */}
        <p className="text-center text-xs font-mono opacity-40 tracking-widest">
          Refª da proposta: {ref}
        </p>

      </div>
    </div>
  );
}
