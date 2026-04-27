-- supabase/seed.sql
-- Plan 2: bootstrap first operator. Runs on `supabase db reset` AFTER all migrations.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'eternalaiden@gmail.com';
  if v_user_id is null then
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
