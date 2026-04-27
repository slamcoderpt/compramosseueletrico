import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

/* ─── Battery Charge SVG Motif ──────────────────────────────────────────── */
function BatteryMotif({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="72"
      viewBox="0 0 40 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Battery outline */}
      <rect x="1.5" y="9.5" width="37" height="61" rx="4.5" stroke="currentColor" strokeWidth="3" />
      {/* Terminal */}
      <rect x="12" y="0" width="16" height="9" rx="2" fill="currentColor" />
      {/* Charge fill layers */}
      <rect x="6" y="24" width="28" height="42" rx="2" fill="currentColor" className="opacity-20" />
      <rect x="6" y="38" width="28" height="28" rx="2" fill="currentColor" className="opacity-60" />
      <rect x="6" y="52" width="28" height="14" rx="2" fill="currentColor" />
      {/* Lightning bolt */}
      <path d="M22 30 L16 44 H20 L18 56 L26 40 H22 L24 30Z" fill="white" />
    </svg>
  );
}

/* ─── Step Icon ─────────────────────────────────────────────────────────── */
function StepIcon({ type }: { type: "form" | "sms" | "payment" }) {
  if (type === "form") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="9" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="23" cy="21" r="3" fill="currentColor" />
        <path d="M21.5 21 L22.5 22 L24.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "sms") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="5" y="4" width="22" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="22" width="6" height="2" rx="1" fill="currentColor" />
        <path d="M10 14 L13 17 L22 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
      <path d="M16 10 L16 16 L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 23 L22 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 23 L12 26 M20 23 L20 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Popular models ────────────────────────────────────────────────────── */
const models = [
  "Tesla Model 3",
  "Renault Zoe",
  "Nissan Leaf",
  "VW ID.3",
  "VW ID.4",
  "Hyundai Kona Electric",
  "Kia EV6",
  "Peugeot e-208",
  "BMW i3",
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative overflow-hidden bg-background">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 39px, currentColor 39px, currentColor 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, currentColor 39px, currentColor 40px)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-start">
            {/* Battery motif — decorative, hidden on mobile to keep fold clean */}
            <div className="hidden lg:flex items-start pt-2">
              <BatteryMotif className="text-primary w-10 h-[72px]" />
            </div>

            {/* Headline block */}
            <div className="space-y-8">
              {/* Label */}
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-primary" aria-hidden="true" />
                <span className="font-mono text-xs tracking-widest uppercase text-primary">
                  Compramos o teu elétrico
                </span>
              </div>

              {/* Main headline */}
              <h1
                className="font-bold leading-[1.05] tracking-tight text-foreground"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
              >
                Vendemos o teu
                <br />
                <span className="text-primary">elétrico</span> em
                <br />
                poucas horas.
              </h1>

              {/* Sub-headline: three guarantees as monospaced counters */}
              <div className="space-y-2">
                {[
                  { label: "Avaliação em 1 minuto" },
                  { label: "Proposta em 1 hora" },
                  { label: "Dinheiro em 24 horas" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-5 text-right tabular-nums">
                      0{i + 1}
                    </span>
                    <div className="h-px w-4 bg-border" aria-hidden="true" />
                    <span className="text-base sm:text-lg text-foreground font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/avaliar"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "text-base px-8 py-6 h-auto font-semibold shadow-lg shadow-primary/20"
                  )}
                >
                  Começar avaliação
                </Link>
                <a
                  href="#como-funciona"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "text-base px-8 py-6 h-auto"
                  )}
                >
                  Como funciona
                </a>
              </div>

              {/* Trust signals */}
              <p className="text-xs text-muted-foreground font-mono">
                Gratuito · Sem compromisso · Resposta em menos de 1 hora
              </p>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="h-px bg-border max-w-6xl mx-auto" aria-hidden="true" />
      </section>

      {/* ================================================================
          COMO FUNCIONA
          ================================================================ */}
      <section id="como-funciona" className="bg-background py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-16">
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              02
            </span>
            <div className="h-px w-8 bg-primary" aria-hidden="true" />
            <h2 className="font-bold text-2xl sm:text-3xl tracking-tight">Como funciona</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-border rounded-xl overflow-hidden">
            {[
              {
                step: "01",
                icon: <StepIcon type="form" />,
                title: "Avalias",
                description:
                  "Preenches o formulário em menos de 1 minuto: marca, modelo, ano, quilometragem e estado geral. Não precisas de peritagem nem de documentos.",
              },
              {
                step: "02",
                icon: <StepIcon type="sms" />,
                title: "Recebes proposta",
                description:
                  "Analisamos o teu EV com base em dados reais de mercado e saúde da bateria. Em menos de 1 hora recebes uma proposta firme por SMS — sem negociação.",
              },
              {
                step: "03",
                icon: <StepIcon type="payment" />,
                title: "Recebes o dinheiro",
                description:
                  "Aceitas, nós tratamos da logística e da transferência de propriedade. O dinheiro entra na tua conta em 24 horas — sem surpresas.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-background p-8 sm:p-10 space-y-5 group">
                <div className="flex items-start justify-between">
                  <div className="text-primary">{item.icon}</div>
                  <span className="font-mono text-3xl font-bold text-border group-hover:text-primary/20 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-xl">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PORQUÊ SÓ ELÉTRICOS
          ================================================================ */}
      <section className="bg-primary py-20 sm:py-28 text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-start">
            {/* Label + heading */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-widest uppercase opacity-60">03</span>
                <div className="h-px w-8 bg-primary-foreground/30" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight">
                Porquê só
                <br />
                elétricos?
              </h2>
              <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
                Não somos um revendedor generalista. A especialização total em EVs
                permite-nos ir muito além.
              </p>
            </div>

            {/* Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Especialistas em SoH",
                  body: "Sabemos exactamente como avaliar a degradação real da bateria — o factor mais crítico no valor de um elétrico usado.",
                },
                {
                  title: "Conhecemos a autonomia real",
                  body: "Temos dados reais de Zoe, Leaf, Tesla, ID.3, Kona Electric e dezenas de outros modelos em condições portuguesas.",
                },
                {
                  title: "Proposta baseada em dados",
                  body: "Não chutamos o preço. Usamos histórico de mercado, quilometragem ajustada e degradação de bateria para fazer uma oferta justa.",
                },
                {
                  title: "Respeitamos o teu tempo",
                  body: "Sem visitas desnecessárias, sem esperas. Avaliação remota, proposta rápida, recolha a horas combinadas.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="space-y-2 border-t border-primary-foreground/20 pt-4"
                >
                  <h3 className="font-semibold text-base">{item.title}</h3>
                  <p className="text-primary-foreground/70 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MODELOS POPULARES
          ================================================================ */}
      <section className="bg-background py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-12">
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              04
            </span>
            <div className="h-px w-8 bg-primary" aria-hidden="true" />
            <h2 className="font-bold text-2xl sm:text-3xl tracking-tight">
              Modelos que compramos
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {models.map((model) => (
              <Badge
                key={model}
                variant="outline"
                className="text-sm font-medium px-4 py-2 h-auto rounded-full border-border hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {model}
              </Badge>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            E muitos mais. Se tens um elétrico que não está na lista,{" "}
            <Link
              href="/avaliar"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              faz a avaliação na mesma
            </Link>{" "}
            — trabalhamos com todas as marcas.
          </p>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <section className="bg-muted/40 py-20 sm:py-28 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-12">
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              05
            </span>
            <div className="h-px w-8 bg-primary" aria-hidden="true" />
            <h2 className="font-bold text-2xl sm:text-3xl tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <div className="max-w-2xl">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA FINAL
          ================================================================ */}
      <section className="bg-background py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl border border-border overflow-hidden">
            {/* Diagonal stripe texture */}
            <div
              className="absolute inset-0 opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, var(--color-primary) 0, var(--color-primary) 1px, transparent 0, transparent 50%)",
                backgroundSize: "12px 12px",
              }}
              aria-hidden="true"
            />

            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl"
              aria-hidden="true"
            />

            <div className="relative px-8 sm:px-12 py-14 sm:py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-primary" aria-hidden="true" />
                  <span className="font-mono text-xs text-primary tracking-widest uppercase">
                    Pronto?
                  </span>
                </div>
                <h2
                  className="font-bold tracking-tight text-foreground leading-tight"
                  style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.75rem)" }}
                >
                  Pronto para vender
                  <br />o teu EV?
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Começa agora — demora menos de 1 minuto. Sem compromisso, sem custos.
                </p>
              </div>

              <div className="shrink-0 flex flex-col gap-3 items-start sm:items-end">
                <Link
                  href="/avaliar"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "text-base px-10 py-6 h-auto font-semibold shadow-lg shadow-primary/20"
                  )}
                >
                  Começar avaliação
                </Link>
                <p className="text-xs text-muted-foreground font-mono">
                  Gratuito · Sem compromisso
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
