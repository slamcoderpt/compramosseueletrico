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
