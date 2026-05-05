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
  "https://images.vexels.com/media/users/3/128885/isolated/preview/62112c9b15fb4bf9e38567d6e436b2dd-tesla-car-svg.png";

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

/* ──────────────────────────────────────────────────────────────────────────
   Testimonials — replace with real seller quotes when available.
   ────────────────────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "João M.",
    car: "Tesla Model 3 · Lisboa",
    quote:
      "Recebi proposta em menos de 3 horas. Preço justo, tudo tratado sem dores de cabeça. Recomendo a qualquer proprietário de elétrico.",
  },
  {
    name: "Sara F.",
    car: "Nissan Leaf · Porto",
    quote:
      "Fiz a avaliação num minuto e o dinheiro entrou na conta no dia seguinte. Simples, rápido, sem negociações infinitas.",
  },
  {
    name: "Rui P.",
    car: "VW ID.3 · Coimbra",
    quote:
      "Outros compradores perdiam-me em negociações. Aqui fui tratado com seriedade: proposta firme logo de início, sem surpresas.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Stat bar numbers — update as real data accumulates.
   ────────────────────────────────────────────────────────────────────────── */
const NUMEROS = [
  { value: "320+", label: "EVs avaliados" },
  { value: "98%", label: "clientes satisfeitos" },
  { value: "<2h", label: "tempo médio de proposta" },
  { value: "4.9★", label: "avaliação média" },
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
                  48&nbsp;h
                </span>
                .
              </h1>

              <p className="mt-6 max-w-md text-[15px] sm:text-base leading-relaxed text-muted-foreground">
                Avaliação online em 1 minuto. Proposta firme por SMS em poucas
                horas. Pagamento nas 48 h seguintes à inspeção.
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
                  ["48h", "Para o pagamento"],
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

              {/* Guarantee strip */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  "Serviço gratuito",
                  "Sem compromisso",
                  "Pagamento por transferência",
                ].map((g) => (
                  <span
                    key={g}
                    className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
                  >
                    <Check
                      size={11}
                      className="text-emerald-500 shrink-0"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {g}
                  </span>
                ))}
              </div>
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
                body: "Recolha no Norte e Centro. Inspeção com leitura ao BMS. Pagamento por transferência nas 48 h seguintes ao teste.",
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
          3. NÚMEROS — dark stat bar, social proof
          ════════════════════════════════════════════════════════════════════ */}
      <NumerosSection />

      {/* ════════════════════════════════════════════════════════════════════
          4. PORQUÊ — split, 4 small spec cards + headline
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
                  body: "Lemos diretamente o sistema de gestão da bateria (BMS). SoH real, não estimado — o fator que mais pesa no valor.",
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
          5. MODELOS — single white card with internal grid
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

          {/* "Compramos com problemas" callout */}
          <div className="mt-4 rounded-2xl border border-border/60 bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-semibold text-foreground">Carro com problemas?</span>{" "}
              Avaliamos na mesma — bateria degradada, danos ou avaria. O estado reflete-se no preço, nunca numa recusa.
            </p>
            <PillButton href="/avaliar" variant="ghost">
              Avaliar assim mesmo
              <ArrowRight size={14} className="ml-1" aria-hidden />
            </PillButton>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. TESTEMUNHOS — 3 seller testimonial cards
          ════════════════════════════════════════════════════════════════════ */}
      <TestemunhosSection />

      {/* ════════════════════════════════════════════════════════════════════
          7. FAQ — narrow, light card-style
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
          8. CTA FINAL — dark anchor card on light bg
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

        {/* ── Vehicle cutout — hero visual ───────────────────────── */}
        <div className="relative -mx-2 sm:-mx-4 mt-1 mb-1 aspect-[16/9]">
          {/* Brand teal underglow — slightly stronger now that the car is fully visible */}
          <div
            aria-hidden
            className="absolute inset-x-12 bottom-3 h-14 blur-2xl opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 55% 100% at 50% 100%, color-mix(in oklab, var(--brand) 75%, transparent), transparent)",
            }}
          />

          {/* Ground shadow — soft elliptical drop under wheels */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[78%] h-3 blur-md opacity-65"
            style={{
              background:
                "radial-gradient(ellipse 50% 100% at 50% 50%, oklch(0 0 0 / 0.55), transparent 70%)",
            }}
          />

          {/* The car cutout itself */}
          <Image
            src={PROPOSAL_PREVIEW_IMG}
            alt="Tesla Model 3 — exemplo ilustrativo"
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-contain object-center select-none pointer-events-none"
            priority
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

/* ─── Números Section — dark stat bar ──────────────────────────────────── */
function NumerosSection() {
  return (
    <section aria-label="Números em destaque" className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className="relative isolate overflow-hidden rounded-3xl"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.10 0.008 220) 0%, oklch(0.06 0 0) 100%)",
            boxShadow:
              "0 1px 0 oklch(1 0 0 / 0.05) inset, 0 24px 60px -20px oklch(0 0 0 / 0.4)",
          }}
        >
          {/* Subtle grid pattern */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          {/* Brand teal glow — right side */}
          <div
            aria-hidden
            className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 100% 50%, color-mix(in oklab, var(--brand) 12%, transparent), transparent)",
            }}
          />

          <dl className="relative grid grid-cols-2 lg:grid-cols-4">
            {NUMEROS.map((n, i) => (
              <div
                key={n.label}
                className={[
                  "flex flex-col items-center justify-center py-10 sm:py-14 px-6 text-center border-white/[0.06]",
                  // Mobile 2-col: right border on left column, bottom border on top row
                  i === 0 ? "border-r border-b" : "",
                  i === 1 ? "border-b" : "",
                  i === 2 ? "border-r" : "",
                  // Desktop 4-col: right border except last, no bottom border
                  i < NUMEROS.length - 1 ? "lg:border-r" : "lg:border-r-0",
                  "lg:border-b-0",
                ].join(" ")}
              >
                <dt
                  className="text-white tabular-nums font-semibold leading-none tracking-[-0.035em]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                    fontWeight: 600,
                  }}
                >
                  {n.value}
                </dt>
                <dd className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  {n.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ─── Star row — brand teal stars ───────────────────────────────────────── */
function StarRow() {
  return (
    <div className="flex gap-0.5" aria-label="5 estrelas de 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="var(--brand)"
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Testemunhos Section ───────────────────────────────────────────────── */
function TestemunhosSection() {
  return (
    <section aria-labelledby="testemunhos-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-10 sm:mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Testemunhos
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              id="testemunhos-title"
              className="font-extrabold tracking-[-0.025em] text-foreground"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800 }}
            >
              Quem já vendeu.
            </h2>
            <p className="text-sm text-muted-foreground">
              Serviço gratuito · sem compromisso até aceitares a proposta.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="group rounded-2xl bg-card border border-border/60 p-6 flex flex-col transition-all duration-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <StarRow />
              <blockquote className="mt-4 text-[14px] leading-relaxed text-foreground/80 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <footer className="mt-5 pt-4 border-t border-border/60 flex items-center gap-3">
                {/* Avatar initials */}
                <span
                  className="size-8 rounded-full grid place-items-center text-[11px] font-semibold text-foreground/60 shrink-0"
                  style={{
                    background: "oklch(0.93 0.002 240)",
                  }}
                  aria-hidden
                >
                  {t.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-foreground leading-none">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5 leading-none">
                    {t.car}
                  </p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
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

          {/* Bottom guarantee strip in CTA */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {["Gratuito", "Sem compromisso", "Pagamento garantido"].map((g) => (
              <span
                key={g}
                className="flex items-center gap-1.5 text-[12px] text-white/50"
              >
                <Check size={11} className="text-emerald-400 shrink-0" strokeWidth={2.5} aria-hidden />
                {g}
              </span>
            ))}
          </div>
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
