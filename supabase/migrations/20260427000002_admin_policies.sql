-- supabase/migrations/20260427000002_admin_policies.sql
-- Plan 2: INSERT/UPDATE policies for operators on the admin-facing tables.

-- profiles: allow user to INSERT own row (used by signup/seed)
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- proposals
create policy "proposals_insert_operators"
  on public.proposals for insert
  with check (public.is_operator());

create policy "proposals_update_operators"
  on public.proposals for update
  using (public.is_operator());

-- leads
create policy "leads_update_operators"
  on public.leads for update
  using (public.is_operator());

-- events
create policy "events_insert_operators"
  on public.events for insert
  with check (public.is_operator());

-- helper RPC for tests (PostgREST may not expose pg_policies directly)
create or replace function public.list_policies(p_table text)
returns table(policyname text, cmd text)
language sql security definer stable as $$
  select policyname::text, cmd::text
  from pg_policies
  where schemaname = 'public' and tablename = p_table;
$$;
