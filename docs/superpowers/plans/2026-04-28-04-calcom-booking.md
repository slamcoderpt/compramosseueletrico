# Plano 4 — Marcação Cal.com

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **UI work:** All tasks marked **`(UI — frontend-design)`** MUST invoke the `frontend-design` skill with the prompt provided in that task. Do not write UI components ad-hoc.

**Goal:** Substituir o placeholder de `/proposta/[token]/marcar` pelo embed Cal.com real, configurado com prefill do lead e `metadata.proposalToken`. Webhook `/api/webhooks/calcom` recebe `BOOKING_CREATED`/`CANCELLED`/`RESCHEDULED`, valida HMAC, faz match pelo token nos metadata, INSERT `bookings`, UPDATE lead `SCHEDULED`, INSERT event, dispara SMS confirmação ao cliente + email Resend ao operador. Idempotente via UNIQUE em `calcom_booking_id`.

**Architecture:** Embed via `@calcom/embed-react` (componente client). Webhook HMAC-SHA256 validado server-side com `crypto.timingSafeEqual`. Match cross-system via `metadata.proposalToken` injetado no embed config — Cal.com propaga-o no webhook payload. Idempotência: `INSERT INTO bookings (calcom_booking_id, ...)` com unique constraint, segunda entrega devolve conflict que tratamos como noop. Para `BOOKING_CANCELLED`, lead volta a `ACCEPTED`. Para `BOOKING_RESCHEDULED`, UPDATE `bookings.scheduled_at`. Em dev sem `CALCOM_EVENT_TYPE_LINK` configurado, a página `/marcar` mostra graciosamente o placeholder de contacto (fallback do Plano 3).

**Tech Stack:** `@calcom/embed-react` (client embed), `crypto` (Node built-in para HMAC), Supabase Postgres (`bookings` table já criada no Plano 1), Twilio (`sendSms` já existe), Resend (`sendOperatorEmail` já existe). Sem novas tabelas — só código.

**Spec:** [docs/superpowers/specs/2026-04-27-compramososeueletrico-design.md](../specs/2026-04-27-compramososeueletrico-design.md) — secção 5 (Cal.com).

**Plano 3 (precondição):** completo. Páginas `/aceite` e `/marcar` (placeholder) existem. Fluxo de aceitação dispara redirect para `/marcar`. Booking table existe vazia.

---

## Pré-requisitos manuais

**Conta Cal.com** ([cal.com](https://cal.com)) — gratuita.
1. Criar conta (sugestão de username: `compramososeueletrico`)
2. Criar **Event Type** chamado `Inspeção de Veículo`:
   - Duração: 60 minutos
   - Local: morada física da empresa
   - Configurações: pedir nome + email + (campo custom) telefone
3. Anotar o **calLink** completo: ex `compramososeueletrico/inspecao` (formato `<username>/<event-slug>`)
4. **Webhooks** → Add webhook:
   - URL: `https://compramososeueletrico.pt/api/webhooks/calcom` (em prod). Para dev local, usa **ngrok** ou **cloudflared** para expor `http://localhost:3000` e cola esse URL.
   - Subscribe to events: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`
   - Anotar o **Secret** (HMAC) — vai para `.env.local` como `CALCOM_WEBHOOK_SECRET`

**Para dev sem ngrok:** podes deixar `CALCOM_EVENT_TYPE_LINK` vazio e a página `/marcar` mostra o fallback de contacto (placeholder do Plano 3). Os testes do webhook usam HMAC mockado, não precisam de Cal.com real.

---

## Estrutura de ficheiros

```
.
├── lib/
│   └── calcom/
│       └── webhook-verify.ts                     (HMAC SHA-256 constant-time)
├── app/
│   ├── api/webhooks/calcom/route.ts              (BOOKING_* handler)
│   └── (public)/proposta/[token]/marcar/
│       ├── page.tsx                              (REPLACE: server fetches lead+token, decides fallback vs embed)
│       └── booking-embed.tsx                     (UI — client component with @calcom/embed-react)
└── tests/
    ├── unit/
    │   └── calcom-webhook-verify.test.ts
    └── integration/
        └── api-webhooks-calcom.test.ts
```

---

## Task 1 — `lib/calcom/webhook-verify.ts` (TDD)

HMAC SHA-256 constant-time signature validation, mirroring the Twilio pattern.

**Files:**
- Create: `lib/calcom/webhook-verify.ts`, `tests/unit/calcom-webhook-verify.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/unit/calcom-webhook-verify.test.ts
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyCalcomSignature } from "@/lib/calcom/webhook-verify";

const SECRET = "test_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyCalcomSignature", () => {
  it("returns true for a valid signature (hex)", () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} });
    const sig = sign(body, SECRET);
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: body })).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} });
    const sig = sign(body, SECRET);
    const tampered = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: { evil: true } });
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: tampered })).toBe(false);
  });

  it("returns false for a wrong secret", () => {
    const body = "x";
    const sig = sign(body, "other_secret_xxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(verifyCalcomSignature({ secret: SECRET, signature: sig, rawBody: body })).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(verifyCalcomSignature({ secret: "", signature: "abc", rawBody: "x" })).toBe(false);
  });

  it("returns false when signature is empty", () => {
    expect(verifyCalcomSignature({ secret: SECRET, signature: "", rawBody: "x" })).toBe(false);
  });

  it("returns false when signature length differs (avoids timingSafeEqual throw)", () => {
    expect(verifyCalcomSignature({ secret: SECRET, signature: "shorthex", rawBody: "x" })).toBe(false);
  });
});
```

- [ ] **Step 2:** Run → FAIL.

```bash
pnpm test tests/unit/calcom-webhook-verify.test.ts
```

- [ ] **Step 3:** Implement `lib/calcom/webhook-verify.ts`:

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyArgs {
  secret: string;
  signature: string;
  rawBody: string;
}

export function verifyCalcomSignature({ secret, signature, rawBody }: VerifyArgs): boolean {
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (signature.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5:** Commit:

```bash
git add lib/calcom/webhook-verify.ts tests/unit/calcom-webhook-verify.test.ts
git commit -m "feat(calcom): HMAC SHA-256 webhook signature verification"
git log --oneline -1
```

---

## Task 2 — `POST /api/webhooks/calcom` (TDD)

Handles `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`. Idempotent via `bookings.calcom_booking_id` unique. SMS confirmação ao cliente. Email Resend ao operador.

**Files:**
- Create: `app/api/webhooks/calcom/route.ts`, `tests/integration/api-webhooks-calcom.test.ts`

- [ ] **Step 1:** Test:

```typescript
// tests/integration/api-webhooks-calcom.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createHmac } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateProposalToken } from "@/lib/proposals/tokens";

const SECRET = "test_calcom_secret";
process.env.CALCOM_WEBHOOK_SECRET = SECRET;

const supabase = createServiceRoleClient();

let leadId: string;
let proposalId: string;
let token: string;

async function seed() {
  const { data: lead } = await supabase
    .from("leads")
    .insert({
      matricula: "CC-44-DD",
      marca: "Tesla",
      modelo: "Model Y",
      ano: 2023,
      km: 20000,
      num_donos_anteriores: 1,
      estado_geral: "OPTIMO",
      sinistros: "NUNCA",
      livro_manutencao: true,
      bateria_soh_pct: 98,
      autonomia_real_km: 480,
      carregador_incluido: true,
      nome: "Booking Test",
      telefone: "+351912000044",
      email: "booking@test.com",
      rgpd_consent_at: new Date().toISOString(),
      status: "ACCEPTED",
    })
    .select("id")
    .single();
  leadId = lead!.id;

  token = generateProposalToken();
  const { data: prop } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      valor_eur_cents: 2200000,
      token,
      status: "ACCEPTED",
      sent_at: new Date(Date.now() - 60_000).toISOString(),
      accepted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 47 * 60 * 60_000).toISOString(),
    })
    .select("id")
    .single();
  proposalId = prop!.id;
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

async function call(payload: any, opts: { signValid?: boolean } = {}) {
  const body = JSON.stringify(payload);
  const sig = (opts.signValid ?? true) ? sign(body) : "deadbeef".repeat(8);

  const { POST } = await import("@/app/api/webhooks/calcom/route");
  const req = new Request("http://localhost:3000/api/webhooks/calcom", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cal-signature-256": sig,
    },
    body,
  });
  return POST(req as any);
}

beforeEach(async () => {
  await supabase.from("leads").delete().eq("matricula", "CC-44-DD");
  await seed();
});

afterAll(async () => {
  await supabase.from("leads").delete().eq("matricula", "CC-44-DD");
});

describe("POST /api/webhooks/calcom", () => {
  it("BOOKING_CREATED: inserts booking, updates lead to SCHEDULED, logs event", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_001",
        startTime: scheduledAt,
        attendees: [{ email: "booking@test.com", name: "Booking Test" }],
        metadata: { proposalToken: token },
      },
    });
    expect(res.status).toBe(200);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("proposal_id", proposalId);
    expect(bookings?.length).toBe(1);
    expect(bookings?.[0].calcom_booking_id).toBe("calcom_uid_001");
    expect(bookings?.[0].status).toBe("CONFIRMED");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("SCHEDULED");

    const { data: events } = await supabase.from("events").select("type").eq("lead_id", leadId);
    expect(events?.some((e) => e.type === "BOOKING_CONFIRMED")).toBe(true);

    const { data: smsLog } = await supabase
      .from("sms_log")
      .select("*")
      .eq("lead_id", leadId);
    expect(smsLog?.length).toBeGreaterThanOrEqual(1);
  });

  it("BOOKING_CREATED: idempotent — second delivery is noop", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const payload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_002",
        startTime: scheduledAt,
        metadata: { proposalToken: token },
      },
    };
    await call(payload);
    const res2 = await call(payload);
    expect(res2.status).toBe(200);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("calcom_booking_id", "calcom_uid_002");
    expect(bookings?.length).toBe(1);
  });

  it("BOOKING_CANCELLED: updates booking + reverts lead to ACCEPTED", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_003", startTime: scheduledAt, metadata: { proposalToken: token } },
    });

    const res = await call({
      triggerEvent: "BOOKING_CANCELLED",
      payload: { uid: "calcom_uid_003" },
    });
    expect(res.status).toBe(200);

    const { data: booking } = await supabase
      .from("bookings")
      .select("status")
      .eq("calcom_booking_id", "calcom_uid_003")
      .single();
    expect(booking?.status).toBe("CANCELLED");

    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single();
    expect(lead?.status).toBe("ACCEPTED");
  });

  it("BOOKING_RESCHEDULED: updates scheduled_at", async () => {
    const t1 = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_004", startTime: t1, metadata: { proposalToken: token } },
    });

    const t2 = new Date(Date.now() + 48 * 60 * 60_000).toISOString();
    const res = await call({
      triggerEvent: "BOOKING_RESCHEDULED",
      payload: { uid: "calcom_uid_004", startTime: t2 },
    });
    expect(res.status).toBe(200);

    const { data: booking } = await supabase
      .from("bookings")
      .select("scheduled_at, status")
      .eq("calcom_booking_id", "calcom_uid_004")
      .single();
    expect(new Date(booking!.scheduled_at).toISOString()).toBe(t2);
    expect(booking?.status).toBe("RESCHEDULED");
  });

  it("rejects invalid signature with 403", async () => {
    const res = await call(
      {
        triggerEvent: "BOOKING_CREATED",
        payload: { uid: "calcom_uid_005", startTime: new Date().toISOString(), metadata: { proposalToken: token } },
      },
      { signValid: false },
    );
    expect(res.status).toBe(403);
  });

  it("returns 200 (warning) when proposalToken is missing", async () => {
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: { uid: "calcom_uid_006", startTime: new Date().toISOString() },
    });
    expect(res.status).toBe(200);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("calcom_booking_id", "calcom_uid_006");
    expect(bookings?.length).toBe(0);
  });

  it("returns 200 (warning) when proposalToken doesn't match any proposal", async () => {
    const res = await call({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "calcom_uid_007",
        startTime: new Date().toISOString(),
        metadata: { proposalToken: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      },
    });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2:** FAIL.

```bash
pnpm test tests/integration/api-webhooks-calcom.test.ts 2>&1 | tail -10
```

- [ ] **Step 3:** Implement `app/api/webhooks/calcom/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyCalcomSignature } from "@/lib/calcom/webhook-verify";
import { sendSms } from "@/lib/sms/twilio";
import { sendOperatorEmail } from "@/lib/email/resend";
import { withRequestId } from "@/lib/logger";
import { formatPtDateTime } from "@/lib/format/date";

export const runtime = "nodejs";

interface CalcomPayload {
  triggerEvent: string;
  payload?: {
    uid?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ email?: string; name?: string }>;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = withRequestId(requestId);

  const signature = req.headers.get("x-cal-signature-256") ?? "";
  const rawBody = await req.text();

  const ok = verifyCalcomSignature({
    secret: process.env.CALCOM_WEBHOOK_SECRET ?? "",
    signature,
    rawBody,
  });
  if (!ok) {
    log.warn("calcom webhook bad signature");
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  let body: CalcomPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 200 });
  }

  const { triggerEvent, payload } = body;
  if (!payload?.uid) {
    log.warn("calcom webhook without uid");
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  if (triggerEvent === "BOOKING_CREATED") {
    return await handleCreated(supabase, payload, requestId, log);
  }
  if (triggerEvent === "BOOKING_RESCHEDULED") {
    return await handleRescheduled(supabase, payload, requestId, log);
  }
  if (triggerEvent === "BOOKING_CANCELLED") {
    return await handleCancelled(supabase, payload, requestId, log);
  }

  log.info("calcom webhook ignored event", { triggerEvent });
  return NextResponse.json({ ok: true });
}

async function handleCreated(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const proposalToken = (payload.metadata?.proposalToken ?? "") as string;
  if (!proposalToken) {
    log.warn("calcom webhook missing proposalToken metadata", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, lead_id, leads:lead_id(nome, telefone, marca, modelo)")
    .eq("token", proposalToken)
    .maybeSingle();

  if (!proposal) {
    log.warn("calcom webhook proposal not found", { proposalToken });
    return NextResponse.json({ ok: true });
  }

  const lead = (proposal as any).leads;
  const startTime = payload.startTime ?? new Date().toISOString();

  const { error: insertErr } = await supabase
    .from("bookings")
    .insert({
      proposal_id: proposal.id,
      calcom_booking_id: payload.uid!,
      scheduled_at: startTime,
      status: "CONFIRMED",
    });

  // Idempotent: if duplicate (23505), it means this booking already exists — skip side effects
  if (insertErr) {
    if (insertErr.code === "23505") {
      log.info("calcom webhook duplicate booking ignored", { uid: payload.uid });
      return NextResponse.json({ ok: true });
    }
    log.error("booking insert failed", { error: insertErr.message });
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }

  await supabase.from("leads").update({ status: "SCHEDULED" }).eq("id", proposal.lead_id);

  await supabase.from("events").insert({
    lead_id: proposal.lead_id,
    proposal_id: proposal.id,
    type: "BOOKING_CONFIRMED",
    actor: "system",
    payload: { calcom_uid: payload.uid, startTime, requestId },
  });

  // SMS to customer (best-effort)
  if (lead?.telefone) {
    const firstName = (lead.nome ?? "").split(/\s+/)[0] || "";
    const when = formatPtDateTime(new Date(startTime));
    const sms_body = `Olá ${firstName}, a tua marcação para inspecionar o ${lead.marca} ${lead.modelo} está confirmada para ${when}. Vemo-nos lá!`;
    try {
      await sendSms({
        to: lead.telefone,
        body: sms_body,
        leadId: proposal.lead_id,
        proposalId: proposal.id,
      });
    } catch (e) {
      log.warn("confirmation SMS failed (non-fatal)", { error: (e as Error).message });
    }
  }

  // Email to operator (best-effort)
  try {
    await sendOperatorEmail({
      subject: `marcação confirmada • ${lead?.marca ?? ""} ${lead?.modelo ?? ""}`,
      html: `<p>Marcação confirmada.</p><p>Cliente: ${lead?.nome ?? ""} (${lead?.telefone ?? ""})</p><p>Data: ${formatPtDateTime(new Date(startTime))}</p><p>Booking UID: ${payload.uid}</p>`,
    });
  } catch (e) {
    log.warn("operator email failed (non-fatal)", { error: (e as Error).message });
  }

  return NextResponse.json({ ok: true });
}

async function handleRescheduled(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const startTime = payload.startTime;
  if (!startTime) {
    log.warn("calcom rescheduled without startTime", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .update({ scheduled_at: startTime, status: "RESCHEDULED" })
    .eq("calcom_booking_id", payload.uid!)
    .select("id, proposal_id, proposals:proposal_id(lead_id)")
    .maybeSingle();

  if (!booking) {
    log.warn("calcom rescheduled for unknown booking", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const leadId = (booking as any).proposals?.lead_id;
  if (leadId) {
    await supabase.from("events").insert({
      lead_id: leadId,
      proposal_id: booking.proposal_id,
      type: "BOOKING_RESCHEDULED",
      actor: "customer",
      payload: { calcom_uid: payload.uid, startTime, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}

async function handleCancelled(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: NonNullable<CalcomPayload["payload"]>,
  requestId: string,
  log: ReturnType<typeof withRequestId>,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("calcom_booking_id", payload.uid!)
    .select("id, proposal_id, proposals:proposal_id(lead_id)")
    .maybeSingle();

  if (!booking) {
    log.warn("calcom cancelled for unknown booking", { uid: payload.uid });
    return NextResponse.json({ ok: true });
  }

  const leadId = (booking as any).proposals?.lead_id;
  if (leadId) {
    // Revert lead to ACCEPTED so customer/operator can re-book
    await supabase.from("leads").update({ status: "ACCEPTED" }).eq("id", leadId);

    await supabase.from("events").insert({
      lead_id: leadId,
      proposal_id: booking.proposal_id,
      type: "BOOKING_CANCELLED",
      actor: "customer",
      payload: { calcom_uid: payload.uid, requestId },
    });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4:** PASS.

```bash
pnpm test tests/integration/api-webhooks-calcom.test.ts 2>&1 | tail -10
```

- [ ] **Step 5:** Final test sweep:

```bash
pnpm test 2>&1 | tail -5
```

- [ ] **Step 6:** Commit:

```bash
git add app/api/webhooks/calcom/ tests/integration/api-webhooks-calcom.test.ts
git commit -m "feat(api): Cal.com webhook handler (BOOKING_CREATED/RESCHEDULED/CANCELLED)"
git log --oneline -1
```

---

## Task 3 — Update env: Cal.com keys

**Files:**
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1:** Add to `.env.example` (committed):

Append at the end:

```
# Cal.com
CALCOM_EVENT_TYPE_LINK=
CALCOM_WEBHOOK_SECRET=
```

- [ ] **Step 2:** Add to `.env.local` (NOT committed) with placeholder values:

```
CALCOM_EVENT_TYPE_LINK=
CALCOM_WEBHOOK_SECRET=test_calcom_secret
```

NOTA: `CALCOM_EVENT_TYPE_LINK` empty → fallback page. `CALCOM_WEBHOOK_SECRET` matches the test secret so webhook tests don't fail when the test sets it explicitly.

- [ ] **Step 3:** Verify tests still pass:

```bash
pnpm test 2>&1 | tail -3
```

- [ ] **Step 4:** Commit:

```bash
git add .env.example
git commit -m "chore: add Cal.com env keys to example"
git log --oneline -1
```

---

## Task 4 — Replace `/proposta/[token]/marcar` with Cal.com embed (UI — frontend-design)

Substitui o placeholder do Plano 3. Page busca lead + proposal, decide entre embed real ou fallback de contacto.

**Files:**
- Modify: `app/(public)/proposta/[token]/marcar/page.tsx`
- Create: `app/(public)/proposta/[token]/marcar/booking-embed.tsx` (client component)

- [ ] **Step 1:** Install Cal.com embed:

```bash
pnpm add @calcom/embed-react
```

- [ ] **Step 2:** Replace the page with server-side logic that decides embed vs fallback:

`app/(public)/proposta/[token]/marcar/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, Clock } from "lucide-react";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { BookingEmbed } from "./booking-embed";

export const metadata = {
  title: "Marcar visita — compramososeueletrico",
  description: "Escolhe o melhor horário para a inspeção do teu carro elétrico.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MarcarPage({ params }: PageProps) {
  const { token } = await params;
  if (!isValidTokenShape(token)) notFound();

  const supabase = createServiceRoleClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, leads:lead_id(nome, email, marca, modelo, telefone)")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) notFound();

  const lead = (proposal as any).leads;
  const calLink = process.env.CALCOM_EVENT_TYPE_LINK;

  // Fallback if Cal.com not configured
  if (!calLink) {
    return <Fallback token={token} lead={lead} />;
  }

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      <header className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Marca a tua visita</h1>
        <p className="text-muted-foreground">
          Escolhe um horário para o {lead.marca} {lead.modelo}. A inspeção demora cerca de 30 minutos.
        </p>
      </header>
      <BookingEmbed
        calLink={calLink}
        token={token}
        prefillName={lead.nome}
        prefillEmail={lead.email}
      />
      <p className="text-xs text-muted-foreground/60 text-center mt-6 font-mono">
        Refª {token.slice(0, 8)}
      </p>
    </main>
  );
}

function Fallback({ token, lead }: { token: string; lead: any }) {
  return (
    <main className="container mx-auto max-w-lg py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 grid place-items-center text-primary">
            <Calendar className="size-8" />
          </div>
          <CardTitle className="text-2xl">Marcação de visita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            A marcação online estará disponível em breve. Por agora, contacta-nos para combinar.
          </p>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <span className="font-mono">+351 21X XXX XXX</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span className="font-mono">ola@compramososeueletrico.pt</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span>9h-19h, dias úteis</span>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              Recebemos a tua aceitação. Vamos contactar-te dentro de 24h se não nos contactares antes.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href={`/proposta/${token}/aceite`}>Voltar</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center font-mono">
            Refª {token.slice(0, 8)}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3 (UI — frontend-design):** Build the embed wrapper component.

Invoke `frontend-design` skill via Skill tool with this prompt:

```
Build the Cal.com embed wrapper for the booking page of compramososeueletrico.

Stack: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui. Brand "Precision Verde" — primary teal `oklch(0.48 0.13 185)`. DM Sans + DM Mono. The package `@calcom/embed-react` is already installed.

File to create: app/(public)/proposta/[token]/marcar/booking-embed.tsx

This is a "use client" component that wraps Cal.com's inline embed.

Props interface:
- calLink: string (e.g., "compramososeueletrico/inspecao")
- token: string (proposal token)
- prefillName: string
- prefillEmail: string

Implementation:
- Use the official Cal.com pattern:
    import Cal, { getCalApi } from "@calcom/embed-react";
    
    useEffect(() => {
      (async () => {
        const cal = await getCalApi();
        cal("ui", {
          theme: "light",
          styles: {
            branding: { brandColor: "#0d7066" }  // approx. brand teal in HEX (oklch 0.48 0.13 185)
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        });
      })();
    }, []);

    return (
      <Cal
        calLink={calLink}
        config={{
          name: prefillName,
          email: prefillEmail,
          metadata: { proposalToken: token },
          theme: "light",
        }}
        style={{
          width: "100%",
          height: "calc(100vh - 200px)",
          minHeight: "600px",
          overflow: "scroll",
        }}
      />
    );

The embed handles its own UX (calendar grid → time slots → confirmation). Our page provides the surrounding context (header explaining the step, brand chrome, footer with proposal ref).

Constraints:
- "use client" directive at top
- Brand teal (#0d7066 — converted from oklch 0.48 0.13 185)
- The `metadata.proposalToken` is CRITICAL — the webhook handler uses it to match the booking back to the proposal. Don't omit.
- Style the iframe container (the embed renders an iframe inside) so it has reasonable height on mobile + desktop. min-height 600px is sensible.
- No additional UI inside this component — just the Cal embed and useEffect for theming.

Files to create:
- app/(public)/proposta/[token]/marcar/booking-embed.tsx
```

- [ ] **Step 4:** Verify build:

```bash
pnpm build 2>&1 | tail -5
```

If it fails because `@calcom/embed-react` doesn't have ESM types or has runtime issues with React 19, the implementer can fall back to a `<script>` + `iframe` approach using Cal.com's vanilla embed, or just install a different version. If still fails, report as DONE_WITH_CONCERNS — the page can render the Fallback path while Cal.com integration is debugged.

- [ ] **Step 5:** Verify tests still pass (Cal.com embed is client-only, doesn't affect tests):

```bash
pnpm test 2>&1 | tail -3
```

- [ ] **Step 6:** Smoke test (with `CALCOM_EVENT_TYPE_LINK` empty, page should show fallback):

```bash
pnpm dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 8
# Need a real proposal token to test — use a placeholder URL just to confirm the route compiles
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/proposta/abcdefghijklmnopqrstuvwxyz123456/marcar"
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```

Expected: HTTP 404 (token doesn't exist in DB) — confirms route is wired correctly.

- [ ] **Step 7:** Commit:

```bash
git add "app/(public)/proposta/[token]/marcar/" package.json pnpm-lock.yaml
git commit -m "feat(proposals): replace marcar placeholder with Cal.com embed + fallback"
git log --oneline -1
```

---

## Task 5 — Final smoke

- [ ] **Step 1:** Sweep:

```bash
pnpm typecheck
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

All must pass.

- [ ] **Step 2:** Manual end-to-end smoke (with Cal.com NOT configured):
  1. `pnpm dev`
  2. Submit lead em `http://localhost:3000/avaliar`
  3. Login admin, abre lead, envia proposta
  4. Visita `/p/{token}` → vê proposta → clica `Aceitar` → confirm dialog → redirect para `/aceite`
  5. Clica `Marcar visita agora` → vai para `/marcar` → vê o **Fallback** (porque `CALCOM_EVENT_TYPE_LINK` está vazio)
  6. Confirma que a página fallback tem morada/email/horário e CTA `Voltar`

- [ ] **Step 3:** Manual webhook smoke (sem Cal.com real, com curl):

  Identifica um proposal token real:
  ```bash
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
    -c "SELECT token FROM proposals ORDER BY sent_at DESC LIMIT 1;"
  ```

  Constrói payload + assinatura e envia:
  ```bash
  TOKEN="<token-do-passo-anterior>"
  SECRET="test_calcom_secret"  # mesma do .env.local
  BODY='{"triggerEvent":"BOOKING_CREATED","payload":{"uid":"manual_test_001","startTime":"2026-05-01T10:00:00Z","metadata":{"proposalToken":"'"$TOKEN"'"}}}'
  SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')
  curl -X POST http://localhost:3000/api/webhooks/calcom \
    -H "Content-Type: application/json" \
    -H "X-Cal-Signature-256: $SIG" \
    -d "$BODY"
  ```

  Esperado: `{"ok":true}` + verificar:
  - `bookings` tem nova row
  - `lead.status = SCHEDULED`
  - timeline no `/admin/leads/{id}` mostra `BOOKING_CONFIRMED`
  - `sms_log` tem nova row para a confirmação ao cliente

- [ ] **Step 4:** Sem commit se tudo passa.

Para Cal.com REAL em dev:
1. Cria conta + event type + webhook conforme pré-requisitos
2. Inicia ngrok: `ngrok http 3000`
3. Copia URL ngrok para o webhook URL no painel Cal.com
4. Cola `calLink` (`username/event-slug`) no `.env.local` como `CALCOM_EVENT_TYPE_LINK`
5. Cola o secret real em `CALCOM_WEBHOOK_SECRET` (substitui `test_calcom_secret`)
6. Reinicia `pnpm dev`
7. Repete o smoke do passo 2 — desta vez deves ver o calendário Cal.com no `/marcar`

---

## Spec coverage check

- ✅ Cal.com embed na página `/marcar` (secção 5) — Task 4
- ✅ Fallback gracioso quando Cal.com não configurado — Task 4
- ✅ HMAC SHA-256 webhook signature (constant-time) — Tasks 1, 2
- ✅ BOOKING_CREATED handling com idempotência — Task 2
- ✅ BOOKING_CANCELLED com revert lead → ACCEPTED — Task 2
- ✅ BOOKING_RESCHEDULED com UPDATE scheduled_at — Task 2
- ✅ SMS confirmação ao cliente — Task 2
- ✅ Email Resend ao operador — Task 2
- ✅ Match por `metadata.proposalToken` — Task 2
- ✅ Logging events `BOOKING_CONFIRMED` / `CANCELLED` / `RESCHEDULED` — Task 2
- ⏸ Página `/marcar` que subscreve realtime para flipar para "confirmado" sem refresh — **fora de escopo** (Cal.com já mostra confirmação no embed; não duplicamos)
- ⏸ No-show handling (`bookings.status='NO_SHOW'`) — **manual no admin** (Plano 5 ou pós-MVP)

Cobertura completa para Plano 4.

---

## Próximos planos

- **Plano 5** — Crons (expirar propostas, GDPR purge, nudge SMS, auto-LOST 7d) + páginas legais + headers de segurança + Sentry + go-live + fix do test flake
