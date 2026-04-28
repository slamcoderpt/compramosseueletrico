# Plano 5 — Crons + RGPD + Legal + Produção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **UI work:** All tasks marked **`(UI — frontend-design)`** MUST invoke the `frontend-design` skill with the prompt provided in that task. Do not write UI components ad-hoc.

**Goal:** Tornar a plataforma pronta para produção. Crons automáticos (expirar propostas, GDPR purge, nudge para marcação, auto-LOST), endpoint admin RGPD forget, páginas legais (privacidade, termos, cookies, contacto), security headers (CSP/HSTS/etc.), Sentry para erros em produção, fix do test flake, e checklist final de go-live.

**Architecture:** Vercel Cron Jobs configurados em `vercel.json` chamam endpoints `/api/cron/*` gated por `CRON_SECRET` no header `Authorization: Bearer ...`. Crons são idempotentes — re-run não duplica eventos nem altera estado já consolidado. RGPD purge usa `DELETE FROM leads WHERE ... AND created_at < now() - interval '12 months'` que faz cascade via FK. Forget endpoint apaga lead específico + escreve audit em `gdpr_deletions`. Security headers aplicados via `headers()` em `next.config.ts` site-wide. Sentry inicializado server-side com DSN — skip gracioso quando env vazia.

**Tech Stack:** `@sentry/nextjs` (errors), Vercel Cron (config), shadcn AlertDialog (forget confirmation). Sem novas tabelas — schema do Plano 1 já tem `gdpr_deletions`.

**Spec:** [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](../specs/2026-04-27-compramososeueletrico-design.md) — secções 6 (RGPD), 7 (segurança/legal), 8 (edge cases) + go-live checklist.

**Plano 4 (precondição):** completo. Todas as tabelas, fluxos e webhooks operacionais.

---

## Pré-requisitos manuais

Para go-live (não bloqueantes para Plano 5 dev local):
- **Sentry** — conta gratuita em [sentry.io](https://sentry.io). Cria projeto Next.js. Anota o DSN.
- **Vercel** — conta + projeto importado do GitHub. Configurar env vars (Production / Preview / Development) com todos os valores.
- **Domínio** `compramososeueletrico.pt` — comprar e apontar DNS para Vercel.
- **Resend** — verificar domínio (DKIM/SPF/DMARC).
- **Twilio** — alphanumeric sender `EletricoPT` aprovado para PT (pode levar 1-2 dias úteis).
- **Cal.com** — webhook URL apontado para `https://compramososeueletrico.pt/api/webhooks/calcom`.

Em dev: tudo mockado/skip-vazio funciona.

---

## Estrutura de ficheiros

```
.
├── vercel.json                                        (cron config)
├── next.config.ts                                     (modify: security headers)
├── sentry.server.config.ts                            (Sentry init)
├── sentry.client.config.ts                            (Sentry init client)
├── instrumentation.ts                                 (Sentry instrumentation hook)
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   ├── expire-proposals/route.ts
│   │   │   ├── gdpr-purge/route.ts
│   │   │   └── nudge-bookings/route.ts
│   │   └── admin/leads/[id]/forget/route.ts
│   └── (legal)/
│       ├── politica-privacidade/page.tsx              (UI)
│       ├── termos/page.tsx                            (UI)
│       ├── cookies/page.tsx                           (UI)
│       └── contacto/page.tsx                          (UI)
├── components/admin/
│   └── ForgetButton.tsx                               (UI — RGPD delete dialog)
├── docs/
│   └── go-live-checklist.md                           (final reference)
├── vitest.config.ts                                   (modify: integration serial)
└── tests/
    └── integration/
        ├── api-cron-expire.test.ts
        ├── api-cron-gdpr-purge.test.ts
        ├── api-cron-nudge.test.ts
        └── api-admin-forget.test.ts
```

---

## Task 1 — Vercel Cron config + CRON_SECRET env

**Files:**
- Create: `vercel.json`
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1:** `vercel.json` na raiz:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-proposals",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/nudge-bookings",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/gdpr-purge",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Schedules: expirar a cada 15 min; nudge diário às 10h; GDPR purge diário às 3h.

- [ ] **Step 2:** Adicionar `CRON_SECRET` ao `.env.example` (commited):

```
# Cron jobs (Vercel Cron uses bearer token auth)
CRON_SECRET=
```

- [ ] **Step 3:** Adicionar ao `.env.local` (NÃO committed):

```
CRON_SECRET=test_cron_secret_local_dev_only
```

- [ ] **Step 4:** Verificar typecheck:

```bash
pnpm typecheck 2>&1 | tail -3
```

- [ ] **Step 5:** Commit:

```bash
git add vercel.json .env.example
git commit -m "chore: Vercel Cron schedules + CRON_SECRET env"
git log --oneline -1
```

---

## Task 2 — `POST /api/cron/expire-proposals` (TDD)

A cada 15 min, marca propostas SENT/VIEWED com `expires_at < now()` como EXPIRED. Atualiza lead status PROPOSED → EXPIRED. Idempotente.

**Files:**
- Create: `app/api/cron/expire-proposals/route.ts`, `tests/integration/api-cron-expire.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-cron-expire.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();

let leadIds: string[] = [];

async function seedExpired() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "EX-PI-01",
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
      nome: "Expire Test",
      telefone: "+351912000111",
      email: "expire@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "PROPOSED",
    })
    .select("id")
    .single();
  leadIds.push(lead!.id);

  await supabase
    .from("proposals")
    .insert({
      lead_id: lead!.id,
      valor_eur_cents: 1000000,
      token: generateProposalToken(),
      status: "SENT",
      sent_at: new Date(Date.now() - 50 * 60 * 60_000).toISOString(),
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
}

async function call(opts: { authValid?: boolean } = {}) {
  const { GET } = await import("@/app/api/cron/expire-proposals/route");
  const headers: Record<string, string> = {};
  if (opts.authValid !== false) headers["authorization"] = `Bearer ${SECRET}`;
  const req = new Request("http://localhost:3000/api/cron/expire-proposals", {
    method: "GET",
    headers,
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIds) await supabase.from("leads").delete().eq("id", id);
  leadIds = [];
  await seedExpired();
});

afterAll(async () => {
  for (const id of leadIds) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/expire-proposals", () => {
  it("expires proposals with expires_at < now(), updates lead", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.expired).toBeGreaterThanOrEqual(1);

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadIds[0]).single();
    expect(lead?.status).toBe("EXPIRED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadIds[0]);
    expect(events?.some((e) => e.type === "PROPOSAL_EXPIRED")).toBe(true);
  });

  it("rejects without bearer token (401)", async () => {
    const res = await call({ authValid: false });
    expect(res.status).toBe(401);
  });

  it("idempotent — second run doesn't re-expire", async () => {
    await call();
    const res2 = await call();
    expect(res2.status).toBe(200);
    const json = await res2.json();
    expect(json.expired).toBe(0);
  });
});
```

- [ ] **Step 2:** FAIL.

```bash
pnpm test tests/integration/api-cron-expire.test.ts 2>&1 | tail -10
```

- [ ] **Step 3:** Implement `app/api/cron/expire-proposals/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) return false;
  return auth === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // Find expired proposals still in SENT/VIEWED
  const { data: expiring, error: selErr } = await supabase
    .from("proposals")
    .select("id, lead_id")
    .in("status", ["SENT", "VIEWED"])
    .lt("expires_at", now);

  if (selErr) {
    log.error("expire-proposals select failed", { error: selErr.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  if (!expiring || expiring.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  const ids = expiring.map((p) => p.id);

  await supabase
    .from("proposals")
    .update({ status: "EXPIRED" })
    .in("id", ids);

  // Update leads from PROPOSED → EXPIRED (only those still PROPOSED)
  const leadIds = expiring.map((p) => p.lead_id);
  await supabase
    .from("leads")
    .update({ status: "EXPIRED", updated_at: now })
    .in("id", leadIds)
    .eq("status", "PROPOSED");

  // Log events
  const events = expiring.map((p) => ({
    lead_id: p.lead_id,
    proposal_id: p.id,
    type: "PROPOSAL_EXPIRED",
    actor: "system",
    payload: { requestId, expiredAt: now },
  }));
  await supabase.from("events").insert(events);

  log.info("expire-proposals batch", { count: expiring.length });
  return NextResponse.json({ ok: true, expired: expiring.length });
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Commit:

```bash
git add app/api/cron/expire-proposals/ tests/integration/api-cron-expire.test.ts
git commit -m "feat(api): cron to expire proposals every 15min"
git log --oneline -1
```

---

## Task 3 — `POST /api/cron/gdpr-purge` (TDD)

Diário às 3h. Apaga leads em estados terminais com >12 meses. Cascade automático para proposals/events/sms_log via FK ON DELETE CASCADE.

**Files:**
- Create: `app/api/cron/gdpr-purge/route.ts`, `tests/integration/api-cron-gdpr-purge.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-cron-gdpr-purge.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();
let leadIdsToDelete: string[] = [];

async function seed() {
  // Old REJECTED (>12 months) — should be purged
  const oldDate = new Date();
  oldDate.setMonth(oldDate.getMonth() - 13);

  const { data: oldLead } = await supabase
    .from("leads")
    .insert({
      matricula: "OL-PG-01",
      marca: "Renault",
      modelo: "Zoe",
      ano: 2018,
      km: 100000,
      num_donos_anteriores: 2,
      estado_geral: "RAZOAVEL",
      sinistros: "NUNCA",
      livro_manutencao: false,
      bateria_soh_pct: 75,
      autonomia_real_km: 150,
      carregador_incluido: true,
      nome: "Old Rejected",
      telefone: "+351912000222",
      email: "old@test.com",
      rgpd_consent_at: oldDate.toISOString(),
      status: "REJECTED",
      created_at: oldDate.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(oldLead!.id);

  // Recent COMPLETED — should NOT be purged (10y retention)
  const { data: completedLead } = await supabase
    .from("leads")
    .insert({
      matricula: "RE-CP-01",
      marca: "Tesla",
      modelo: "Model Y",
      ano: 2023,
      km: 5000,
      num_donos_anteriores: 1,
      estado_geral: "OPTIMO",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 99,
      autonomia_real_km: 500,
      carregador_incluido: true,
      nome: "Completed Recent",
      telefone: "+351912000333",
      email: "completed@test.com",
      rgpd_consent_at: oldDate.toISOString(),
      status: "COMPLETED",
      created_at: oldDate.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(completedLead!.id);

  // Recent NEW — should NOT be purged
  const { data: recent } = await supabase
    .from("leads")
    .insert({
      matricula: "RC-NW-01",
      marca: "Nissan",
      modelo: "Leaf",
      ano: 2021,
      km: 40000,
      num_donos_anteriores: 1,
      estado_geral: "BOM",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 90,
      autonomia_real_km: 250,
      carregador_incluido: true,
      nome: "Recent New",
      telefone: "+351912000444",
      email: "recent@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "NEW",
    })
    .select("id")
    .single();
  leadIdsToDelete.push(recent!.id);
}

async function call(opts: { authValid?: boolean } = {}) {
  const { GET } = await import("@/app/api/cron/gdpr-purge/route");
  const headers: Record<string, string> = {};
  if (opts.authValid !== false) headers["authorization"] = `Bearer ${SECRET}`;
  const req = new Request("http://localhost:3000/api/cron/gdpr-purge", {
    method: "GET",
    headers,
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
  leadIdsToDelete = [];
  await seed();
});

afterAll(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/gdpr-purge", () => {
  it("deletes old REJECTED/EXPIRED/LOST leads", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.purged).toBeGreaterThanOrEqual(1);

    const { data: old } = await supabase.from("leads").select("id").eq("matricula", "OL-PG-01").maybeSingle();
    expect(old).toBeNull();
  });

  it("preserves COMPLETED leads even if old (10y retention)", async () => {
    await call();
    const { data: completed } = await supabase.from("leads").select("id").eq("matricula", "RE-CP-01").maybeSingle();
    expect(completed).not.toBeNull();
  });

  it("preserves recent leads", async () => {
    await call();
    const { data: recent } = await supabase.from("leads").select("id").eq("matricula", "RC-NW-01").maybeSingle();
    expect(recent).not.toBeNull();
  });

  it("rejects without bearer token", async () => {
    const res = await call({ authValid: false });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement `app/api/cron/gdpr-purge/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) return false;
  return auth === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);
  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const cutoffIso = cutoff.toISOString();

  const { data: deleted, error } = await supabase
    .from("leads")
    .delete()
    .in("status", ["REJECTED", "EXPIRED", "LOST"])
    .lt("created_at", cutoffIso)
    .select("id");

  if (error) {
    log.error("gdpr-purge delete failed", { error: error.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  const purged = deleted?.length ?? 0;
  log.info("gdpr-purge complete", { purged, cutoff: cutoffIso });
  return NextResponse.json({ ok: true, purged });
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Commit:

```bash
git add app/api/cron/gdpr-purge/ tests/integration/api-cron-gdpr-purge.test.ts
git commit -m "feat(api): cron GDPR purge of old terminal leads (>12 months)"
git log --oneline -1
```

---

## Task 4 — `POST /api/cron/nudge-bookings` (TDD)

Diário. Para leads ACCEPTED há mais de 24h sem booking → SMS nudge. Para leads ACCEPTED há mais de 7 dias sem booking → auto-LOST.

**Files:**
- Create: `app/api/cron/nudge-bookings/route.ts`, `tests/integration/api-cron-nudge.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-cron-nudge.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_cron_secret_local_dev_only";
process.env.CRON_SECRET = SECRET;

const supabase = createServiceRoleClient();
let leadIdsToDelete: string[] = [];

async function seedAcceptedNoBooking(opts: { hoursAgo: number; matricula: string }) {
  const acceptedAt = new Date(Date.now() - opts.hoursAgo * 60 * 60_000);
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: opts.matricula,
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
      nome: "Nudge Test",
      telefone: "+351912000555",
      email: "nudge@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "ACCEPTED",
      updated_at: acceptedAt.toISOString(),
    })
    .select("id")
    .single();
  leadIdsToDelete.push(lead!.id);

  await supabase.from("proposals").insert({
    lead_id: lead!.id,
    valor_eur_cents: 1500000,
    token: generateProposalToken(),
    status: "ACCEPTED",
    sent_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    accepted_at: acceptedAt.toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
  });

  return lead!.id;
}

async function call() {
  const { GET } = await import("@/app/api/cron/nudge-bookings/route");
  const req = new Request("http://localhost:3000/api/cron/nudge-bookings", {
    method: "GET",
    headers: { authorization: `Bearer ${SECRET}` },
  });
  return GET(req as any);
}

beforeEach(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
  leadIdsToDelete = [];
});

afterAll(async () => {
  for (const id of leadIdsToDelete) await supabase.from("leads").delete().eq("id", id);
});

describe("GET /api/cron/nudge-bookings", () => {
  it("nudges leads ACCEPTED >24h without booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 30, matricula: "ND-30-AA" });

    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nudged).toBeGreaterThanOrEqual(1);

    const { data: smsLog } = await supabase.from("sms_log").select("*").eq("lead_id", id);
    expect(smsLog?.length).toBeGreaterThanOrEqual(1);
  });

  it("auto-LOSTs leads ACCEPTED >7d without booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 8 * 24, matricula: "ND-8D-AA" });

    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.lost).toBeGreaterThanOrEqual(1);

    const { data: lead } = await supabase.from("leads").select("status, lost_reason").eq("id", id).single();
    expect(lead?.status).toBe("LOST");
    expect(lead?.lost_reason).toBe("accepted_no_show_booking");
  });

  it("ignores leads with booking", async () => {
    const id = await seedAcceptedNoBooking({ hoursAgo: 30, matricula: "ND-WB-AA" });
    const { data: prop } = await supabase.from("proposals").select("id").eq("lead_id", id).single();
    await supabase.from("bookings").insert({
      proposal_id: prop!.id,
      calcom_booking_id: `nudge_test_${Date.now()}`,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      status: "CONFIRMED",
    });

    const res = await call();
    const { data: lead } = await supabase.from("leads").select("status").eq("id", id).single();
    expect(lead?.status).toBe("ACCEPTED");
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement:

```typescript
// app/api/cron/nudge-bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms/twilio";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET) return false;
  return auth === expected;
}

const NUDGE_AFTER_HOURS = 24;
const LOST_AFTER_DAYS = 7;

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);
  const supabase = createServiceRoleClient();
  const now = Date.now();

  // Fetch ACCEPTED leads without bookings
  const { data: acceptedLeads } = await supabase
    .from("leads")
    .select("id, nome, telefone, marca, modelo, updated_at, proposals:proposals!proposals_lead_id_fkey(id, token, status), bookings:bookings(id)")
    .eq("status", "ACCEPTED");

  let nudged = 0;
  let lost = 0;

  for (const lead of acceptedLeads ?? []) {
    // Skip if has any booking already
    const hasBooking = ((lead as any).bookings ?? []).length > 0;
    if (hasBooking) continue;

    const acceptedMs = new Date(lead.updated_at).getTime();
    const ageHours = (now - acceptedMs) / (60 * 60_000);
    const ageDays = ageHours / 24;

    if (ageDays >= LOST_AFTER_DAYS) {
      // Auto-LOST
      await supabase
        .from("leads")
        .update({ status: "LOST", lost_reason: "accepted_no_show_booking" })
        .eq("id", lead.id);
      const proposals = (lead as any).proposals ?? [];
      const proposalId = proposals.length > 0 ? proposals[0].id : null;
      await supabase.from("events").insert({
        lead_id: lead.id,
        proposal_id: proposalId,
        type: "STATUS_CHANGED",
        actor: "system",
        payload: { from: "ACCEPTED", to: "LOST", reason: "accepted_no_show_booking", requestId },
      });
      lost++;
      continue;
    }

    if (ageHours >= NUDGE_AFTER_HOURS) {
      // Check if already nudged in last 24h (events of type SMS_DELIVERED with payload nudge=true)
      const { data: recentNudge } = await supabase
        .from("events")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("type", "OPERATOR_NOTE")
        .gte("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
        .limit(1);
      if (recentNudge && recentNudge.length > 0) continue;

      const proposals = (lead as any).proposals ?? [];
      const proposalId = proposals.length > 0 ? proposals[0].id : null;
      const token = proposals.length > 0 ? proposals[0].token : null;

      if (token) {
        const firstName = (lead.nome ?? "").split(/\s+/)[0];
        const url = `${process.env.NEXT_PUBLIC_SITE_URL}/proposta/${token}/marcar`;
        const body = `Olá ${firstName}, falta marcares a visita ao nosso local para finalizar a venda do ${lead.marca} ${lead.modelo}. Marca aqui: ${url}`;
        try {
          await sendSms({
            to: lead.telefone,
            body,
            leadId: lead.id,
            proposalId,
          });
          await supabase.from("events").insert({
            lead_id: lead.id,
            proposal_id: proposalId,
            type: "OPERATOR_NOTE",
            actor: "system",
            payload: { kind: "nudge_booking", requestId },
          });
          nudged++;
        } catch (e) {
          log.warn("nudge SMS failed (non-fatal)", { error: (e as Error).message });
        }
      }
    }
  }

  log.info("nudge-bookings batch", { nudged, lost });
  return NextResponse.json({ ok: true, nudged, lost });
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5:** Commit:

```bash
git add app/api/cron/nudge-bookings/ tests/integration/api-cron-nudge.test.ts
git commit -m "feat(api): cron nudge-bookings (24h SMS, 7d auto-LOST)"
git log --oneline -1
```

---

## Task 5 — `POST /api/admin/leads/[id]/forget` + admin button (UI — frontend-design)

RGPD: apaga lead + audit em `gdpr_deletions`.

**Files:**
- Create: `app/api/admin/leads/[id]/forget/route.ts`, `tests/integration/api-admin-forget.test.ts`
- Create: `components/admin/ForgetButton.tsx`
- Modify: `app/admin/leads/[id]/page.tsx` (add button at bottom)

- [ ] **Step 1:** Integration test:

```typescript
// tests/integration/api-admin-forget.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabase = createServiceRoleClient();
let leadId: string;
let operatorId: string;

async function seed() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", "Operador Principal")
    .single();
  operatorId = profile!.id;

  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "FG-PT-01",
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
      nome: "Forget Test",
      telefone: "+351912000666",
      email: "forget@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "REJECTED",
    })
    .select("id")
    .single();
  leadId = lead!.id;
}

async function call(opts: { authedAs?: string | null; reason?: string } = {}) {
  const { POST } = await import("@/app/api/admin/leads/[id]/forget/route");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.authedAs !== null) headers["x-test-user"] = opts.authedAs ?? operatorId;

  const req = new Request(`http://localhost:3000/api/admin/leads/${leadId}/forget`, {
    method: "POST",
    headers,
    body: JSON.stringify({ reason: opts.reason ?? "user_request" }),
  });
  return POST(req as any, { params: Promise.resolve({ id: leadId }) } as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "FG-PT-01");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "FG-PT-01");
});

describe("POST /api/admin/leads/[id]/forget", () => {
  it("deletes lead and writes gdpr_deletions audit row", async () => {
    const res = await call({ reason: "customer_request" });
    expect(res.status).toBe(200);

    const { data: lead } = await supabase.from("leads").select("id").eq("id", leadId).maybeSingle();
    expect(lead).toBeNull();

    const { data: audit } = await supabase
      .from("gdpr_deletions")
      .select("*")
      .eq("deleted_lead_id", leadId)
      .single();
    expect(audit?.reason).toBe("customer_request");
    expect(audit?.deleted_by).toBe(operatorId);
  });

  it("rejects without auth", async () => {
    const res = await call({ authedAs: null });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Implement `app/api/admin/leads/[id]/forget/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { withRequestId } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().max(200).optional(),
});

async function getOperatorId(req: NextRequest): Promise<string | null> {
  const testUser = req.headers.get("x-test-user");
  if (testUser && process.env.NODE_ENV !== "production") return testUser;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceRoleClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["operator", "admin"].includes(profile.role)) return null;
  return user.id;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const operatorId = await getOperatorId(req);
  if (!operatorId) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const { id: leadId } = await params;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {}
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
  }
  const reason = parsed.data.reason ?? "operator_initiated";

  const supabase = createServiceRoleClient();

  // Audit BEFORE delete (preserve operator ID + reason even if cascade wipes the lead)
  await supabase.from("gdpr_deletions").insert({
    deleted_lead_id: leadId,
    reason,
    deleted_by: operatorId,
  });

  const { error: delErr } = await supabase.from("leads").delete().eq("id", leadId);
  if (delErr) {
    log.error("forget lead delete failed", { error: delErr.message, leadId });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  log.info("lead forgotten via RGPD", { leadId, operatorId, reason });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4:** PASS.

- [ ] **Step 5 (UI — frontend-design):** Create `components/admin/ForgetButton.tsx` and wire it.

Invoke `frontend-design` skill via Skill tool with this prompt:

```
Build a "Apagar dados (RGPD)" button + confirmation dialog for the admin lead detail page of compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (button, alert-dialog, input, label installed). Brand "Precision Verde". Admin uses dark chrome.

File to create: components/admin/ForgetButton.tsx

Props:
- leadId: string
- onForgotten?: () => void

Behavior:
- "use client" component
- Renders a destructive variant button labelled "Apagar dados (RGPD)" with a Trash2 icon (lucide-react). Discreet — placed at the bottom of the lead detail page, NOT prominent.
- On click, opens shadcn AlertDialog with:
    - Title: "Apagar dados deste lead?"
    - Description: "Vais apagar permanentemente todos os dados deste lead (formulário, propostas, eventos, SMS log). Fica registado no audit log de RGPD com a razão fornecida. Esta ação não pode ser desfeita."
    - Input field labelled "Razão (obrigatória)" — required, textbox or short input, max 200 chars. Examples placeholder: "ex: pedido do titular dos dados"
    - Cancel button + "Confirmar eliminação" button (destructive variant). Confirm disabled until reason has at least 3 chars.
- On confirm:
    - POST `/api/admin/leads/${leadId}/forget` with `{ reason }`
    - On success (200): close dialog, call `onForgotten?.()` if provided. Use `router.replace('/admin')` to navigate back to inbox.
    - On error: toast.error("Falhou apagar — vê os logs").

Then ALSO modify: app/admin/leads/[id]/page.tsx
- Add `<ForgetButton leadId={lead.id} />` to the bottom of the page, after the Timeline section. Wrap it in a small section with a discreet header "Zona de risco" and a horizontal divider above. The button should be visually separate from the rest of the page so it doesn't get clicked by accident.

Constraints:
- pt-PT
- "Apagar dados (RGPD)" is destructive — clear consequences in the dialog
- Use shadcn AlertDialog (already installed) + Input + Label + Button
- Brand-conscious — destructive variant should still feel professional, not punishing
- Form-style: pressing Enter in the reason field should NOT submit (require explicit click on Confirmar — guard against accidental submit)

Files to create/modify:
- components/admin/ForgetButton.tsx
- app/admin/leads/[id]/page.tsx
```

- [ ] **Step 6:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 7:** Run tests:

```bash
pnpm test tests/integration/api-admin-forget.test.ts 2>&1 | tail -5
pnpm test 2>&1 | tail -3
```

- [ ] **Step 8:** Commit:

```bash
git add app/api/admin/leads/ components/admin/ "app/admin/leads/" tests/integration/api-admin-forget.test.ts
git commit -m "feat(admin): RGPD forget endpoint + button in lead detail"
git log --oneline -1
```

---

## Task 6 — Páginas legais (UI — frontend-design batch)

**Files:**
- Create: `app/(public)/politica-privacidade/page.tsx`, `app/(public)/termos/page.tsx`, `app/(public)/cookies/page.tsx`, `app/(public)/contacto/page.tsx`

- [ ] **Step 1 (UI — frontend-design):**

Invoke `frontend-design` skill with this prompt:

```
Build FOUR static legal/info pages for compramososeueletrico (Portugal-based EV-buying platform).

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (card, button, separator, accordion installed). Brand "Precision Verde" — primary teal `oklch(0.48 0.13 185)`. DM Sans + DM Mono. Public layout already wraps these (header + footer).

All four pages are SERVER components with no client interactivity. Each page exports `metadata` with title + description in pt-PT.

CONTENT GUIDELINES:
- pt-PT, formal but accessible (NOT lawyer-speak; conversational legal that real Portuguese consumers can read).
- Use "tu" form for user-facing pages, "v.exa." NOT used. Mix of "tu" (consumer-facing parts) and impersonal third-person where it's specifically legal.
- Real-but-placeholder identifying info: empresa "Compramos o Seu Elétrico, Lda.", NIF "999 999 999", morada "Rua Exemplo 123, 1000-000 Lisboa", DPO email "dpo@compramososeueletrico.pt".
- Reference Portuguese authorities where appropriate (CNPD for RGPD complaints).

File 1: app/(public)/politica-privacidade/page.tsx
- Title: "Política de Privacidade"
- Sections (in order, with a TOC at the top):
    1. Quem somos — company info (nome, NIF, morada, DPO email)
    2. Que dados recolhemos — table or list with: (a) dados do veículo (matrícula, marca, modelo, ano, km, etc.), (b) dados pessoais (nome, telemóvel, email), (c) metadados de eventos (IP, user-agent — anti-fraude), (d) registos de SMS (Twilio — para auditoria de comunicações)
    3. Por que tratamos os teus dados — base legal por finalidade:
       - Avaliação e proposta: execução pré-contratual (art. 6º/1/b RGPD), 12 meses de retenção
       - Operação da plataforma e auditoria: interesse legítimo (art. 6º/1/f), 6-12 meses
       - Vendas concluídas (faturação): obrigação legal fiscal portuguesa, 10 anos com anonimização parcial após 12 meses
    4. Sub-processadores que usamos — lista: Vercel (hosting, UE/EUA com SCC), Supabase (DB, UE eu-west), Twilio (SMS, UE/EUA com SCC), Cal.com (marcação, UE/EUA), Resend (email, UE/EUA), Upstash (rate-limit, UE), Sentry (errors, UE)
    5. Direitos do titular — acesso, retificação, apagamento ("direito a ser esquecido"), portabilidade, oposição. Link mailto:dpo@compramososeueletrico.pt para exercer.
    6. Reclamações — Comissão Nacional de Proteção de Dados (CNPD), Av. D. Carlos I, 134, 1.º, 1200-651 Lisboa, www.cnpd.pt
    7. Alterações a esta política — data de última revisão. Use string fixa "Última atualização: 28 de abril de 2026".

File 2: app/(public)/termos/page.tsx
- Title: "Termos e Condições"
- Sections:
    1. Sobre o serviço — natureza Wizard of Oz (somos uma plataforma de avaliação e compra; não somos um marketplace; compramos o teu carro diretamente)
    2. Natureza da proposta — claro e DESTACADO: a proposta enviada por SMS é INDICATIVA. O preço final é confirmado apenas após inspeção presencial. Diferenças significativas entre o declarado e o real podem alterar o preço ou levar à recusa. (esta secção é importante).
    3. Validade da proposta — 48 horas a contar do envio do SMS. Após expiração, é necessária nova avaliação.
    4. Marcação de visita — local físico (placeholder morada Lisboa). 30 minutos típicos.
    5. Pagamento — no próprio dia da inspeção, por transferência bancária ou cheque. Documentação do veículo entregue no momento.
    6. Responsabilidade — limitação a danos diretos, exclusão de lucros cessantes
    7. Lei aplicável — lei portuguesa, foro: comarca de Lisboa
    8. Contacto — dpo@compramososeueletrico.pt para qualquer questão

File 3: app/(public)/cookies/page.tsx
- Title: "Política de Cookies"
- Conteúdo curto (este site usa cookies muito limitadas):
    - Apenas cookies estritamente necessárias (sessão admin via Supabase Auth, CSRF). NÃO usamos analytics, NÃO usamos pixels, NÃO usamos cookies de marketing.
    - Lista de cookies essenciais (tabela simples): nome do cookie, finalidade, duração.
        Examples: `sb-access-token` (Supabase, sessão), `sb-refresh-token` (Supabase, renovação), HttpOnly + Secure + SameSite=Lax.
    - "Como gerir" — instruções genéricas para o utilizador desativar cookies no browser (mas alerta que isso impede o login admin).
    - Possibilidade de mudança no futuro (se adicionarmos analytics, adicionaremos um banner de consentimento).
- Tom: conciso, transparente.

File 4: app/(public)/contacto/page.tsx
- Title: "Contacto"
- Hero: "Fala connosco"
- Card grande com:
    - Nome empresa: "Compramos o Seu Elétrico, Lda."
    - NIF: 999 999 999 (DM Mono)
    - Morada: Rua Exemplo 123, 1000-000 Lisboa (DM Mono)
    - Telefone: +351 21X XXX XXX (DM Mono, tel: link)
    - Email geral: ola@compramososeueletrico.pt (mailto: link)
    - Email DPO/RGPD: dpo@compramososeueletrico.pt (mailto: link)
    - Horário: 9h-19h, dias úteis (lucide Clock icon)
- Mapa placeholder (NÃO incorporar Google Maps real — apenas um placeholder div com texto "Mapa indisponível neste momento")
- Pequena nota: "Podes também começar a avaliação online" + CTA "Avaliar o meu EV" → /avaliar.

Constraints (todas as 4 páginas):
- pt-PT formal-mas-acessível
- Mobile-first, max-w-2xl ou max-w-3xl centered cards
- Headings hierarchy clara (h1 grande no topo, h2 para secções)
- Links internos (entre privacy/termos/cookies/contacto) cruzados
- TOC âncora-link no topo das páginas longas (Política e Termos)
- Use shadcn Separator para divisões dentro de páginas longas
- DM Mono para NIF, telefone, morada (dados estruturados)
- No emojis. Lucide icons sparingly.
- Each page exports `metadata = { title: "...", description: "..." }` em pt-PT.
- No client components needed — tudo server components puros com <Link>s.

Files to create:
- app/(public)/politica-privacidade/page.tsx
- app/(public)/termos/page.tsx
- app/(public)/cookies/page.tsx
- app/(public)/contacto/page.tsx
```

- [ ] **Step 2:** Verify build:

```bash
pnpm build 2>&1 | tail -8
```

Should show all 4 routes as static.

- [ ] **Step 3:** Smoke test:

```bash
pnpm dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 8
for path in politica-privacidade termos cookies contacto; do
  echo -n "/$path: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$path"
done
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

All 4 should return 200.

- [ ] **Step 4:** Commit:

```bash
git add "app/(public)/"
git commit -m "feat(public): legal pages (politica, termos, cookies, contacto)"
git log --oneline -1
```

---

## Task 7 — Security headers (next.config.ts)

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1:** Read current `next.config.ts`. It's likely minimal. Replace with:

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// CSP: allow Cal.com embed + Supabase + self.
// Avoid 'unsafe-inline' for scripts where possible.
const cspParts = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.cal.com https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://app.cal.com https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.twilio.com https://app.cal.com https://api.cal.com",
  "frame-src 'self' https://app.cal.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: cspParts.join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

NOTA: `'unsafe-inline'` e `'unsafe-eval'` em script-src são necessários para o Next.js dev mode. Em produção podes apertar — ver guia do Next.js para CSP com nonces.

- [ ] **Step 2:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

- [ ] **Step 3:** Smoke (verifica headers):

```bash
pnpm dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 8
curl -s -I http://localhost:3000/ | grep -i -E "strict-transport|x-frame|x-content|referrer|permissions|content-security"
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

Esperado: ver os headers retornados.

- [ ] **Step 4:** Commit:

```bash
git add next.config.ts
git commit -m "chore(security): CSP + HSTS + clickjacking + permissions headers"
git log --oneline -1
```

---

## Task 8 — Sentry integration

**Files:**
- Create: `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1:** Install:

```bash
pnpm add @sentry/nextjs
```

- [ ] **Step 2:** Create configs (manually, NOT via `npx @sentry/wizard` which is interactive):

`sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
```

`sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
```

`sentry.edge.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
```

`instrumentation.ts` (project root):
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = (
  err: unknown,
  request: Request,
  context: { routerKind: "Pages Router" | "App Router"; routePath: string },
) => {
  // Lazy import — Sentry only loads if DSN is configured server-side
  if (!process.env.SENTRY_DSN) return;
  import("@sentry/nextjs").then(({ captureRequestError }) =>
    captureRequestError(err, request as any, context as any),
  );
};
```

- [ ] **Step 3:** Add to `.env.example` (committed):

```
# Sentry (optional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 4:** Add to `.env.local` (NOT committed) — empty (Sentry skips):

```
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 5:** Verify build:

```bash
pnpm build 2>&1 | tail -10
```

Pode mostrar warnings sobre Sentry source maps quando DSN está vazio — ignoráveis em dev. O build deve passar.

- [ ] **Step 6:** Verify tests still pass:

```bash
pnpm test 2>&1 | tail -5
```

- [ ] **Step 7:** Commit:

```bash
git add sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts instrumentation.ts .env.example package.json pnpm-lock.yaml
git commit -m "feat(observability): Sentry integration (skip if DSN empty)"
git log --oneline -1
```

---

## Task 9 — Fix test flake (vitest serial integration)

**Files:**
- Modify: `vitest.config.ts`

O flake era race entre testes integration paralelos partilhando DB. Solução: forçar integration tests a correr serialmente.

- [ ] **Step 1:** Read current `vitest.config.ts`. Modificar para adicionar `poolOptions` que limite paralelismo apenas para integration:

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
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

`fileParallelism: false` força ficheiros a correr um de cada vez. `singleThread: true` limita a 1 worker. Isto garante que integration tests não competem pela DB.

Trade-off: testes mais lentos mas estáveis. Em CI são ~30-60s a mais — aceitável.

- [ ] **Step 2:** Run full test suite. Expected: TODOS passam consistentemente.

```bash
pnpm test 2>&1 | tail -5
```

- [ ] **Step 3:** Run again para confirmar não-flake:

```bash
pnpm test 2>&1 | tail -5
```

- [ ] **Step 4:** Commit:

```bash
git add vitest.config.ts
git commit -m "test: force serial execution to fix integration race conditions"
git log --oneline -1
```

---

## Task 10 — Go-live checklist doc

**Files:**
- Create: `docs/go-live-checklist.md`

- [ ] **Step 1:** Create the doc:

```markdown
# Go-live checklist

Last update: 2026-04-28

## Antes do deploy

### Contas e credenciais
- [ ] Vercel: projeto criado e ligado ao GitHub
- [ ] Supabase: projeto em região `eu-west-X` (NÃO US)
- [ ] Twilio: conta com sender alfanumérico `EletricoPT` aprovado para PT
- [ ] Cal.com: conta + event type "Inspeção de Veículo" + webhook configurado
- [ ] Resend: domínio `compramososeueletrico.pt` verificado (SPF/DKIM/DMARC)
- [ ] Upstash: Redis em região `eu-west-1`
- [ ] Sentry: projeto criado, DSN copiado
- [ ] Domínio: `compramososeueletrico.pt` comprado, DNS apontado para Vercel

### Env vars (Production no Vercel)
Confirmar todas as keys em `.env.example` estão preenchidas com valores reais de produção:

- [ ] `NEXT_PUBLIC_SITE_URL=https://compramososeueletrico.pt`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (cloud — não localhost)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY` + `RESEND_FROM=ola@compramososeueletrico.pt` + `OPERATOR_EMAIL`
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM=EletricoPT`
- [ ] `CALCOM_EVENT_TYPE_LINK` + `CALCOM_WEBHOOK_SECRET` (real do painel Cal.com)
- [ ] `CRON_SECRET` (gerar 32+ chars random)
- [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`

### Database
- [ ] Migrations aplicadas em produção (`supabase db push --linked`)
- [ ] Operadores criados (NÃO via `seed.sql` — esse é só para dev. Em produção, criar via Supabase dashboard ou SQL direto)
- [ ] Backup automático ligado (incluído no plano pago Supabase; free tier tem 7 dias retention)

### Webhooks
- [ ] Twilio status callback URL → `https://compramososeueletrico.pt/api/webhooks/twilio`
- [ ] Cal.com webhook URL → `https://compramososeueletrico.pt/api/webhooks/calcom`

### Segurança
- [ ] Headers verificados em https://securityheaders.com (mínimo A)
- [ ] CSP testada — embed Cal.com funciona, Supabase Realtime funciona
- [ ] HTTPS forçado pelo Vercel
- [ ] Cookies admin: `Secure`, `HttpOnly`, `SameSite=Lax` (Supabase Auth defaults)

### Conteúdo legal
- [ ] `/politica-privacidade` revista por jurista (recomendado)
- [ ] `/termos` revistos
- [ ] Morada/NIF reais nas páginas legais e footer (substituir os placeholders `999 999 999`, `Rua Exemplo 123`)
- [ ] Email DPO real configurado

### Operacional
- [ ] Vercel Cron habilitado e schedules verificados (`vercel.json`)
- [ ] Sentry alerts configurados (email / Slack para erros)
- [ ] Plano de Supabase suficiente para tráfego esperado (free tier limita a ~500MB DB e ~50k MAU)

## Deploy day

1. [ ] Final lint + typecheck + test em main
2. [ ] Merge to main → Vercel auto-deploy
3. [ ] Verificar deploy URL
4. [ ] Smoke test: submit lead real (com phone próprio)
5. [ ] Smoke test: admin login + receber lead em realtime
6. [ ] Smoke test: enviar proposta + receber SMS no telemóvel próprio
7. [ ] Smoke test: aceitar proposta + marcar visita Cal.com real
8. [ ] Smoke test: cancel booking → verificar revert no admin
9. [ ] Verificar primeiro cron run (esperar até 15 min para `expire-proposals` rodar)

## Pós-deploy

- [ ] Monitor Sentry pelo menos 24h
- [ ] Verificar logs Vercel para erros 5xx
- [ ] Confirmar emails Resend a chegar (não spam)
- [ ] Confirmar SMS Twilio a chegar
- [ ] Anunciar (Instagram / OLX / etc.)
```

- [ ] **Step 2:** Commit:

```bash
git add docs/go-live-checklist.md
git commit -m "docs: go-live checklist for production"
git log --oneline -1
```

---

## Task 11 — Final smoke

- [ ] **Step 1:** Sweep:

```bash
pnpm typecheck
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Todos passam.

- [ ] **Step 2:** Resumo no chat — Plano 5 completo. Plataforma pronta para go-live.

---

## Spec coverage check

- ✅ Cron expire-proposals @ */15min — Tasks 1, 2
- ✅ Cron GDPR purge diário — Tasks 1, 3
- ✅ Cron nudge SMS + auto-LOST 7d — Tasks 1, 4
- ✅ RGPD forget endpoint + admin button — Task 5
- ✅ Páginas legais (privacidade, termos, cookies, contacto) — Task 6
- ✅ Security headers (CSP, HSTS, etc.) — Task 7
- ✅ Sentry — Task 8
- ✅ Test flake fix — Task 9
- ✅ Go-live checklist — Task 10
- ⏸ Anonymization de leads COMPLETED após 12 meses — **deferido** (10y retention via lei fiscal; anonimização parcial pode ser adicionada num futuro plano com cron extra)
- ⏸ Banner de cookies — **não necessário** com o setup atual (apenas cookies estritamente necessárias)
- ⏸ Multi-operador attribution / métricas — **pós-MVP**

Cobertura completa para Plano 5 e go-live MVP.
