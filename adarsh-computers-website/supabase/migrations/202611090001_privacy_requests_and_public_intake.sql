-- Additive privacy-request intake, server-side public-form throttling and notification support.
-- This migration preserves all existing orders, enquiries and customer data.

create table if not exists public.public_form_rate_limits (
  scope text not null check (scope in ('enquiry', 'privacy_request')),
  fingerprint text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  primary key (scope, fingerprint, window_start)
);
create index if not exists public_form_rate_limits_window_idx on public.public_form_rate_limits(window_start);
alter table public.public_form_rate_limits enable row level security;
revoke all on public.public_form_rate_limits from public, anon, authenticated;

create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  purpose text not null check (purpose in ('customer_account', 'profile', 'checkout', 'enquiry', 'privacy_request')),
  notice_version text not null check (char_length(notice_version) between 1 and 40),
  entity_type text check (entity_type is null or entity_type in ('profile', 'enquiry', 'privacy_request')),
  entity_id uuid,
  consented_at timestamptz not null default now()
);
create index if not exists privacy_consents_user_time_idx on public.privacy_consents(user_id, consented_at desc);
create index if not exists privacy_consents_entity_idx on public.privacy_consents(entity_type, entity_id) where entity_id is not null;
alter table public.privacy_consents enable row level security;
revoke all on public.privacy_consents from public, anon, authenticated;
grant select on public.privacy_consents to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'privacy_consents' and policyname = 'Admins read privacy consent records') then
    create policy "Admins read privacy consent records" on public.privacy_consents for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
end $$;

create or replace function public.consume_adarsh_public_rate_limit(p_scope text, p_client_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fingerprint text;
  v_hits integer;
  v_window timestamptz := date_trunc('hour', now());
begin
  if p_scope not in ('enquiry', 'privacy_request') or p_client_key is null or char_length(p_client_key) not between 1 and 256 then
    return false;
  end if;
  v_fingerprint := encode(extensions.digest(convert_to(p_client_key, 'UTF8'), 'sha256'), 'hex');
  insert into public.public_form_rate_limits(scope, fingerprint, window_start, hit_count)
  values (p_scope, v_fingerprint, v_window, 1)
  on conflict (scope, fingerprint, window_start)
  do update set hit_count = public.public_form_rate_limits.hit_count + 1
  returning hit_count into v_hits;
  delete from public.public_form_rate_limits where window_start < now() - interval '48 hours';
  return v_hits <= 6;
end;
$$;
revoke all on function public.consume_adarsh_public_rate_limit(text, text) from public;
revoke all on function public.consume_adarsh_public_rate_limit(text, text) from anon, authenticated;

-- Replace direct anonymous inserts with a validated, throttled RPC.
revoke insert on public.enquiries from public, anon, authenticated;
drop policy if exists "Visitors can submit enquiries" on public.enquiries;

create or replace function public.submit_adarsh_enquiry(
  p_name text, p_phone text, p_email text, p_interested_in text, p_message text, p_client_key text,
  p_privacy_consent boolean, p_notice_version text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_enquiry_id uuid;
begin
  if p_privacy_consent is distinct from true or p_notice_version is distinct from '2026-11-09-v1'
    or char_length(trim(coalesce(p_name, ''))) not between 2 and 120
    or char_length(trim(coalesce(p_phone, ''))) not between 7 and 30
    or char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7
    or char_length(trim(coalesce(p_email, ''))) > 254
    or (nullif(trim(coalesce(p_email, '')), '') is not null and trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
    or char_length(trim(coalesce(p_interested_in, ''))) > 160
    or char_length(trim(coalesce(p_message, ''))) not between 10 and 4000 then
    return false;
  end if;
  if not public.consume_adarsh_public_rate_limit('enquiry', p_client_key) then return false; end if;
  insert into public.enquiries(name, phone, email, interested_in, message, status)
  values (trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_interested_in, '')), ''), trim(p_message), 'New')
  returning id into v_enquiry_id;
  insert into public.privacy_consents(purpose, notice_version, entity_type, entity_id)
  values ('enquiry', p_notice_version, 'enquiry', v_enquiry_id);
  return true;
end;
$$;
revoke all on function public.submit_adarsh_enquiry(text, text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_adarsh_enquiry(text, text, text, text, text, text, boolean, text) to service_role;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 3 and 254),
  request_type text not null check (request_type in ('Access a copy', 'Correct details', 'Delete account or details', 'Withdraw consent', 'Other privacy concern')),
  details text not null check (char_length(trim(details)) between 10 and 2000),
  status text not null default 'Received' check (status in ('Received', 'Identity check required', 'In progress', 'Completed', 'Unable to process')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 2000),
  identity_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.privacy_requests'::regclass and conname = 'privacy_requests_identity_before_action') then
    alter table public.privacy_requests add constraint privacy_requests_identity_before_action
      check (status not in ('In progress', 'Completed') or identity_verified_at is not null);
  end if;
end $$;
create index if not exists privacy_requests_created_idx on public.privacy_requests(created_at desc);
create index if not exists privacy_requests_status_idx on public.privacy_requests(status, created_at desc);
alter table public.privacy_requests enable row level security;
revoke all on public.privacy_requests from public, anon, authenticated;
grant select, update on public.privacy_requests to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'privacy_requests' and policyname = 'Admins read privacy requests') then
    create policy "Admins read privacy requests" on public.privacy_requests for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'privacy_requests' and policyname = 'Admins update privacy requests') then
    create policy "Admins update privacy requests" on public.privacy_requests for update to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;
end $$;

drop function if exists public.submit_adarsh_privacy_request(text, text, text, text, text, boolean, text);
create function public.submit_adarsh_privacy_request(
  p_full_name text, p_email text, p_request_type text, p_details text, p_client_key text,
  p_privacy_consent boolean, p_notice_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  if p_privacy_consent is distinct from true or p_notice_version is distinct from '2026-11-09-v1'
    or char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120
    or char_length(trim(coalesce(p_email, ''))) not between 3 and 254
    or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or p_request_type is null
    or p_request_type not in ('Access a copy', 'Correct details', 'Delete account or details', 'Withdraw consent', 'Other privacy concern')
    or char_length(trim(coalesce(p_details, ''))) not between 10 and 2000 then
    return null;
  end if;
  if not public.consume_adarsh_public_rate_limit('privacy_request', p_client_key) then return null; end if;
  insert into public.privacy_requests(full_name, email, request_type, details)
  values (trim(p_full_name), lower(trim(p_email)), p_request_type, trim(p_details))
  returning id into v_request_id;
  insert into public.privacy_consents(purpose, notice_version, entity_type, entity_id)
  values ('privacy_request', p_notice_version, 'privacy_request', v_request_id);
  insert into public.admin_notifications(type, reference_id, title, message)
  values ('privacy_request', v_request_id, 'New privacy request received', trim(p_request_type) || ' · ' || lower(trim(p_email)))
  on conflict (type, reference_id) do nothing;
  return v_request_id;
end;
$$;
revoke all on function public.submit_adarsh_privacy_request(text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_adarsh_privacy_request(text, text, text, text, text, boolean, text) to service_role;

create or replace function public.record_adarsh_privacy_consent(p_purpose text, p_notice_version text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
    or p_purpose is null or p_purpose not in ('profile', 'checkout')
    or p_notice_version is distinct from '2026-11-09-v1' then
    return false;
  end if;
  insert into public.privacy_consents(user_id, purpose, notice_version)
  values (auth.uid(), p_purpose, p_notice_version);
  return true;
end;
$$;
revoke all on function public.record_adarsh_privacy_consent(text, text) from public, anon;
grant execute on function public.record_adarsh_privacy_consent(text, text) to authenticated;

-- Record affirmative account-creation consent in the auth trigger created by the base schema.
create or replace function public.handle_adarsh_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'customer')
  on conflict (id) do update set email = excluded.email;
  if new.raw_user_meta_data ->> 'privacy_notice_accepted' = 'yes'
     and new.raw_user_meta_data ->> 'privacy_notice_version' = '2026-11-09-v1' then
    insert into public.privacy_consents(user_id, purpose, notice_version, entity_type, entity_id)
    values (new.id, 'customer_account', '2026-11-09-v1', 'profile', new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.handle_adarsh_auth_user() from public;

-- Extend the existing private notification stream with privacy-request notices.
alter table public.admin_notifications drop constraint if exists admin_notifications_type_check;
alter table public.admin_notifications add constraint admin_notifications_type_check check (type in ('order', 'enquiry', 'privacy_request'));
alter table public.admin_notifications replica identity full;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'privacy_requests') then
    alter publication supabase_realtime add table public.privacy_requests;
  end if;
end $$;

