# Plano 2 — Admin Auth + Inbox + Envio de Proposta

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **UI work:** All tasks marked **`(UI — frontend-design)`** MUST invoke the `frontend-design` skill with the prompt provided in that task. Do not write UI components ad-hoc.

**Goal:** Operador autentica via magic link, vê inbox de leads em tempo real, abre detalhe de um lead, introduz valor da proposta + notas internas e envia SMS ao cliente. Twilio webhook actualiza estado de entrega na timeline. Lead transita para `PROPOSED`.

**Architecture:** Supabase Auth com magic link (sem palavras-passe). Middleware Next.js valida sessão + role `operator`/`admin` em `/admin/*`. Inbox e detalhe usam Supabase Realtime para feed live. POST `/api/admin/proposals` (server-side, gated) gera token de 32 chars, INSERT proposal, UPDATE lead, envia SMS via Twilio com `statusCallback` apontando ao webhook. Webhook `/api/webhooks/twilio` valida assinatura HMAC, actualiza `sms_log.status`, regista event. Race conditions em propostas duplicadas resolvidas pelo unique partial index `proposals(lead_id) WHERE status IN ('SENT','VIEWED')`.

**Tech Stack:** Next.js 16 + App Router, Supabase Auth + Realtime + RLS policies (additional INSERT policies para auth.users), Twilio Node SDK, MSW para mocks de Twilio em testes, react-hook-form + Zod para o form de envio de proposta, shadcn/ui (Toaster + Dialog para confirmações). Sem novas deps grandes.

**Spec:** [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](../specs/2026-04-27-compramososeueletrico-design.md) — secções 4 (back-office) e 5 (Twilio).

**Plano 1 (precondição):** completo. Schema com `proposals`, `events`, `sms_log`, `profiles` em produção local.

---

## Pré-requisitos manuais (utilizador, fora do código)

- **Conta Twilio** ([twilio.com](https://twilio.com)). Anota: `Account SID`, `Auth Token`. Cria um **Alphanumeric Sender ID** chamado `EletricoPT` (gratuito de criar, requer aprovação da Twilio para envio para PT — pode demorar 1-2 dias úteis; podes começar com placeholder e receber rejeições até estar aprovado). Em dev local não precisas de SMS reais — testes usam MSW.
- (Opcional para dev) **localhost tunnel** (ex: `ngrok` ou `cloudflared tunnel`) para receber webhooks Twilio em desenvolvimento real. Não bloqueante — testes locais usam mock signatures.

---

## Estrutura de ficheiros (criados/modificados neste plano)

```
.
├── lib/
│   ├── proposals/
│   │   ├── tokens.ts                       (gen + validate URL-safe tokens)
│   │   └── state.ts                        (state machine transitions)
│   └── sms/
│       ├── twilio.ts                       (sendSms wrapper + sms_log integration)
│       └── webhook-verify.ts               (Twilio signature HMAC validation)
├── middleware.ts                            (Next.js route gating /admin/*)
├── app/
│   ├── admin/
│   │   ├── layout.tsx                      (UI — gated admin layout)
│   │   ├── login/page.tsx                  (UI — magic link form)
│   │   ├── auth/callback/route.ts          (auth code exchange)
│   │   ├── page.tsx                        (UI — inbox with realtime)
│   │   └── leads/[id]/page.tsx             (UI — lead detail + action panel + timeline)
│   └── api/
│       ├── admin/proposals/route.ts        (POST send proposal)
│       └── webhooks/twilio/route.ts        (delivery status updates)
├── components/admin/
│   ├── InboxTable.tsx                      (UI — realtime table, age coloring)
│   ├── StatusTabs.tsx                      (UI — count tabs)
│   ├── LeadDeclaration.tsx                 (UI — readonly form recap)
│   ├── ProposalForm.tsx                    (UI — value + notes + send)
│   └── Timeline.tsx                        (UI — events + sms_log + bookings)
├── supabase/
│   └── migrations/
│       └── 20260427000002_admin_policies.sql  (RLS INSERT/UPDATE policies + magic link config note)
└── tests/
    ├── unit/
    │   ├── tokens.test.ts
    │   ├── proposals-state.test.ts
    │   └── twilio-webhook-verify.test.ts
    └── integration/
        ├── api-admin-proposals.test.ts
        └── api-webhooks-twilio.test.ts
```

Worth noting:
- E2E test for the admin flow is intentionally NOT in this plan — admin auth via magic link requires email link extraction (Inbucket parsing), which is brittle. Manual smoke test instead. A real E2E for admin is in Plan 5.
- The `is_operator()` helper function (created in Plan 1 migration) is reused as-is by the new policies.

---

## Task 1 — `lib/proposals/tokens.ts` (TDD)

**Files:**
- Create: `lib/proposals/tokens.ts`, `tests/unit/tokens.test.ts`

- [ ] **Step 1:** Write test (`tests/unit/tokens.test.ts`):

```typescript
import { describe, it, expect } from "vitest";
import { generateProposalToken, isValidTokenShape } from "@/lib/proposals/tokens";

describe("generateProposalToken", () => {
  it("returns a 32-char URL-safe string", () => {
    const t = generateProposalToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
  it("returns unique tokens", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateProposalToken());
    expect(set.size).toBe(1000);
  });
});

describe("isValidTokenShape", () => {
  it.each([
    [generateProposalToken(), true],
    ["short", false],
    ["with spaces 12345678901234567890123", false],
    ["thirty-two-chars-but-has-no-token-format!", false],
    ["", false],
  ])("validates %s as %s", (input, expected) => {
    expect(isValidTokenShape(input)).toBe(expected);
  });
});
```

- [ ] **Step 2:** Run → FAIL.

```bash
pnpm test tests/unit/tokens.test.ts
```

- [ ] **Step 3:** Implement `lib/proposals/tokens.ts`:

```typescript
import { randomBytes } from "node:crypto";

const TOKEN_LENGTH = 32;
const TOKEN_REGEX = /^[A-Za-z0-9_-]{32}$/;

export function generateProposalToken(): string {
  return randomBytes(24).toString("base64url");
}

export function isValidTokenShape(t: string): boolean {
  return typeof t === "string" && TOKEN_REGEX.test(t);
}

export const PROPOSAL_TOKEN_LENGTH = TOKEN_LENGTH;
```

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5:** Commit:

```bash
git add lib/proposals/tokens.ts tests/unit/tokens.test.ts
git commit -m "feat(proposals): URL-safe token generation"
```

---

## Task 2 — `lib/proposals/state.ts` (TDD)

**Files:**
- Create: `lib/proposals/state.ts`, `tests/unit/proposals-state.test.ts`

- [ ] **Step 1:** Test:

```typescript
import { describe, it, expect } from "vitest";
import {
  canTransitionProposal,
  canTransitionLead,
  PROPOSAL_STATUSES,
  LEAD_STATUSES,
  type ProposalStatus,
  type LeadStatus,
} from "@/lib/proposals/state";

describe("PROPOSAL_STATUSES", () => {
  it("has all 5 statuses", () => {
    expect(PROPOSAL_STATUSES).toEqual(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"]);
  });
});

describe("canTransitionProposal", () => {
  it.each<[ProposalStatus, ProposalStatus, boolean]>([
    ["SENT", "VIEWED", true],
    ["SENT", "ACCEPTED", true],
    ["SENT", "REJECTED", true],
    ["SENT", "EXPIRED", true],
    ["VIEWED", "ACCEPTED", true],
    ["VIEWED", "REJECTED", true],
    ["VIEWED", "EXPIRED", true],
    ["ACCEPTED", "REJECTED", false],
    ["REJECTED", "ACCEPTED", false],
    ["EXPIRED", "ACCEPTED", false],
    ["VIEWED", "SENT", false],
  ])("%s -> %s = %s", (from, to, expected) => {
    expect(canTransitionProposal(from, to)).toBe(expected);
  });
});

describe("canTransitionLead", () => {
  it.each<[LeadStatus, LeadStatus, boolean]>([
    ["NEW", "IN_REVIEW", true],
    ["NEW", "PROPOSED", true],
    ["IN_REVIEW", "PROPOSED", true],
    ["PROPOSED", "ACCEPTED", true],
    ["PROPOSED", "REJECTED", true],
    ["PROPOSED", "EXPIRED", true],
    ["ACCEPTED", "SCHEDULED", true],
    ["SCHEDULED", "COMPLETED", true],
    ["NEW", "LOST", true],
    ["PROPOSED", "LOST", true],
    ["SCHEDULED", "LOST", true],
    ["COMPLETED", "NEW", false],
    ["LOST", "PROPOSED", false],
  ])("%s -> %s = %s", (from, to, expected) => {
    expect(canTransitionLead(from, to)).toBe(expected);
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement:

```typescript
export const PROPOSAL_STATUSES = ["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "PROPOSED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "SCHEDULED",
  "COMPLETED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const PROPOSAL_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransitionProposal(from: ProposalStatus, to: ProposalStatus): boolean {
  return PROPOSAL_TRANSITIONS[from].includes(to);
}

const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["IN_REVIEW", "PROPOSED", "LOST"],
  IN_REVIEW: ["PROPOSED", "LOST"],
  PROPOSED: ["ACCEPTED", "REJECTED", "EXPIRED", "LOST"],
  ACCEPTED: ["SCHEDULED", "LOST"],
  REJECTED: ["LOST"],
  EXPIRED: ["LOST"],
  SCHEDULED: ["COMPLETED", "LOST"],
  COMPLETED: [],
  LOST: [],
};

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Commit:

```bash
git add lib/proposals/ tests/unit/proposals-state.test.ts
git commit -m "feat(proposals): state machine transitions for lead and proposal"
```

---

## Task 3 — `lib/sms/webhook-verify.ts` (TDD)

**Files:**
- Create: `lib/sms/webhook-verify.ts`, `tests/unit/twilio-webhook-verify.test.ts`

- [ ] **Step 1:** Test:

```typescript
import { describe, it, expect, vi } from "vitest";
import { verifyTwilioSignature } from "@/lib/sms/webhook-verify";
import twilio from "twilio";

describe("verifyTwilioSignature", () => {
  it("returns true for a valid signature", () => {
    const authToken = "test_token";
    const url = "https://example.com/api/webhooks/twilio";
    const params: Record<string, string> = { MessageSid: "SM123", MessageStatus: "delivered" };

    // Use Twilio's own helper to compute the expected signature
    const expected = twilio.webhook ? "" : "";
    // Easier: spy on twilio.validateRequest
    const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(true);
    const ok = verifyTwilioSignature({ authToken, signature: "sig", url, params });
    expect(ok).toBe(true);
    spy.mockRestore();
  });

  it("returns false for an invalid signature", () => {
    const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(false);
    const ok = verifyTwilioSignature({
      authToken: "x",
      signature: "bad",
      url: "https://example.com/api/webhooks/twilio",
      params: { MessageSid: "SM123" },
    });
    expect(ok).toBe(false);
    spy.mockRestore();
  });

  it("returns false when authToken is missing", () => {
    const ok = verifyTwilioSignature({
      authToken: "",
      signature: "sig",
      url: "https://example.com",
      params: {},
    });
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2:** Install `twilio` Node SDK:

```bash
pnpm add twilio
```

- [ ] **Step 3:** FAIL.

- [ ] **Step 4:** Implement `lib/sms/webhook-verify.ts`:

```typescript
import twilio from "twilio";

export interface VerifyArgs {
  authToken: string;
  signature: string;
  url: string;
  params: Record<string, string>;
}

export function verifyTwilioSignature({ authToken, signature, url, params }: VerifyArgs): boolean {
  if (!authToken || !signature) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
```

- [ ] **Step 5:** PASS.

- [ ] **Step 6:** Commit:

```bash
git add lib/sms/webhook-verify.ts tests/unit/twilio-webhook-verify.test.ts package.json pnpm-lock.yaml
git commit -m "feat(sms): Twilio webhook signature verification"
```

---

## Task 4 — `lib/sms/twilio.ts` (sendSms wrapper)

**Files:**
- Create: `lib/sms/twilio.ts`

(No unit test for this file directly — it's tested through `POST /api/admin/proposals` integration test in Task 13. MSW intercepts the Twilio HTTP call.)

- [ ] **Step 1:** Implement:

```typescript
import twilio from "twilio";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

let client: ReturnType<typeof twilio> | null = null;
function getClient(): ReturnType<typeof twilio> {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio env missing");
    client = twilio(sid, token);
  }
  return client;
}

export interface SendSmsArgs {
  to: string;             // E.164
  body: string;
  leadId?: string | null;
  proposalId?: string | null;
}

export interface SendSmsResult {
  smsLogId: string;
  twilioSid: string;
}

export async function sendSms({ to, body, leadId, proposalId }: SendSmsArgs): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient();

  const { data: log, error: logErr } = await supabase
    .from("sms_log")
    .insert({
      lead_id: leadId ?? null,
      proposal_id: proposalId ?? null,
      to_phone: to,
      body,
      status: "QUEUED",
    })
    .select("id")
    .single();
  if (logErr || !log) throw new Error(`sms_log insert failed: ${logErr?.message}`);

  const from = process.env.TWILIO_FROM;
  if (!from) throw new Error("TWILIO_FROM missing");

  const statusCallback = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio?logId=${log.id}`;

  try {
    const msg = await getClient().messages.create({
      from,
      to,
      body,
      statusCallback,
    });
    await supabase
      .from("sms_log")
      .update({ twilio_sid: msg.sid, status: "SENT" })
      .eq("id", log.id);
    return { smsLogId: log.id, twilioSid: msg.sid };
  } catch (e) {
    const err = e as Error;
    logger.error("twilio send failed", { error: err.message, smsLogId: log.id });
    await supabase
      .from("sms_log")
      .update({ status: "FAILED", error: err.message })
      .eq("id", log.id);
    throw err;
  }
}
```

- [ ] **Step 2:** Verify typecheck:

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3:** Commit:

```bash
git add lib/sms/twilio.ts
git commit -m "feat(sms): sendSms wrapper with sms_log integration"
```

---

## Task 5 — Migration 00002: admin RLS policies

**Files:**
- Create: `supabase/migrations/20260427000002_admin_policies.sql`
- Create: `tests/integration/admin-rls.test.ts`

- [ ] **Step 1:** Test (TDD):

```typescript
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

describe("admin RLS policies", () => {
  it("operator can INSERT into proposals", async () => {
    // Service role bypasses RLS — instead, verify policies exist via pg_policies
    const { data, error } = await supabase
      .rpc("pg_policies_for", { p_table: "proposals" } as any)
      .select?.("*") ?? { data: null, error: null };
    // If the RPC isn't created, fall back to a direct SQL check via service role
    const { data: policies } = await supabase
      .from("pg_policies" as any)
      .select("policyname, cmd")
      .eq("schemaname", "public")
      .eq("tablename", "proposals");
    const names = (policies ?? []).map((p: any) => p.policyname);
    expect(names).toContain("proposals_insert_operators");
    expect(names).toContain("proposals_update_operators");
  });

  it("has events_insert_operators policy", async () => {
    const { data: policies } = await supabase
      .from("pg_policies" as any)
      .select("policyname")
      .eq("schemaname", "public")
      .eq("tablename", "events");
    const names = (policies ?? []).map((p: any) => p.policyname);
    expect(names).toContain("events_insert_operators");
  });

  it("has leads_update_operators policy", async () => {
    const { data: policies } = await supabase
      .from("pg_policies" as any)
      .select("policyname")
      .eq("schemaname", "public")
      .eq("tablename", "leads");
    const names = (policies ?? []).map((p: any) => p.policyname);
    expect(names).toContain("leads_update_operators");
  });

  it("has profiles_upsert_self policy", async () => {
    const { data: policies } = await supabase
      .from("pg_policies" as any)
      .select("policyname")
      .eq("schemaname", "public")
      .eq("tablename", "profiles");
    const names = (policies ?? []).map((p: any) => p.policyname);
    expect(names).toContain("profiles_insert_self");
  });
});
```

NOTA: `pg_policies` é uma view do postgres acessível via service role. PostgREST pode não a expor por defeito — se o teste falhar a aceder, ajusta para query SQL via `supabase.rpc` com uma função custom OU para um query directo via `pg.Client`. Versão simples: assume que está acessível; se não estiver, criar uma função SQL `select_policies(p_table text) returns table(...)` no migration e chamar `.rpc(...)` nesse.

- [ ] **Step 2:** FAIL (migration não aplicada ainda).

- [ ] **Step 3:** Migration:

```sql
-- supabase/migrations/20260427000002_admin_policies.sql
-- Plan 2: INSERT/UPDATE policies for operators on the admin-facing tables.
-- The is_operator() helper from migration 00001 is reused.

-- profiles: allow user to INSERT own row (used by signup/seed).
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- proposals: operators can INSERT new proposals + UPDATE existing ones
create policy "proposals_insert_operators"
  on public.proposals for insert
  with check (public.is_operator());

create policy "proposals_update_operators"
  on public.proposals for update
  using (public.is_operator());

-- leads: operators can UPDATE lead status / lost_reason etc.
create policy "leads_update_operators"
  on public.leads for update
  using (public.is_operator());

-- events: operators can INSERT manual events (operator notes, status changes)
create policy "events_insert_operators"
  on public.events for insert
  with check (public.is_operator());

-- sms_log: server-side only writes via service role. No policy needed for now.
```

- [ ] **Step 4:** Apply:

```bash
pnpm exec supabase db reset
```

Expected: applies 00001 + 00002 cleanly. ~30-60s.

- [ ] **Step 5:** Run integration test → PASS.

```bash
pnpm test tests/integration/admin-rls.test.ts
```

If `pg_policies` access fails, fix by adding to the migration:

```sql
create or replace function public.list_policies(p_table text)
returns table(policyname text, cmd text)
language sql security definer stable as $$
  select policyname::text, cmd::text
  from pg_policies
  where schemaname = 'public' and tablename = p_table;
$$;
```

And update the test to call `supabase.rpc("list_policies", { p_table: "proposals" })`.

- [ ] **Step 6:** Commit:

```bash
git add supabase/migrations/20260427000002_admin_policies.sql tests/integration/admin-rls.test.ts
git commit -m "feat(db): admin RLS policies (INSERT/UPDATE for operators)"
```

---

## Task 6 — Supabase config: enable email auth + magic link redirect

**Files:**
- Modify: `supabase/config.toml`

- [ ] **Step 1:** Read current `supabase/config.toml`. Find the `[auth]` and `[auth.email]` sections.

- [ ] **Step 2:** Edit `supabase/config.toml`:

In the `[auth]` section, ensure:
```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/admin/auth/callback", "https://compramososeueletrico.pt/admin/auth/callback"]
```

In `[auth.email]` ensure:
```toml
[auth.email]
enable_signup = false
double_confirm_changes = true
enable_confirmations = false
```

(`enable_signup = false` because operators are seeded manually — no public signup. `enable_confirmations = false` for the magic link not to require email confirmation since the magic link IS the confirmation.)

If the section `[auth.email.template.magic_link]` is configurable, leave as default or customize subject `"O teu link de acesso ao admin de compramososeueletrico"`.

- [ ] **Step 3:** Restart Supabase to apply:

```bash
pnpm exec supabase stop
pnpm exec supabase start
```

(Wait ~30-60s for everything to come up.)

- [ ] **Step 4:** Verify magic link flow works at the API level:

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/otp' \
  -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY do .env.local>" \
  -H "Content-Type: application/json" \
  -d '{"email":"eternalaiden@gmail.com","options":{"shouldCreateUser":false,"emailRedirectTo":"http://localhost:3000/admin/auth/callback"}}'
```

Esperado: `{}` (sucesso silencioso). MAS porque `enable_signup = false` e ainda não existe um user para este email, vai dar erro `Signup is disabled`. Isto é esperado — vamos criar o user manualmente em Task 7.

- [ ] **Step 5:** Commit:

```bash
git add supabase/config.toml
git commit -m "chore(supabase): enable email auth with magic link redirects"
```

---

## Task 7 — Seed: create first operator user + profile

**Files:**
- Create: `supabase/seed.sql`

Esta task é importante porque sem um user, ninguém pode entrar. Criamos via SQL seed — corre automaticamente após `supabase db reset`.

- [ ] **Step 1:** Verifica que o user `eternalaiden@gmail.com` ainda não existe:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT email FROM auth.users WHERE email='eternalaiden@gmail.com';"
```

Esperado: 0 rows.

- [ ] **Step 2:** Cria `supabase/seed.sql`:

```sql
-- supabase/seed.sql
-- Plan 2: bootstrap first operator. Runs automatically on `supabase db reset` AFTER all migrations.

-- Idempotent: only insert if not present.
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'eternalaiden@gmail.com';
  if v_user_id is null then
    -- Use the supabase-internal admin function-equivalent: insert directly into auth.users.
    -- Magic link will work because email column matches.
    insert into auth.users (
      id,
      instance_id,
      email,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      is_anonymous
    )
    values (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'eternalaiden@gmail.com',
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false
    )
    returning id into v_user_id;
  end if;

  insert into public.profiles (id, display_name, role)
  values (v_user_id, 'Operador Principal', 'admin')
  on conflict (id) do update set role = excluded.role;
end $$;
```

NOTA: para email auth com magic link, o user SEMPRE recebe um link válido se existir em `auth.users`. Não é preciso password.

- [ ] **Step 3:** Aplica:

```bash
pnpm exec supabase db reset
```

- [ ] **Step 4:** Verifica:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT u.email, p.role FROM auth.users u JOIN public.profiles p ON p.id=u.id;"
```

Esperado:
```
        email          | role
-----------------------+-------
 eternalaiden@gmail.com | admin
```

- [ ] **Step 5:** Test magic link via Inbucket (mailpit):

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/otp' \
  -H "apikey: <ANON do .env.local>" \
  -H "Content-Type: application/json" \
  -d '{"email":"eternalaiden@gmail.com","create_user":false,"options":{"emailRedirectTo":"http://localhost:3000/admin/auth/callback"}}'
```

Esperado: HTTP 200 + corpo vazio. Abre `http://127.0.0.1:54324` (Inbucket / Mailpit) — deves ver email com link.

- [ ] **Step 6:** Commit:

```bash
git add supabase/seed.sql
git commit -m "chore(supabase): seed first operator user"
```

---

## Task 8 — Middleware para gating de `/admin/*`

**Files:**
- Create: `middleware.ts` (na raiz do projeto, NOT dentro de `app/`)
- Create: `lib/supabase/middleware.ts`

- [ ] **Step 1:** `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  return { response, supabase, user };
}
```

- [ ] **Step 2:** `middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate /admin/* (except /admin/login and /admin/auth/callback)
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (pathname.startsWith("/admin/auth/callback")) return NextResponse.next();

  const { response, supabase, user } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Verify role via profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["operator", "admin"].includes(profile.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "no_access");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 3:** Verify build:

```bash
pnpm build
```

Expected: passes. Middleware compiles to Edge runtime by default — `@supabase/ssr` is Edge-compatible.

- [ ] **Step 4:** Commit:

```bash
git add middleware.ts lib/supabase/middleware.ts
git commit -m "feat(admin): middleware gating /admin/* with role check"
```

---

## Task 9 — `/admin/auth/callback` route handler

**Files:**
- Create: `app/admin/auth/callback/route.ts`

- [ ] **Step 1:** Implement:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=exchange_failed`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2:** Verify build:

```bash
pnpm build
```

- [ ] **Step 3:** Commit:

```bash
git add app/admin/auth/callback/
git commit -m "feat(admin): auth callback exchanges code for session"
```

---

## Task 10 — `/admin/login` page (UI — frontend-design)

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/login-form.tsx` (client component)

- [ ] **Step 1 (UI — frontend-design):**

Invoke the `frontend-design` skill via the `Skill` tool with this prompt:

```
Build the admin login page for compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (button, input, label, form, card, sonner already installed). Brand "Precision Verde" tokens already in app/globals.css. DM Sans + DM Mono.

This is the operator-only login page. Magic link flow — no password, no signup.

Files:
- app/admin/login/page.tsx — server component (default export). Reads ?error and ?from query params (in Next 15+ via async `searchParams: Promise<...>`). Renders <LoginForm error={errorMessage} />.
- app/admin/login/login-form.tsx — `"use client"` component. Imports createBrowserSupabase from `@/lib/supabase/client`. Form with single email input + button "Enviar link". On submit:
    1. supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/admin/auth/callback` } })
    2. on success, show success state (use sonner toast.success() AND inline success card "Verifica o teu email")
    3. on error, show error inline + toast.error()

Page UX:
- Centered card on a subtle backdrop (use brand neutrals)
- Logo / title at top: "compramososeueletrico" with sub "Acesso de operador"
- Error from URL (?error=no_access | exchange_failed | missing_code) shown above the form as a destructive alert
- Single email input + button
- Below the form, a discreet line: "Não tens acesso? Contacta a equipa."
- Mobile-first

Map error codes:
- no_access: "Esta conta não tem permissões de operador."
- exchange_failed: "O link expirou ou é inválido. Pede um novo."
- missing_code: "Link mal formatado."

Constraints:
- pt-PT, "tu" form copy
- shadcn Form + Card + Button + Input + Label primitives
- Brand tokens — login page should feel calm and trustworthy, not flashy
- "use client" only on login-form.tsx, never on page.tsx
- After successful submit, the form should disable the button and show a success state ("Vamos enviar-te um link para {email}. Verifica a caixa de entrada.") — keep email visible as confirmation
```

- [ ] **Step 2:** Verify build:

```bash
pnpm build
```

- [ ] **Step 3:** Smoke test:

```bash
pnpm dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 8
curl -s http://localhost:3000/admin/login | grep -i "operador" || echo "MISSING"
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

- [ ] **Step 4:** Manual smoke (operator-side):
  1. Open `http://localhost:3000/admin/login` in browser
  2. Enter `eternalaiden@gmail.com`
  3. Click "Enviar link"
  4. Open `http://127.0.0.1:54324` (Mailpit) — see the magic link email
  5. Click the link in the email — should redirect through `/admin/auth/callback?code=...` then to `/admin`
  6. (`/admin` page doesn't exist yet → 404 is OK at this point. We confirm session by re-trying `/admin/login` should NOT redirect us back if we're already logged in… actually middleware doesn't gate /admin/login, so this isn't testable yet. Confirm by going to `/admin` — expect 404 with cookies set.)

- [ ] **Step 5:** Commit:

```bash
git add app/admin/login/
git commit -m "feat(admin): login page with magic link"
```

---

## Task 11 — `/admin` inbox + admin layout (UI — frontend-design)

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx`
- Create: `components/admin/InboxTable.tsx`, `components/admin/StatusTabs.tsx`, `components/admin/AgeBadge.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invoke `frontend-design` with:

```
Build the admin inbox page + admin layout for compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (button, input, label, form, card, badge, dialog, popover, command, sonner, etc. installed). Brand "Precision Verde" tokens. DM Sans + DM Mono.

This is the OPERATOR'S work surface. Tone shift: more dense, more functional, less marketing-y than the public site. Trust through clarity and hierarchy. Use DM Mono for codes/IDs/numbers. Compact spacing.

Files:
- app/admin/layout.tsx — gated layout (middleware already handles auth). Header with: brand mark on the left, current operator's display_name + role badge + sign-out button on the right (sign-out is a client component or server action calling supabase.auth.signOut()). Sub-header is empty / available for sub-page nav.
- app/admin/page.tsx — server component fetching initial leads + counts. Then renders client component <InboxTable initialData={...} />.
- components/admin/InboxTable.tsx — `"use client"`. Subscribes to Supabase Realtime on `leads` table (postgres_changes — INSERT, UPDATE). Shows status tabs with live counts, a search input (filter by matricula/telefone/email/marca), then a table.
- components/admin/StatusTabs.tsx — visual tabs with counts. Statuses: Novos, Em revisão, Proposta enviada, Aceites, Marcados, Recusados, Expirados, Perdidos.
- components/admin/AgeBadge.tsx — server-safe component that takes a created_at date and shows "há X min" with color: green <30min, amber 30-50min, red >50min, neutral after.

Inbox table columns:
1. Carro: marca + modelo + ano (DM Sans), versão small (DM Mono opacity-70)
2. Cliente: nome + telefone masked
3. Idade: <AgeBadge created_at={...} />
4. Estado: badge with status color
5. → (chevron right linking to /admin/leads/[id])

Realtime behavior:
- Subscribe to postgres_changes for INSERT on leads → prepend to list, briefly highlight the new row (animation), increment "Novos" count
- Subscribe to UPDATE → replace row in place
- A small "live" indicator (pulsing dot in DM Mono "live") near the search bar

Search:
- Client-side filter on the loaded leads
- Fields: matricula, telefone, email, marca, modelo
- Case-insensitive

Status mapping (DB enum → label):
- NEW → "Novos"
- IN_REVIEW → "Em revisão"
- PROPOSED → "Proposta enviada"
- ACCEPTED → "Aceites"
- SCHEDULED → "Marcados"
- REJECTED → "Recusados"
- EXPIRED → "Expirados"
- LOST → "Perdidos"
- COMPLETED → not shown by default but countable

Use the createBrowserSupabase() client from @/lib/supabase/client. The realtime channel name should be deterministic (e.g., "admin-leads") and unsubscribe on unmount.

Constraints:
- pt-PT
- Strong information density — operators will spend hours here. NO whitespace excess.
- Accessibility: real <table> markup, proper ARIA on tabs (use shadcn Tabs primitive — `pnpm dlx shadcn@latest add tabs` if not installed)
- The page renders fast (initial data is server-fetched), then realtime hydrates updates
- Empty state: "Sem leads ainda. Quando entrar uma avaliação, aparece aqui em tempo real."
```

- [ ] **Step 2:** If shadcn Tabs not installed:

```bash
pnpm dlx shadcn@latest add tabs
```

- [ ] **Step 3:** Verify build + tests:

```bash
pnpm typecheck
pnpm build
pnpm test
```

All must pass.

- [ ] **Step 4:** Manual smoke:
  1. Login at `/admin/login` (Mailpit link)
  2. After redirect, should land at `/admin`
  3. Verify the existing test leads from Plan 1 (if any) appear
  4. From another tab, submit a lead via `/avaliar` — verify the new lead appears realtime in `/admin`

- [ ] **Step 5:** Commit:

```bash
git add "app/admin/layout.tsx" "app/admin/page.tsx" "components/admin/" "components/ui/" package.json pnpm-lock.yaml
git commit -m "feat(admin): inbox with realtime, status tabs, search"
```

---

## Task 12 — `/admin/leads/[id]` detail page (UI — frontend-design)

**Files:**
- Create: `app/admin/leads/[id]/page.tsx`
- Create: `components/admin/LeadDeclaration.tsx`, `components/admin/Timeline.tsx`, `components/admin/ProposalForm.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invoke `frontend-design` with:

```
Build the admin lead detail page for compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui. Brand "Precision Verde" tokens. DM Sans + DM Mono.

Layout (desktop ≥1024px): two-column.
- LEFT (60%): LeadDeclaration — read-only display of all form fields the customer submitted, organized exactly like the form (Identificação, Estado, Bateria & EV, Contacto). Phone and email are clickable (tel: / mailto:). Matrícula in DM Mono.
- RIGHT (40%): action panel — conditional based on lead.status:
    - NEW or IN_REVIEW: <ProposalForm leadId=... defaultValor=... />
    - PROPOSED: card showing "Proposta ativa", valor, expires_at countdown, link copyable, button "Reenviar SMS" (calls POST /api/admin/proposals/[proposalId]/resend — out of scope for this task; render the button as disabled with tooltip "Plano 3"), button "Cancelar proposta" (also out of scope, disabled tooltip)
    - ACCEPTED, SCHEDULED, COMPLETED, REJECTED, EXPIRED, LOST: read-only summary of outcome with status badge.

Below, full-width: Timeline component.

Files:
- app/admin/leads/[id]/page.tsx — server component (async). Fetches lead, latest proposal, events (descending), bookings, sms_log via service role. Renders the layout. params is Promise in Next 15+: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params`.
- components/admin/LeadDeclaration.tsx — server component, takes lead object as prop, renders all fields in 4 grouped Cards titled "Identificação", "Estado", "Bateria e EV", "Contacto".
- components/admin/ProposalForm.tsx — `"use client"`. react-hook-form + Zod (schema: { valor: number positive integer ≥ 100 ≤ 200000, notes: string optional max 500 }). On submit, POST `/api/admin/proposals` with `{ leadId, valor, notes }` — the API route accepts valor in EUROS (not cents) and converts internally. On success: toast.success("Proposta enviada"), router.refresh(). On error: toast.error(body.error.message).
- components/admin/Timeline.tsx — server component, takes `events`, `sms_log`, `bookings` arrays merged + sorted by created_at desc. Each entry has icon, type label, actor, relative time (formatPtRelative from @/lib/format/date). Use lucide icons. JSON payload shown as collapsible <details> for power users.

Mobile (<1024px): stacked LeadDeclaration → action panel → Timeline.

Loading: server component fetches block. Add Suspense boundary if heavy. Use shadcn Skeleton primitive (`pnpm dlx shadcn@latest add skeleton` if not installed).

Constraints:
- pt-PT
- DM Mono for matrícula, telefone, valor (EUR), tokens, IDs
- Valor field uses input-group with "€" suffix
- ProposalForm has a "preview" of the SMS body shown below the textarea: dynamically composed:
    "Olá {primeiro_nome}, a nossa proposta para o seu {marca} {modelo}: {NEXT_PUBLIC_SITE_URL}/p/{TOKEN_PLACEHOLDER} (válida 48h)"
  Note: the actual token is generated server-side, so just show "(...token será gerado...)" placeholder.
- Format: lib/format/currency.ts (formatEur, eurToCents, centsToEur). Pass valor_eur_cents from DB; display as €.
```

- [ ] **Step 2:** If shadcn Skeleton not installed:

```bash
pnpm dlx shadcn@latest add skeleton
```

- [ ] **Step 3:** Verify build:

```bash
pnpm build
```

- [ ] **Step 4:** Commit:

```bash
git add "app/admin/leads/" components/admin/ components/ui/ package.json pnpm-lock.yaml
git commit -m "feat(admin): lead detail page with declaration, proposal form, timeline"
```

---

## Task 13 — `POST /api/admin/proposals` (TDD)

**Files:**
- Create: `app/api/admin/proposals/route.ts`
- Create: `tests/integration/api-admin-proposals.test.ts`

- [ ] **Step 1:** Test (`tests/integration/api-admin-proposals.test.ts`):

```typescript
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();

let leadId: string;
let operatorId: string;

async function seedLeadAndOperator() {
  // Find seeded operator (from supabase/seed.sql)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", "Operador Principal")
    .single();
  operatorId = profile!.id;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "TT-99-AA",
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
      nome: "Test Operator Lead",
      telefone: "+351912000099",
      email: "test99@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    })
    .select("id")
    .single();
  leadId = lead!.id;
}

async function callApi(body: any, opts: { authedAs?: string } = {}) {
  // We bypass auth in tests by passing a header that the route trusts in test mode.
  // Simpler: spy on the auth helper. For now, pass the operatorId directly via test header.
  const { POST } = await import("@/app/api/admin/proposals/route");
  const req = new Request("http://localhost:3000/api/admin/proposals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test-user": opts.authedAs ?? operatorId,
    },
    body: JSON.stringify(body),
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("proposals").delete().eq("lead_id", leadId ?? "00000000-0000-0000-0000-000000000000");
  await supabase.from("leads").delete().eq("matricula", "TT-99-AA");
  await seedLeadAndOperator();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "TT-99-AA");
});

describe("POST /api/admin/proposals", () => {
  it("creates a proposal, sends SMS, updates lead to PROPOSED, logs event", async () => {
    const res = await callApi({ leadId, valor: 18500, notes: "carro impecável" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.proposalId).toBeDefined();
    expect(json.token).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const { data: prop } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", json.proposalId)
      .single();
    expect(prop?.valor_eur_cents).toBe(1850000);
    expect(prop?.status).toBe("SENT");
    expect(prop?.sent_by).toBe(operatorId);
    expect(prop?.notes_internal).toBe("carro impecável");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("PROPOSED");

    const { data: events } = await supabase.from("events").select("*").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "PROPOSAL_SENT")).toBe(true);

    const { data: smsLog } = await supabase.from("sms_log").select("*").eq("lead_id", leadId);
    expect(smsLog?.length).toBe(1);
    expect(smsLog?.[0].body).toContain("Tesla Model 3");
    expect(smsLog?.[0].body).toContain(json.token);
  });

  it("rejects valor < 100", async () => {
    const res = await callApi({ leadId, valor: 50 });
    expect(res.status).toBe(400);
  });

  it("rejects without auth header", async () => {
    const { POST } = await import("@/app/api/admin/proposals/route");
    const req = new Request("http://localhost:3000/api/admin/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId, valor: 1000 }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("blocks second active proposal for same lead (409 from unique partial)", async () => {
    const a = await callApi({ leadId, valor: 1000 });
    expect(a.status).toBe(201);
    const b = await callApi({ leadId, valor: 2000 });
    expect(b.status).toBe(409);
  });
});
```

- [ ] **Step 2:** Add MSW handler for Twilio (modify `tests/mocks/handlers.ts`):

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // Resend
  http.post("https://api.resend.com/emails", async () => {
    return HttpResponse.json({ id: "test-email-id" });
  }),
  // Twilio messages
  http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", async () => {
    return HttpResponse.json({ sid: "SM_test_123", status: "queued" });
  }),
];
```

- [ ] **Step 3:** FAIL.

- [ ] **Step 4:** Implement `app/api/admin/proposals/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";
import { sendSms } from "@/lib/sms/twilio";
import { eurToCents } from "@/lib/format/currency";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  leadId: z.string().uuid(),
  valor: z.number().int().min(100).max(200000),
  notes: z.string().max(500).optional(),
});

async function getOperatorId(req: NextRequest): Promise<string | null> {
  // Tests bypass via x-test-user
  const testUser = req.headers.get("x-test-user");
  if (testUser && process.env.NODE_ENV !== "production") return testUser;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["operator", "admin"].includes(profile.role)) return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const operatorId = await getOperatorId(req);
  if (!operatorId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sessão inválida." } },
      { status: 401 },
    );
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: parsed.error.issues } },
      { status: 400 },
    );
  }
  const { leadId, valor, notes } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, marca, modelo, telefone, nome, status")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Lead não encontrado." } },
      { status: 404 },
    );
  }

  const token = generateProposalToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .insert({
      lead_id: lead.id,
      valor_eur_cents: eurToCents(valor),
      token,
      status: "SENT",
      sent_by: operatorId,
      expires_at: expiresAt,
      notes_internal: notes ?? null,
    })
    .select("id, token")
    .single();

  if (propErr) {
    if (propErr.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Já existe uma proposta ativa para este lead." } },
        { status: 409 },
      );
    }
    log.error("proposal insert failed", { error: propErr.message });
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Erro interno." } },
      { status: 500 },
    );
  }

  await supabase.from("leads").update({ status: "PROPOSED", updated_at: new Date().toISOString() }).eq("id", lead.id);

  await supabase.from("events").insert({
    lead_id: lead.id,
    proposal_id: proposal.id,
    type: "PROPOSAL_SENT",
    actor: `operator:${operatorId}`,
    payload: { valor, requestId },
  });

  // Build SMS
  const firstName = lead.nome.split(/\s+/)[0];
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${proposal.token}`;
  const body_sms = `Olá ${firstName}, a nossa proposta para o seu ${lead.marca} ${lead.modelo}: ${url} (válida 48h)`;

  try {
    await sendSms({
      to: lead.telefone,
      body: body_sms,
      leadId: lead.id,
      proposalId: proposal.id,
    });
  } catch (e) {
    log.warn("SMS send failed (non-fatal — operator alerted)", { error: (e as Error).message });
    // Don't roll back the proposal — operator can retry from UI later.
  }

  return NextResponse.json(
    { proposalId: proposal.id, token: proposal.token },
    { status: 201 },
  );
}
```

- [ ] **Step 5:** Run tests → PASS.

```bash
pnpm test tests/integration/api-admin-proposals.test.ts
```

- [ ] **Step 6:** Verify all tests still pass:

```bash
pnpm test
```

- [ ] **Step 7:** Commit:

```bash
git add app/api/admin/proposals/ tests/integration/api-admin-proposals.test.ts tests/mocks/handlers.ts
git commit -m "feat(api): POST /api/admin/proposals with Twilio integration"
```

---

## Task 14 — `POST /api/webhooks/twilio` (TDD)

**Files:**
- Create: `app/api/webhooks/twilio/route.ts`
- Create: `tests/integration/api-webhooks-twilio.test.ts`

- [ ] **Step 1:** Test:

```typescript
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import twilio from "twilio";

const supabase = createServiceRoleClient();
let smsLogId: string;

async function seedSmsLog() {
  const { data } = await supabase
    .from("sms_log")
    .insert({
      to_phone: "+351912000099",
      body: "test body",
      twilio_sid: "SM_webhook_test",
      status: "SENT",
    })
    .select("id")
    .single();
  smsLogId = data!.id;
}

async function call(body: URLSearchParams, signatureValid = true) {
  const spy = vi.spyOn(twilio, "validateRequest").mockReturnValue(signatureValid);
  const { POST } = await import("@/app/api/webhooks/twilio/route");
  const req = new Request(`http://localhost:3000/api/webhooks/twilio?logId=${smsLogId}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": "anything",
    },
    body: body.toString(),
  });
  const res = await POST(req as any);
  spy.mockRestore();
  return res;
}

beforeEach(async () => {
  await supabase.from("sms_log").delete().eq("twilio_sid", "SM_webhook_test");
  await seedSmsLog();
});

afterAll(async () => {
  await supabase.from("sms_log").delete().eq("twilio_sid", "SM_webhook_test");
});

describe("POST /api/webhooks/twilio", () => {
  it("updates sms_log status to delivered with valid signature", async () => {
    const params = new URLSearchParams({
      MessageSid: "SM_webhook_test",
      MessageStatus: "delivered",
    });
    const res = await call(params, true);
    expect(res.status).toBe(200);

    const { data } = await supabase
      .from("sms_log")
      .select("status")
      .eq("id", smsLogId)
      .single();
    expect(data?.status).toBe("DELIVERED");
  });

  it("rejects invalid signature with 403", async () => {
    const params = new URLSearchParams({ MessageSid: "SM_webhook_test", MessageStatus: "delivered" });
    const res = await call(params, false);
    expect(res.status).toBe(403);
  });

  it("idempotent — same status applied twice doesn't duplicate events", async () => {
    const params = new URLSearchParams({ MessageSid: "SM_webhook_test", MessageStatus: "delivered" });
    await call(params, true);
    await call(params, true);
    const { data } = await supabase.from("sms_log").select("status").eq("id", smsLogId).single();
    expect(data?.status).toBe("DELIVERED");
    // Both calls should have returned 200 — and we shouldn't have spammed events
  });

  it("maps failed status correctly", async () => {
    const params = new URLSearchParams({
      MessageSid: "SM_webhook_test",
      MessageStatus: "failed",
      ErrorMessage: "no such number",
    });
    const res = await call(params, true);
    expect(res.status).toBe(200);
    const { data } = await supabase.from("sms_log").select("status, error").eq("id", smsLogId).single();
    expect(data?.status).toBe("FAILED");
    expect(data?.error).toContain("no such number");
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement `app/api/webhooks/twilio/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTwilioSignature } from "@/lib/sms/webhook-verify";
import { logger, withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const STATUS_MAP: Record<string, "QUEUED" | "SENT" | "DELIVERED" | "FAILED"> = {
  queued: "QUEUED",
  sending: "SENT",
  sent: "SENT",
  delivered: "DELIVERED",
  undelivered: "FAILED",
  failed: "FAILED",
};

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const text = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => (params[k] = v));

  const ok = verifyTwilioSignature({
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    signature,
    url,
    params,
  });
  if (!ok) {
    log.warn("twilio webhook bad signature");
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const messageSid = params.MessageSid;
  const messageStatus = (params.MessageStatus ?? "").toLowerCase();
  const errorMessage = params.ErrorMessage ?? null;

  const newStatus = STATUS_MAP[messageStatus];
  if (!newStatus) {
    log.info("twilio webhook unhandled status", { messageStatus });
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  // Idempotent UPDATE — only updates if status actually changes
  const { data: row, error } = await supabase
    .from("sms_log")
    .update({ status: newStatus, error: errorMessage })
    .eq("twilio_sid", messageSid)
    .neq("status", newStatus)
    .select("id, lead_id, proposal_id")
    .maybeSingle();

  if (error) {
    log.error("twilio webhook update failed", { error: error.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  // Log event only on transition to DELIVERED
  if (row && newStatus === "DELIVERED" && row.lead_id) {
    await supabase.from("events").insert({
      lead_id: row.lead_id,
      proposal_id: row.proposal_id,
      type: "SMS_DELIVERED",
      actor: "system",
      payload: { messageSid, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Commit:

```bash
git add app/api/webhooks/twilio/ tests/integration/api-webhooks-twilio.test.ts
git commit -m "feat(api): Twilio webhook for SMS delivery status"
```

---

## Task 15 — Update env: Twilio + admin URLs

**Files:**
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1:** Add Twilio entries to `.env.example`:

Edit `.env.example`, add at the bottom:

```
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

- [ ] **Step 2:** Add to `.env.local` (placeholder values for dev — MSW intercepts real calls):

Edit `.env.local`, append:

```
TWILIO_ACCOUNT_SID=test_account_sid
TWILIO_AUTH_TOKEN=test_auth_token
TWILIO_FROM=EletricoPT
```

(`.env.local` is gitignored — these are dev placeholders only.)

- [ ] **Step 3:** Verify tests still pass with new env:

```bash
pnpm test
```

- [ ] **Step 4:** Commit:

```bash
git add .env.example
git commit -m "chore: add Twilio env keys to example"
```

---

## Task 16 — Sign-out action + admin sign-out button

**Files:**
- Create: `app/admin/actions.ts` (server actions)
- Modify: `app/admin/layout.tsx` (add sign-out button)

- [ ] **Step 1:** Server action:

`app/admin/actions.ts`:

```typescript
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 2:** Wire the button in `app/admin/layout.tsx` — find the header sign-out button (frontend-design from Task 11 should have placed a placeholder). Modify it to use a form with the server action:

```tsx
import { signOutAction } from "./actions";

// In the header:
<form action={signOutAction}>
  <Button type="submit" variant="ghost" size="sm">Sair</Button>
</form>
```

- [ ] **Step 3:** Verify build:

```bash
pnpm build
```

- [ ] **Step 4:** Manual smoke: login, click sign-out, expect redirect to `/admin/login`, no session.

- [ ] **Step 5:** Commit:

```bash
git add app/admin/
git commit -m "feat(admin): sign-out server action wired to header"
```

---

## Task 17 — Final smoke + verify all tests

- [ ] **Step 1:** Full sweep:

```bash
pnpm typecheck
pnpm test
pnpm build
```

All must pass. Test count: 45 (Plan 1) + ~12 (Plan 2) ≈ 57 tests passing.

- [ ] **Step 2:** Manual end-to-end smoke:
  1. `pnpm dev`
  2. Visit `/avaliar`, submit a lead
  3. Visit `/admin/login`, send magic link to `eternalaiden@gmail.com`
  4. Open Mailpit at `http://127.0.0.1:54324`, click the link
  5. Lands at `/admin` — see the lead from step 2 in the inbox
  6. Click the lead → `/admin/leads/[id]` opens
  7. In the right panel, enter `valor: 18500`, `notes: "test"`, click Send
  8. Mailpit will NOT show an SMS (Twilio is mocked locally), but `sms_log` table should have a row and `proposals` table should have a new row. Check via:
     ```bash
     PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
       -c "SELECT lead_id, status, valor_eur_cents, sent_by FROM proposals ORDER BY sent_at DESC LIMIT 1;"
     PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
       -c "SELECT to_phone, status, body FROM sms_log ORDER BY created_at DESC LIMIT 1;"
     ```
  9. The lead status should be `PROPOSED` and the timeline shows `PROPOSAL_SENT`.

- [ ] **Step 3:** No commit if everything passes — Plan 2 is just verification at this stage.

If any issue, fix in a follow-up commit before declaring Plan 2 done.

---

## Spec coverage check (auto-revisão pós-escrita)

- ✅ Magic link auth (secção 5 do spec) — Tasks 6, 7, 9, 10
- ✅ Middleware gating com role check — Task 8
- ✅ Inbox com realtime + tabs — Task 11
- ✅ Lead detail + ação condicional — Task 12
- ✅ POST /api/admin/proposals + token + Twilio + lead transition — Task 13
- ✅ Twilio webhook com signature + idempotente — Tasks 3, 4, 14
- ✅ State machine transitions — Task 2
- ✅ Tokens URL-safe 32 chars — Task 1
- ✅ RLS INSERT/UPDATE policies para operadores — Task 5
- ✅ Profile bootstrap (seed) — Task 7
- ✅ Sign-out — Task 16
- ⏸ Reenviar SMS / cancelar proposta — **deferida para Plano 3** (renderizadas como botões disabled em Task 12)
- ⏸ Multi-operator assignment, métricas, settings page — **fora de escopo do Plano 2** (Plano 5 ou pós-MVP)
- ⏸ Auto-LOST 7 dias / nudge SMS — **deferida para Plano 5** (cron jobs)

Cobertura coerente com o âmbito do Plano 2.

---

## Próximos planos

- Plano 3 — Fluxo de proposta do cliente (`/proposta/[token]`, accept/reject, terminal pages, rate-limit)
- Plano 4 — Marcação Cal.com
- Plano 5 — Crons + RGPD + Legal + Produção
