import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Política de Cookies · compramososeueletrico",
  description:
    "Usamos só cookies estritamente necessárias. Sem analytics, sem pixels, sem rastreamento de marketing.",
};

const COOKIES = [
  {
    nome: "sb-access-token",
    fornecedor: "Supabase",
    finalidade: "Sessão autenticada do operador",
    duracao: "1 hora (renovação automática)",
    flags: "HttpOnly · Secure · SameSite=Lax",
  },
  {
    nome: "sb-refresh-token",
    fornecedor: "Supabase",
    finalidade: "Renovação da sessão sem novo login",
    duracao: "30 dias",
    flags: "HttpOnly · Secure · SameSite=Lax",
  },
];

export default function CookiesPage() {
  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3">
          Documento legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          Política de Cookies
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Em duas linhas: usamos apenas cookies{" "}
          <strong className="text-foreground">estritamente necessárias</strong> para
          a área administrativa funcionar. Sem analytics, sem pixels, sem
          rastreamento de marketing.
        </p>
        <p className="mt-3 text-xs font-mono text-muted-foreground">
          Última atualização: 28 de abril de 2026
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          O que usamos (e o que não usamos)
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary mb-2">
              Usamos
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              <li>Sessão admin (Supabase Auth)</li>
              <li>CSRF — proteção de formulários</li>
            </ul>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">
              Não usamos
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>Google Analytics, Meta Pixel</li>
              <li>Cookies de marketing</li>
              <li>Fingerprinting</li>
            </ul>
          </div>
        </div>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Lista de cookies essenciais
        </h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground text-left">
                <th className="px-3 py-2 font-normal">Nome</th>
                <th className="px-3 py-2 font-normal hidden sm:table-cell">Fornecedor</th>
                <th className="px-3 py-2 font-normal">Finalidade</th>
                <th className="px-3 py-2 font-normal hidden md:table-cell">Duração</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c, i) => (
                <tr
                  key={c.nome}
                  className={i !== COOKIES.length - 1 ? "border-b border-border" : ""}
                >
                  <td className="px-3 py-3 font-mono text-xs text-foreground align-top">
                    {c.nome}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground align-top hidden sm:table-cell">
                    {c.fornecedor}
                  </td>
                  <td className="px-3 py-3 text-foreground align-top">
                    <p>{c.finalidade}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      {c.flags}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground align-top hidden md:table-cell">
                    {c.duracao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="my-10" />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Como gerir
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estas cookies não exigem consentimento prévio (são essenciais ao
          funcionamento do serviço, nos termos do art. 5.º/3 da Diretiva ePrivacy).
          Ainda assim, podes desativar cookies no teu browser a qualquer momento —
          tem em conta que isso impede o login na área administrativa.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Caso, no futuro, venhamos a adicionar ferramentas que requeiram
          consentimento (analytics anonimizados, por exemplo), implementaremos um
          banner de consentimento em conformidade com o RGPD e a recomendação da
          CNPD.
        </p>
      </section>

      <Separator className="my-10" />
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
          href="/termos"
          className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Termos
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
