import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Privacidade · compramososeueletrico",
  description:
    "Como tratamos os teus dados pessoais e os do teu veículo elétrico. Bases legais, prazos de retenção e direitos do titular.",
};

const SECTIONS = [
  { id: "quem-somos", n: "01", t: "Quem somos" },
  { id: "que-dados", n: "02", t: "Que dados recolhemos" },
  { id: "porque-tratamos", n: "03", t: "Por que tratamos os teus dados" },
  { id: "subprocessadores", n: "04", t: "Sub-processadores que usamos" },
  { id: "direitos", n: "05", t: "Direitos do titular" },
  { id: "reclamacoes", n: "06", t: "Reclamações" },
  { id: "alteracoes", n: "07", t: "Alterações a esta política" },
];

const DADOS = [
  {
    label: "Veículo",
    items: ["Matrícula", "Marca, modelo, ano", "Quilómetros", "Estado geral, sinistros", "SoH da bateria, autonomia real"],
  },
  {
    label: "Pessoais",
    items: ["Nome", "Telemóvel (E.164)", "Email"],
  },
  {
    label: "Metadados de eventos",
    items: ["Endereço IP (anti-fraude, retenção limitada)", "User-agent", "Timestamps de submissão e visualização"],
  },
  {
    label: "Comunicações",
    items: ["Registo de SMS enviados (Twilio)", "Estado de entrega para auditoria"],
  },
];

const FINALIDADES = [
  {
    titulo: "Avaliação e proposta de compra",
    base: "Execução pré-contratual — art. 6.º/1/b RGPD",
    retencao: "12 meses após o último contacto",
  },
  {
    titulo: "Operação da plataforma e auditoria",
    base: "Interesse legítimo — art. 6.º/1/f RGPD",
    retencao: "6 a 12 meses",
  },
  {
    titulo: "Vendas concluídas (faturação)",
    base: "Obrigação legal fiscal portuguesa",
    retencao:
      "10 anos, com anonimização parcial após 12 meses (mantendo apenas o estritamente exigido pela AT)",
  },
];

const SUBP = [
  { nome: "Vercel", funcao: "Hosting e edge", regiao: "UE / EUA", base: "SCC" },
  { nome: "Supabase", funcao: "Base de dados e autenticação", regiao: "UE (eu-west)", base: "—" },
  { nome: "Twilio", funcao: "Envio de SMS", regiao: "UE / EUA", base: "SCC" },
  { nome: "Cal.com", funcao: "Marcação de visita", regiao: "UE / EUA", base: "SCC" },
  { nome: "Resend", funcao: "Email transacional", regiao: "UE / EUA", base: "SCC" },
  { nome: "Upstash", funcao: "Rate-limit", regiao: "UE", base: "—" },
  { nome: "Sentry", funcao: "Monitorização de erros", regiao: "UE", base: "—" },
];

export default function PoliticaPrivacidadePage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3">
          Documento legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          Política de Privacidade
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-prose">
          Esta página explica que dados recolhemos, porque os tratamos, com quem os
          partilhamos e que direitos tens — em linguagem direta, sem juridiquês.
        </p>
        <p className="mt-3 text-xs font-mono text-muted-foreground">
          Última atualização: 28 de abril de 2026
        </p>
      </header>

      {/* TOC */}
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

      {/* Sections */}
      <div className="space-y-14">
        <Section id="quem-somos" n="01" t="Quem somos">
          <p>
            Esta plataforma é operada por{" "}
            <strong className="text-foreground">Compramos o Seu Elétrico, Lda.</strong>,
            sociedade com sede em Portugal.
          </p>
          <DataTable
            rows={[
              ["Empresa", "Compramos o Seu Elétrico, Lda."],
              ["NIF", "999 999 999"],
              ["Morada", "Rua Exemplo 123, 1000-000 Lisboa"],
              ["Encarregado de Proteção de Dados (DPO)", "dpo@compramososeueletrico.pt"],
            ]}
          />
        </Section>

        <Section id="que-dados" n="02" t="Que dados recolhemos">
          <p>
            Recolhemos apenas o estritamente necessário para te dar uma proposta justa
            e operar a plataforma com segurança. Nenhum dado é usado para marketing.
          </p>
          <div className="not-prose grid sm:grid-cols-2 gap-3 mt-2">
            {DADOS.map((bloco) => (
              <Card
                key={bloco.label}
                className="p-4 gap-2 bg-background border-border"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                  {bloco.label}
                </p>
                <ul className="text-sm text-foreground space-y-1">
                  {bloco.items.map((it) => (
                    <li key={it} className="leading-snug">
                      {it}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="porque-tratamos" n="03" t="Por que tratamos os teus dados">
          <p>
            Cada finalidade tem uma base legal própria. Quando o tratamento depende
            do teu consentimento, podes retirá-lo a qualquer momento.
          </p>
          <div className="not-prose space-y-3 mt-2">
            {FINALIDADES.map((f) => (
              <div
                key={f.titulo}
                className="rounded-md border border-border bg-muted/30 p-4"
              >
                <p className="text-sm font-medium text-foreground">{f.titulo}</p>
                <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Base
                  </dt>
                  <dd className="text-foreground">{f.base}</dd>
                  <dt className="font-mono uppercase tracking-wider text-muted-foreground">
                    Retenção
                  </dt>
                  <dd className="text-foreground">{f.retencao}</dd>
                </dl>
              </div>
            ))}
          </div>
        </Section>

        <Section id="subprocessadores" n="04" t="Sub-processadores que usamos">
          <p>
            Para operar a plataforma trabalhamos com os seguintes sub-processadores.
            Quando aplicável, transferências para fora da UE são protegidas por
            Cláusulas Contratuais Tipo (SCC) aprovadas pela Comissão Europeia.
          </p>
          <div className="not-prose mt-2 overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground text-left">
                  <th className="px-3 py-2 font-normal">Serviço</th>
                  <th className="px-3 py-2 font-normal">Função</th>
                  <th className="px-3 py-2 font-normal">Região</th>
                  <th className="px-3 py-2 font-normal">Base</th>
                </tr>
              </thead>
              <tbody>
                {SUBP.map((sp, i) => (
                  <tr
                    key={sp.nome}
                    className={i !== SUBP.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-3 py-2.5 font-medium text-foreground">{sp.nome}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{sp.funcao}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {sp.regiao}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {sp.base}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="direitos" n="05" t="Direitos do titular">
          <p>
            Enquanto titular dos dados, tens direito a:
          </p>
          <ul>
            <li><strong className="text-foreground">Acesso</strong> — saber que dados temos sobre ti.</li>
            <li><strong className="text-foreground">Retificação</strong> — corrigir dados incorretos.</li>
            <li><strong className="text-foreground">Apagamento</strong> ("direito a ser esquecido") — eliminação dos teus dados, nos termos legais aplicáveis.</li>
            <li><strong className="text-foreground">Portabilidade</strong> — recebê-los num formato estruturado e legível por máquina.</li>
            <li><strong className="text-foreground">Oposição</strong> — opor-te ao tratamento baseado em interesse legítimo.</li>
          </ul>
          <p>
            Para exercer qualquer destes direitos, escreve para{" "}
            <a
              href="mailto:dpo@compramososeueletrico.pt"
              className="font-mono text-primary hover:underline underline-offset-4"
            >
              dpo@compramososeueletrico.pt
            </a>
            . Respondemos no prazo máximo de 30 dias.
          </p>
        </Section>

        <Section id="reclamacoes" n="06" t="Reclamações">
          <p>
            Se considerares que os teus dados não estão a ser tratados nos termos da
            lei, podes apresentar reclamação à autoridade de controlo competente.
          </p>
          <DataTable
            rows={[
              ["Autoridade", "Comissão Nacional de Proteção de Dados (CNPD)"],
              ["Morada", "Av. D. Carlos I, 134, 1.º, 1200-651 Lisboa"],
              ["Web", "www.cnpd.pt"],
            ]}
          />
        </Section>

        <Section id="alteracoes" n="07" t="Alterações a esta política">
          <p>
            Esta política pode ser atualizada para refletir alterações na lei ou no
            funcionamento da plataforma. A data de última revisão está indicada no
            topo. Alterações materiais serão comunicadas aos titulares com sessão
            ativa quando relevantes.
          </p>
        </Section>
      </div>

      <FooterNav current="politica-privacidade" />
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
      <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-ul:my-3 [&>p+div]:mt-4">
        {children}
      </div>
    </section>
  );
}

function DataTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="not-prose mt-3 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 rounded-md border border-border bg-muted/30 p-4 text-sm">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground sm:pt-0.5">
            {k}
          </dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function FooterNav({ current }: { current: string }) {
  const links = [
    { href: "/politica-privacidade", label: "Privacidade" },
    { href: "/termos", label: "Termos" },
    { href: "/cookies", label: "Cookies" },
    { href: "/contacto", label: "Contacto" },
  ].filter((l) => !l.href.includes(current));
  return (
    <>
      <Separator className="my-12" />
      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
          Ver também ·
        </span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
