import Link from "next/link";
import { CheckCircle2, MessageSquare, FileText, Calendar, BatteryCharging, Gauge, FileCheck, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16">

      {/* ================================================================
          HERO — Success confirmation
          ================================================================ */}
      <section className="space-y-6">
        {/* Icon + rule */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2
              className="text-primary"
              size={28}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
          <div className="h-px flex-1 bg-border" aria-hidden="true" />
          <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase shrink-0">
            Confirmado
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1
            className="font-bold leading-[1.1] tracking-tight text-foreground"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
          >
            Recebemos a tua avaliação.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Vais receber um SMS com a nossa proposta dentro de{" "}
            <strong className="text-foreground font-semibold">1 hora útil</strong>{" "}
            (horário 9h–19h, dias úteis).
          </p>
        </div>
      </section>

      {/* ================================================================
          O QUE SE SEGUE — 3-step timeline
          ================================================================ */}
      <section className="space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            01
          </span>
          <div className="h-px w-8 bg-primary" aria-hidden="true" />
          <h2 className="font-semibold text-lg tracking-tight">O que se segue</h2>
        </div>

        {/* Steps */}
        <ol className="space-y-0" role="list">
          {[
            {
              number: "01",
              icon: <MessageSquare size={20} strokeWidth={1.75} aria-hidden="true" />,
              title: "Recebes SMS no teu telemóvel",
              description:
                "A nossa equipa analisa os dados do teu veículo e envia uma proposta firme por SMS — sem negociação, sem ambiguidades.",
            },
            {
              number: "02",
              icon: <FileText size={20} strokeWidth={1.75} aria-hidden="true" />,
              title: "Abres o link e vês a proposta",
              description:
                "O SMS inclui um link seguro com o valor proposto e as condições. Podes ver tudo ao teu ritmo, sem pressão.",
            },
            {
              number: "03",
              icon: <Calendar size={20} strokeWidth={1.75} aria-hidden="true" />,
              title: "Aceitas e marcas a inspeção",
              description:
                "Se a proposta te convencer, aceitares e marcas a inspeção presencial. Tratamos de toda a logística e da transferência.",
            },
          ].map((step, idx, arr) => (
            <li key={step.number} className="relative flex gap-5">
              {/* Vertical connector line */}
              {idx < arr.length - 1 && (
                <div
                  className="absolute left-[19px] top-12 bottom-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}

              {/* Step marker */}
              <div className="relative flex-shrink-0 w-10 h-10 mt-1 rounded-full border border-border bg-card flex items-center justify-center text-primary">
                {step.icon}
              </div>

              {/* Content */}
              <div className="pb-8 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {step.number}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ================================================================
          ENQUANTO ESPERAS — Inspection checklist
          ================================================================ */}
      <section className="space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            02
          </span>
          <div className="h-px w-8 bg-primary" aria-hidden="true" />
          <h2 className="font-semibold text-lg tracking-tight">Enquanto esperas</h2>
        </div>

        {/* Reassurance intro */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          A nossa avaliação é transparente e baseada em dados reais. Na inspeção presencial vamos verificar:
        </p>

        {/* Checklist */}
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {[
            {
              icon: <BatteryCharging size={18} strokeWidth={1.75} aria-hidden="true" />,
              title: "Saúde da bateria (SoH)",
              description:
                "Medimos a capacidade real em kWh relativamente à capacidade original — o indicador mais importante no valor de um EV.",
            },
            {
              icon: <Gauge size={18} strokeWidth={1.75} aria-hidden="true" />,
              title: "Autonomia real",
              description:
                "Verificamos a autonomia no ciclo WLTP e em condições reais de condução portuguesa — sem dependermos só dos dados do fabricante.",
            },
            {
              icon: <FileCheck size={18} strokeWidth={1.75} aria-hidden="true" />,
              title: "Condição geral e documentação",
              description:
                "Carroçaria, interiores, pneus, travões e histórico de manutenção. Confirmamos também que a documentação está em ordem para a transferência.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 p-5">
              <div className="flex-shrink-0 mt-0.5 text-primary">{item.icon}</div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Não precisas de preparar nada agora. Se a proposta for aceite, a nossa equipa diz-te exactamente o que levar para a inspeção.
        </p>
      </section>

      {/* ================================================================
          CTA SECUNDÁRIA
          ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-border">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex items-center gap-2 self-start"
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar à página inicial
        </Link>

        <p className="text-xs text-muted-foreground font-mono">
          Dúvidas? Contacta-nos antes de receberes o SMS.
        </p>
      </div>

      {/* ================================================================
          FOOTER REF NOTE — low-contrast visual ack
          ================================================================ */}
      {ref && (
        <p
          className="font-mono text-xs text-muted-foreground/40 tracking-wide"
          aria-label={`Referência da avaliação: ${ref}`}
        >
          Refª: {ref}
        </p>
      )}
    </div>
  );
}
