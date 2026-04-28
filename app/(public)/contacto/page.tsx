import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto · compramososeueletrico",
  description:
    "Fala connosco — empresa, NIF, morada, telefone, email geral e DPO. Horário de funcionamento e como começar a avaliação online.",
};

export default function ContactoPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3">
          Contacto
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
          Fala connosco
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-prose">
          Tens uma questão sobre uma proposta, sobre o processo, ou sobre os teus
          dados? Aqui ficam todos os caminhos para chegar a nós.
        </p>
      </header>

      {/* Identification card */}
      <Card className="p-0 overflow-hidden border-border gap-0">
        <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-2">
          <Building2 size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Compramos o Seu Elétrico, Lda.
          </h2>
        </div>
        <dl className="divide-y divide-border">
          <Row icon={<MapPin size={15} className="text-muted-foreground" aria-hidden="true" />} label="NIF">
            <span className="font-mono text-sm text-foreground">999 999 999</span>
          </Row>
          <Row icon={<MapPin size={15} className="text-muted-foreground" aria-hidden="true" />} label="Morada">
            <span className="font-mono text-sm text-foreground">
              Rua Exemplo 123, 1000-000 Lisboa
            </span>
          </Row>
          <Row icon={<Phone size={15} className="text-muted-foreground" aria-hidden="true" />} label="Telefone">
            <a
              href="tel:+351210000000"
              className="font-mono text-sm text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              +351 21X XXX XXX
            </a>
          </Row>
          <Row icon={<Mail size={15} className="text-muted-foreground" aria-hidden="true" />} label="Email geral">
            <a
              href="mailto:ola@compramososeueletrico.pt"
              className="font-mono text-sm text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              ola@compramososeueletrico.pt
            </a>
          </Row>
          <Row icon={<ShieldCheck size={15} className="text-muted-foreground" aria-hidden="true" />} label="DPO / RGPD">
            <a
              href="mailto:dpo@compramososeueletrico.pt"
              className="font-mono text-sm text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              dpo@compramososeueletrico.pt
            </a>
          </Row>
          <Row icon={<Clock size={15} className="text-muted-foreground" aria-hidden="true" />} label="Horário">
            <span className="text-sm text-foreground">
              9h–19h · dias úteis
            </span>
          </Row>
        </dl>
      </Card>

      {/* Map placeholder */}
      <div className="mt-6 relative rounded-md border border-border overflow-hidden">
        <div
          className="h-48 sm:h-56 grid place-items-center text-center bg-muted/40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 23px, color-mix(in oklab, var(--border) 60%, transparent) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, color-mix(in oklab, var(--border) 60%, transparent) 23px 24px)",
          }}
          aria-hidden="true"
        >
          <div className="bg-background/85 backdrop-blur-sm rounded-full px-4 py-2 border border-border text-xs font-mono text-muted-foreground">
            Mapa indisponível neste momento
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="mt-10 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary mb-2">
            Ou começa já
          </p>
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Avaliação online em poucos minutos
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
            Recebes uma proposta indicativa por SMS. Sem compromisso.
          </p>
        </div>
        <Link
          href="/avaliar"
          className={cn(buttonVariants({ size: "default" }), "shrink-0 group")}
        >
          Avaliar o meu EV
          <ArrowRight
            size={15}
            className="ml-1.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </section>

      <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
          Ver também ·
        </span>
        <Link
          href="/politica-privacidade"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Privacidade
        </Link>
        <Link
          href="/termos"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Termos
        </Link>
        <Link
          href="/cookies"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Cookies
        </Link>
      </nav>
    </article>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-3.5 grid grid-cols-[max-content_1fr] sm:grid-cols-[20px_140px_1fr] items-center gap-x-4 gap-y-1">
      <span className="hidden sm:inline-flex justify-center">{icon}</span>
      <dt className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground sm:col-start-2">
        {label}
      </dt>
      <dd className="col-span-2 sm:col-span-1 sm:col-start-3">{children}</dd>
    </div>
  );
}
