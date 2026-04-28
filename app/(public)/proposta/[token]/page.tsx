import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { decideProposalView, type ProposalRow } from "@/lib/proposals/lookup";
import { formatEur } from "@/lib/format/currency";
import { formatPtDateTime } from "@/lib/format/date";
import { AcceptRejectButtons } from "@/components/proposal/AcceptRejectButtons";
import { Countdown } from "@/components/proposal/Countdown";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  CalendarCheck,
  MapPin,
  Banknote,
  Car,
  ShieldCheck,
  FileText,
  Info,
} from "lucide-react";

const VIEW_LOG_WINDOW_MS = 60 * 60_000; // 1h

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  const { token } = await params;
  if (!isValidTokenShape(token)) notFound();

  const supabase = createServiceRoleClient();

  const { data: proposalRaw } = await supabase
    .from("proposals")
    .select("id, lead_id, token, status, valor_eur_cents, sent_at, viewed_at, accepted_at, rejected_at, expires_at, notes_internal")
    .eq("token", token)
    .maybeSingle();

  if (!proposalRaw) notFound();

  const proposal = proposalRaw as ProposalRow;
  const decision = decideProposalView(proposal);
  if (decision.action === "REDIRECT") redirect(decision.target);

  // Server-side transition: SENT → VIEWED on first view
  if (proposal.status === "SENT") {
    await supabase
      .from("proposals")
      .update({ status: "VIEWED", viewed_at: new Date().toISOString() })
      .eq("id", proposal.id)
      .eq("status", "SENT");
  }

  // Idempotent VIEWED event: only insert if no PROPOSAL_VIEWED in last 1h from same IP
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  const ua = hdrs.get("user-agent") ?? "";

  const { data: recentView } = await supabase
    .from("events")
    .select("id, payload, created_at")
    .eq("lead_id", proposal.lead_id)
    .eq("type", "PROPOSAL_VIEWED")
    .gte("created_at", new Date(Date.now() - VIEW_LOG_WINDOW_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  const sameIpRecent = (recentView ?? []).some((e: any) => e.payload?.ip === ip);
  if (!sameIpRecent) {
    await supabase.from("events").insert({
      lead_id: proposal.lead_id,
      proposal_id: proposal.id,
      type: "PROPOSAL_VIEWED",
      actor: "customer",
      payload: { ip, ua },
    });
  }

  // Fetch lead for the rich page
  const { data: lead } = await supabase
    .from("leads")
    .select("nome, marca, modelo, versao, ano, km, cor, num_donos_anteriores, estado_geral, sinistros, livro_manutencao, bateria_soh_pct, autonomia_real_km, carregador_incluido, matricula")
    .eq("id", proposal.lead_id)
    .single();

  if (!lead) notFound();

  return <ProposalView proposal={proposal} lead={lead as any} />;
}

// ─── Enum label maps ──────────────────────────────────────────────────────────

const ESTADO_GERAL_LABELS: Record<string, string> = {
  OPTIMO: "Ótimo",
  BOM: "Bom",
  RAZOAVEL: "Razoável",
  MAU: "Mau",
};

const SINISTROS_LABELS: Record<string, string> = {
  NUNCA: "Nunca",
  LIGEIROS: "Ligeiros",
  GRAVES: "Graves",
};

// ─── Polished ProposalView ────────────────────────────────────────────────────

function ProposalView({ proposal, lead }: { proposal: ProposalRow; lead: any }) {
  const valorFormatted = formatEur(proposal.valor_eur_cents);
  const expiresDate = new Date(proposal.expires_at);
  const expiresFormatted = formatPtDateTime(expiresDate);
  const ref = proposal.token.slice(0, 8).toUpperCase();

  // Car summary rows
  const carRows: { label: string; value: string | null; mono?: boolean }[] = [
    { label: "Matrícula", value: lead.matricula ?? null, mono: true },
    {
      label: "Veículo",
      value: [lead.marca, lead.modelo, lead.versao, lead.ano].filter(Boolean).join(" · "),
    },
    {
      label: "Quilómetros",
      value: lead.km != null ? `${Number(lead.km).toLocaleString("pt-PT")} km` : null,
    },
    { label: "Cor", value: lead.cor ?? null },
    {
      label: "Donos anteriores",
      value: lead.num_donos_anteriores != null ? String(lead.num_donos_anteriores) : null,
    },
    {
      label: "Estado geral",
      value: lead.estado_geral ? (ESTADO_GERAL_LABELS[lead.estado_geral] ?? lead.estado_geral) : null,
    },
    {
      label: "Sinistros",
      value: lead.sinistros ? (SINISTROS_LABELS[lead.sinistros] ?? lead.sinistros) : null,
    },
    {
      label: "Livro de manutenção",
      value: lead.livro_manutencao != null ? (lead.livro_manutencao ? "Sim" : "Não") : null,
    },
    {
      label: "Saúde da bateria (SoH)",
      value: lead.bateria_soh_pct != null ? `${lead.bateria_soh_pct}%` : null,
    },
    {
      label: "Autonomia real",
      value: lead.autonomia_real_km != null ? `${lead.autonomia_real_km} km` : null,
    },
    {
      label: "Carregador incluído",
      value: lead.carregador_incluido != null ? (lead.carregador_incluido ? "Sim" : "Não") : null,
    },
  ].filter((r) => r.value !== null && r.value !== "");

  // Conditions list
  const conditions = [
    "Proposta indicativa, sujeita a confirmação após inspeção no local.",
    "Pagamento efetuado no próprio dia da visita.",
    "Transferência bancária imediata ou cheque visado após validação.",
    "O veículo fica connosco no local após aceitação e assinatura.",
    "O carro deve estar limpo e com toda a documentação presente no dia da inspeção.",
  ];

  // Steps timeline
  const steps = [
    {
      icon: CheckCircle,
      label: "Aceitar",
      detail: "Confirmas a proposta aqui mesmo, nesta página.",
    },
    {
      icon: CalendarCheck,
      label: "Marcar visita",
      detail: "Escolhes o dia e hora mais conveniente para ti.",
    },
    {
      icon: MapPin,
      label: "Validar no local",
      detail: "Inspeção rápida (~30 min) no nosso espaço em Lisboa.",
    },
    {
      icon: Banknote,
      label: "Pagar e transferir",
      detail: "Transferência bancária imediata. O carro fica connosco.",
    },
  ];

  // FAQ items
  const faqItems = [
    {
      q: "E se o carro estiver pior do que declarei?",
      a: "Se a inspeção revelar diferenças significativas em relação ao declarado, poderemos ajustar a proposta. Serás sempre informado antes de qualquer decisão final, sem compromissos.",
    },
    {
      q: "Posso negociar o valor?",
      a: "A proposta é calculada com base nos dados declarados e no mercado atual. Após a inspeção, se o carro corresponder ao declarado, o valor é fixo. Fazemos avaliações justas e transparentes.",
    },
    {
      q: "Quanto tempo demora todo o processo?",
      a: "Da aceitação ao pagamento, tipicamente menos de 48 horas. A inspeção demora cerca de 30 minutos; o pagamento é feito no próprio dia.",
    },
    {
      q: "Onde ficam? Tenho de levar o carro?",
      a: "Temos espaço em Lisboa. Tens de trazer o carro até nós — a inspeção é feita nas nossas instalações. O endereço exato é enviado após marcação da visita.",
    },
    {
      q: "E se mudar de ideias depois de aceitar?",
      a: "Podes cancelar até ao momento da assinatura na inspeção. Depois de assinado o contrato de compra e venda, a transação é vinculativa.",
    },
    {
      q: "Quem são vocês?",
      a: "Somos uma empresa portuguesa especializada na compra de veículos elétricos usados. Operamos com transparência, preços justos e pagamento garantido no próprio dia.",
    },
  ];

  return (
    <>
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 pb-36 sm:pb-14">

        {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="proposal-hero-title">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Proposta para
          </p>
          <h1
            id="proposal-hero-title"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-snug mb-6"
          >
            {lead.nome ? `${lead.nome}, aqui está a nossa proposta` : "A nossa proposta"}{" "}
            para o teu{" "}
            <span className="text-foreground">
              {lead.marca} {lead.modelo}
            </span>
          </h1>

          {/* Price block */}
          <div className="rounded-2xl bg-primary/5 ring-1 ring-primary/15 px-6 py-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div
                className="font-mono text-5xl sm:text-6xl font-semibold text-primary tracking-tight leading-none"
                aria-label={`Valor da proposta: ${valorFormatted}`}
              >
                {valorFormatted}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="font-mono text-[0.65rem] tracking-widest border-primary/20 text-primary/70 uppercase"
                >
                  Proposta indicativa
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Ref.ª
              </p>
              <p className="font-mono text-sm text-foreground tracking-wider">{ref}</p>
            </div>
          </div>
        </section>

        {/* ── 2. Validity countdown ────────────────────────────────────────── */}
        <section
          aria-label="Validade da proposta"
          className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span>
              Válida até{" "}
              <time
                dateTime={expiresDate.toISOString()}
                className="text-foreground font-medium"
              >
                {expiresFormatted}
              </time>
            </span>
          </div>
          <Countdown expiresAt={proposal.expires_at} />
        </section>

        {/* ── 3. Action buttons (desktop) ─────────────────────────────────── */}
        <section aria-label="Ações sobre a proposta" className="hidden sm:block">
          <AcceptRejectButtons token={proposal.token} valorFormatted={valorFormatted} />
          <p className="mt-3 text-xs text-muted-foreground">
            Ao aceitar, passas para o passo de marcação de visita. Podes cancelar até à assinatura.
          </p>
        </section>

        {/* ── 4. Car summary ──────────────────────────────────────────────── */}
        <section aria-labelledby="car-summary-title">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Car className="size-4 text-primary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <h2
                  id="car-summary-title"
                  className="text-sm font-semibold text-foreground"
                >
                  Resumo do carro declarado
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Estes valores foram fornecidos por ti — confirmamos tudo na inspeção.
              </p>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                {carRows.map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
                    <dd
                      className={`text-sm text-foreground text-right ${
                        mono ? "font-mono tracking-wider" : "font-medium"
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>

        {/* ── 5. Conditions ───────────────────────────────────────────────── */}
        <section aria-labelledby="conditions-title">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className="size-4 text-primary shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h2
                  id="conditions-title"
                  className="text-sm font-semibold text-foreground"
                >
                  Condições
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span
                      className="mt-1 size-1.5 rounded-full bg-primary/60 shrink-0 ring-2 ring-primary/15"
                      aria-hidden="true"
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ── 6. Next steps timeline ──────────────────────────────────────── */}
        <section aria-labelledby="steps-title">
          <h2
            id="steps-title"
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5"
          >
            Próximos passos
          </h2>
          <ol className="space-y-0">
            {steps.map(({ icon: Icon, label, detail }, index) => (
              <li key={label} className="flex gap-4">
                {/* Connector */}
                <div className="flex flex-col items-center">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/20">
                    <Icon
                      className="size-4 text-primary"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-1 my-1.5 bg-border min-h-[1.5rem]" />
                  )}
                </div>
                {/* Content */}
                <div className={`min-w-0 ${index < steps.length - 1 ? "pb-5" : "pb-0"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground/60 tabular-nums">
                      0{index + 1}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 7. FAQ accordion ────────────────────────────────────────────── */}
        <section aria-labelledby="faq-title">
          <div className="flex items-center gap-2.5 mb-4">
            <FileText
              className="size-4 text-muted-foreground shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h2
              id="faq-title"
              className="text-xs font-mono uppercase tracking-widest text-muted-foreground"
            >
              Perguntas frequentes
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Accordion>
              {faqItems.map(({ q, a }, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <div className="px-4">
                    <AccordionTrigger className="text-sm font-medium text-foreground py-3.5 hover:no-underline hover:text-primary">
                      {q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {a}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Reference footer */}
        <p className="text-center text-xs font-mono text-muted-foreground/40 tracking-widest pt-2">
          Ref.ª {ref}
        </p>
      </div>

      {/* ── Sticky CTA bar — mobile only ────────────────────────────────── */}
      <div
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 space-y-2"
        aria-label="Ações sobre a proposta"
      >
        <AcceptRejectButtons token={proposal.token} valorFormatted={valorFormatted} />
        <p className="text-center text-xs text-muted-foreground">
          Ao aceitar, passas para a marcação de visita.
        </p>
      </div>
    </>
  );
}
