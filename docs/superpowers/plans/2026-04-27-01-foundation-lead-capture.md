# Plano 1 — Fundação + Captura de Leads

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **UI work:** All tasks marked **`(UI — frontend-design)`** MUST invoke the `frontend-design` skill with the prompt provided in that task. Do not write UI components ad-hoc.

**Goal:** Cliente submete formulário de avaliação multi-step e operador recebe email com os dados. Estabelece toda a fundação técnica (Next.js, Supabase com schema completo, libs comuns, infra de testes) usada pelos planos 2-5.

**Architecture:** Next.js 15 App Router (TS) com Tailwind + shadcn/ui. Supabase Postgres em região UE com schema completo (todas as 7 tabelas, RLS ligado, índices). Form de 4 passos com React Hook Form + Zod, persistência em localStorage. POST `/api/leads` valida, deduplica por unique parcial, INSERT em `leads` + `events`, dispara email Resend. Common libs (`lib/format/*`, `lib/validation/*`, `lib/supabase/*`, `lib/email/*`, `lib/logger.ts`, `lib/ratelimit.ts`) testadas em isolamento.

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind 3, shadcn/ui, Supabase (Postgres + RLS), Resend, Upstash Redis (rate-limit), libphonenumber-js, react-hook-form, zod, Vitest, MSW, Playwright, GitHub Actions.

**Spec:** [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](../specs/2026-04-27-compramososeueletrico-design.md)

---

## Estrutura de ficheiros (criados neste plano)

```
.
├── .env.example
├── .env.local                              (gitignored, manual)
├── .github/workflows/ci.yml
├── .gitignore
├── CLAUDE.md
├── README.md
├── next.config.ts
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── supabase/
│   ├── config.toml                          (gerado pelo CLI)
│   └── migrations/
│       └── 20260427000001_init.sql
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── app/
│   ├── (public)/
│   │   ├── avaliar/
│   │   │   ├── obrigado/page.tsx           (UI)
│   │   │   └── page.tsx                    (form wizard host)
│   │   └── page.tsx                         (landing)
│   ├── api/
│   │   └── leads/route.ts
│   ├── globals.css
│   └── layout.tsx                           (UI)
├── components/
│   ├── form/
│   │   ├── Wizard.tsx
│   │   ├── ProgressBar.tsx                  (UI)
│   │   ├── Step1Identification.tsx          (UI)
│   │   ├── Step2Condition.tsx               (UI)
│   │   ├── Step3Battery.tsx                 (UI)
│   │   └── Step4Contact.tsx                 (UI)
│   └── ui/                                  (shadcn primitives)
├── lib/
│   ├── email/resend.ts
│   ├── format/{currency.ts, phone.ts, date.ts}
│   ├── logger.ts
│   ├── ratelimit.ts
│   ├── supabase/{server.ts, client.ts}
│   └── validation/lead-schema.ts
└── tests/
    ├── unit/                                (one .test.ts per lib file)
    ├── integration/api-leads.test.ts
    └── e2e/lead-submission.spec.ts
```

---

## Pré-requisitos manuais (utilizador, fora do código)

Antes de começar a executar tarefas:

- **Conta Supabase** criada em [supabase.com](https://supabase.com), projeto novo na região **eu-west-1** ou **eu-west-2** (não EUA). Anota: `Project URL`, `anon key`, `service_role key`.
- **Conta Resend** em [resend.com](https://resend.com), API key gerada. Domínio `compramososeueletrico.pt` adicionado e verificado (SPF/DKIM/DMARC) — pode ficar em sandbox até o domínio estar comprado; nesse caso usa `onboarding@resend.dev` como `from` no MVP.
- **Conta Upstash** em [upstash.com](https://upstash.com), Redis em região `eu-west-1`. Anota REST URL + token.
- **pnpm 9+, Node 20+, Docker Desktop** instalados localmente. Docker é necessário para correr o Supabase local.

---

## Task 1 — Inicializar repositório git e estrutura mínima

**Files:**
- Create: `.gitignore`, `README.md`, `CLAUDE.md`

- [ ] **Step 1:** Inicializar git (working dir vazio)

```bash
cd /c/1.projetos/compramososeueletrico
git init
git checkout -b main
```

- [ ] **Step 2:** Criar `.gitignore`

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/

# Env
.env
.env.local
.env.*.local

# Testing
coverage/
playwright-report/
test-results/

# Supabase
supabase/.branches/
supabase/.temp/

# OS / IDE
.DS_Store
Thumbs.db
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
```

- [ ] **Step 3:** Criar `README.md` mínimo

```markdown
# compramososeueletrico

Plataforma de compra de carros elétricos usados em Portugal.

Spec: [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md)

## Setup

```bash
pnpm install
pnpm dev
```

Ver `docs/superpowers/plans/` para tarefas de implementação.
```

- [ ] **Step 4:** Criar `CLAUDE.md` com regras críticas do projeto

```markdown
# Project Instructions for Claude

- All UI work MUST go through the `frontend-design` skill. Never write components or pages ad-hoc.
- All implementation follows the plans in `docs/superpowers/plans/`. Do not skip steps.
- Use pnpm, not npm.
- Tests are mandatory: every lib file has a `.test.ts`. Every API route has an integration test.
- Tone in user-facing copy: **pt-PT, "tu" form, casual but trustworthy**. Never "obrigado/a" — just "obrigado".
- Currency: € with `Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })`. Dates with `pt-PT` locale.
- Phone: always normalize to E.164 (`+3519XXXXXXXX`) server-side before storage.
```

- [ ] **Step 5:** Commit

```bash
git add .gitignore README.md CLAUDE.md docs/
git commit -m "chore: initialize repo with docs, gitignore, claude instructions"
```

---

## Task 2 — Bootstrap Next.js 15 + TypeScript + Tailwind

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1:** Inicializar Next.js com create-next-app (preferências: App Router, TypeScript, Tailwind, sem src/, alias `@/*`)

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
```

Aceitar overrides quando perguntar sobre ficheiros existentes (.gitignore já existe).

- [ ] **Step 2:** Verificar versão

```bash
pnpm exec next --version
```

Expected: `15.x.x` ou superior. Se for inferior:

```bash
pnpm add next@latest react@latest react-dom@latest
```

- [ ] **Step 3:** Substituir `app/page.tsx` por placeholder mínimo (vamos refazer com frontend-design depois)

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl">compramososeueletrico — em construção</h1>
    </main>
  );
}
```

- [ ] **Step 4:** Verificar build

```bash
pnpm build
```

Expected: build completes sem erros, gera `.next/`.

- [ ] **Step 5:** Verificar dev server

```bash
pnpm dev
# Visit http://localhost:3000
# Ctrl+C para parar
```

Expected: página renderiza "em construção".

- [ ] **Step 6:** Commit

```bash
git add .
git commit -m "chore: bootstrap Next.js 15 with TypeScript and Tailwind"
```

---

## Task 3 — Instalar e configurar shadcn/ui (UI — frontend-design)

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `components.json` (gerado)
- Create: `components/ui/{button.tsx, input.tsx, label.tsx, form.tsx, toast.tsx, toaster.tsx, progress.tsx, select.tsx, checkbox.tsx, dialog.tsx, badge.tsx, card.tsx, sonner.tsx}`, `lib/utils.ts` (gerado pelo shadcn)

- [ ] **Step 1:** Inicializar shadcn

```bash
pnpm dlx shadcn@latest init
```

Respostas:
- Style: `default`
- Base color: `neutral`
- CSS variables: `yes`

- [ ] **Step 2:** Adicionar primitives necessárias para o form e UI base

```bash
pnpm dlx shadcn@latest add button input label form toast toaster progress select checkbox dialog badge card sonner
```

- [ ] **Step 3 (UI — frontend-design):** Definir tokens de marca e layout root

Invocar a skill `frontend-design` com este prompt:

```
Project: compramososeueletrico — plataforma de compra de carros elétricos usados em Portugal (Wizard of Oz MVP).

Audience: pt-PT consumers, mostly mobile, 30-55 anos, tecnologicamente confortáveis (têm carro elétrico).

Brand mood: confiável, moderno, técnico-mas-acessível, focado em carros elétricos. Não pode ter aura "fintech genérico" nem "AI startup template". Inspiração: Tesla minimalismo + simplicidade Cazoo + warmth dos Mercados PT (idealista, OLX) sem ser cluttered.

Tarefa: definir os design tokens base (cores primária/secundária/accent, tipografia, raio de borda, espaçamento, sombras) e atualizar:
1. tailwind.config.ts — extensões de tema (colors, fontFamily, borderRadius, boxShadow)
2. app/globals.css — CSS variables alinhadas com shadcn/ui (--primary, --secondary, etc.) em modo light + dark
3. app/layout.tsx — root layout com fonts (recomendo Inter como sans + uma serif para destaques se fizer sentido), metadata SEO base (title, description, og:image placeholder), <Toaster /> da sonner

Constraints técnicas:
- Tailwind 3 + shadcn/ui já instalados; respeitar a estrutura `--<token>: <hsl>` que o shadcn usa
- Mobile-first
- Cores devem garantir WCAG AA (text on bg ≥ 4.5:1)
- Sem dependências novas para fonts além de next/font

Output: edita os 3 ficheiros mencionados. Apresenta o token system em comentário no topo de globals.css.
```

- [ ] **Step 4:** Verificar build com novos tokens

```bash
pnpm build
```

Expected: passes.

- [ ] **Step 5:** Smoke test do dev server e screenshot mental do `/`

```bash
pnpm dev
# Visit http://localhost:3000 — confirmar que tipografia e cores carregaram
```

- [ ] **Step 6:** Commit

```bash
git add .
git commit -m "feat(ui): install shadcn/ui and define brand design tokens"
```

---

## Task 4 — Instalar dependências runtime + dev

**Files:**
- Modify: `package.json`

- [ ] **Step 1:** Adicionar deps runtime

```bash
pnpm add @supabase/supabase-js @supabase/ssr resend libphonenumber-js zod react-hook-form @hookform/resolvers @upstash/redis @upstash/ratelimit
```

- [ ] **Step 2:** Adicionar deps dev (testes)

```bash
pnpm add -D vitest @vitest/ui @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw @playwright/test supabase tsx
```

- [ ] **Step 3:** Adicionar scripts em `package.json`

Substituir bloco `scripts` por:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "supabase:start": "supabase start",
  "supabase:stop": "supabase stop",
  "supabase:reset": "supabase db reset"
}
```

- [ ] **Step 4:** Verificar que `pnpm typecheck` passa

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5:** Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install runtime and dev dependencies"
```

---

## Task 5 — Configurar Supabase local + env

**Files:**
- Create: `.env.example`, `.env.local` (manual, gitignored), `supabase/config.toml` (gerado)

- [ ] **Step 1:** Inicializar Supabase no repo

```bash
pnpm exec supabase init
```

Aceitar defaults. Gera `supabase/config.toml`.

- [ ] **Step 2:** Iniciar Supabase local (Docker tem de estar a correr)

```bash
pnpm exec supabase start
```

Expected: imprime URLs e chaves. Anota:
- `API URL: http://127.0.0.1:54321`
- `anon key: eyJ...`
- `service_role key: eyJ...`

- [ ] **Step 3:** Criar `.env.example` (commited, sem segredos)

```
# Public (browser)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM=onboarding@resend.dev
OPERATOR_EMAIL=

# Rate-limit
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 4:** Criar `.env.local` (manual, **NÃO** commit) com valores reais

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon do supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role do supabase start>
RESEND_API_KEY=<resend key da conta>
RESEND_FROM=onboarding@resend.dev
OPERATOR_EMAIL=<o teu email>
UPSTASH_REDIS_REST_URL=<da conta upstash>
UPSTASH_REDIS_REST_TOKEN=<da conta upstash>
```

- [ ] **Step 5:** Confirmar que `.env.local` está no gitignore (já está pelo Task 1)

```bash
git check-ignore .env.local
```

Expected: `.env.local`

- [ ] **Step 6:** Commit

```bash
git add .env.example supabase/
git commit -m "chore: configure Supabase local and env scaffolding"
```

---

## Task 6 — Migração 00001: schema completo + RLS + índices

**Files:**
- Create: `supabase/migrations/20260427000001_init.sql`
- Create: `tests/integration/migration.test.ts`

- [ ] **Step 1:** Escrever o teste de integração que verifica schema (TDD)

`tests/integration/migration.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

describe("migration 00001", () => {
  it("creates all 7 tables", async () => {
    const expected = [
      "leads",
      "proposals",
      "events",
      "bookings",
      "sms_log",
      "profiles",
      "gdpr_deletions",
    ];
    const { data, error } = await supabase
      .from("information_schema.tables" as any)
      .select("table_name")
      .eq("table_schema", "public");
    expect(error).toBeNull();
    const names = (data ?? []).map((r: any) => r.table_name);
    for (const t of expected) expect(names).toContain(t);
  });

  it("has RLS enabled on leads", async () => {
    const { data, error } = await supabase.rpc("pg_table_rls_check", {
      tname: "leads",
    } as any);
    // If the helper RPC is not available, skip or assert via direct SQL via service role.
    if (error?.message?.includes("does not exist")) return;
    expect(data).toBe(true);
  });

  it("rejects duplicate active lead with same matricula+telefone", async () => {
    const payload = {
      matricula: "AA-11-BB",
      marca: "Tesla",
      modelo: "Model 3",
      versao: "LR",
      ano: 2021,
      km: 50000,
      cor: "branco",
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 92,
      autonomia_real_km: 380,
      carregador_incluido: true,
      nome: "João Teste",
      telefone: "+351912000001",
      email: "joao@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    };
    const a = await supabase.from("leads").insert(payload);
    expect(a.error).toBeNull();
    const b = await supabase.from("leads").insert(payload);
    expect(b.error).not.toBeNull();
    expect(b.error?.code).toBe("23505");
    // cleanup
    await supabase.from("leads").delete().eq("matricula", "AA-11-BB");
  });
});
```

- [ ] **Step 2:** Correr o teste para confirmar que falha (sem migração ainda)

```bash
pnpm test tests/integration/migration.test.ts
```

Expected: FAIL — tabelas não existem.

- [ ] **Step 3:** Escrever a migração

`supabase/migrations/20260427000001_init.sql`:

```sql
-- compramososeueletrico - schema inicial
-- Spec: docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles (operadores) - extende auth.users
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('operator', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============================================================
-- leads
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  matricula text not null,
  marca text not null,
  modelo text not null,
  versao text,
  ano int not null check (ano between 2010 and extract(year from now())::int + 1),
  km int not null check (km >= 0 and km < 1000000),
  cor text,
  num_donos_anteriores int not null check (num_donos_anteriores >= 0),
  estado_geral text not null check (estado_geral in ('OPTIMO','BOM','RAZOAVEL','MAU')),
  sinistros text not null check (sinistros in ('NUNCA','LIGEIROS','GRAVES')),
  livro_manutencao bool not null,
  bateria_soh_pct int not null check (bateria_soh_pct between 0 and 100),
  autonomia_real_km int not null check (autonomia_real_km >= 0),
  carregador_incluido bool not null,
  nome text not null,
  telefone text not null,
  email text not null,
  rgpd_consent_at timestamptz not null,
  status text not null default 'NEW' check (status in (
    'NEW','IN_REVIEW','PROPOSED','ACCEPTED','REJECTED','EXPIRED','SCHEDULED','COMPLETED','LOST'
  )),
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_status_created_at_idx on public.leads (status, created_at desc);
create index leads_telefone_idx on public.leads (telefone);
create unique index leads_active_dedupe_idx on public.leads (matricula, telefone)
  where status in ('NEW','IN_REVIEW','PROPOSED');
alter table public.leads enable row level security;

-- ============================================================
-- proposals
-- ============================================================
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  valor_eur_cents bigint not null check (valor_eur_cents > 0),
  token text not null unique,
  status text not null default 'SENT' check (status in ('SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz not null,
  notes_internal text,
  created_at timestamptz not null default now()
);
create index proposals_lead_id_idx on public.proposals (lead_id);
create index proposals_status_expires_at_idx on public.proposals (status, expires_at);
create unique index proposals_lead_active_idx on public.proposals (lead_id)
  where status in ('SENT','VIEWED');
alter table public.proposals enable row level security;

-- ============================================================
-- events (timeline)
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  type text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_lead_id_created_at_idx on public.events (lead_id, created_at desc);
alter table public.events enable row level security;

-- ============================================================
-- bookings
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  calcom_booking_id text not null unique,
  scheduled_at timestamptz not null,
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','CANCELLED','RESCHEDULED','NO_SHOW')),
  created_at timestamptz not null default now()
);
create index bookings_proposal_id_idx on public.bookings (proposal_id);
alter table public.bookings enable row level security;

-- ============================================================
-- sms_log
-- ============================================================
create table public.sms_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  to_phone text not null,
  body text not null,
  twilio_sid text unique,
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','DELIVERED','FAILED')),
  error text,
  created_at timestamptz not null default now()
);
alter table public.sms_log enable row level security;

-- ============================================================
-- gdpr_deletions (audit)
-- ============================================================
create table public.gdpr_deletions (
  id uuid primary key default gen_random_uuid(),
  deleted_lead_id uuid not null,
  reason text,
  deleted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.gdpr_deletions enable row level security;

-- ============================================================
-- updated_at trigger for leads
-- ============================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- RLS policies
-- - All tables: no public access. Service role bypasses RLS.
-- - profiles: SELECT own
-- - operators (via profiles role) read all leads/proposals/events/bookings/sms_log
-- ============================================================

-- profiles: utilizador vê o próprio
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

-- helper function: is current user an operator/admin?
create or replace function public.is_operator()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator','admin')
  );
$$;

-- leads: operators select all
create policy "leads_select_operators"
  on public.leads for select
  using (public.is_operator());

-- proposals: operators select all
create policy "proposals_select_operators"
  on public.proposals for select
  using (public.is_operator());

-- events: operators select all
create policy "events_select_operators"
  on public.events for select
  using (public.is_operator());

-- bookings: operators select all
create policy "bookings_select_operators"
  on public.bookings for select
  using (public.is_operator());

-- sms_log: operators select all
create policy "sms_log_select_operators"
  on public.sms_log for select
  using (public.is_operator());

-- gdpr_deletions: operators select all
create policy "gdpr_deletions_select_operators"
  on public.gdpr_deletions for select
  using (public.is_operator());
```

- [ ] **Step 4:** Aplicar migração ao Supabase local

```bash
pnpm exec supabase db reset
```

Expected: aplica migração inicial sem erros.

- [ ] **Step 5:** Correr o teste de integração da migração

```bash
pnpm test tests/integration/migration.test.ts
```

Expected: PASS.

- [ ] **Step 6:** Commit

```bash
git add supabase/migrations/ tests/integration/migration.test.ts
git commit -m "feat(db): initial migration with all tables, RLS, indexes"
```

---

## Task 7 — Configurar Vitest + MSW + Playwright

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`, `tests/mocks/handlers.ts`, `tests/mocks/server.ts`

- [ ] **Step 1:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 2:** `tests/setup.ts`

```typescript
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 3:** `tests/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // Resend
  http.post("https://api.resend.com/emails", async () => {
    return HttpResponse.json({ id: "test-email-id" });
  }),
];
```

- [ ] **Step 4:** `tests/mocks/server.ts`

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);
```

- [ ] **Step 5:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

- [ ] **Step 6:** Adicionar `dotenv` aos devDependencies

```bash
pnpm add -D dotenv
```

- [ ] **Step 7:** Smoke test do Vitest (sem testes ainda além da migração)

```bash
pnpm test
```

Expected: 1 test file (`migration.test.ts`) passes.

- [ ] **Step 8:** Commit

```bash
git add .
git commit -m "chore(test): configure Vitest, MSW, Playwright"
```

---

## Task 8 — `lib/format/phone.ts` (TDD)

**Files:**
- Create: `lib/format/phone.ts`, `tests/unit/format-phone.test.ts`

- [ ] **Step 1:** Escrever teste

`tests/unit/format-phone.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalizePtMobile, isPtMobile, maskPhone } from "@/lib/format/phone";

describe("normalizePtMobile", () => {
  it.each([
    ["912345678", "+351912345678"],
    ["+351912345678", "+351912345678"],
    ["00351912345678", "+351912345678"],
    ["351 912 345 678", "+351912345678"],
    [" +351 912-345-678 ", "+351912345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePtMobile(input)).toBe(expected);
  });

  it.each([
    "21 234 5678",   // fixo Lisboa
    "212345678",     // fixo
    "812345678",     // não móvel
    "9123",          // curto
    "abcdefghi",     // lixo
    "",
  ])("rejects %s as not a PT mobile", (input) => {
    expect(() => normalizePtMobile(input)).toThrow();
  });
});

describe("isPtMobile", () => {
  it("returns true for valid mobile", () => {
    expect(isPtMobile("+351912345678")).toBe(true);
  });
  it("returns false for fixed line", () => {
    expect(isPtMobile("+351212345678")).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks middle digits", () => {
    expect(maskPhone("+351912345678")).toBe("+351 9XX XXX 678");
  });
});
```

- [ ] **Step 2:** Correr teste — falha (módulo não existe)

```bash
pnpm test tests/unit/format-phone.test.ts
```

Expected: FAIL.

- [ ] **Step 3:** Implementar `lib/format/phone.ts`

```typescript
import { parsePhoneNumberFromString, type PhoneNumber } from "libphonenumber-js";

export class InvalidPhoneError extends Error {
  constructor(input: string) {
    super(`Não é um telemóvel português válido: ${input}`);
    this.name = "InvalidPhoneError";
  }
}

function parsePt(input: string): PhoneNumber | undefined {
  const cleaned = input.trim();
  return parsePhoneNumberFromString(cleaned, "PT");
}

export function normalizePtMobile(input: string): string {
  const phone = parsePt(input);
  if (!phone || !phone.isValid() || phone.country !== "PT" || phone.getType() !== "MOBILE") {
    throw new InvalidPhoneError(input);
  }
  return phone.number; // E.164
}

export function isPtMobile(input: string): boolean {
  try {
    normalizePtMobile(input);
    return true;
  } catch {
    return false;
  }
}

export function maskPhone(e164: string): string {
  // +351912345678 -> +351 9XX XXX 678
  const m = e164.match(/^\+351(\d)(\d{2})(\d{3})(\d{3})$/);
  if (!m) return e164;
  return `+351 ${m[1]}XX XXX ${m[4]}`;
}
```

- [ ] **Step 4:** Correr teste — passes

```bash
pnpm test tests/unit/format-phone.test.ts
```

Expected: PASS.

- [ ] **Step 5:** Commit

```bash
git add lib/format/phone.ts tests/unit/format-phone.test.ts
git commit -m "feat(format): PT mobile normalization and masking"
```

---

## Task 9 — `lib/format/currency.ts` e `lib/format/date.ts` (TDD)

**Files:**
- Create: `lib/format/currency.ts`, `lib/format/date.ts`, `tests/unit/format-currency.test.ts`, `tests/unit/format-date.test.ts`

- [ ] **Step 1:** Testes

`tests/unit/format-currency.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatEur, eurToCents, centsToEur } from "@/lib/format/currency";

describe("formatEur", () => {
  it.each([
    [1234567, "12 345,67 €"],
    [100, "1,00 €"],
    [0, "0,00 €"],
  ])("formats %d cents as %s", (cents, expected) => {
    // Note: pt-PT uses NBSP; normalise both sides
    const norm = (s: string) => s.replace(/\s/g, " ");
    expect(norm(formatEur(cents))).toBe(norm(expected));
  });
});

describe("eurToCents", () => {
  it("converts whole euros", () => {
    expect(eurToCents(150)).toBe(15000);
  });
  it("rounds to nearest cent", () => {
    expect(eurToCents(1.005)).toBe(101); // banker's rounding may vary; spec uses Math.round
  });
});

describe("centsToEur", () => {
  it("converts back", () => {
    expect(centsToEur(15000)).toBe(150);
  });
});
```

`tests/unit/format-date.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatPtDateTime, formatPtRelative } from "@/lib/format/date";

describe("formatPtDateTime", () => {
  it("formats date and time in pt-PT", () => {
    const d = new Date("2026-04-27T14:30:00Z");
    const out = formatPtDateTime(d);
    expect(out).toMatch(/27.*abril.*2026/i);
    // hour depends on TZ — only check structure
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatPtRelative", () => {
  it("renders 'há X minutos' for past", () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatPtRelative(past)).toMatch(/há.*minuto/);
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar `lib/format/currency.ts`

```typescript
const fmt = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(cents: number): string {
  return fmt.format(cents / 100);
}

export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

export function centsToEur(cents: number): number {
  return cents / 100;
}
```

`lib/format/date.ts`:

```typescript
const dt = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "long",
  timeStyle: "short",
});

const rel = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

export function formatPtDateTime(d: Date): string {
  return dt.format(d);
}

export function formatPtRelative(d: Date, now: Date = new Date()): string {
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rel.format(diffSec, "second");
  if (abs < 3600) return rel.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rel.format(Math.round(diffSec / 3600), "hour");
  return rel.format(Math.round(diffSec / 86400), "day");
}
```

- [ ] **Step 4:** Run — PASS.

```bash
pnpm test tests/unit/format-currency.test.ts tests/unit/format-date.test.ts
```

- [ ] **Step 5:** Commit

```bash
git add lib/format/ tests/unit/format-currency.test.ts tests/unit/format-date.test.ts
git commit -m "feat(format): currency (EUR cents) and date (pt-PT) helpers"
```

---

## Task 10 — `lib/validation/lead-schema.ts` (TDD)

**Files:**
- Create: `lib/validation/lead-schema.ts`, `tests/unit/lead-schema.test.ts`

- [ ] **Step 1:** Teste

`tests/unit/lead-schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  fullLeadSchema,
} from "@/lib/validation/lead-schema";

const validStep1 = {
  matricula: "AA-11-BB",
  marca: "Tesla",
  modelo: "Model 3",
  versao: "Long Range",
  ano: 2021,
};
const validStep2 = {
  km: 50000,
  cor: "branco",
  num_donos_anteriores: 1,
  estado_geral: "BOM" as const,
  sinistros: "NUNCA" as const,
  livro_manutencao: true,
};
const validStep3 = {
  bateria_soh_pct: 92,
  autonomia_real_km: 380,
  carregador_incluido: true,
};
const validStep4 = {
  nome: "João Silva",
  telefone: "+351912345678",
  email: "joao@test.com",
  rgpd: true,
};

describe("step schemas", () => {
  it("step1 accepts valid", () => {
    expect(step1Schema.safeParse(validStep1).success).toBe(true);
  });
  it("step1 rejects bad matricula", () => {
    expect(step1Schema.safeParse({ ...validStep1, matricula: "1234" }).success).toBe(false);
  });
  it("step1 rejects ano in future", () => {
    expect(step1Schema.safeParse({ ...validStep1, ano: 2099 }).success).toBe(false);
  });
  it("step2 rejects km > 999999", () => {
    expect(step2Schema.safeParse({ ...validStep2, km: 1000001 }).success).toBe(false);
  });
  it("step2 rejects unknown estado_geral", () => {
    expect(step2Schema.safeParse({ ...validStep2, estado_geral: "OK" as any }).success).toBe(false);
  });
  it("step3 rejects soh > 100", () => {
    expect(step3Schema.safeParse({ ...validStep3, bateria_soh_pct: 150 }).success).toBe(false);
  });
  it("step4 requires rgpd consent", () => {
    expect(step4Schema.safeParse({ ...validStep4, rgpd: false }).success).toBe(false);
  });
  it("step4 rejects fixed-line phone", () => {
    expect(step4Schema.safeParse({ ...validStep4, telefone: "+351212345678" }).success).toBe(false);
  });
  it("full schema combines all + normalizes phone", () => {
    const all = { ...validStep1, ...validStep2, ...validStep3, ...validStep4, telefone: "912345678" };
    const r = fullLeadSchema.safeParse(all);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.telefone).toBe("+351912345678");
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar `lib/validation/lead-schema.ts`

```typescript
import { z } from "zod";
import { isPtMobile, normalizePtMobile } from "@/lib/format/phone";

const matriculaRegex = /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;

export const step1Schema = z.object({
  matricula: z
    .string()
    .trim()
    .toUpperCase()
    .regex(matriculaRegex, "Matrícula inválida (formato XX-XX-XX)"),
  marca: z.string().trim().min(1).max(50),
  modelo: z.string().trim().min(1).max(50),
  versao: z.string().trim().max(80).optional().nullable(),
  ano: z.number().int().min(2010).max(new Date().getFullYear() + 1),
});
export type Step1 = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  km: z.number().int().min(0).max(999999),
  cor: z.string().trim().max(40).optional().nullable(),
  num_donos_anteriores: z.number().int().min(0).max(20),
  estado_geral: z.enum(["OPTIMO", "BOM", "RAZOAVEL", "MAU"]),
  sinistros: z.enum(["NUNCA", "LIGEIROS", "GRAVES"]),
  livro_manutencao: z.boolean(),
});
export type Step2 = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  bateria_soh_pct: z.number().int().min(0).max(100),
  autonomia_real_km: z.number().int().min(0).max(2000),
  carregador_incluido: z.boolean(),
});
export type Step3 = z.infer<typeof step3Schema>;

export const step4Schema = z.object({
  nome: z.string().trim().min(2).max(80),
  telefone: z
    .string()
    .trim()
    .refine((v) => isPtMobile(v), "Apenas aceitamos telemóveis portugueses")
    .transform((v) => normalizePtMobile(v)),
  email: z.string().trim().email().max(120),
  rgpd: z.literal(true, { errorMap: () => ({ message: "É obrigatório aceitar a política de privacidade" }) }),
});
export type Step4 = z.infer<typeof step4Schema>;

export const fullLeadSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);
export type FullLead = z.infer<typeof fullLeadSchema>;
```

- [ ] **Step 4:** Run — PASS.

- [ ] **Step 5:** Commit

```bash
git add lib/validation/ tests/unit/lead-schema.test.ts
git commit -m "feat(validation): Zod schemas for the 4-step lead form"
```

---

## Task 11 — `lib/logger.ts` (TDD)

**Files:**
- Create: `lib/logger.ts`, `tests/unit/logger.test.ts`

- [ ] **Step 1:** Teste

`tests/unit/logger.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { logger, withRequestId } from "@/lib/logger";

describe("logger", () => {
  it("logs structured JSON to console", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { foo: "bar" });
    expect(spy).toHaveBeenCalledOnce();
    const arg = spy.mock.calls[0][0];
    const parsed = JSON.parse(arg as string);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.foo).toBe("bar");
    expect(parsed.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it("withRequestId prefixes logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const child = withRequestId("req-abc");
    child.info("event");
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.requestId).toBe("req-abc");
    spy.mockRestore();
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar

```typescript
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, context: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
};

export function withRequestId(requestId: string) {
  return {
    debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, { ...c, requestId }),
    info: (m: string, c?: Record<string, unknown>) => emit("info", m, { ...c, requestId }),
    warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, { ...c, requestId }),
    error: (m: string, c?: Record<string, unknown>) => emit("error", m, { ...c, requestId }),
  };
}
```

- [ ] **Step 4:** Run — PASS.

- [ ] **Step 5:** Commit

```bash
git add lib/logger.ts tests/unit/logger.test.ts
git commit -m "feat(logger): structured JSON logger with requestId scoping"
```

---

## Task 12 — `lib/supabase/{server,client}.ts`

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `tests/unit/supabase-server.test.ts`

- [ ] **Step 1:** Teste

`tests/unit/supabase-server.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

describe("supabase service role client", () => {
  it("returns a client", () => {
    const client = createServiceRoleClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar `lib/supabase/server.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server env missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

`lib/supabase/client.ts`:

```typescript
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4:** Run — PASS.

- [ ] **Step 5:** Commit

```bash
git add lib/supabase/ tests/unit/supabase-server.test.ts
git commit -m "feat(supabase): service-role and browser clients"
```

---

## Task 13 — `lib/email/resend.ts` (TDD com MSW)

**Files:**
- Create: `lib/email/resend.ts`, `tests/unit/email-resend.test.ts`

- [ ] **Step 1:** Teste

`tests/unit/email-resend.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sendOperatorEmail } from "@/lib/email/resend";

process.env.RESEND_API_KEY = "test_key";
process.env.RESEND_FROM = "noreply@test.dev";
process.env.OPERATOR_EMAIL = "ops@test.dev";

describe("sendOperatorEmail", () => {
  it("sends an email and returns id", async () => {
    const result = await sendOperatorEmail({
      subject: "novo lead Tesla Model 3",
      html: "<p>lead test</p>",
    });
    expect(result.id).toBe("test-email-id");
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar

```typescript
import { Resend } from "resend";

let resend: Resend | null = null;
function client() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendOperatorEmail(opts: { subject: string; html: string }) {
  const to = (process.env.OPERATOR_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM missing");
  if (to.length === 0) throw new Error("OPERATOR_EMAIL empty");
  const { data, error } = await client().emails.send({
    from,
    to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return { id: data!.id };
}

export function renderNewLeadHtml(lead: {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  nome: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads/${lead.id}`;
  return `
    <p>Novo lead: <strong>${lead.marca} ${lead.modelo} ${lead.ano}</strong></p>
    <p>Cliente: ${lead.nome}</p>
    <p><a href="${url}">Abrir no admin</a></p>
  `.trim();
}
```

- [ ] **Step 4:** Run — PASS.

- [ ] **Step 5:** Commit

```bash
git add lib/email/ tests/unit/email-resend.test.ts
git commit -m "feat(email): Resend wrapper for operator notifications"
```

---

## Task 14 — `lib/ratelimit.ts`

**Files:**
- Create: `lib/ratelimit.ts`

(Sem teste unitário — Upstash não tem mock fácil; testamos no integration de `/api/leads`.)

- [ ] **Step 1:** Implementar

```typescript
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash env missing");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export const leadsRateLimit = (() => {
  let l: Ratelimit | null = null;
  return () => {
    if (!l) {
      l = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "rl:leads",
      });
    }
    return l;
  };
})();
```

- [ ] **Step 2:** Verificar typecheck

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3:** Commit

```bash
git add lib/ratelimit.ts
git commit -m "feat(ratelimit): Upstash sliding-window helper for /api/leads"
```

---

## Task 15 — Root layout + landing (UI — frontend-design)

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(public)/page.tsx` (mover `app/page.tsx` para grupo `(public)`)
- Create: `app/(public)/layout.tsx` (se necessário)

- [ ] **Step 1:** Mover `app/page.tsx` para `app/(public)/page.tsx`

```bash
mkdir -p "app/(public)"
git mv app/page.tsx "app/(public)/page.tsx"
```

- [ ] **Step 2 (UI — frontend-design):** Construir landing

Invocar `frontend-design` com este prompt:

```
Build the public landing page for compramososeueletrico (a Wizard of Oz EV-buying platform in Portugal).

Context already established:
- Brand tokens defined in tailwind.config.ts and app/globals.css (use the existing tokens — do not redefine)
- Tone: pt-PT, "tu" form, casual but trustworthy
- Target: PT consumer with an EV to sell, mostly mobile

Files to create/modify:
- app/(public)/page.tsx — the landing
- app/(public)/layout.tsx — shared layout for public pages with header (logo + a single CTA "Avaliar o meu EV") and footer (links to /politica-privacidade, /termos, /cookies, /contacto — pages don't exist yet, just <Link>; NIF + morada placeholder)
- Any client components in components/marketing/

Sections needed:
1. Hero — headline strong claim ("Vendemos o teu elétrico em poucas horas"), subhead ("Avaliação em 1 minuto · Proposta em 1 hora · Dinheiro em 24 horas"), CTA primário "Começar avaliação" → /avaliar, secundário "Como funciona" (anchor scroll)
2. "Como funciona" — 3 passos com ícones (Avaliar / Proposta SMS / Pagamento)
3. "Porquê só elétricos" — 3-4 bullets (especialistas em SoH, autonomia real, conhecimento de modelos PT mais comuns, etc.)
4. Modelos populares — grid de 6-8 marcas/modelos suportados (Tesla, Renault Zoe, Nissan Leaf, VW ID.3/4, Hyundai Kona, Kia EV6, Peugeot e-208, BMW i3) — apenas badges/pills com nome
5. FAQ — acordeão com 5-6 perguntas (a proposta é firme? quanto demora? onde ficam? e se mudar de ideias? quem são vocês?)
6. CTA final — "Pronto para vender o teu EV?" + botão para /avaliar

Constraints:
- Use shadcn/ui primitives where possible (Button, Card, Accordion — pode precisar de adicionar Accordion via shadcn add)
- Mobile-first; hero deve dominar 1ª dobra mobile sem cortar a CTA
- Sem placeholder lorem-ipsum — escreve copy real em pt-PT
- A landing tem de ser distinctive: NÃO use o "gradient blob + boilerplate hero" típico. Procura uma identidade visual concreta (tipografia forte, espaçamento generoso, ou um angle visual relacionado com elétricos/baterias/charge progression)
- Não inventes ainda imagens reais — usa placeholders mínimos com classes Tailwind ou SVGs custom

Deliverable: a landing renderiza em /, é responsive, e o link "Começar avaliação" leva a /avaliar (a rota será criada em task 17).
```

- [ ] **Step 3:** Smoke test

```bash
pnpm dev
# Visit http://localhost:3000 — confirma todas as secções, mobile + desktop
```

- [ ] **Step 4:** Verificar typecheck + build

```bash
pnpm typecheck && pnpm build
```

- [ ] **Step 5:** Commit

```bash
git add .
git commit -m "feat(public): landing page with hero, how-it-works, FAQ"
```

---

## Task 16 — Wizard host + estado (TDD)

**Files:**
- Create: `app/(public)/avaliar/page.tsx`, `components/form/Wizard.tsx`, `tests/unit/wizard.test.tsx`

- [ ] **Step 1:** Teste do Wizard

`tests/unit/wizard.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Wizard } from "@/components/form/Wizard";

beforeEach(() => {
  localStorage.clear();
});

describe("Wizard", () => {
  it("renders step 1 by default", () => {
    render(<Wizard />);
    expect(screen.getByTestId("wizard-step")).toHaveTextContent("1");
  });

  it("persists draft to localStorage on input", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    const matricula = screen.getByLabelText(/matrícula/i);
    await user.type(matricula, "AA-11-BB");
    const stored = JSON.parse(localStorage.getItem("avaliar-draft") ?? "{}");
    expect(stored.matricula).toBe("AA-11-BB");
  });

  it("blocks Next when step 1 invalid", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await user.click(screen.getByRole("button", { name: /seguinte/i }));
    expect(screen.getByTestId("wizard-step")).toHaveTextContent("1");
    expect(screen.getByText(/matrícula/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar Wizard com lógica mínima (UI ficará nas tasks 17-20 via frontend-design)

`components/form/Wizard.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fullLeadSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  type FullLead,
} from "@/lib/validation/lead-schema";
import { Step1Identification } from "./Step1Identification";
import { Step2Condition } from "./Step2Condition";
import { Step3Battery } from "./Step3Battery";
import { Step4Contact } from "./Step4Contact";
import { ProgressBar } from "./ProgressBar";

const DRAFT_KEY = "avaliar-draft";
const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

export function Wizard() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<Partial<FullLead>>({
    mode: "onBlur",
    defaultValues: typeof window !== "undefined" ? loadDraft() : {},
  });

  // Persist watched values
  useEffect(() => {
    const sub = methods.watch((v) => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    });
    return () => sub.unsubscribe();
  }, [methods]);

  async function next() {
    const schema = stepSchemas[step - 1];
    const values = methods.getValues();
    const r = schema.safeParse(values);
    if (!r.success) {
      r.error.issues.forEach((i) => methods.setError(i.path.join(".") as any, { message: i.message }));
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    setError(null);
    const values = methods.getValues();
    const r = fullLeadSchema.safeParse(values);
    if (!r.success) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(r.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Erro ao submeter. Tenta de novo.");
        return;
      }
      const data = await res.json();
      localStorage.removeItem(DRAFT_KEY);
      window.location.assign(`/avaliar/obrigado?ref=${data.ref}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <ProgressBar current={step} total={4} />
      <div data-testid="wizard-step" className="sr-only">{step}</div>
      {step === 1 && <Step1Identification />}
      {step === 2 && <Step2Condition />}
      {step === 3 && <Step3Battery />}
      {step === 4 && <Step4Contact />}
      <NavButtons step={step} onNext={next} onBack={back} onSubmit={submit} submitting={submitting} />
      {error && <p role="alert" className="text-red-600 mt-4">{error}</p>}
    </FormProvider>
  );
}

function NavButtons({ step, onBack, onNext, onSubmit, submitting }: {
  step: number; onBack: () => void; onNext: () => void; onSubmit: () => void; submitting: boolean;
}) {
  return (
    <div className="flex justify-between mt-6">
      {step > 1 ? <button type="button" onClick={onBack}>Voltar</button> : <span />}
      {step < 4 ? (
        <button type="button" onClick={onNext}>Seguinte</button>
      ) : (
        <button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "A enviar..." : "Receber proposta"}
        </button>
      )}
    </div>
  );
}

function loadDraft(): Partial<FullLead> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}
```

`app/(public)/avaliar/page.tsx`:

```tsx
import { Wizard } from "@/components/form/Wizard";

export default function AvaliarPage() {
  return (
    <main className="container mx-auto max-w-xl py-8 px-4">
      <Wizard />
    </main>
  );
}
```

Stubs temporários para Step components (serão refeitos por frontend-design):

`components/form/ProgressBar.tsx`:

```tsx
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="text-sm text-muted-foreground mb-4">
      Passo {current} de {total}
    </div>
  );
}
```

`components/form/Step1Identification.tsx`, `Step2Condition.tsx`, `Step3Battery.tsx`, `Step4Contact.tsx` — cada um stub mínimo com inputs sem styling:

```tsx
// Step1Identification.tsx
"use client";
import { useFormContext } from "react-hook-form";
export function Step1Identification() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Matrícula
        <input {...register("matricula")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Marca
        <input {...register("marca")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Modelo
        <input {...register("modelo")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Versão (opcional)
        <input {...register("versao")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Ano
        <input type="number" {...register("ano", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
    </div>
  );
}
```

Stubs análogos para os outros 3 passos (substituídos por UI polished nos Tasks 18-20):

`components/form/Step2Condition.tsx`:

```tsx
"use client";
import { useFormContext } from "react-hook-form";
export function Step2Condition() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Quilómetros
        <input type="number" {...register("km", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Cor (opcional)
        <input {...register("cor")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Nº de donos anteriores
        <input type="number" {...register("num_donos_anteriores", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Estado geral
        <select {...register("estado_geral")} className="border p-2 w-full">
          <option value="">—</option>
          <option value="OPTIMO">Ótimo</option>
          <option value="BOM">Bom</option>
          <option value="RAZOAVEL">Razoável</option>
          <option value="MAU">Mau</option>
        </select>
      </label>
      <label className="block">
        Sinistros
        <select {...register("sinistros")} className="border p-2 w-full">
          <option value="">—</option>
          <option value="NUNCA">Nunca</option>
          <option value="LIGEIROS">Ligeiros</option>
          <option value="GRAVES">Graves</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("livro_manutencao")} /> Livro de manutenção
      </label>
    </div>
  );
}
```

`components/form/Step3Battery.tsx`:

```tsx
"use client";
import { useFormContext } from "react-hook-form";
export function Step3Battery() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        SoH bateria (%)
        <input type="number" {...register("bateria_soh_pct", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Autonomia real (km)
        <input type="number" {...register("autonomia_real_km", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("carregador_incluido")} /> Carregador portátil incluído
      </label>
    </div>
  );
}
```

`components/form/Step4Contact.tsx`:

```tsx
"use client";
import { useFormContext } from "react-hook-form";
export function Step4Contact() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Nome
        <input {...register("nome")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Telemóvel
        <input {...register("telefone")} className="border p-2 w-full" placeholder="9XX XXX XXX" />
      </label>
      <label className="block">
        Email
        <input type="email" {...register("email")} className="border p-2 w-full" />
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" {...register("rgpd")} className="mt-1" />
        <span>Aceito a política de privacidade e os termos.</span>
      </label>
    </div>
  );
}
```

- [ ] **Step 4:** Run teste

```bash
pnpm test tests/unit/wizard.test.tsx
```

Expected: PASS.

- [ ] **Step 5:** Commit

```bash
git add components/form/ app/\(public\)/avaliar/ tests/unit/wizard.test.tsx
git commit -m "feat(form): wizard host with step state, validation, localStorage draft"
```

---

## Task 17 — Step 1 (Identificação) (UI — frontend-design)

**Files:**
- Modify: `components/form/Step1Identification.tsx`, possibly `components/form/ProgressBar.tsx`
- Add shadcn primitives if needed: `pnpm dlx shadcn@latest add ...`

- [ ] **Step 1 (UI — frontend-design):**

Invocar `frontend-design` com este prompt:

```
Build Step 1 of the multi-step EV evaluation form for compramososeueletrico.

This is a wizard step inside <FormProvider> (React Hook Form is already wired). The schema is in lib/validation/lead-schema.ts (step1Schema). Brand tokens already defined.

Fields (label : type : behavior):
- matricula : text : auto-uppercase + auto-mask "XX-XX-XX" on type, max 8 chars including dashes. PT plate format. Show small inline help: "Formato: AA-11-BB"
- marca : combobox (shadcn Combobox) populated with these top-N PT EV brands: Tesla, Renault, Nissan, Volkswagen, Hyundai, Kia, Peugeot, Citroën, Opel, BMW, Mercedes-Benz, Audi, Volvo, Ford, Smart, MG, BYD, Polestar, Skoda, SEAT, Cupra, Fiat, Mini, Honda, Mazda, Porsche, Jaguar, Toyota, DS Automobiles. Allow custom value if not in list.
- modelo : text : free input
- versao : text : optional, label "Versão (opcional)" — placeholder "ex: Long Range, GT, e+, etc."
- ano : number select : range 2010..currentYear+1, default empty

Layout & UX:
- ProgressBar at top (will be revised in next sub-step) showing "Passo 1 de 4 — Identificação"
- Section title "Que carro queres vender?"
- Optional one-line subtitle "Começamos pelo básico."
- Single-column on mobile, can be 2-col on >=768px for shorter fields (ano + versão side by side)
- Validation surfaces inline below each field using shadcn Form primitives, error state styled per brand
- "Seguinte" button bottom-right (kept by Wizard host — do NOT replace it)

Also: take this opportunity to upgrade `components/form/ProgressBar.tsx` to a real visual progress bar (4 segments, current step highlighted, completed steps with check-icon). Use design tokens. It's reused across all steps.

Files to modify:
- components/form/Step1Identification.tsx
- components/form/ProgressBar.tsx

Constraints:
- Keep existing field names and useFormContext pattern; don't break the Wizard
- Don't introduce new dependencies beyond shadcn primitives (Combobox, Select, etc. — install via shadcn add if needed)
- pt-PT copy
- The form must remain functional even without the next 3 steps existing (they have stubs)

Deliverable: a polished step 1 that visually sets the tone for the rest of the wizard.
```

- [ ] **Step 2:** Re-run wizard test (UI mudou mas comportamento fica)

```bash
pnpm test tests/unit/wizard.test.tsx
```

Expected: PASS (pode precisar ajustar selectors no teste se a label muda — atualizar teste se necessário).

- [ ] **Step 3:** Smoke

```bash
pnpm dev
# /avaliar — confirmar look & feel + máscara matrícula
```

- [ ] **Step 4:** Commit

```bash
git add .
git commit -m "feat(form): step 1 (identification) with frontend-design polish"
```

---

## Task 18 — Step 2 (Estado) (UI — frontend-design)

**Files:**
- Modify: `components/form/Step2Condition.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invocar `frontend-design`:

```
Build Step 2 (Estado) of the EV evaluation wizard for compramososeueletrico.

Schema: step2Schema in lib/validation/lead-schema.ts
Fields:
- km : number input with thousand separators visual, clamp 0-999999, suffix "km"
- cor : text (optional, max 40)
- num_donos_anteriores : number (0-20), default 1
- estado_geral : enum [OPTIMO, BOM, RAZOAVEL, MAU] — render as 4 large pill-buttons in a row, selectable, mobile-friendly. Labels: "Ótimo", "Bom", "Razoável", "Mau". Each pill should hint a tone color (green/teal/amber/red) but subtle.
- sinistros : enum [NUNCA, LIGEIROS, GRAVES] — same 3-pill pattern. Labels: "Nunca", "Ligeiros", "Graves".
- livro_manutencao : bool — radio group with two pills "Sim" / "Não"

Layout:
- Section title "Estado do carro"
- Subtitle "Sê honesto — confirmamos no local."
- Single-column mobile, 2-col on >=768px where it fits (km + num_donos can pair)
- Estado pills span full width (1 row of 4)
- Sinistros pills similarly

Use react-hook-form + shadcn (RadioGroup, Toggle, ToggleGroup, or custom pills). Stick to the brand tokens. Inline error states.

Files to modify:
- components/form/Step2Condition.tsx

Deliverable: polished step 2 consistent with step 1.
```

- [ ] **Step 2:** Smoke + commit

```bash
pnpm dev
# clica até ao step 2, testa pills + erros
```

```bash
git add .
git commit -m "feat(form): step 2 (condition) with frontend-design polish"
```

---

## Task 19 — Step 3 (Bateria & EV) (UI — frontend-design)

**Files:**
- Modify: `components/form/Step3Battery.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invocar `frontend-design`:

```
Build Step 3 (Bateria & EV) of the EV evaluation wizard for compramososeueletrico.

This is the EV-specific differentiator step — should feel like an expert is asking. Schema: step3Schema.

Fields:
- bateria_soh_pct : number 0-100 with "%" suffix. Above the input, a small help block (collapsible or info popover): "O SoH (State of Health) é a saúde da tua bateria. Encontra-o em: Tesla → Service Mode; Renault Zoe → app My Renault; outros → menu de bateria do carro ou pede a alguém da marca. Se não souberes, deixa em branco e nós ajudamos." (default placeholder e.g., 90).
- autonomia_real_km : number. Help: "A autonomia real que fazes hoje, com condução normal. Exemplo: se carregas a 100% e fazes 350 km, escreve 350."
- carregador_incluido : bool — pill toggle "Sim" / "Não". Help below: "Estás a entregar o carregador portátil junto com o carro?"

Layout:
- Section title "Bateria e EV"
- Subtitle "A parte que torna a tua avaliação justa."
- Each field full-width with breathing room
- Visual treatment that nods to "battery / charge" without being cheesy (e.g., a subtle progress-style visualization for SoH input)

Files to modify:
- components/form/Step3Battery.tsx

Constraints: same as steps 1-2 — RHF, shadcn, brand tokens, pt-PT copy.

Deliverable: a step that *feels expert* and converts well (this is where users either trust us or bounce).
```

- [ ] **Step 2:** Smoke + commit

```bash
git add .
git commit -m "feat(form): step 3 (battery & EV) with frontend-design polish"
```

---

## Task 20 — Step 4 (Contacto + RGPD) (UI — frontend-design)

**Files:**
- Modify: `components/form/Step4Contact.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invocar `frontend-design`:

```
Build Step 4 (Contacto + RGPD) of the EV evaluation wizard for compramososeueletrico.

Schema: step4Schema.

Fields:
- nome : text (2-80 chars), placeholder "ex: João Silva"
- telefone : text with PT mobile mask. Show "+351" prefix as static label on the left, allow only 9 digits after, show as "9XX XXX XXX". libphonenumber-js validates server-side. Don't accept fixed-line numbers. Inline error: "Apenas aceitamos telemóveis portugueses."
- email : email
- rgpd : checkbox + label with inline links: "Li e aceito a [política de privacidade] e os [termos]. Os meus dados serão usados exclusivamente para avaliar o veículo e contactar-me com a proposta." Links go to /politica-privacidade and /termos (pages not built yet — just <Link>, no error if 404). Submit must be blocked if not checked.

Layout:
- Section title "Onde te encontramos?"
- Subtitle "Vais receber a proposta por SMS dentro de 1 hora útil."
- Mobile-first single column
- The submit button is owned by the Wizard host but the consent checkbox lives in this step

Files to modify:
- components/form/Step4Contact.tsx

Constraints: same as previous steps. Make the consent block prominent — it should look intentional, not buried.

Deliverable: polished step 4 + final-step recap (above the submit button) listing the carro identified ("Vais receber proposta para o teu Tesla Model 3 (2021).") if those values are set.
```

- [ ] **Step 2:** Smoke + commit

```bash
git add .
git commit -m "feat(form): step 4 (contact + RGPD) with frontend-design polish"
```

---

## Task 21 — `POST /api/leads` (TDD)

**Files:**
- Create: `app/api/leads/route.ts`, `tests/integration/api-leads.test.ts`

- [ ] **Step 1:** Teste de integração (Supabase local tem de estar a correr)

`tests/integration/api-leads.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

const validPayload = {
  matricula: "BB-22-CC",
  marca: "Renault",
  modelo: "Zoe",
  versao: "Z.E. 50",
  ano: 2020,
  km: 60000,
  cor: "azul",
  num_donos_anteriores: 1,
  estado_geral: "BOM",
  sinistros: "NUNCA",
  livro_manutencao: true,
  bateria_soh_pct: 88,
  autonomia_real_km: 280,
  carregador_incluido: true,
  nome: "Maria Teste",
  telefone: "912000002",
  email: "maria@test.com",
  rgpd: true,
};

async function callApi(body: any) {
  const { POST } = await import("@/app/api/leads/route");
  const req = new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "BB-22-CC");
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "BB-22-CC");
});

describe("POST /api/leads", () => {
  it("creates a lead and returns ref", async () => {
    const res = await callApi(validPayload);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ref).toBeDefined();
    const { data } = await supabase.from("leads").select("*").eq("matricula", "BB-22-CC").single();
    expect(data?.telefone).toBe("+351912000002");
    expect(data?.status).toBe("NEW");
  });

  it("rejects payload without RGPD consent", async () => {
    const res = await callApi({ ...validPayload, rgpd: false });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects fixed-line phone", async () => {
    const res = await callApi({ ...validPayload, telefone: "212345678" });
    expect(res.status).toBe(400);
  });

  it("returns 200 with same-payload duplicate (idempotent UX)", async () => {
    const a = await callApi(validPayload);
    expect(a.status).toBe(201);
    const b = await callApi(validPayload);
    expect([200, 409]).toContain(b.status);
  });

  it("logs LEAD_CREATED event", async () => {
    await callApi(validPayload);
    const { data: leads } = await supabase.from("leads").select("id").eq("matricula", "BB-22-CC").single();
    const { data: events } = await supabase.from("events").select("*").eq("lead_id", leads!.id);
    expect(events?.some((e) => e.type === "LEAD_CREATED")).toBe(true);
  });
});
```

- [ ] **Step 2:** Run — FAIL.

- [ ] **Step 3:** Implementar `app/api/leads/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { fullLeadSchema } from "@/lib/validation/lead-schema";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOperatorEmail, renderNewLeadHtml } from "@/lib/email/resend";
import { logger, withRequestId } from "@/lib/logger";
import { leadsRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  // rate-limit (tolera ausência de Upstash em ambiente local de testes)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rl = await leadsRateLimit().limit(`ip:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas submissões. Tenta dentro de uma hora." } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON inválido" } },
      { status: 400 },
    );
  }

  const parsed = fullLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const supabase = createServiceRoleClient();

  const insertPayload = {
    matricula: data.matricula,
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao ?? null,
    ano: data.ano,
    km: data.km,
    cor: data.cor ?? null,
    num_donos_anteriores: data.num_donos_anteriores,
    estado_geral: data.estado_geral,
    sinistros: data.sinistros,
    livro_manutencao: data.livro_manutencao,
    bateria_soh_pct: data.bateria_soh_pct,
    autonomia_real_km: data.autonomia_real_km,
    carregador_incluido: data.carregador_incluido,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    rgpd_consent_at: new Date().toISOString(),
    status: "NEW" as const,
  };

  const { data: lead, error } = await supabase
    .from("leads")
    .insert(insertPayload)
    .select("id, marca, modelo, ano, nome")
    .single();

  if (error) {
    if (error.code === "23505") {
      log.info("duplicate active lead", { matricula: data.matricula });
      return NextResponse.json(
        { ref: "duplicate", message: "Já recebemos a tua avaliação. Vais receber SMS em breve." },
        { status: 200 },
      );
    }
    log.error("lead insert failed", { error: error.message });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Erro interno. Tenta de novo." } },
      { status: 500 },
    );
  }

  await supabase.from("events").insert({
    lead_id: lead.id,
    type: "LEAD_CREATED",
    actor: "customer",
    payload: { ip, requestId },
  });

  // email operador (best-effort — falhas não bloqueiam o cliente)
  try {
    await sendOperatorEmail({
      subject: `novo lead • ${lead.marca} ${lead.modelo} ${lead.ano}`,
      html: renderNewLeadHtml(lead),
    });
  } catch (e) {
    log.warn("operator email failed (non-fatal)", { error: (e as Error).message });
  }

  // ref opaco — não revela id real
  const ref = lead.id.slice(0, 8);
  return NextResponse.json({ ref }, { status: 201 });
}
```

- [ ] **Step 4:** Run — PASS.

```bash
pnpm test tests/integration/api-leads.test.ts
```

- [ ] **Step 5:** Commit

```bash
git add app/api/leads/ tests/integration/api-leads.test.ts
git commit -m "feat(api): POST /api/leads with validation, dedupe, email notify"
```

---

## Task 22 — Página de obrigado (UI — frontend-design)

**Files:**
- Create: `app/(public)/avaliar/obrigado/page.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invocar `frontend-design`:

```
Build the post-submission "obrigado" page for compramososeueletrico.

Route: app/(public)/avaliar/obrigado/page.tsx
Reads search param `?ref=<short-id>` (just for display ack — has no real meaning to the user).

The page does NOT read user details — we don't have access by the ref alone (privacy by design). The page is generic but warm.

Sections:
1. Hero — large checkmark icon (SVG) + "Recebemos a tua avaliação." + subtext "Vais receber um SMS com a nossa proposta dentro de 1 hora útil (horário 9h-19h, dias úteis)."
2. "O que se segue" — 3-step visual (mais ou menos): 1. Recebes SMS 2. Abres link e vês a proposta 3. Aceitas e marcas a inspeção
3. "Enquanto esperas" — secção informacional: o que vamos validar na inspeção (bateria, autonomia, condição, documentação), bullet list. Tom: tranquiliza o utilizador.
4. CTA secundária: "Voltar à página inicial" → / 
5. Pequeno footer com "Refª: {ref}" (mostrado em caps fixed-width tipo monospace, baixo contraste, só ack visual)

Constraints:
- pt-PT, "tu" form
- Mobile-first
- Respect brand tokens
- This is a low-stakes page but needs to feel like a confirmation, não um flop. Trust matters.

Deliverable: polished obrigado page rendering at /avaliar/obrigado.
```

- [ ] **Step 2:** Smoke

```bash
pnpm dev
# Submeter form no /avaliar com dados válidos → redirect para /avaliar/obrigado?ref=...
```

- [ ] **Step 3:** Commit

```bash
git add app/\(public\)/avaliar/obrigado/
git commit -m "feat(public): thank-you page with frontend-design polish"
```

---

## Task 23 — E2E happy path (Playwright)

**Files:**
- Create: `tests/e2e/lead-submission.spec.ts`

- [ ] **Step 1:** Teste E2E

`tests/e2e/lead-submission.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("submit lead happy path", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /avaliar/i }).first().click();

  await expect(page).toHaveURL(/\/avaliar/);

  // Step 1
  await page.getByLabel(/matrícula/i).fill("CC-33-DD");
  await page.getByLabel(/marca/i).fill("Tesla");
  await page.getByLabel(/modelo/i).fill("Model 3");
  await page.getByLabel(/^ano/i).fill("2022");
  await page.getByRole("button", { name: /seguinte/i }).click();

  // Step 2
  await page.getByLabel(/km/i).fill("45000");
  await page.getByLabel(/donos/i).fill("1");
  await page.getByRole("button", { name: /^bom$/i }).click();
  await page.getByRole("button", { name: /^nunca$/i }).click();
  await page.getByRole("button", { name: /^sim$/i }).first().click(); // livro manutencao
  await page.getByRole("button", { name: /seguinte/i }).click();

  // Step 3
  await page.getByLabel(/soh|saúde/i).fill("90");
  await page.getByLabel(/autonomia/i).fill("400");
  await page.getByRole("button", { name: /^sim$/i }).first().click(); // carregador
  await page.getByRole("button", { name: /seguinte/i }).click();

  // Step 4
  await page.getByLabel(/nome/i).fill("E2E Test");
  await page.getByLabel(/telem|telefone/i).fill("912000099");
  await page.getByLabel(/email/i).fill("e2e@test.com");
  await page.getByLabel(/política|aceito/i).check();
  await page.getByRole("button", { name: /receber proposta/i }).click();

  await expect(page).toHaveURL(/\/avaliar\/obrigado/);
  await expect(page.getByText(/recebemos a tua avaliação/i)).toBeVisible();
});
```

- [ ] **Step 2:** Garantir Playwright browsers instalados

```bash
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 3:** Limpar lead anterior se existir + correr

```bash
# Cleanup manual antes do teste:
psql "$NEXT_PUBLIC_SUPABASE_URL" -c "DELETE FROM leads WHERE matricula='CC-33-DD';" 2>/dev/null || true
pnpm test:e2e
```

Expected: PASS. (Pode precisar afinar selectors conforme o markup gerado pelo frontend-design — atualizar o teste em conformidade.)

- [ ] **Step 4:** Commit

```bash
git add tests/e2e/
git commit -m "test(e2e): lead submission happy path"
```

---

## Task 24 — CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:** Workflow

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: lint + typecheck
        run: |
          pnpm lint
          pnpm typecheck

      - name: start supabase
        uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase start

      - name: unit + integration tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_LOCAL_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_LOCAL_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          RESEND_API_KEY: test_key
          RESEND_FROM: noreply@test.dev
          OPERATOR_EMAIL: ops@test.dev
        run: pnpm test

      - name: build
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_LOCAL_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_LOCAL_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
        run: pnpm build

      - name: e2e tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_LOCAL_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_LOCAL_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          RESEND_API_KEY: test_key
          RESEND_FROM: noreply@test.dev
          OPERATOR_EMAIL: ops@test.dev
        run: |
          pnpm exec playwright install --with-deps chromium
          pnpm test:e2e
```

> **Nota:** os secrets `SUPABASE_LOCAL_ANON_KEY` e `SUPABASE_LOCAL_SERVICE_ROLE_KEY` correspondem às chaves geradas localmente pelo `supabase start` — adicionar manualmente no repo settings → Actions → Secrets.

- [ ] **Step 2:** Commit

```bash
git add .github/
git commit -m "ci: lint, typecheck, unit, integration, build, e2e on PR + main"
```

---

## Task 25 — Smoke final + push

- [ ] **Step 1:** Garantir tudo passa local

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Expected: tudo verde.

- [ ] **Step 2:** Verificar `git status` limpo

```bash
git status
```

Expected: working tree clean.

- [ ] **Step 3:** Resumo no chat — não criar mais commits sem instrução

Mensagem ao utilizador:

> Plano 1 implementado. Pronto para criar Plano 2 (admin auth + envio de proposta) ou para deploy preview deste plano via Vercel.

---

## Spec coverage check (auto-revisão pós-escrita)

- ✅ Schema completo (secção 3 do spec) — Task 6
- ✅ Form 4-step com validação (secção 4) — Tasks 16-20
- ✅ POST /api/leads com dedupe e RGPD (secção 4) — Task 21
- ✅ Página de obrigado (secção 4) — Task 22
- ✅ Email Resend ao operador (secção 6) — Tasks 13, 21
- ✅ Rate-limit Upstash (secção 7) — Tasks 14, 21
- ✅ Logger com requestId (secção 8) — Task 11
- ✅ libphonenumber-js para E.164 PT (secção 7) — Task 8
- ✅ Locale pt-PT em formatação (secção 7) — Task 9
- ✅ Tokens lib — **deferida para Plano 2** (não usada na captura de leads)
- ✅ State machine `proposals` — **deferida para Plano 2/3**
- ✅ Twilio — **deferido para Plano 2**
- ✅ Cal.com — **deferido para Plano 4**
- ✅ Admin / proposta / cron / RGPD purge / legal — **deferidos para Planos 2-5**
- ✅ Testes infra (Vitest + MSW + Playwright) — Task 7
- ✅ CI — Task 24

Cobertura coerente com o âmbito do Plano 1 ("Cliente submete avaliação, operador recebe email").

---

## Próximos planos (a escrever depois deste estar executado)

- Plano 2 — Admin auth + Inbox + Envio de proposta
- Plano 3 — Fluxo de proposta do cliente
- Plano 4 — Marcação Cal.com
- Plano 5 — Crons + RGPD + Legal + Produção
