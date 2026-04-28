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
