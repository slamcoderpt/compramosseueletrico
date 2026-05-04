import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

/* ──────────────────────────────────────────────────────────────────────────
   Landing — "Tesla-clean" direction
   - Full-bleed cinematic sections
   - DM Sans 900 with tight tracking for cinematic display
   - Teal used as a single deliberate accent
   - Pill buttons. No badges, no busy patterns, no boxed cards.
   ────────────────────────────────────────────────────────────────────────── */

const MODELS = [
  "Tesla Model 3",
  "Tesla Model Y",
  "Renault Zoe",
  "Nissan Leaf",
  "VW ID.3",
  "VW ID.4",
  "Hyundai Kona EV",
  "Kia EV6",
  "Peugeot e-208",
  "BMW i3",
  "Fiat 500e",
  "Polestar 2",
];

export default function LandingPage() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          1. HERO — full viewport, dark, aurora glow, centered statement
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden text-white"
        style={{
          minHeight: "calc(100svh - 56px)",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, oklch(0.32 0.08 185 / 0.55), transparent 70%)," +
            "radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.20 0.04 220 / 0.6), transparent 70%)," +
            "linear-gradient(180deg, oklch(0.10 0.012 220) 0%, oklch(0.07 0.010 220) 100%)",
        }}
      >
        {/* Animated aurora layer */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 motion-safe:animate-[aurora_22s_ease-in-out_infinite] opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, oklch(0.48 0.13 185 / 0.18), transparent 35%)," +
              "radial-gradient(circle at 80% 30%, oklch(0.55 0.10 200 / 0.15), transparent 40%)," +
              "radial-gradient(circle at 50% 90%, oklch(0.62 0.14 185 / 0.12), transparent 40%)",
          }}
        />

        {/* Noise texture for film-grain feel */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 mix-blend-overlay opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        <div className="relative mx-auto flex h-full min-h-[calc(100svh-56px)] max-w-6xl flex-col px-4 sm:px-6">
          {/* Tiny mono kicker — top */}
          <div className="flex items-center gap-3 pt-10 sm:pt-14">
            <div
              aria-hidden
              className="h-px w-8"
              style={{ background: "oklch(0.65 0.14 185 / 0.55)" }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
              Compramos o teu elétrico · Portugal
            </span>
          </div>

          {/* Centerpiece — main statement */}
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <h1
              id="hero-title"
              className="font-sans font-black text-white leading-[0.92] tracking-[-0.04em] motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_both]"
              style={{
                fontSize: "clamp(3rem, 11vw, 9rem)",
                fontWeight: 900,
              }}
            >
              <span className="block">O teu elétrico.</span>
              <span className="block">
                Vendido em{" "}
                <span
                  className="italic font-light tracking-tight"
                  style={{ color: "oklch(0.72 0.14 185)" }}
                >
                  24&nbsp;h
                </span>
                .
              </span>
            </h1>

            <p
              className="mt-8 max-w-xl text-balance text-base sm:text-lg leading-relaxed text-white/65 motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_120ms_both]"
            >
              Avaliação online em 1 minuto. Proposta firme por SMS em poucas
              horas. Pagamento no próprio dia. Sem peritagens, sem
              negociações, sem surpresas.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_240ms_both]">
              <PillButton href="/avaliar" variant="primary">
                Avaliar agora
                <ArrowRight size={16} className="ml-1.5" aria-hidden />
              </PillButton>
              <PillButton href="#processo" variant="ghost">
                Ver como funciona
              </PillButton>
            </div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_360ms_both]">
              Gratuito · Sem compromisso · Resposta em &lt;1&nbsp;hora
            </p>
          </div>

          {/* Scroll cue */}
          <div className="flex justify-center pb-10 sm:pb-14">
            <a
              href="#processo"
              aria-label="Saltar para 'Como funciona'"
              className="group inline-flex flex-col items-center gap-2 text-white/45 transition-colors hover:text-white"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.24em]">
                Scroll
              </span>
              <ArrowDown
                size={14}
                className="motion-safe:animate-[bounce-subtle_2.4s_ease-in-out_infinite]"
                aria-hidden
              />
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          2. PROCESSO — light, three steps, generous space
          ════════════════════════════════════════════════════════════════════ */}
      <section
        id="processo"
        aria-labelledby="processo-title"
        className="bg-background py-28 sm:py-36"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-16 sm:mb-24 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              O processo
            </p>
            <h2
              id="processo-title"
              className="mt-4 font-black tracking-[-0.03em] text-foreground"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", fontWeight: 900 }}
            >
              Três passos. Sem fricção.
            </h2>
          </header>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-y-14 md:gap-y-0 md:gap-x-12 lg:gap-x-16">
            {[
              {
                n: "01",
                title: "Avalias online",
                body: "Marca, modelo, ano, km e estado geral — em menos de um minuto. Sem documentos, sem visitas, sem peritagens.",
              },
              {
                n: "02",
                title: "Recebes proposta firme",
                body: "Avaliamos com base em dados de mercado e na saúde da bateria. Em poucas horas o valor cai-te no telemóvel por SMS.",
              },
              {
                n: "03",
                title: "Recebes o dinheiro",
                body: "Aceitas, marcas a inspeção presencial e fechamos no próprio dia — pagamento por transferência imediata.",
              },
            ].map((step) => (
              <li key={step.n} className="group relative">
                {/* Top rule + number */}
                <div className="relative">
                  <div
                    aria-hidden
                    className="h-px w-full bg-foreground/15"
                  />
                  <div
                    aria-hidden
                    className="absolute left-0 top-0 h-px w-12 transition-all duration-700 group-hover:w-full"
                    style={{ background: "oklch(0.48 0.13 185)" }}
                  />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span
                    className="font-mono text-xs tracking-[0.18em] uppercase"
                    style={{ color: "oklch(0.48 0.13 185)" }}
                  >
                    Passo {step.n}
                  </span>
                </div>
                <h3
                  className="mt-3 text-2xl sm:text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground"
                  style={{ fontWeight: 800 }}
                >
                  {step.title}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-sm">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3. PORQUÊ ELÉTRICOS — split, dark, big stat
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="porque-title"
        className="relative isolate overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.10 0.012 220) 0%, oklch(0.08 0.010 220) 100%)",
        }}
      >
        {/* Subtle teal halo bottom-right */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 90% 100%, oklch(0.48 0.13 185 / 0.20), transparent 50%)",
          }}
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-28 sm:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-end">
            {/* Big stat */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                Porquê só elétricos
              </p>
              <p
                className="mt-6 font-black leading-[0.85] tracking-[-0.06em]"
                style={{
                  fontSize: "clamp(5rem, 18vw, 14rem)",
                  fontWeight: 900,
                  background:
                    "linear-gradient(180deg, oklch(0.95 0.04 185) 0%, oklch(0.55 0.13 185) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                100%
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
                Especialistas a sério. Avaliamos só elétricos — desde o
                <em className="font-mono text-white/80 not-italic mx-1">SoH</em>
                da bateria à autonomia real em condições portuguesas. Por isso
                a nossa proposta é firme.
              </p>
            </div>

            {/* Bullet list */}
            <ul className="space-y-7">
              {[
                {
                  k: "Bateria a sério",
                  v: "Sabemos avaliar a degradação real — o fator que mais pesa no valor de um EV usado.",
                },
                {
                  k: "Autonomia real",
                  v: "Temos dados de Zoe, Leaf, Tesla, ID.3, Kona, EV6 e dezenas de outros em condições reais.",
                },
                {
                  k: "Preço com base em dados",
                  v: "Não chutamos. Usamos histórico de mercado, km ajustada e bateria.",
                },
                {
                  k: "Respeitamos o teu tempo",
                  v: "Avaliação remota, proposta rápida, sem visitas desnecessárias.",
                },
              ].map((item) => (
                <li key={item.k} className="group">
                  <div className="flex items-baseline gap-4">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full shrink-0 translate-y-2 transition-transform group-hover:scale-150"
                      style={{ background: "oklch(0.65 0.14 185)" }}
                    />
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                        {item.k}
                      </h3>
                      <p className="text-sm leading-relaxed text-white/55 max-w-md">
                        {item.v}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. MODELOS — wordmark grid, restrained
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="modelos-title"
        className="bg-background border-y border-border/60 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Catálogo
              </p>
              <h2
                id="modelos-title"
                className="mt-3 font-black tracking-[-0.03em] text-foreground"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 900 }}
              >
                Compramos qualquer EV.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Os mais frequentes. Outros — entra na avaliação mesmo assim.
            </p>
          </header>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-l border-t border-border/60">
            {MODELS.map((model) => (
              <li
                key={model}
                className="group relative border-r border-b border-border/60 aspect-[5/2] flex items-center justify-center px-3 transition-colors hover:bg-muted/30"
              >
                <span className="text-[15px] sm:text-base font-medium tracking-tight text-foreground/85 group-hover:text-foreground transition-colors text-center">
                  {model}
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: "oklch(0.48 0.13 185)" }}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. FAQ — clean, narrow column
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="faq-title"
        className="bg-background py-28 sm:py-36"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-12 sm:mb-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              FAQ
            </p>
            <h2
              id="faq-title"
              className="mt-4 font-black tracking-[-0.03em] text-foreground"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 900 }}
            >
              Perguntas comuns.
            </h2>
          </header>
          <FaqAccordion />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. CTA FINAL — black, minimal, statement
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="cta-title"
        className="relative isolate overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.30 0.06 185 / 0.45), transparent 70%)," +
            "linear-gradient(180deg, oklch(0.07 0.010 220) 0%, oklch(0.05 0.008 220) 100%)",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-32 sm:py-40 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            Prontos quando estiveres
          </p>
          <h2
            id="cta-title"
            className="mt-6 font-black leading-[0.95] tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", fontWeight: 900 }}
          >
            Começa pela{" "}
            <span style={{ color: "oklch(0.72 0.14 185)" }}>matrícula</span>.
          </h2>
          <p className="mt-6 mx-auto max-w-md text-white/60 text-base leading-relaxed">
            Menos de um minuto. Recebes a proposta no telemóvel.
          </p>
          <div className="mt-12 flex justify-center">
            <PillButton href="/avaliar" variant="primary" size="lg">
              Avaliar o meu EV
              <ArrowRight size={18} className="ml-1.5" aria-hidden />
            </PillButton>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Pill Button ─────────────────────────────────────────────────────────
   Tesla-style rounded pill, two variants. Custom (not buttonVariants) to
   keep the cinematic look distinct from form buttons elsewhere.
   ────────────────────────────────────────────────────────────────────── */
function PillButton({
  href,
  children,
  variant = "primary",
  size = "default",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "default" | "lg";
}) {
  const base =
    "group inline-flex items-center justify-center gap-1 rounded-full font-medium tracking-tight transition-all duration-300 motion-safe:hover:translate-y-[-1px]";
  const sizes = {
    default: "px-7 h-11 text-sm min-w-[170px]",
    lg: "px-9 h-13 text-base min-w-[200px]",
  };
  const variants = {
    primary:
      "bg-white text-black hover:bg-white/90 shadow-[0_8px_28px_-8px_rgba(255,255,255,0.35)]",
    ghost:
      "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/30",
  };
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </Link>
  );
}
