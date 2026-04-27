# compramososeueletrico — Design Document

**Data:** 2026-04-27
**Estado:** Em revisão pelo utilizador
**Autor:** brainstorming session (Claude Code)

---

## 1. Visão geral

Plataforma web para compra de carros **elétricos usados** a particulares em Portugal, inspirada no modelo de compramososeucarro.pt mas exclusivamente para EVs.

**Modelo de operação (Wizard of Oz MVP):** o front simula avaliação automática mas a proposta é feita por um operador humano. Fluxo:

1. Cliente preenche formulário multi-step (~12-15 perguntas, com bloco específico EV: SoH, autonomia real, carregador).
2. Página de obrigado promete proposta por SMS dentro de **1 hora útil** (horário comercial, dias úteis).
3. Operador recebe alerta realtime + email, abre back-office, avalia manualmente, introduz preço e envia SMS com link único para a proposta.
4. Cliente abre `/proposta/[token]` — vê valor (indicativo, sujeito a inspeção), válido **48h**, com resumo, condições, próximos passos e FAQ.
5. **Aceitar** → marcação de visita via embed Cal.com → SMS de confirmação. **Recusar** → fim.
6. Visita ao único local físico, inspeção real, fecho da compra.

### Decisões fundamentais (já validadas)

- Profundidade do form: **Standard ~12-15 perguntas**.
- SLA público: **1h em horário comercial**.
- Marcação: **Cal.com embed** (não calendário próprio).
- Stack: **Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase + Twilio + Cal.com**, monolito Next.js, deploy Vercel.
- Proposta: **48h, indicativa, accept/reject only, página rica**.
- Back-office: **B-tier** — realtime, timeline, multi-operador, integração Cal.com.
- Localizações: **1** no MVP.
- Domínio: **compramososeueletrico.pt**.
- Provider SMS: **Twilio** (sender alfanumérico para PT).

---

## 2. Arquitetura & topologia

### Stack

- **Frontend & API:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **DB & Auth & Realtime:** Supabase (Postgres em região UE)
- **SMS:** Twilio (sender alfanumérico `EletricoPT`)
- **Marcação:** Cal.com (embed)
- **Email transacional:** Resend
- **Rate-limit:** Upstash Redis
- **Deploy:** Vercel
- **Observabilidade:** Vercel Logs + Sentry

### Topologia de rotas (mesma app)

**Público:**
- `/` — landing
- `/avaliar` — form multi-step
- `/avaliar/obrigado` — página de status
- `/proposta/[token]` — página da proposta
- `/proposta/[token]/marcar` — Cal.com embed pós-aceitação
- `/proposta/[token]/recusada`
- `/proposta/[token]/expirada`
- `/p/[token]` — atalho para SMS curto (redirect server-side)
- `/politica-privacidade`, `/termos`, `/cookies`, `/contacto`

**API:**
- `POST /api/leads` — submissão do form
- `POST /api/proposals/[token]/accept|reject`
- `POST /api/admin/proposals` — operador envia proposta
- `POST /api/admin/leads/[id]/forget` — RGPD
- `POST /api/webhooks/twilio`
- `POST /api/webhooks/calcom`
- `GET /api/cron/expire-proposals`
- `GET /api/cron/gdpr-purge`

**Admin:**
- `/admin/login` (magic link)
- `/admin/auth/callback`
- `/admin` — inbox realtime
- `/admin/leads/[id]` — detalhe + ação
- `/admin/settings`

### Diagrama de fluxo

```
Cliente preenche form → POST /api/leads → INSERT lead (status=NEW)
                                          ↓
                             Supabase Realtime + email Resend
                                          ↓
                                    Operador no /admin
                                          ↓
                            Avalia, introduz preço, clica Enviar
                                          ↓
                  POST /api/admin/proposals → INSERT proposal (token, expira_em=+48h)
                                          ↓
                              Twilio sendSMS(link único)
                                          ↓
                              Cliente abre /proposta/[token]
                                  ↓                    ↓
                             Aceitar               Recusar
                                  ↓                    ↓
                       /proposta/[token]/marcar   status=REJECTED
                       (Cal.com embed)
                                  ↓
                  Webhook Cal.com → status=SCHEDULED + SMS confirmação
```

---

## 3. Modelo de dados

5 tabelas + `profiles`. Tudo com `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`. RLS ativo em todas. Cliente browser nunca escreve direto — tudo passa por API routes com `service_role`.

### `leads`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| matricula | text | |
| marca, modelo, versao | text | |
| ano | int | |
| km | int | |
| cor | text | |
| num_donos_anteriores | int | |
| estado_geral | text | enum: `OPTIMO`, `BOM`, `RAZOAVEL`, `MAU` |
| sinistros | text | enum: `NUNCA`, `LIGEIROS`, `GRAVES` |
| livro_manutencao | bool | |
| bateria_soh_pct | int | EV-specific |
| autonomia_real_km | int | EV-specific |
| carregador_incluido | bool | EV-specific |
| nome | text | |
| telefone | text | E.164 |
| email | text | |
| rgpd_consent_at | timestamptz | |
| status | text | `NEW`, `IN_REVIEW`, `PROPOSED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `SCHEDULED`, `COMPLETED`, `LOST` |
| lost_reason | text nullable | quando status=LOST |
| created_at, updated_at | timestamptz | |

**Índices:**
- `(status, created_at DESC)` — inbox
- `(telefone)` — dedupe lookup
- Unique parcial `(matricula, telefone) WHERE status IN ('NEW','IN_REVIEW','PROPOSED')` — anti-duplicado

### `proposals`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| lead_id | uuid FK → leads ON DELETE CASCADE | |
| valor_eur_cents | bigint | em cêntimos (sem floats) |
| token | text UNIQUE | 32 chars URL-safe |
| status | text | `SENT`, `VIEWED`, `ACCEPTED`, `REJECTED`, `EXPIRED` |
| sent_by | uuid FK → auth.users | operador |
| sent_at | timestamptz | |
| viewed_at, accepted_at, rejected_at | timestamptz nullable | |
| expires_at | timestamptz | `sent_at + interval '48 hours'` |
| notes_internal | text nullable | |

**Índices:**
- UNIQUE `(token)`
- `(lead_id)`
- `(status, expires_at)` — job de expiração
- Unique parcial `(lead_id) WHERE status IN ('SENT','VIEWED')` — só uma proposta ativa por lead

### `events` (timeline)

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| lead_id | uuid FK → leads ON DELETE CASCADE |
| proposal_id | uuid FK → proposals nullable |
| type | text — `LEAD_CREATED`, `PROPOSAL_SENT`, `SMS_DELIVERED`, `PROPOSAL_VIEWED`, `PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`, `PROPOSAL_EXPIRED`, `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, `OPERATOR_NOTE`, `STATUS_CHANGED` |
| actor | text — `system`, `customer`, `operator:<uuid>` |
| payload | jsonb |

**Índice:** `(lead_id, created_at)`.

### `bookings`

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| proposal_id | uuid FK → proposals |
| calcom_booking_id | text UNIQUE |
| scheduled_at | timestamptz |
| status | text — `CONFIRMED`, `CANCELLED`, `RESCHEDULED`, `NO_SHOW` |

### `sms_log`

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| lead_id, proposal_id | uuid FK nullable |
| to_phone, body | text |
| twilio_sid | text |
| status | text — `QUEUED`, `SENT`, `DELIVERED`, `FAILED` |
| error | text nullable |

### `profiles` (operadores)

| Coluna | Tipo |
|---|---|
| id | uuid PK FK → auth.users |
| display_name | text |
| role | text — `operator`, `admin` |
| created_at | timestamptz |

### `gdpr_deletions` (audit RGPD)

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| deleted_lead_id | uuid |
| reason | text |
| deleted_by | uuid FK → auth.users |
| created_at | timestamptz |

---

## 4. Fluxo público

### Landing — `/`
Hero: *"Vendemos o teu elétrico em poucas horas. Avaliação em 1 minuto, proposta em 1 hora, dinheiro em 24 horas."* + 3 ícones (Avaliar / Receber proposta / Vender). Bloco *Porquê só elétricos?*. FAQ. CTA → `/avaliar`.

### Form — `/avaliar`

Wizard mobile-first, **4 passos**, React Hook Form + Zod, persistido em `localStorage`. Cada passo `?step=N` (deep-link, voltar não perde dados). Barra de progresso.

| Passo | Campos |
|---|---|
| 1 — Identificação | matrícula (uppercase + máscara `XX-XX-XX`), marca (combobox), modelo, versão, ano |
| 2 — Estado | km, cor, nº donos anteriores, estado geral (4 botões), sinistros (3 botões), livro manutenção (sim/não) |
| 3 — Bateria & EV | SoH % (input + tooltip), autonomia real (km), carregador portátil incluído |
| 4 — Contacto | nome, telemóvel (PT E.164), email, **checkbox RGPD obrigatório** |

**Submit:**
1. Server valida (Zod completa + E.164 PT + dedupe via unique parcial)
2. INSERT `leads` (status `NEW`), INSERT `events` `LEAD_CREATED`
3. Resend email ao operador
4. Supabase Realtime notifica `/admin`
5. Redirect `/avaliar/obrigado?ref=<short-id-opaco>`

### Página de obrigado
*"Obrigado **{nome}**, recebemos a avaliação do teu **{marca} {modelo} {ano}**. Vais receber um SMS no número **{telefone-mascarado}** com a proposta dentro de **1 hora útil** (horário 9h-19h, dias úteis)."* Sem `leadId` no URL.

### Página da proposta — `/proposta/[token]`

Server-side rendering. Lookup + validações:

```
SELECT proposal + lead WHERE token = $1
  → não existe: 404
  → status = 'EXPIRED' OR expires_at < now(): redirect /expirada
  → status = 'REJECTED': redirect /recusada
  → status = 'ACCEPTED': redirect /marcar
  → status = 'SENT': UPDATE → 'VIEWED', INSERT event PROPOSAL_VIEWED
  → status = 'VIEWED': segue
```

**Conteúdo (ordem de scroll):**
1. Hero: *"A nossa proposta para o teu {marca} {modelo}"* + valor (€) grande + badge **"Proposta indicativa"**
2. Validade: countdown live até `expires_at`
3. Botões: `Aceitar proposta` (verde) + `Recusar` (cinza), ambos com diálogo de confirmação
4. Resumo do carro declarado (com nota *"valores fornecidos por si — confirmamos na inspeção"*)
5. Condições (indicativa, sujeita a confirmação no local, modos de pagamento)
6. Próximos passos (timeline visual: aceitar → marcar → validar no local → pagar)
7. FAQ acordeão

### Aceitar / Recusar

- `POST /api/proposals/[token]/accept` — UPDATE com `WHERE status IN ('SENT','VIEWED') AND expires_at > now()` (atómico). Devolve `{next: '/proposta/[token]/marcar'}` ou 409/410.
- `POST /api/proposals/[token]/reject` — análogo, redirect para `/recusada`.

### Marcar — `/proposta/[token]/marcar`

Cal.com embed (`@calcom/embed-react`) com `prefill` do lead e `metadata.proposalToken`. Acima: *"Quase lá! Escolhe um horário em {endereço}."*

Webhook `/api/webhooks/calcom`:
- Valida HMAC (`X-Cal-Signature-256`, constant-time)
- `BOOKING_CREATED` → match por `metadata.proposalToken` → INSERT `bookings`, UPDATE lead `SCHEDULED`, INSERT event, SMS confirmação cliente, email operador
- `BOOKING_CANCELLED` → UPDATE `bookings`, lead volta a `ACCEPTED`, log + email
- `BOOKING_RESCHEDULED` → UPDATE `scheduled_at`, log + SMS atualizado

A página subscreve Realtime do próprio booking — UI flipa para *"Marcação confirmada para {data}"* sem refresh quando o webhook escreve.

### Páginas terminais
- `/recusada` — *"Que pena. Se mudares de ideias, contacta-nos."*
- `/expirada` — *"Esta proposta expirou. Pede nova avaliação."* + CTA `/avaliar`
- 404 token inválido — *"Esta proposta não existe ou foi removida."*

---

## 5. Back-office (operador)

Tudo sob `/admin/*`, gated por `middleware.ts` (sessão Supabase + role check).

### `/admin/login`
Magic link (sem palavra-passe). Após callback, redirect `/admin`.

### `/admin` — inbox

- Tabs com contagem live: *Novos · Em revisão · Proposta enviada · Aceites · Marcados · Recusados · Expirados · Perdidos*
- Pesquisa (matrícula / telefone / email / marca-modelo) + ordenação
- Tabela com colunas: carro · cliente · idade (verde <30min, âmbar 30-50, vermelho >50) · estado · `→`
- **Realtime:** `postgres_changes` em `leads`. Lead novo → linha desliza, badge sobe, **chime** (toggle), `Notification` API.

### `/admin/leads/[id]` — detalhe

**Esquerda — declaração:** todos os campos do form, agrupados, telefone/email clicáveis.

**Direita — ação condicional:**
- **`NEW` / `IN_REVIEW`:** form *Enviar proposta* (`valor`, `notes_internal`, botão `Enviar SMS`).
  - `POST /api/admin/proposals`: gera token, INSERT proposal `SENT`, UPDATE lead `PROPOSED`, INSERT event, Twilio sendSMS, INSERT sms_log.
  - SMS body: `Olá {primeiro_nome}, a nossa proposta para o seu {marca} {modelo}: https://compramososeueletrico.pt/p/{token} (válida 48h)`
- **`PROPOSED`:** valor + countdown + link copiável + botões `Reenviar SMS` / `Cancelar proposta`.
- **`ACCEPTED`:** *"Cliente aceitou às {hora}, a aguardar marcação."* Link `/proposta/{token}/marcar` (incognito).
- **`SCHEDULED`:** card com booking, botões `Marcar concluído` / `No-show`.
- **Sempre disponível:** `Marcar como perdido` (com motivo).

**Rodapé — Timeline:** events do lead em ordem cronológica reversa, com `sms_log` e `bookings` mesclados, ícones, ator, timestamp humano.

### Job de expiração

Vercel Cron `*/15 * * * *` → `/api/cron/expire-proposals` (gated por `CRON_SECRET`):
```sql
UPDATE proposals SET status='EXPIRED'
WHERE status IN ('SENT','VIEWED') AND expires_at < now()
RETURNING id, lead_id;
```
Para cada: UPDATE `leads.status='EXPIRED'` (só se ainda em `PROPOSED`), INSERT event.

### `/admin/settings`
Horário, local da inspeção, URL Cal.com, mute som por operador. Templates SMS hardcoded no MVP.

### Multi-operador
Inbox partilhado. `sent_by` regista quem propôs. Race condition resolvida pelo unique parcial em `proposals(lead_id) WHERE status IN ('SENT','VIEWED')` — segundo INSERT falha com 23505, UI mostra toast *"Outro operador já enviou."*

---

## 6. Integrações externas

### Twilio

**Env:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (sender alfanumérico `EletricoPT`).

**Wrapper `lib/sms/twilio.ts`:** `sendSms({to, body, leadId, proposalId})` — INSERT `sms_log` (`QUEUED`), chama `client.messages.create({statusCallback: <webhook>})`, guarda `twilio_sid`.

**Webhook `/api/webhooks/twilio`:**
- Valida `X-Twilio-Signature` com `twilio.validateRequest(...)` → 403 se inválido
- Match por `MessageSid`, UPDATE `sms_log.status` para `SENT`/`DELIVERED`/`FAILED`
- `DELIVERED` → INSERT event `SMS_DELIVERED`
- Idempotente: `UPDATE ... WHERE twilio_sid=$1 AND status != $2`

### Cal.com

**Env:** `CALCOM_EVENT_TYPE_LINK` (ex: `compramososeueletrico/inspecao`), `CALCOM_WEBHOOK_SECRET`.

**Embed:** `@calcom/embed-react` com `calLink`, `prefill: {name, email}`, `metadata: {proposalToken}` (crítico para webhook).

**Webhook:** valida HMAC SHA256 do `rawBody` com `crypto.timingSafeEqual`. Match por `metadata.proposalToken`. Idempotente via `UNIQUE(calcom_booking_id)`.

### Resend

**Env:** `RESEND_API_KEY`, `OPERATOR_EMAIL` (CSV no MVP).

Triggers: lead novo, booking criado/cancelado, falha SMS.

### Supabase RLS

- Todas tabelas com RLS ativo, **sem policies SELECT/INSERT públicas**
- API server-side usa `service_role`
- Browser admin usa `anon` com policy `SELECT` condicionada a `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('operator','admin'))`
- Realtime subscription filtra por policy

### Tokens de proposta

- 32 chars URL-safe, ~144 bits entropia (`crypto.randomBytes(24).toString('base64url')`)
- Sem PII no token
- Acesso público (segurança = segredo + expiração)
- Rate-limit 5/min por IP em accept/reject

### `.env`

```
NEXT_PUBLIC_SITE_URL=https://compramososeueletrico.pt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
CALCOM_EVENT_TYPE_LINK=
CALCOM_WEBHOOK_SECRET=
RESEND_API_KEY=
OPERATOR_EMAIL=
CRON_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

---

## 7. RGPD, segurança & conteúdos legais

### Base legal e retenção

| Dado | Base legal | Retenção |
|---|---|---|
| Veículo (matrícula, marca, etc.) | Execução pré-contratual (art. 6º/1/b) | 12 meses após último contacto |
| Nome, telefone, email | Execução pré-contratual | 12 meses |
| IP + UA (eventos) | Interesse legítimo (art. 6º/1/f) | 6 meses |
| SMS log | Interesse legítimo + Twilio | 12 meses |
| Leads convertidos (`COMPLETED`) | Obrigação legal (lei fiscal PT) | 10 anos com anonimização parcial após 12 meses |

### Job de purga

Vercel Cron `0 3 * * *` → `/api/cron/gdpr-purge`:
```sql
DELETE FROM leads
WHERE status IN ('REJECTED','EXPIRED','LOST')
  AND created_at < now() - interval '12 months';
-- cascade: proposals, events, sms_log via FK ON DELETE CASCADE
```
Leads `COMPLETED`: job separado anonimiza email/telefone após 12 meses, mantém matrícula/data/valor 10 anos.

### Direitos do titular

- Email DPO: `dpo@compramososeueletrico.pt`
- `POST /api/admin/leads/[id]/forget` — DELETE + INSERT em `gdpr_deletions` para prova
- Botão *"Apagar dados (RGPD)"* no admin

### Consentimento

Checkbox obrigatório, não pré-marcado:
> ☐ Li e aceito a [política de privacidade](/politica-privacidade) e os [termos](/termos). Os meus dados serão usados exclusivamente para avaliar o veículo e contactar-me com a proposta.

`rgpd_consent_at = now()` no INSERT.

### Cookies

MVP: apenas estritamente necessárias (sessão admin, CSRF). **Sem banner.** Quando adicionar analytics → Plausible (cookieless) ou banner.

### Páginas legais

- `/politica-privacidade` — quem somos, dados, finalidades, base legal, sub-processadores, retenção, direitos, DPO, CNPD
- `/termos` — natureza indicativa, validade 48h, lei portuguesa, foro
- `/cookies` — lista mínima
- `/contacto` — morada, NIF, telefone, email, horário

Footer global em todas as páginas com 4 links + NIF + morada (DL 7/2004).

### Sub-processadores

| Provider | Finalidade | Local |
|---|---|---|
| Vercel | Hosting | UE/EUA (SCC) |
| Supabase | DB, auth, storage | UE (`eu-west-X`) |
| Twilio | SMS | UE/EUA (SCC) |
| Cal.com | Marcação | UE/EUA |
| Resend | Email | UE/EUA |
| Upstash | Rate-limit | UE (`eu-west-1`) |
| Sentry | Errors | UE region |

Crítico: Supabase + Upstash em região **UE**.

### Segurança

- HTTPS forçado, HSTS `max-age=63072000; includeSubDomains; preload`
- CSP estrita em `next.config.js` com whitelist (Cal.com, Supabase, Resend)
- Headers via middleware: `X-Frame-Options: DENY` (exceto rotas com Cal.com), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Cookies admin: `Secure`, `HttpOnly`, `SameSite=Lax`
- CSRF: Server Actions nativas + `Origin` check em `/api/admin/*`
- Rate-limit Upstash:
  - `/api/leads` POST: 3/h por IP
  - `/api/proposals/[token]/accept|reject`: 5/min por IP
  - `/api/admin/*`: 60/min por user
- Logs sem PII (só IDs)
- Renovate semanal para CVEs

### i18n

- Telefone normalizado server-side com `libphonenumber-js`, rejeita não-móveis PT
- Locale `pt-PT` em datas/moeda

---

## 8. Estados, edge cases & erros

### Máquina de estados — `lead`

```
NEW → IN_REVIEW → PROPOSED → ACCEPTED → SCHEDULED → COMPLETED
              \             \           \
               \             → REJECTED  → LOST (no-show, manual)
                \            → EXPIRED
                 → LOST (manual)
```
LOST acessível de qualquer estado (operador manual + `lost_reason`).

### Máquina de estados — `proposal`

```
SENT → VIEWED → ACCEPTED
     \        \  REJECTED
      \        \ EXPIRED (cron)
       \-----> ACCEPTED (defensivo, sem VIEW prévio)
```

Todas as transições com `UPDATE ... WHERE status IN (...) AND expires_at > now()` para race-safety.

### Edge cases

| # | Cenário | Comportamento |
|---|---|---|
| 1 | Mesmo carro 2× em <24h (matrícula+telefone) | Bloqueado por unique parcial. Mostra *"Já recebemos a sua avaliação."* |
| 2 | Cliente submete novo lead com proposta ativa | Permitido; admin mostra badge *"este telefone tem outro lead aberto"* |
| 3 | Aceita mas não marca | Cron diário: SMS nudge após 24h, auto-`LOST` após 7d (motivo `accepted_no_show_booking`) |
| 4 | No-show na inspeção | Operador marca `LOST` manual, motivo `no_show` |
| 5 | Cliente cancela booking Cal.com | Webhook → lead volta a `ACCEPTED`, email operador |
| 6 | Cliente reagenda | Webhook → UPDATE `scheduled_at`, SMS atualizado |
| 7 | Twilio devolve `FAILED` | Banner vermelho no admin, email Resend, botão `Editar telefone & reenviar` |
| 8 | Webhook Twilio duplicado | `UPDATE ... WHERE twilio_sid=$1 AND status != $2` idempotente |
| 9 | Webhook Cal.com perdido | Botão fallback *"Marcar manualmente"* no admin |
| 10 | Cliente abre link 50× | Primeiro: `SENT→VIEWED` + event. Subsequentes: novo event só se >1h do último (anti-spam) |
| 11 | Cliente partilha link | Não distinguimos no MVP. FAQ avisa. Futuro: 2FA SMS na proposta |
| 12 | Accept no exato momento do cron | UPDATE atómico com `WHERE status IN ('SENT','VIEWED') AND expires_at > now()` resolve |
| 13 | Dois operadores enviam simultaneamente | Unique parcial em `proposals(lead_id)`: 23505 → toast *"Outro operador já enviou"* |
| 14 | Realtime falha no admin | Tab refresh resolve. Tolerável. |
| 15 | Cliente quer rever proposta após aceitar | `/proposta/[token]` em `ACCEPTED` → redirect `/marcar` |
| 16 | Pedido RGPD a meio do fluxo | Botão admin DELETE cascata, INSERT `gdpr_deletions`, próxima view → 404 |
| 17 | Form com lixo/spam (bots) | Honeypot + rate-limit. Turnstile só se houver abuse |
| 18 | Sem rede a meio do form | `localStorage` retém estado, oferece *"Continuar onde parou?"* |
| 19 | Cliente sem telemóvel (só fixo) | Validação E.164 móvel. Mensagem *"Apenas aceitamos telemóveis."* |
| 20 | Operador deixa proposta a meio | Não persistido no MVP — volta a preencher |

### Convenção de erros API

Todas as routes devolvem `{ error: { code, message, details? } }` com HTTP apropriado:

| HTTP | code | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod falhou |
| 401 | `UNAUTHENTICATED` | `/api/admin/*` sem sessão |
| 403 | `FORBIDDEN` | Webhook assinatura inválida; role insuficiente |
| 404 | `NOT_FOUND` | Token de proposta inválido |
| 409 | `CONFLICT` | Estado já transicionou; INSERT duplicado |
| 410 | `EXPIRED` | Proposta passou `expires_at` |
| 429 | `RATE_LIMITED` | Header `Retry-After` |
| 500 | `INTERNAL` | Inesperado, log com `requestId`, mensagem genérica |

UI mapeia `code` para mensagens humanas. Falhas externas (Twilio/Cal.com/Resend) são não-fatais para o cliente — só o operador é alertado.

### Logging & observabilidade

- `lib/logger.ts` com `requestId` propagado via `x-request-id`
- Vercel Logs como tier 1
- Sentry para errors em produção (free tier)
- Sem PII em logs

---

## 9. Testes & deploy

### Pirâmide de testes

**Unit (Vitest):**
- `lib/sms/twilio.ts` — render template, normalização E.164
- `lib/proposals/state.ts` — máquina de estados (todas combinações)
- `lib/validation/lead-schema.ts` — Zod (válidos, inválidos, edge)
- `lib/calcom/webhook-verify.ts` — HMAC válido/inválido (constant-time)
- `lib/twilio/webhook-verify.ts` — idem
- `lib/format/{currency,phone,date}.ts` — pt-PT
- `lib/tokens.ts` — geração e formato

**Integration (Vitest + Supabase Docker):**
- `POST /api/leads` — submit completo, dedupe, RGPD, race do unique parcial
- `POST /api/admin/proposals` — gera token, mock Twilio, idempotência, conflict
- `POST /api/proposals/[token]/accept|reject` — estados, expirada→410, já aceite→409
- `/api/webhooks/twilio` — assinatura, idempotência por `MessageSid`
- `/api/webhooks/calcom` — `BOOKING_CREATED|CANCELLED|RESCHEDULED`, sem `proposalToken`, duplicado
- `/api/cron/expire-proposals` — só elegíveis, idempotente
- `/api/cron/gdpr-purge` — só >12 meses em estados terminais

Mocks: **MSW** para Twilio/Cal.com/Resend HTTP. Supabase é real (container).

**E2E (Playwright):**
- Felicidade total: form → proposta enviada → aceitar → embed Cal.com (mock) → confirmação
- Recusar
- Expiração (DB fast-forward + run cron)

### Estrutura

```
/
├── app/
│   ├── (public)/{page.tsx, avaliar/, proposta/[token]/, (legal)/}
│   ├── admin/{layout, page, leads/[id]/, login/, settings/}
│   └── api/{leads/, proposals/[token]/{accept,reject}/, admin/proposals/, webhooks/{twilio,calcom}/, cron/{expire-proposals,gdpr-purge}/}
├── components/{ui/, form/, proposal/, admin/}
├── lib/
│   ├── supabase/{server,client,realtime}.ts
│   ├── sms/twilio.ts
│   ├── email/resend.ts
│   ├── calcom/{embed,webhook-verify}.ts
│   ├── proposals/{state,tokens}.ts
│   ├── validation/lead-schema.ts
│   ├── format/{currency,phone,date}.ts
│   ├── ratelimit.ts
│   └── logger.ts
├── supabase/migrations/
├── tests/{unit,integration,e2e}/
└── .github/workflows/ci.yml
```

### Migrações

Supabase CLI + SQL versionado em `supabase/migrations/<timestamp>_<nome>.sql`. Cada migração transacional. Up-only (correções via novas migrações). CI corre `supabase db reset && supabase db push`.

### CI/CD

GitHub Actions: install → lint → typecheck → unit → start Supabase container → migrações → integration → build → e2e. Verde → Vercel preview deploy automático em PR. Merge `main` → produção.

### Ambientes

| Ambiente | Domínio | DB | Twilio | Cal.com | Cron |
|---|---|---|---|---|---|
| Local | `localhost:3000` | Supabase Docker | test creds | sandbox | manual |
| Preview (PR) | `*.vercel.app` | Supabase preview branch | test | sandbox | off |
| Produção | `compramososeueletrico.pt` | Supabase EU | live | live | on |

### Go-live checklist

- [ ] DNS `compramososeueletrico.pt` → Vercel
- [ ] Twilio sender alfanumérico aprovado para PT, status webhook a apontar para produção
- [ ] Cal.com event type criado, webhook secret configurado
- [ ] Supabase projeto em região UE, migrações aplicadas, profiles dos operadores criados
- [ ] Resend domínio verificado (SPF/DKIM/DMARC)
- [ ] Páginas legais revistas (idealmente por jurista)
- [ ] Sentry DSN no env
- [ ] Vercel Cron `*/15 * * * *` (expirar) e `0 3 * * *` (RGPD purge)
- [ ] Teste end-to-end real com lead próprio antes de divulgar
- [ ] Backup Supabase ligado

### Monitorização & rollback

- Vercel Analytics (Core Web Vitals)
- Sentry (errors)
- Vercel Logs por `requestId`
- Supabase Dashboard (slow queries)
- Rollback Vercel: promote do deploy anterior em ~10s
- Migrações: hotfix com nova migração reverte efeitos

---

## 10. Fora de escopo (pós-MVP)

Listado para alinhamento, **não incluído na primeira implementação**:

1. Fotos no formulário (Supabase Storage)
2. Múltiplos locais físicos (event types Cal.com por local)
3. Atribuição de leads a operadores específicos
4. Dashboard de métricas e conversão
5. Plausible Analytics + banner cookies
6. Notificações push via PWA
7. Templates SMS configuráveis em settings
8. Multi-idioma
9. Persistência de drafts no admin
10. 2FA SMS na proposta (anti-partilha de link)

---

## 11. Resumo de decisões

| Tópico | Decisão |
|---|---|
| Modelo | Wizard of Oz: form parece automático, operador propõe atrás |
| Form | 4 passos, ~12-15 perguntas, EV-specific (SoH, autonomia, carregador) |
| SLA público | 1h em horário comercial (9h-19h, dias úteis) |
| Proposta | 48h, indicativa, accept/reject only, página rica |
| Marcação | Cal.com embed, 1 local |
| Stack | Next.js 15 + TS + Tailwind + shadcn + Supabase + Twilio + Cal.com + Resend, monolito Vercel |
| Auth admin | Supabase magic link, role check via `profiles` |
| Realtime | Supabase Realtime para inbox |
| RGPD | Consent checkbox, 12m retenção, purga automática, botão forget no admin |
| Domínio | compramososeueletrico.pt |
| Operadores | 1-2 no MVP, multi-operador desde dia 1, sem atribuição |
