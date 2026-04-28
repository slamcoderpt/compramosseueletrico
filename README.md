# compramososeueletrico

Plataforma de compra de carros elétricos usados em Portugal. Avaliação online → proposta indicativa por SMS → marcação de visita → compra direta.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + Realtime) · Twilio (SMS) · Cal.com (booking) · Resend (email) · Upstash (rate-limit) · Sentry (errors).

Spec completa: [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md)

---

## Setup local

### 1. Pré-requisitos

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x — `npm i -g pnpm`
- **Docker Desktop** — Supabase CLI corre Postgres + Auth + Inbucket em containers
- **Git**

### 2. Clonar e instalar

```bash
git clone https://github.com/slamcoderpt/compramosseueletrico.git
cd compramosseueletrico
pnpm install
```

### 3. Variáveis de ambiente

Cria `.env.local` na raiz a partir do exemplo:

```bash
cp .env.example .env.local
```

Para correr **só local** (sem SMS / email reais), os defaults abaixo bastam — preenche apenas o essencial e deixa o resto vazio (os serviços fazem skip gracioso):

```env
# Supabase local (vem com supabase start, ver passo 4)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copia do output de "supabase start">
SUPABASE_SERVICE_ROLE_KEY=<copia do output de "supabase start">

# Resend (deixa vazio — usa Inbucket local)
RESEND_API_KEY=
RESEND_FROM=onboarding@resend.dev
OPERATOR_EMAIL=eternalaiden@gmail.com

# Upstash rate-limit (vazio = skip em dev)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Twilio (vazio = sms_log entra como QUEUED/FAILED, sem rede)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

# Cal.com (vazio = mostra fallback "marcação indisponível")
CALCOM_EVENT_TYPE_LINK=
CALCOM_WEBHOOK_SECRET=test_calcom_secret

# Cron (Vercel Cron usa Bearer)
CRON_SECRET=test_cron_secret_local_dev_only

# Sentry (vazio = skip)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

### 4. Subir Supabase local

```bash
pnpm supabase:start
```

Primeira vez demora alguns minutos (descarrega imagens Docker). No fim imprime as URLs e keys — copia o `anon key` e `service_role key` para o `.env.local`.

URLs úteis:
- API: http://127.0.0.1:54321
- Studio (DB GUI): http://127.0.0.1:54323
- **Inbucket** (apanha emails de magic-link em dev): http://127.0.0.1:54324

### 5. Aplicar migrations + seed

```bash
pnpm supabase:reset
```

Aplica todas as migrations em `supabase/migrations/` e corre `supabase/seed.sql` que cria o operador admin (email `eternalaiden@gmail.com`).

> **Mudar email do operador:** edita [supabase/seed.sql](supabase/seed.sql) antes do reset.

### 6. Arrancar a app

```bash
pnpm dev
```

Abre http://localhost:3000.

### 7. Login admin

1. Vai a http://localhost:3000/admin
2. Mete o email do operador (default: `eternalaiden@gmail.com`)
3. Carrega "Receber link"
4. Vai a **http://127.0.0.1:54324** (Inbucket) — abre o email mais recente, copia o link
5. Cola no browser → estás dentro

---

## Scripts

| Comando | O quê |
|---|---|
| `pnpm dev` | Next.js em watch (porta 3000) |
| `pnpm build` | Build de produção |
| `pnpm start` | Servir build de produção |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit + integration, serial) |
| `pnpm test:watch` | Vitest em watch |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm supabase:start` | Sobe Supabase local |
| `pnpm supabase:stop` | Pára Supabase local |
| `pnpm supabase:reset` | Reset DB (re-aplica migrations + seed) |

---

## Smoke test rápido

1. **Submeter avaliação:** http://localhost:3000/avaliar — preenche os 3 passos com dados fictícios. No fim devolve confirmação.
2. **Ver no admin:** http://localhost:3000/admin — o lead aparece em realtime.
3. **Enviar proposta:** abre o lead, preenche valor, clica em "Enviar proposta". O SMS fica em `sms_log` com status FAILED (sem Twilio em dev), mas o token e link da proposta são gerados.
4. **Aceitar proposta:** copia a URL de `/proposta/<token>` da DB (Studio) ou clica no token no admin → simula aceitação.

Páginas úteis:
- `/` — landing
- `/avaliar` — wizard público (3 passos)
- `/proposta/<token>` — vista pública da proposta
- `/proposta/<token>/marcar` — marcação Cal.com
- `/admin` — inbox do operador
- `/politica-privacidade`, `/termos`, `/cookies`, `/contacto` — páginas legais

---

## Estrutura

```
app/
├── (public)/                 — landing, avaliar wizard, páginas legais
├── proposta/[token]/         — vista pública da proposta (aceitar/recusar/marcar)
├── admin/                    — inbox + detalhe de lead (auth)
└── api/
    ├── leads/                — submissão pública
    ├── admin/                — endpoints autenticados (proposals, forget)
    ├── proposals/[token]/    — accept/reject públicos
    ├── webhooks/             — twilio + calcom
    └── cron/                 — expire / gdpr-purge / nudge-bookings
components/
├── ui/                       — shadcn primitives
├── public/                   — wizard de avaliação
└── admin/                    — inbox, proposal form, timeline, ForgetButton
lib/
├── supabase/                 — clients (browser/server/service-role)
├── pricing/                  — fórmula de avaliação
├── proposals/tokens.ts       — tokens 32-char base64url
├── sms/twilio.ts             — envio + sms_log
├── format/                   — currency / phone / date pt-PT
└── ...
supabase/
├── migrations/               — schema + RLS policies
└── seed.sql                  — operador admin de dev
docs/
├── go-live-checklist.md      — checklist de produção
└── superpowers/              — specs e planos
```

---

## Próximos passos

- **Produção / go-live:** segue [docs/go-live-checklist.md](docs/go-live-checklist.md) — env vars Vercel, domínio, Sentry alerts, sender Twilio aprovado, etc.
- **Crons (Vercel):** já configurados em [vercel.json](vercel.json) — expirar propostas (15 min), nudge bookings (10h), GDPR purge (3h). Em dev podes simular com `curl -H "Authorization: Bearer test_cron_secret_local_dev_only" http://localhost:3000/api/cron/expire-proposals`.

---

## Convenções

- **Pacote manager:** sempre `pnpm`. Nunca `npm`.
- **UI:** todo o trabalho de UI passa pelo skill `frontend-design` — ver [CLAUDE.md](CLAUDE.md).
- **Tone pt-PT:** "tu" form, casual mas confiável. "Obrigado" sem barras de género.
- **Phone:** sempre normalizar para E.164 (`+3519XXXXXXXX`) server-side antes de gravar.
- **Tests:** todo lib file tem `.test.ts`; toda API route tem integration test.
