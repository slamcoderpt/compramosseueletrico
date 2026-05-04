import Link from "next/link";
import {
  ArrowRight,
  Check,
  Zap,
  Clock,
  Wallet,
  ShieldCheck,
  BatteryFull,
  Gauge,
} from "lucide-react";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

/* ──────────────────────────────────────────────────────────────────────────
   Landing — "Card-stack SaaS" direction
   - Soft gray background, white cards with subtle elevation
   - One signature dark navy "preview proposta" card as the hero anchor
   - Pill buttons + status dot badges
   - Restrained color: monochrome chrome, brand teal as rare atmospheric accent
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
    <div className="min-h-screen">
      {/* ════════════════════════════════════════════════════════════════════
          1. HERO — 2-col, headline left, preview proposta card right
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            {/* Left — copy */}
            <div className="motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_both]">
              <StatusPill>
                <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                Aceitamos avaliações agora
              </StatusPill>

              <h1
                id="hero-title"
                className="mt-6 font-sans font-extrabold text-foreground tracking-[-0.035em] leading-[0.98]"
                style={{ fontSize: "clamp(2.5rem, 6.4vw, 4.75rem)", fontWeight: 800 }}
              >
                O teu elétrico.
                <br />
                Vendido em{" "}
                <span
                  className="italic font-light tracking-[-0.02em]"
                  style={{ color: "var(--brand)" }}
                >
                  24&nbsp;h
                </span>
                .
              </h1>

              <p className="mt-6 max-w-md text-[15px] sm:text-base leading-relaxed text-muted-foreground">
                Avaliação online em 1 minuto. Proposta firme por SMS em poucas
                horas. Pagamento no próprio dia da inspeção.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <PillButton href="/avaliar" variant="primary">
                  Avaliar agora
                  <ArrowRight size={15} className="ml-1.5" aria-hidden />
                </PillButton>
                <PillButton href="#processo" variant="ghost">
                  Como funciona
                </PillButton>
              </div>

              {/* Inline trust signals */}
              <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                {[
                  ["100%", "Só elétricos"],
                  ["<1h", "Para a proposta"],
                  ["24h", "Para o pagamento"],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt
                      className="text-2xl font-semibold tracking-[-0.02em] text-foreground tabular-nums"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {k}
                    </dt>
                    <dd className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right — Dark preview proposta card */}
            <div className="motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,0.84,0.44,1)_120ms_both]">
              <ProposalPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          2. PROCESSO — three white cards
          ════════════════════════════════════════════════════════════════════ */}
      <section
        id="processo"
        aria-labelledby="processo-title"
        className="py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-12 sm:mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              O processo
            </p>
            <h2
              id="processo-title"
              className="mt-3 font-extrabold tracking-[-0.025em] text-foreground"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800 }}
            >
              Três passos. Sem fricção.
            </h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                n: "01",
                Icon: Zap,
                title: "Avalias online",
                body: "Marca, modelo, ano, km e estado. Em menos de um minuto. Sem documentos, sem peritagens.",
              },
              {
                n: "02",
                Icon: Clock,
                title: "Proposta firme",
                body: "Avaliamos com base em mercado e saúde da bateria. O valor cai-te no telemóvel por SMS.",
              },
              {
                n: "03",
                Icon: Wallet,
                title: "Recebes o dinheiro",
                body: "Inspeção presencial e fechamos no próprio dia, com pagamento por transferência imediata.",
              },
            ].map((step) => (
              <article
                key={step.n}
                className="group relative rounded-2xl bg-card border border-border/60 p-6 sm:p-7 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="size-9 rounded-xl bg-foreground/[0.03] border border-border/60 grid place-items-center text-foreground"
                    aria-hidden
                  >
                    <step.Icon size={16} strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3. PORQUÊ — split, 4 small spec cards + headline
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="porque-title"
        className="py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Especialidade
              </p>
              <h2
                id="porque-title"
                className="mt-3 font-extrabold tracking-[-0.025em] text-foreground"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800 }}
              >
                Só elétricos.
                <br />
                <span className="text-muted-foreground font-medium">
                  Daí a precisão.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                Não somos um revendedor generalista. Avaliamos só EVs — desde
                degradação real da bateria à autonomia em condições portuguesas.
                Por isso a nossa proposta é firme.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  Icon: BatteryFull,
                  title: "Bateria a sério",
                  body: "Avaliamos a degradação real (SoH) — o fator que mais pesa no valor.",
                },
                {
                  Icon: Gauge,
                  title: "Autonomia real",
                  body: "Dados próprios de Zoe, Leaf, Tesla, ID.3, EV6 em Portugal.",
                },
                {
                  Icon: ShieldCheck,
                  title: "Preço com base em dados",
                  body: "Histórico de mercado, km ajustada, bateria. Sem chutos.",
                },
                {
                  Icon: Clock,
                  title: "Respeitamos o teu tempo",
                  body: "Avaliação remota, proposta rápida, sem visitas desnecessárias.",
                },
              ].map((it) => (
                <article
                  key={it.title}
                  className="rounded-2xl bg-card border border-border/60 p-5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div
                    className="size-8 rounded-lg bg-foreground/[0.03] border border-border/60 grid place-items-center text-foreground mb-4"
                    aria-hidden
                  >
                    <it.Icon size={15} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                    {it.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {it.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. MODELOS — single white card with internal grid
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="modelos-title"
        className="py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Catálogo
            </p>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2
                id="modelos-title"
                className="font-extrabold tracking-[-0.025em] text-foreground"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800 }}
              >
                Compramos qualquer EV.
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Os mais frequentes. Outros — entra na avaliação mesmo assim.
              </p>
            </div>
          </header>

          <div
            className="rounded-2xl bg-card border border-border/60 overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {MODELS.map((model, i) => {
                const isLastRow = i >= MODELS.length - 4;
                const isLastCol = (i + 1) % 4 === 0;
                return (
                  <li
                    key={model}
                    className={[
                      "group relative aspect-[5/2] flex items-center justify-center px-3 transition-colors hover:bg-foreground/[0.02]",
                      !isLastRow ? "border-b border-border/60" : "",
                      !isLastCol ? "lg:border-r border-border/60" : "",
                      i % 2 === 0 ? "border-r border-border/60 lg:border-r" : "",
                      i % 3 !== 2 ? "sm:border-r border-border/60" : "",
                    ].join(" ")}
                  >
                    <span className="text-[14px] sm:text-[15px] font-medium tracking-tight text-foreground/85 group-hover:text-foreground transition-colors text-center">
                      {model}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. FAQ — narrow, light card-style
          ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="faq-title"
        className="py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 sm:mb-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              FAQ
            </p>
            <h2
              id="faq-title"
              className="mt-3 font-extrabold tracking-[-0.025em] text-foreground"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800 }}
            >
              Perguntas comuns.
            </h2>
          </header>
          <div
            className="rounded-2xl bg-card border border-border/60 p-2 sm:p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. CTA FINAL — dark anchor card on light bg
          ════════════════════════════════════════════════════════════════════ */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <DarkCtaCard />
        </div>
      </section>
    </div>
  );
}

/* ─── Status Pill ───────────────────────────────────────────────────────── */
function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card pl-2 pr-3 py-1 text-[11px] font-medium text-foreground/80"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </span>
  );
}

/* ─── Pill Button ───────────────────────────────────────────────────────── */
function PillButton({
  href,
  children,
  variant = "primary",
  size = "default",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "light";
  size?: "default" | "lg";
}) {
  const base =
    "group inline-flex items-center justify-center gap-1 rounded-full font-medium tracking-tight transition-all duration-300";
  const sizes = {
    default: "px-5 h-11 text-sm",
    lg: "px-7 h-12 text-base",
  };
  const variants = {
    primary:
      "bg-foreground text-background hover:bg-foreground/90 shadow-[0_4px_14px_-4px_oklch(0_0_0_/_0.25)]",
    ghost:
      "bg-card text-foreground border border-border/80 hover:bg-foreground/[0.03]",
    light:
      "bg-white text-black hover:bg-white/90",
  };
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

/* ─── Proposal Preview Card ─────────────────────────────────────────────── */
function ProposalPreviewCard() {
  return (
    <article
      className="relative isolate overflow-hidden rounded-3xl text-white"
      style={{
        background:
          "radial-gradient(ellipse 100% 70% at 100% 0%, oklch(0.20 0.04 220) 0%, transparent 60%)," +
          "linear-gradient(160deg, oklch(0.13 0.012 220) 0%, oklch(0.08 0.008 220) 100%)",
        boxShadow:
          "0 1px 0 oklch(1 0 0 / 0.04) inset, 0 24px 60px -20px oklch(0 0 0 / 0.45)",
      }}
      aria-label="Exemplo de proposta indicativa"
    >
      {/* Radar concentric circles, top-right */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        <defs>
          <radialGradient id="radar-fade" cx="100%" cy="0%" r="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g
          stroke="white"
          fill="none"
          strokeOpacity="0.06"
          transform="translate(100%, 0%)"
        >
          <circle r="80" />
          <circle r="160" strokeDasharray="2 5" />
          <circle r="240" strokeDasharray="2 5" />
          <circle r="320" strokeDasharray="2 5" />
        </g>
      </svg>

      {/* Brand teal accent corner */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-px h-24"
        style={{
          background:
            "linear-gradient(180deg, var(--brand) 0%, transparent 100%)",
        }}
      />

      <div className="relative p-6 sm:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
              Proposta indicativa · Demo
            </p>
            <p className="font-mono text-[11px] text-white/60 tabular-nums">
              PT-2026-0421
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest"
            style={{
              background: "oklch(0.20 0.04 145 / 0.4)",
              color: "oklch(0.85 0.14 145)",
              border: "1px solid oklch(0.45 0.10 145 / 0.40)",
            }}
          >
            <span className="size-1 rounded-full bg-current" />
            Indicativa
          </span>
        </div>

        {/* Vehicle */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3
              className="text-[26px] sm:text-[30px] font-bold leading-[1.05] tracking-[-0.02em] text-white"
              style={{ fontWeight: 700 }}
            >
              Tesla Model 3
            </h3>
            <p className="mt-1 text-[13px] text-white/55">
              Long Range · 2022 · 50 320 km
            </p>
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap"
          >
            12-XX-AB
          </span>
        </div>

        {/* EV silhouette */}
        <div className="relative -mx-2 mt-2 mb-2 grid place-items-center">
          <svg
            viewBox="0 0 320 100"
            className="w-full max-w-[320px] h-auto opacity-90"
            aria-hidden
          >
            {/* Ground line */}
            <line
              x1="20"
              y1="92"
              x2="300"
              y2="92"
              stroke="white"
              strokeOpacity="0.25"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            {/* Body */}
            <path
              d="M 30 70
                 Q 38 50 72 42
                 L 110 38
                 Q 130 26 165 23
                 L 200 23
                 Q 230 26 248 38
                 L 282 42
                 Q 302 50 305 70
                 L 305 80
                 L 30 80
                 Z"
              stroke="white"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Roof line */}
            <path
              d="M 96 42 Q 130 24 165 23 L 200 23 Q 232 26 252 42"
              stroke="white"
              strokeOpacity="0.55"
              strokeWidth="1"
              fill="none"
            />
            {/* Door division */}
            <line
              x1="167"
              y1="23"
              x2="167"
              y2="68"
              stroke="white"
              strokeOpacity="0.22"
              strokeWidth="0.7"
            />
            {/* Front wheel */}
            <circle cx="80" cy="80" r="14" stroke="white" strokeWidth="1.4" fill="oklch(0.06 0 0)" />
            <circle cx="80" cy="80" r="6" stroke="white" strokeWidth="1.2" fill="none" />
            {/* Rear wheel */}
            <circle cx="255" cy="80" r="14" stroke="white" strokeWidth="1.4" fill="oklch(0.06 0 0)" />
            <circle cx="255" cy="80" r="6" stroke="white" strokeWidth="1.2" fill="none" />
            {/* Headlight */}
            <line x1="298" y1="64" x2="304" y2="64" stroke="white" strokeWidth="1.4" />
          </svg>
        </div>

        {/* Specs grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-white/[0.08] py-5">
          <Row label="Quilómetros" value="50 320 km" />
          <Row label="Autonomia real" value="450 km" />
          <Row label="Donos anteriores" value="1" />
          <RowSoH value={95} />
        </dl>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Valor indicativo
            </p>
            <p
              className="mt-1 font-bold tracking-[-0.025em] tabular-nums text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 700 }}
            >
              €&nbsp;18&nbsp;500
            </p>
          </div>
          <Link
            href="/avaliar"
            className="group inline-flex items-center justify-center gap-1 rounded-full bg-white text-black h-10 px-5 text-[13px] font-medium tracking-tight transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_20px_-6px_oklch(1_0_0_/_0.30)]"
          >
            Avaliar o meu
            <ArrowRight size={14} className="ml-0.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {/* Caveat */}
        <p className="font-mono text-[10px] leading-relaxed text-white/35">
          Valor confirmado após inspeção presencial. Validade da proposta: 48&nbsp;h.
        </p>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </dt>
      <dd className="text-[13px] font-medium text-white/95 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function RowSoH({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        Bateria (SoH)
      </dt>
      <dd className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-white/95 tabular-nums shrink-0 w-9">
          {value}%
        </span>
        <span
          aria-hidden
          className="relative h-1 flex-1 rounded-full bg-white/[0.08] overflow-hidden"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${value}%`,
              background: "var(--brand)",
            }}
          />
        </span>
      </dd>
    </div>
  );
}

/* ─── Dark CTA card ─────────────────────────────────────────────────────── */
function DarkCtaCard() {
  return (
    <div
      className="relative isolate overflow-hidden rounded-3xl text-white"
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 80% 50%, color-mix(in oklab, var(--brand) 25%, transparent) 0%, transparent 60%)," +
          "linear-gradient(160deg, oklch(0.10 0.008 220) 0%, oklch(0.06 0 0) 100%)",
        boxShadow:
          "0 1px 0 oklch(1 0 0 / 0.04) inset, 0 24px 60px -20px oklch(0 0 0 / 0.5)",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative px-6 sm:px-12 lg:px-16 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            Prontos quando estiveres
          </p>
          <h2
            className="mt-4 font-extrabold leading-[0.96] tracking-[-0.035em] text-white"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)", fontWeight: 800 }}
          >
            Começa pela{" "}
            <span style={{ color: "var(--brand)" }}>matrícula</span>.
          </h2>
          <p className="mt-5 max-w-md text-white/60 text-[15px] leading-relaxed">
            Menos de um minuto. Recebes uma proposta indicativa por SMS em
            poucas horas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-3 lg:items-stretch">
          <PillButton href="/avaliar" variant="light" size="lg">
            Avaliar o meu EV
            <ArrowRight size={16} className="ml-1.5" aria-hidden />
          </PillButton>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center gap-1.5 rounded-full h-12 px-5 text-base font-medium text-white/85 hover:text-white transition-colors"
          >
            <Check size={14} aria-hidden />
            Falar primeiro
          </Link>
        </div>
      </div>
    </div>
  );
}
