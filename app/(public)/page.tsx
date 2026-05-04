import Link from "next/link";
import Image from "next/image";
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
   Demo proposal preview image.
   - Default: a stable Unsplash Tesla Model 3 photo (free commercial license).
   - To swap with your own asset:
     1. drop your image at `public/proposal-preview.png`
     2. change PROPOSAL_PREVIEW_IMG below to "/proposal-preview.png"
   - Works with both relative (Next/Image-optimized) and remote URLs
     (configured in next.config.ts → images.remotePatterns)
   ────────────────────────────────────────────────────────────────────────── */
const PROPOSAL_PREVIEW_IMG =
  "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=85";

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
          "radial-gradient(ellipse 90% 60% at 100% 0%, oklch(0.18 0.025 220) 0%, transparent 55%)," +
          "radial-gradient(ellipse 80% 50% at 0% 100%, color-mix(in oklab, var(--brand) 12%, transparent) 0%, transparent 60%)," +
          "linear-gradient(165deg, oklch(0.12 0.010 230) 0%, oklch(0.06 0.005 230) 100%)",
        boxShadow:
          "0 1px 0 oklch(1 0 0 / 0.05) inset, 0 30px 80px -24px oklch(0 0 0 / 0.55)",
      }}
      aria-label="Exemplo de proposta indicativa"
    >
      {/* Radar concentric circles — top-right */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        <g
          stroke="white"
          fill="none"
          strokeOpacity="0.08"
          transform="translate(100%, 0%)"
        >
          <circle r="60" strokeOpacity="0.10" />
          <circle r="130" strokeDasharray="2 5" />
          <circle r="200" strokeDasharray="2 5" strokeOpacity="0.06" />
          <circle r="280" strokeDasharray="2 5" strokeOpacity="0.04" />
        </g>
      </svg>

      {/* Brand teal accent corner */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-px h-28"
        style={{
          background:
            "linear-gradient(180deg, var(--brand) 0%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute top-0 right-0 h-px w-20"
        style={{
          background:
            "linear-gradient(270deg, var(--brand) 0%, transparent 100%)",
        }}
      />

      <div className="relative p-6 sm:p-8 flex flex-col gap-7">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
              Proposta indicativa · Demo
            </p>
            <p className="font-mono text-[11px] text-white/55 tabular-nums tracking-wider">
              PT-2026-0421
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest"
            style={{
              background: "color-mix(in oklab, var(--brand) 15%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
          >
            <span
              className="size-1 rounded-full motion-safe:animate-pulse"
              style={{ background: "var(--brand)" }}
            />
            Indicativa
          </span>
        </div>

        {/* ── Vehicle title block ────────────────────────────────── */}
        <div>
          <h3
            className="text-[28px] sm:text-[34px] font-bold leading-[1] tracking-[-0.025em] text-white"
            style={{ fontWeight: 700 }}
          >
            Tesla Model 3
          </h3>
          <div className="mt-2 flex items-center gap-3 text-[12px]">
            <span className="text-white/55">Long Range · 2022</span>
            <span className="size-1 rounded-full bg-white/20" />
            {/* Portuguese plate-style chip */}
            <PtPlate value="12-AB-34" />
          </div>
        </div>

        {/* ── Vehicle photo — hero visual ────────────────────────── */}
        <div className="relative -mx-2 sm:-mx-4 mt-1 mb-1 aspect-[16/9]">
          {/* Underglow — brand teal halo behind the car */}
          <div
            aria-hidden
            className="absolute inset-x-12 bottom-2 h-16 blur-2xl opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 50% 100%, color-mix(in oklab, var(--brand) 70%, transparent), transparent)",
            }}
          />

          {/* Photo */}
          <div className="relative w-full h-full overflow-hidden rounded-2xl">
            <Image
              src={PROPOSAL_PREVIEW_IMG}
              alt="Tesla Model 3 — exemplo ilustrativo"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover object-center"
              priority
              style={{
                filter: "brightness(0.95) contrast(1.05) saturate(0.92)",
              }}
            />
            {/* Top vignette to integrate with the dark card top */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.06 0.005 230) 0%, transparent 18%, transparent 80%, oklch(0.06 0.005 230 / 0.55) 100%)",
              }}
            />
            {/* Side fade for blending */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.08 0.005 230 / 0.35) 0%, transparent 12%, transparent 88%, oklch(0.08 0.005 230 / 0.35) 100%)",
              }}
            />
          </div>

          {/* Reflection floor */}
          <div
            aria-hidden
            className="absolute inset-x-6 -bottom-1 h-2 blur-md opacity-40"
            style={{
              background:
                "linear-gradient(180deg, oklch(1 0 0 / 0.10) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* ── SoH battery — hero metric ──────────────────────────── */}
        <SoHBatteryRow value={95} />

        {/* ── Other specs ────────────────────────────────────────── */}
        <dl className="grid grid-cols-3 gap-x-4 border-y border-white/[0.08] py-4">
          <SmallStat label="Quilómetros" value="50 320" suffix="km" />
          <SmallStat label="Autonomia" value="450" suffix="km" />
          <SmallStat label="Donos" value="1" suffix="" />
        </dl>

        {/* ── Price + CTA ────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
              Valor indicativo
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-white/40 text-lg font-medium">€</span>
              <span
                className="font-bold tracking-[-0.035em] tabular-nums text-white leading-none"
                style={{ fontSize: "clamp(2.25rem, 5.5vw, 3rem)", fontWeight: 700 }}
              >
                18&thinsp;500
              </span>
            </div>
          </div>
          <Link
            href="/avaliar"
            className="group inline-flex items-center justify-center gap-1 rounded-full bg-white text-black h-11 px-5 text-[13px] font-semibold tracking-tight transition-all hover:translate-y-[-1px] hover:shadow-[0_10px_24px_-8px_oklch(1_0_0_/_0.30)]"
          >
            Avaliar o meu
            <ArrowRight
              size={14}
              className="ml-0.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {/* Caveat */}
        <p className="font-mono text-[10px] leading-relaxed text-white/35 -mt-2">
          Confirmado após inspeção presencial · validade 48&nbsp;h
        </p>
      </div>
    </article>
  );
}

/* ─── Mini PT plate chip ────────────────────────────────────────────────── */
function PtPlate({ value }: { value: string }) {
  return (
    <span
      className="inline-flex items-stretch overflow-hidden rounded-[3px] border border-white/15 text-[10px] font-mono"
      aria-label={`Matrícula ${value}`}
    >
      <span
        className="px-1 grid place-items-center text-[7px] font-bold text-white/85"
        style={{ background: "oklch(0.30 0.18 260)" }}
      >
        P
      </span>
      <span className="px-1.5 py-0.5 bg-white/[0.04] text-white/85 tracking-[0.05em] tabular-nums">
        {value}
      </span>
    </span>
  );
}

/* ─── SoH segmented battery row (the hero metric) ───────────────────────── */
function SoHBatteryRow({ value }: { value: number }) {
  const segments = 12;
  const filledSegments = Math.round((value / 100) * segments);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
          Bateria · SoH
        </p>
        <p className="font-mono text-[10px] text-white/40">
          melhor do que 87% dos Model 3 desta idade
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="font-bold text-white tabular-nums leading-none"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
            fontWeight: 600,
          }}
        >
          {value}
          <span className="text-white/45 text-base font-normal ml-0.5">%</span>
        </span>
        <div className="flex flex-1 gap-[3px]" aria-hidden>
          {Array.from({ length: segments }).map((_, i) => (
            <span
              key={i}
              className="flex-1 h-2.5 rounded-[1.5px] transition-opacity"
              style={{
                background:
                  i < filledSegments
                    ? "var(--brand)"
                    : "oklch(1 0 0 / 0.06)",
                opacity: i < filledSegments ? 1 - (filledSegments - i) * 0.04 : 1,
                boxShadow:
                  i < filledSegments
                    ? "0 0 8px color-mix(in oklab, var(--brand) 30%, transparent)"
                    : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Small stat row ────────────────────────────────────────────────────── */
function SmallStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </dt>
      <dd className="text-[15px] font-semibold text-white/95 tabular-nums leading-none flex items-baseline gap-1">
        {value}
        {suffix && (
          <span className="text-[11px] font-normal text-white/40">{suffix}</span>
        )}
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
