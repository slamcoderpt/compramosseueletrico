import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos e Condições · compramososeueletrico",
  description:
    "Como funciona o nosso serviço de compra de veículos elétricos. Validade da proposta, inspeção presencial, pagamento e responsabilidades.",
};

const SECTIONS = [
  { id: "servico", n: "01", t: "Sobre o serviço" },
  { id: "natureza-proposta", n: "02", t: "Natureza da proposta" },
  { id: "validade", n: "03", t: "Validade da proposta" },
  { id: "marcacao", n: "04", t: "Marcação de visita" },
  { id: "pagamento", n: "05", t: "Pagamento" },
  { id: "responsabilidade", n: "06", t: "Responsabilidade" },
  { id: "lei", n: "07", t: "Lei aplicável" },
  { id: "contacto", n: "08", t: "Contacto" },
];

export default function TermosPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3">
          Documento legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          Termos e Condições
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-prose">
          As regras que regulam o uso desta plataforma e a compra do teu veículo
          elétrico. Lê com atenção — em caso de dúvida, fala connosco em{" "}
          <a
            href="mailto:dpo@compramososeueletrico.pt"
            className="font-mono text-primary hover:underline underline-offset-4"
          >
            dpo@compramososeueletrico.pt
          </a>
          .
        </p>
        <p className="mt-3 text-xs font-mono text-muted-foreground">
          Última atualização: 28 de abril de 2026
        </p>
      </header>

      <nav
        aria-label="Índice"
        className="mb-12 rounded-md border border-border bg-muted/40 p-5"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Índice
        </p>
        <ol className="space-y-1.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={`#${s.id}`}
                className="group flex items-baseline gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono text-[11px] text-muted-foreground group-hover:text-primary tabular-nums">
                  {s.n}
                </span>
                <span>{s.t}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-14">
        <Section id="servico" n="01" t="Sobre o serviço">
          <p>
            A plataforma <strong className="text-foreground">compramososeueletrico</strong> é
            operada por Compramos o Seu Elétrico, Lda. Não somos um marketplace nem
            um intermediário: <strong className="text-foreground">compramos diretamente o teu carro</strong>.
            A avaliação inicia-se online e termina com inspeção presencial num dos
            nossos locais.
          </p>
        </Section>

        <Section id="natureza-proposta" n="02" t="Natureza da proposta">
          <div className="not-prose mb-4 rounded-md border-l-4 border-primary bg-primary/8 p-4 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-primary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground leading-relaxed">
              A proposta enviada por SMS é{" "}
              <strong>indicativa</strong>. O preço final é confirmado apenas após a
              inspeção presencial.
            </p>
          </div>
          <p>
            Diferenças significativas entre o estado declarado e o estado real do
            veículo podem alterar o valor proposto ou levar à recusa de compra. Por
            estado real entende-se, entre outros: quilometragem, integridade
            mecânica, histórico de sinistros, estado da bateria (SoH) e autonomia
            verificável.
          </p>
        </Section>

        <Section id="validade" n="03" t="Validade da proposta">
          <p>
            A proposta indicativa enviada por SMS é válida durante{" "}
            <strong className="text-foreground">48 horas</strong> a contar do momento do
            envio. Após este prazo, é necessária nova avaliação — as condições do
            mercado e do próprio veículo podem ter mudado.
          </p>
        </Section>

        <Section id="marcacao" n="04" t="Marcação de visita">
          <p>
            Aceite a proposta, marcas a visita ao nosso local através do calendário
            que te enviamos. A inspeção tem uma duração média de{" "}
            <strong className="text-foreground">30 minutos</strong>. Pedimos pontualidade —
            o slot é reservado em exclusivo para ti.
          </p>
          <p>
            Caso não possas comparecer, cancela ou remarca pelo link do
            calendário com pelo menos algumas horas de antecedência.
          </p>
        </Section>

        <Section id="pagamento" n="05" t="Pagamento">
          <p>
            O pagamento é efetuado <strong className="text-foreground">no próprio
            dia da inspeção</strong>, após confirmação do preço final, por
            transferência bancária imediata ou cheque. Toda a documentação do
            veículo (livrete, DUA, livro de manutenção, chaves) é entregue no
            momento.
          </p>
        </Section>

        <Section id="responsabilidade" n="06" t="Responsabilidade">
          <p>
            Limitamos a nossa responsabilidade aos danos diretos causados por dolo
            ou negligência grave. Excluem-se, na máxima extensão permitida pela lei,
            lucros cessantes, danos indiretos, perda de oportunidade e quaisquer
            danos não previsíveis no momento da contratação.
          </p>
        </Section>

        <Section id="lei" n="07" t="Lei aplicável">
          <p>
            Estes termos regem-se pela lei portuguesa. Para qualquer litígio
            emergente da sua aplicação, é competente o foro da{" "}
            <strong className="text-foreground">comarca de Lisboa</strong>, com expressa
            renúncia a qualquer outro.
          </p>
        </Section>

        <Section id="contacto" n="08" t="Contacto">
          <p>
            Para qualquer questão sobre estes termos, escreve para{" "}
            <a
              href="mailto:dpo@compramososeueletrico.pt"
              className="font-mono text-primary hover:underline underline-offset-4"
            >
              dpo@compramososeueletrico.pt
            </a>{" "}
            ou consulta a página de{" "}
            <Link
              href="/contacto"
              className="text-foreground hover:text-primary underline underline-offset-4"
            >
              contacto
            </Link>
            .
          </p>
        </Section>
      </div>

      <Separator className="my-12" />
      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
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
          href="/cookies"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Cookies
        </Link>
        <Link
          href="/contacto"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Contacto
        </Link>
      </nav>
    </article>
  );
}

function Section({
  id,
  n,
  t,
  children,
}: {
  id: string;
  n: string;
  t: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="flex items-baseline gap-4 mb-4">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{n}</span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t}
        </h2>
      </header>
      <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-p:my-3">
        {children}
      </div>
    </section>
  );
}
