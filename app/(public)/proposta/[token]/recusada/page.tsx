import Link from "next/link";
import { CircleSlash, Phone, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PropostaRecusadaPage({ params }: Props) {
  await params; // good hygiene — token available if needed in future

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-lg mx-auto space-y-10">

        {/* Hero icon */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-muted p-5 ring-1 ring-border">
            <CircleSlash
              className="size-12 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Headline + subtext */}
        <div className="space-y-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Recusaste a nossa proposta.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Sem problema. Se mudares de ideias dentro de 30 dias, podes pedir
            uma nova avaliação — o teu carro pode ainda estar dentro da nossa
            janela de interesse.
          </p>
        </div>

        {/* Contact block */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
            Tens dúvidas? Liga-nos
          </p>
          <div className="space-y-3">
            <a
              href="tel:+351210000000"
              className="flex items-center gap-3 group"
              aria-label="Contacto por telefone"
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
              aria-label="Contacto por email"
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
          </div>
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
  title: "Proposta recusada — compramososeueletrico",
  description:
    "Recusaste a nossa proposta. Sem problema — podes pedir uma nova avaliação gratuita do teu veículo elétrico dentro de 30 dias.",
};
