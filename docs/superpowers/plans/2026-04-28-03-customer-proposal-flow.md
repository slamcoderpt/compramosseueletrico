# Plano 3 — Fluxo de Proposta do Cliente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **UI work:** All tasks marked **`(UI — frontend-design)`** MUST invoke the `frontend-design` skill with the prompt provided in that task. Do not write UI components ad-hoc.

**Goal:** Cliente recebe SMS, clica `/p/{token}`, abre página rica com proposta, valor, condições e FAQ. Botões `Aceitar` e `Recusar` (com diálogo de confirmação) chamam APIs server-side que validam estado, fazem transições atómicas e mostram página terminal apropriada. Tokens inválidos/expirados/já actuados redirecionam para páginas dedicadas. Após aceitar, cliente vê página de confirmação que aponta para a marcação Cal.com (implementada no Plano 4 como stub).

**Architecture:** `/proposta/[token]` é um server component que valida estado em SQL atómico (`UPDATE ... WHERE status IN ('SENT','VIEWED') AND expires_at > now() RETURNING *`) e redireciona conforme estado. Primeiro view dispara `SENT → VIEWED` + INSERT event `PROPOSAL_VIEWED` (com IP + UA + idempotência por janela de 1h). Botões fazem `POST /api/proposals/[token]/{accept,reject}` que devolvem `{ next: '/proposta/[token]/...' }` ou `{ error: { code, message } }` com HTTP apropriado. Race-safe via `WHERE status IN (...)` em todas as transições. Rate-limit Upstash (5/min/IP) nas rotas de accept/reject. Tokens são públicos por design (segredo de URL + expiração).

**Tech Stack:** Next.js 16 App Router (server components + route handlers), Supabase Postgres com RLS bypass via service role, Upstash Ratelimit, react-hook-form (apenas para confirmation dialog se necessário — provavelmente não), shadcn/ui (Dialog, Button, Card). Sem novas deps.

**Spec:** [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](../specs/2026-04-27-compramososeueletrico-design.md) — secção 4 (página da proposta) e 8 (estados e edge cases).

**Plano 2 (precondição):** completo. `proposals` table tem tokens válidos para usar nos testes. POST /api/admin/proposals gera-os.

---

## Pré-requisitos manuais

Nenhum novo. Tudo o que é preciso já está instalado e configurado:
- Schema com `proposals.token`, `proposals.status`, `proposals.expires_at`
- `lib/proposals/tokens.ts` (geração + validação)
- `lib/proposals/state.ts` (transitions)
- `lib/ratelimit.ts` (helper Upstash — Plano 1)
- `.env.local` com `UPSTASH_REDIS_REST_URL` e `_TOKEN` ainda vazios → fallback gracious (skip rate-limit em dev)

---

## Estrutura de ficheiros (criados/modificados neste plano)

```
.
├── app/
│   ├── p/[token]/
│   │   └── route.ts                              (short URL redirect)
│   └── (public)/
│       └── proposta/[token]/
│           ├── page.tsx                          (UI — main proposal view)
│           ├── aceite/page.tsx                   (UI — post-accept, links to /marcar stub)
│           ├── marcar/page.tsx                   (UI — placeholder for Plano 4 Cal.com embed)
│           ├── recusada/page.tsx                 (UI — terminal "que pena")
│           └── expirada/page.tsx                 (UI — terminal + CTA para nova avaliação)
├── app/api/proposals/[token]/
│   ├── accept/route.ts                           (POST atomic transition)
│   └── reject/route.ts                           (POST atomic transition)
├── lib/
│   ├── proposals/
│   │   └── lookup.ts                             (fetchProposalForView atomic helper)
│   └── ratelimit.ts                              (modify — add proposalActionRateLimit)
└── tests/
    ├── unit/
    │   └── proposals-lookup.test.ts
    └── integration/
        ├── api-proposals-accept.test.ts
        └── api-proposals-reject.test.ts
```

Note: `/proposta/[token]/marcar` é um stub neste plano (placeholder com texto + Cal.com embed real no Plano 4). Mas precisa existir para o redirect pós-accept funcionar.

---

## Task 1 — `lib/proposals/lookup.ts` (TDD)

Helper centraliza a lógica de SELECT proposal + lead por token. Não faz transições — apenas leitura segura para o server component decidir o que fazer.

**Files:**
- Create: `lib/proposals/lookup.ts`, `tests/unit/proposals-lookup.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/unit/proposals-lookup.test.ts
import { describe, it, expect, vi } from "vitest";
import { decideProposalView, type ProposalRow } from "@/lib/proposals/lookup";

const base: ProposalRow = {
  id: "p1",
  lead_id: "l1",
  token: "tok",
  status: "SENT",
  valor_eur_cents: 1850000,
  sent_at: new Date(Date.now() - 60_000).toISOString(),
  viewed_at: null,
  accepted_at: null,
  rejected_at: null,
  expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  notes_internal: null,
};

describe("decideProposalView", () => {
  it("returns SHOW for SENT and not expired", () => {
    expect(decideProposalView(base).action).toBe("SHOW");
  });

  it("returns SHOW for VIEWED and not expired", () => {
    expect(decideProposalView({ ...base, status: "VIEWED" }).action).toBe("SHOW");
  });

  it("returns REDIRECT to /aceite for ACCEPTED", () => {
    const r = decideProposalView({ ...base, status: "ACCEPTED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/aceite$/);
  });

  it("returns REDIRECT to /recusada for REJECTED", () => {
    const r = decideProposalView({ ...base, status: "REJECTED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/recusada$/);
  });

  it("returns REDIRECT to /expirada for EXPIRED status", () => {
    const r = decideProposalView({ ...base, status: "EXPIRED" });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/expirada$/);
  });

  it("returns REDIRECT to /expirada when expires_at is in the past", () => {
    const r = decideProposalView({
      ...base,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(r.action).toBe("REDIRECT");
    expect(r.target).toMatch(/\/expirada$/);
  });
});
```

- [ ] **Step 2:** Run → FAIL.

```bash
pnpm test tests/unit/proposals-lookup.test.ts
```

- [ ] **Step 3:** Implement `lib/proposals/lookup.ts`:

```typescript
import type { ProposalStatus } from "./state";

export interface ProposalRow {
  id: string;
  lead_id: string;
  token: string;
  status: ProposalStatus;
  valor_eur_cents: number;
  sent_at: string;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  expires_at: string;
  notes_internal: string | null;
}

export type ViewDecision =
  | { action: "SHOW"; proposal: ProposalRow }
  | { action: "REDIRECT"; target: string };

export function decideProposalView(p: ProposalRow): ViewDecision {
  const now = Date.now();
  const expiresMs = new Date(p.expires_at).getTime();

  if (p.status === "EXPIRED" || expiresMs < now) {
    return { action: "REDIRECT", target: `/proposta/${p.token}/expirada` };
  }
  if (p.status === "REJECTED") {
    return { action: "REDIRECT", target: `/proposta/${p.token}/recusada` };
  }
  if (p.status === "ACCEPTED") {
    return { action: "REDIRECT", target: `/proposta/${p.token}/aceite` };
  }
  // SENT or VIEWED
  return { action: "SHOW", proposal: p };
}
```

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5:** Commit:

```bash
git add lib/proposals/lookup.ts tests/unit/proposals-lookup.test.ts
git commit -m "feat(proposals): viewer-side state decision helper"
git log --oneline -1
```

---

## Task 2 — `/p/[token]` short-URL redirect

Servidor side redirect simples. Mantém URL curto no SMS sem expor mais nada.

**Files:**
- Create: `app/p/[token]/route.ts`

- [ ] **Step 1:** Implement:

```typescript
// app/p/[token]/route.ts
import { NextResponse } from "next/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidTokenShape(token)) {
    return NextResponse.redirect(new URL("/", _req.url));
  }
  return NextResponse.redirect(new URL(`/proposta/${token}`, _req.url));
}
```

- [ ] **Step 2:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 3:** Smoke test:

```bash
pnpm dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 8
# Use a fake but valid-shaped token
curl -s -o /dev/null -w "%{http_code}|%{redirect_url}\n" "http://localhost:3000/p/abcdefghijklmnopqrstuvwxyz123456"
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

Expected output: `307|http://localhost:3000/proposta/abcdefghijklmnopqrstuvwxyz123456` (or similar).

- [ ] **Step 4:** Commit:

```bash
git add app/p/
git commit -m "feat(proposals): /p/[token] short-URL redirect"
git log --oneline -1
```

---

## Task 3 — `/proposta/[token]/expirada` and `/recusada` (UI — frontend-design, batch)

Páginas terminais simples — fazemos as duas numa única chamada `frontend-design` para eficiência.

**Files:**
- Create: `app/(public)/proposta/[token]/expirada/page.tsx`
- Create: `app/(public)/proposta/[token]/recusada/page.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invoke the `frontend-design` skill via the `Skill` tool with this prompt:

```
Build TWO terminal pages for the proposal flow of compramososeueletrico (a Wizard of Oz EV-buying platform).

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (button, card, alert installed). Brand "Precision Verde" tokens already in app/globals.css. DM Sans + DM Mono. Public-facing (no admin chrome). Reuse the public layout already at app/(public)/layout.tsx (it provides header + footer).

Both pages are SERVER components, no client interactivity needed (just <Link>s).
Both routes use dynamic param {token} but DON'T need to query the proposal — they're just informational. The token is in the URL only for context (so users can re-share / revisit the same URL after action).

Note: Next.js 15+ params are a Promise: `{ params }: { params: Promise<{ token: string }> }`.

File 1: app/(public)/proposta/[token]/expirada/page.tsx

Content:
- Hero: lucide ClockX or Clock icon (large, neutral tone, NOT destructive red — we don't want to feel punishing)
- Headline: "Esta proposta já expirou."
- Subtext: "As nossas propostas são válidas durante 48 horas. Mas isto não é o fim — podes pedir uma avaliação nova em poucos minutos."
- Visual: a small breakdown card showing "Proposta válida por 48h · Avaliação leva 1 minuto · Resposta em 1 hora útil"
- Primary CTA: "Pedir nova avaliação" → /avaliar
- Secondary CTA: "Voltar à página inicial" → /
- Tone: empathetic, not defeatist

File 2: app/(public)/proposta/[token]/recusada/page.tsx

Content:
- Hero: lucide CircleSlash or X icon (large, neutral — "respect the no")
- Headline: "Recusaste a nossa proposta."
- Subtext: "Sem problema. Se mudares de ideias dentro de 30 dias, podes pedir uma nova avaliação — o teu carro pode ainda estar dentro da nossa janela de interesse."
- Small block: "Tens dúvidas? Liga-nos" with mock phone "+351 21X XXX XXX" (in DM Mono) and email "ola@compramososeueletrico.pt"
- Primary CTA: "Pedir nova avaliação" → /avaliar
- Secondary CTA: "Voltar à página inicial" → /
- Tone: respectful, low-key

Constraints (apply to both pages):
- pt-PT, "tu" form
- Brand tokens — calm muted neutrals + brand teal accents only on CTAs
- Mobile-first; centered card on desktop, single column on mobile
- Generous vertical spacing — these pages should feel uncluttered
- No emojis. Use lucide-react icons.
- Include `metadata` export for each page with title + description in pt-PT
```

- [ ] **Step 2:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 3:** Commit:

```bash
git add "app/(public)/proposta/"
git commit -m "feat(proposals): terminal pages (expirada, recusada)"
git log --oneline -1
```

---

## Task 4 — `/proposta/[token]/aceite` and `/marcar` placeholder (UI — frontend-design, batch)

Página `/aceite` é "obrigado, agora marca" e linka para `/marcar`. Página `/marcar` é placeholder até Plano 4 (Cal.com).

**Files:**
- Create: `app/(public)/proposta/[token]/aceite/page.tsx`
- Create: `app/(public)/proposta/[token]/marcar/page.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invoke `frontend-design` with this prompt:

```
Build TWO post-acceptance pages for compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui. Brand "Precision Verde" tokens. DM Sans + DM Mono. Public layout reused.

Both are server components. Params are Promise in Next 15+: `{ params }: { params: Promise<{ token: string }> }`.

File 1: app/(public)/proposta/[token]/aceite/page.tsx

This is shown right after the customer clicks "Aceitar" on the proposal page. It's a celebratory confirmation + a clear next step: marcar a inspeção.

Content:
- Hero: lucide CircleCheck (large, brand teal). Big positive moment.
- Headline: "Proposta aceite!"
- Subtext: "Próximo passo: marca uma visita rápida ao nosso local para inspecionarmos o teu carro."
- Visual sequence (3 steps with icons): 1. Marca a visita 2. Validamos no local (~30 min) 3. Pagamos no próprio dia
- Primary CTA: "Marcar visita agora" → /proposta/{token}/marcar
- Below the CTA, a discreet line: "Recebes confirmação por SMS após a marcação."
- Reassurance: small section "O que vamos validar na inspeção" with 4 bullets (saúde da bateria, autonomia real, condição visual, documentação) — copy already exists in /avaliar/obrigado, you can mirror that tone.
- Footer: Refª da proposta in DM Mono opacity-40 — show first 8 chars of {token} from params

File 2: app/(public)/proposta/[token]/marcar/page.tsx

PLACEHOLDER — Plano 4 implements Cal.com embed here. For now:

Content:
- Hero: lucide Calendar (large, brand teal)
- Headline: "Marcação de visita"
- Subtext: "A marcação online estará disponível em breve. Por agora, contacta-nos para combinar."
- Mock contact card: phone "+351 21X XXX XXX" (DM Mono), email "ola@compramososeueletrico.pt", horário "9h-19h, dias úteis"
- Below: an info box (shadcn Alert with default variant): "Recebemos a tua aceitação. Vamos contactar-te dentro de 24h se não nos contactares antes."
- Secondary CTA: "Voltar" with browser-back behavior or → /
- Footer: Refª da proposta in DM Mono opacity-40

Constraints:
- pt-PT, "tu" form
- Mobile-first, centered card layout
- Brand teal for primary, neutrals elsewhere
- No emojis. Lucide icons only.
- Both pages export `metadata` (title + description in pt-PT)
- DON'T fetch the proposal — these are pure informational pages
```

- [ ] **Step 2:** Verify build.

- [ ] **Step 3:** Commit:

```bash
git add "app/(public)/proposta/"
git commit -m "feat(proposals): post-accept and marcar (placeholder) pages"
git log --oneline -1
```

---

## Task 5 — `/proposta/[token]` main page (UI — frontend-design + view-state logic)

A peça central. Server component que valida estado, faz transição `SENT → VIEWED` se aplicável (com idempotência), e renderiza a página rica.

**Files:**
- Create: `app/(public)/proposta/[token]/page.tsx`
- Create: `components/proposal/AcceptRejectButtons.tsx` (client component)
- Create: `components/proposal/Countdown.tsx` (client component)

- [ ] **Step 1 — server-side state logic (não-UI, mas tem de ser feito antes do frontend-design):**

Cria primeiro a versão server component MÍNIMA que faz a lógica correctamente, mesmo sem polish visual. O frontend-design vai depois polir mantendo o esqueleto.

`app/(public)/proposta/[token]/page.tsx` (versão inicial — implementer will refine via frontend-design):

```tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { decideProposalView } from "@/lib/proposals/lookup";

const VIEW_LOG_WINDOW_MS = 60 * 60_000; // 1h

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  const { token } = await params;
  if (!isValidTokenShape(token)) notFound();

  const supabase = createServiceRoleClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, token, status, valor_eur_cents, sent_at, viewed_at, accepted_at, rejected_at, expires_at, notes_internal")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) notFound();

  const decision = decideProposalView(proposal as any);
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
    .limit(1);

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

  return <ProposalView proposal={proposal as any} lead={lead as any} />;
}

// PLACEHOLDER — frontend-design replaces this in Step 2
function ProposalView({ proposal, lead }: any) {
  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">A nossa proposta para o teu {lead.marca} {lead.modelo}</h1>
      <div className="text-5xl font-bold">{(proposal.valor_eur_cents / 100).toFixed(2)} €</div>
      <p className="text-sm text-muted-foreground">Proposta indicativa</p>
      <p>Válida até {new Date(proposal.expires_at).toLocaleString("pt-PT")}</p>
      <div className="flex gap-3">
        <form action={`/api/proposals/${proposal.token}/accept`} method="post">
          <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded">Aceitar proposta</button>
        </form>
        <form action={`/api/proposals/${proposal.token}/reject`} method="post">
          <button type="submit" className="border px-6 py-3 rounded">Recusar</button>
        </form>
      </div>
    </main>
  );
}
```

NOTE: Os `<form action="...">` apontam directamente para a rota API. As rotas vão ser implementadas em Tasks 6+7 com redirects de POST→303 para a página terminal apropriada. Manter este esqueleto até depois do frontend-design para evitar churn.

- [ ] **Step 2 — Verify build (page renders, even with placeholder UI):**

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 3 (UI — frontend-design):**

Invoke `frontend-design` with this prompt:

```
Polish the proposal view page for compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (button, card, badge, accordion, alert, dialog installed). Brand "Precision Verde". DM Sans + DM Mono. Public layout already wraps the page.

CONTEXT: The file `app/(public)/proposta/[token]/page.tsx` already exists with the SERVER-SIDE state validation, transition logic, and event logging working correctly. There's a placeholder <ProposalView> function inside that just renders crude markup. Your job is to REPLACE that ProposalView function (and add any client components needed) — keeping all the server-side logic intact.

Server fetches `proposal` (with valor_eur_cents, expires_at, notes_internal) and `lead` (with all the form fields). Pass them to your view component.

The two `<form action="/api/proposals/{token}/{accept|reject}" method="post">` forms work via standard form POST — the API routes will respond with HTTP 303 redirects after the transition, so no JS is needed for the basic happy path. BUT we want a confirmation dialog before submitting both, especially for "Recusar". So extract the buttons + dialogs into a client component:

components/proposal/AcceptRejectButtons.tsx ("use client")
- Receives `token: string`
- Renders two shadcn AlertDialog (or Dialog) primitives:
    - "Aceitar proposta" — primary teal button. Clicking opens dialog: "Tens a certeza que queres aceitar a proposta de {valor}? A seguir vais marcar uma visita." with Cancel + Confirm. Confirm submits a hidden form to /api/proposals/{token}/accept (or fires fetch + window.location.assign).
    - "Recusar" — secondary muted button. Clicking opens dialog: "Tens a certeza que queres recusar? Esta ação não pode ser anulada." with Cancel + Confirm.
- Use form-based POST submission (form.submit()) inside onClick handlers — that way the response is naturally handled as a navigation by the browser when the API returns 303.

components/proposal/Countdown.tsx ("use client")
- Receives `expiresAt: string` (ISO date)
- Renders live countdown: "Válida por mais Xh Ym Zs" — updates every second
- When countdown hits 0, replaces text with "Expirada" and reloads the page (which then redirects via server-side decision logic)

Page sections (in scroll order, ALL inside <ProposalView>):
1. Hero: "A nossa proposta para o teu {marca} {modelo}" — strong typography. Below: huge €valor (DM Mono, brand teal, opacity 100%) + small "PROPOSTA INDICATIVA" badge + tooltip explaining why indicativa.
2. Validity countdown bar (using Countdown component): "Válida até {data} às {hora} ({Xh Ym restantes})" — visual emphasis on time pressure WITHOUT being pushy.
3. Action buttons (using AcceptRejectButtons component) — sticky on mobile, prominent on desktop.
4. Resumo do carro declarado — grid of all lead fields the customer submitted, with header note: "Estes valores foram fornecidos por ti — confirmamos tudo na inspeção."
5. Condições — bullet list (Card with borders): proposta indicativa, sujeita a confirmação no local, pagamento no próprio dia, transferência via cheque/transferência bancária imediata, etc.
6. Próximos passos — visual timeline (4 steps): 1. Aceitar 2. Marcar visita 3. Validar no local 4. Pagar e transferir.
7. FAQ accordion — 6 questions:
   - "E se o carro estiver pior do que declarei?"
   - "Posso negociar o valor?"
   - "Quanto tempo demora todo o processo?"
   - "Onde ficam? Tenho de levar o carro?"
   - "E se mudar de ideias depois de aceitar?"
   - "Quem são vocês?"

Constraints:
- pt-PT, "tu" form
- Strong but not aggressive — this is a high-stakes commercial moment for the customer
- valor formatted as `formatEur(valor_eur_cents)` from `@/lib/format/currency`
- date formatted as `formatPtDateTime(date)` from `@/lib/format/date`
- Mobile-first; on mobile, the accept/reject buttons should stick to bottom of viewport for easy access during scroll
- Brand teal for primary CTA, muted neutrals elsewhere
- No emojis. Lucide icons.
- Use shadcn Accordion, Card, Button, Badge, AlertDialog (install if missing: `pnpm dlx shadcn@latest add alert-dialog`)

DON'T modify the server-side data fetching, transition, or event logging. Only replace the ProposalView function + add client components.
```

- [ ] **Step 4:** If `alert-dialog` not installed:

```bash
pnpm dlx shadcn@latest add alert-dialog 2>&1 | tail -3
```

- [ ] **Step 5:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 6:** Commit:

```bash
git add "app/(public)/proposta/[token]/page.tsx" "components/proposal/" "components/ui/" package.json pnpm-lock.yaml
git commit -m "feat(proposals): main proposal view page with countdown + accept/reject"
git log --oneline -1
```

---

## Task 6 — Rate-limit helper for proposal actions

**Files:**
- Modify: `lib/ratelimit.ts`

- [ ] **Step 1:** Read the current `lib/ratelimit.ts`.

- [ ] **Step 2:** Add a new export at the bottom:

```typescript
export const proposalActionRateLimit = (() => {
  let l: Ratelimit | null = null;
  return () => {
    if (!l) {
      l = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "rl:proposal-action",
      });
    }
    return l;
  };
})();
```

- [ ] **Step 3:** Verify typecheck:

```bash
pnpm typecheck 2>&1 | tail -3
```

- [ ] **Step 4:** Commit:

```bash
git add lib/ratelimit.ts
git commit -m "feat(ratelimit): proposal action sliding-window (5/min/IP)"
git log --oneline -1
```

---

## Task 7 — `POST /api/proposals/[token]/accept` (TDD)

**Files:**
- Create: `app/api/proposals/[token]/accept/route.ts`, `tests/integration/api-proposals-accept.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-proposals-accept.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const supabase = createServiceRoleClient();

let leadId: string;
let proposalId: string;
let token: string;

async function seed(opts: { status?: "SENT" | "VIEWED" | "EXPIRED"; expiresInMs?: number } = {}) {
  const status = opts.status ?? "SENT";
  const expiresInMs = opts.expiresInMs ?? 60 * 60_000;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "AC-PT-01",
      marca: "Tesla",
      modelo: "Model 3",
      ano: 2022,
      km: 30000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 95,
      autonomia_real_km: 450,
      carregador_incluido: true,
      nome: "Accept Test",
      telefone: "+351912000077",
      email: "accept@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "PROPOSED",
    })
    .select("id")
    .single();
  leadId = lead!.id;

  token = generateProposalToken();
  const { data: prop } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      valor_eur_cents: 1850000,
      token,
      status,
      expires_at: new Date(Date.now() + expiresInMs).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

async function call(t: string) {
  const { POST } = await import("@/app/api/proposals/[token]/accept/route");
  const req = new Request(`http://localhost:3000/api/proposals/${t}/accept`, {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  return POST(req as any, { params: Promise.resolve({ token: t }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
});

describe("POST /api/proposals/[token]/accept", () => {
  it("redirects to /aceite on success and updates state", async () => {
    const res = await call(token);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(new RegExp(`/proposta/${token}/aceite$`));

    const { data: prop } = await supabase.from("proposals").select("status, accepted_at").eq("id", proposalId).single();
    expect(prop?.status).toBe("ACCEPTED");
    expect(prop?.accepted_at).not.toBeNull();

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("ACCEPTED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_ACCEPTED")).toBe(true);
  });

  it("returns 404 for unknown token", async () => {
    const res = await call("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(res.status).toBe(404);
  });

  it("returns 410 if proposal already expired", async () => {
    await supabase.from("leads").delete().eq("matricula", "AC-PT-01");
    await seed({ expiresInMs: -1000 });
    const res = await call(token);
    expect([303, 410]).toContain(res.status);
    if (res.status === 303) {
      expect(res.headers.get("location")).toMatch(/\/expirada$/);
    }
  });

  it("idempotent — second call still redirects to /aceite (no double accept)", async () => {
    await call(token);
    const res2 = await call(token);
    expect(res2.status).toBe(303);
    expect(res2.headers.get("location")).toMatch(/\/aceite$/);
  });
});
```

- [ ] **Step 2:** FAIL.

```bash
pnpm test tests/integration/api-proposals-accept.test.ts 2>&1 | tail -10
```

- [ ] **Step 3:** Implement `app/api/proposals/[token]/accept/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { proposalActionRateLimit } from "@/lib/ratelimit";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const { token } = await params;
  if (!isValidTokenShape(token)) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rl = await proposalActionRateLimit().limit(`ip:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas tentativas. Tenta de novo em alguns segundos." } },
        { status: 429 },
      );
    }
  }

  const supabase = createServiceRoleClient();

  // Fetch + check current state (read for routing decisions)
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  // Already accepted — idempotent redirect
  if (proposal.status === "ACCEPTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
  }

  // Already terminal in another way — redirect to viewer's flow
  if (proposal.status === "REJECTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/recusada`, req.url), 303);
  }
  if (proposal.status === "EXPIRED" || new Date(proposal.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL(`/proposta/${token}/expirada`, req.url), 303);
  }

  // Atomic transition: only succeeds if still in SENT/VIEWED and not expired
  const { data: updated, error: updErr } = await supabase
    .from("proposals")
    .update({ status: "ACCEPTED", accepted_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .in("status", ["SENT", "VIEWED"])
    .gt("expires_at", new Date().toISOString())
    .select("id, lead_id")
    .maybeSingle();

  if (!updated) {
    // Lost race — refetch and redirect appropriately
    const { data: now } = await supabase
      .from("proposals")
      .select("status")
      .eq("id", proposal.id)
      .single();
    if (now?.status === "ACCEPTED") {
      return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
    }
    return NextResponse.redirect(new URL(`/proposta/${token}/expirada`, req.url), 303);
  }

  await supabase
    .from("leads")
    .update({ status: "ACCEPTED", updated_at: new Date().toISOString() })
    .eq("id", updated.lead_id);

  await supabase.from("events").insert({
    lead_id: updated.lead_id,
    proposal_id: updated.id,
    type: "PROPOSAL_ACCEPTED",
    actor: "customer",
    payload: { ip, requestId },
  });

  log.info("proposal accepted", { proposalId: updated.id });
  return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
}
```

- [ ] **Step 4:** PASS.

```bash
pnpm test tests/integration/api-proposals-accept.test.ts 2>&1 | tail -10
```

- [ ] **Step 5:** Commit:

```bash
git add "app/api/proposals/" tests/integration/api-proposals-accept.test.ts
git commit -m "feat(api): POST /api/proposals/[token]/accept with atomic transition"
git log --oneline -1
```

---

## Task 8 — `POST /api/proposals/[token]/reject` (TDD)

**Files:**
- Create: `app/api/proposals/[token]/reject/route.ts`, `tests/integration/api-proposals-reject.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-proposals-reject.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const supabase = createServiceRoleClient();
let leadId: string;
let proposalId: string;
let token: string;

async function seed() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "RJ-PT-01",
      marca: "Renault",
      modelo: "Zoe",
      ano: 2020,
      km: 60000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 88,
      autonomia_real_km: 280,
      carregador_incluido: true,
      nome: "Reject Test",
      telefone: "+351912000088",
      email: "reject@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "PROPOSED",
    })
    .select("id")
    .single();
  leadId = lead!.id;

  token = generateProposalToken();
  const { data: prop } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      valor_eur_cents: 1200000,
      token,
      status: "SENT",
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

async function call(t: string) {
  const { POST } = await import("@/app/api/proposals/[token]/reject/route");
  const req = new Request(`http://localhost:3000/api/proposals/${t}/reject`, {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  return POST(req as any, { params: Promise.resolve({ token: t }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "RJ-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "RJ-PT-01");
});

describe("POST /api/proposals/[token]/reject", () => {
  it("redirects to /recusada and updates state", async () => {
    const res = await call(token);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(new RegExp(`/proposta/${token}/recusada$`));

    const { data: prop } = await supabase.from("proposals").select("status, rejected_at").eq("id", proposalId).single();
    expect(prop?.status).toBe("REJECTED");
    expect(prop?.rejected_at).not.toBeNull();

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("REJECTED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_REJECTED")).toBe(true);
  });

  it("returns 404 for unknown token", async () => {
    const res = await call("yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");
    expect(res.status).toBe(404);
  });

  it("idempotent — second call also redirects to /recusada", async () => {
    await call(token);
    const res2 = await call(token);
    expect(res2.status).toBe(303);
    expect(res2.headers.get("location")).toMatch(/\/recusada$/);
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement `app/api/proposals/[token]/reject/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { proposalActionRateLimit } from "@/lib/ratelimit";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const { token } = await params;
  if (!isValidTokenShape(token)) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rl = await proposalActionRateLimit().limit(`ip:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas tentativas. Tenta de novo em alguns segundos." } },
        { status: 429 },
      );
    }
  }

  const supabase = createServiceRoleClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  if (proposal.status === "REJECTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/recusada`, req.url), 303);
  }
  if (proposal.status === "ACCEPTED") {
    return NextResponse.redirect(new URL(`/proposta/${token}/aceite`, req.url), 303);
  }
  if (proposal.status === "EXPIRED" || new Date(proposal.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL(`/proposta/${token}/expirada`, req.url), 303);
  }

  const { data: updated } = await supabase
    .from("proposals")
    .update({ status: "REJECTED", rejected_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .in("status", ["SENT", "VIEWED"])
    .gt("expires_at", new Date().toISOString())
    .select("id, lead_id")
    .maybeSingle();

  if (!updated) {
    return NextResponse.redirect(new URL(`/proposta/${token}`, req.url), 303);
  }

  await supabase
    .from("leads")
    .update({ status: "REJECTED", updated_at: new Date().toISOString() })
    .eq("id", updated.lead_id);

  await supabase.from("events").insert({
    lead_id: updated.lead_id,
    proposal_id: updated.id,
    type: "PROPOSAL_REJECTED",
    actor: "customer",
    payload: { ip, requestId },
  });

  log.info("proposal rejected", { proposalId: updated.id });
  return NextResponse.redirect(new URL(`/proposta/${token}/recusada`, req.url), 303);
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Final test sweep:

```bash
pnpm test 2>&1 | tail -5
```

Expected: all green (~98 tests including the new ones).

- [ ] **Step 6:** Commit:

```bash
git add "app/api/proposals/" tests/integration/api-proposals-reject.test.ts
git commit -m "feat(api): POST /api/proposals/[token]/reject with atomic transition"
git log --oneline -1
```

---

## Task 9 — Final smoke

- [ ] **Step 1:** Sweep:

```bash
pnpm typecheck
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

All must pass.

- [ ] **Step 2:** Manual happy path:
  1. `pnpm dev`
  2. Submit a lead em `http://localhost:3000/avaliar`
  3. Login admin com magic link, abre o lead em `/admin/leads/{id}`
  4. Envia proposta com valor `15000`
  5. Confirma timeline mostra `PROPOSAL_SENT`
  6. Verifica o token gerado:
     ```
     PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
       -c "SELECT token FROM proposals ORDER BY sent_at DESC LIMIT 1;"
     ```
  7. Visita `http://localhost:3000/p/{token}` — deve redirecionar para `/proposta/{token}` com a página rica.
  8. Confirma countdown está a contar.
  9. Volta ao admin → verifica timeline tem `PROPOSAL_VIEWED`.
  10. Volta ao /proposta/{token} e clica `Aceitar` → confirma dialog → redirect para `/aceite`.
  11. Volta ao admin → timeline `PROPOSAL_ACCEPTED`. Lead status = `ACCEPTED`.
  12. Visita `/proposta/{token}` outra vez → redirect imediato para `/aceite` (não revê).
  13. Repete o exercício com outro lead, mas clica `Recusar` → confirma dialog → `/recusada`.

- [ ] **Step 3:** Sem commit se tudo passa. Se algum bug aparecer no smoke, fix em commit separado.

---

## Spec coverage check

- ✅ /p/[token] short URL (secção 4) — Task 2
- ✅ /proposta/[token] página rica (secção 4) — Task 5
- ✅ Estado SENT → VIEWED idempotente — Task 5
- ✅ Estado expirado/recusado/aceite redirects — Tasks 1, 5, 7, 8
- ✅ Aceitar/Recusar com dialog — Task 5 (UI)
- ✅ Atomic transitions race-safe — Tasks 7, 8
- ✅ /aceite, /recusada, /expirada terminal pages — Tasks 3, 4
- ✅ /marcar placeholder para Plano 4 — Task 4
- ✅ Rate-limit 5/min/IP — Tasks 6, 7, 8
- ✅ 404 token inválido — Tasks 5, 7, 8
- ✅ Logging do view com IP/UA — Task 5
- ⏸ Cal.com embed real — **Plano 4**
- ⏸ Job de expiração de propostas — **Plano 5**
- ⏸ Nudge SMS após accept sem booking — **Plano 5**

Cobertura completa para o âmbito do Plano 3.

---

## Próximos planos

- Plano 4 — Marcação Cal.com (substitui o stub de `/marcar`, webhook BOOKING_*, SMS confirmação)
- Plano 5 — Crons + RGPD + Legal + Produção
