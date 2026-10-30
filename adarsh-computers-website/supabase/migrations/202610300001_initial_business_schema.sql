-- Additive initial schema for Adarsh Computers.
-- This migration creates missing objects only, seeds only missing records, and never drops tables or data.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('owner', 'admin', 'editor', 'customer')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  price numeric(12, 2) check (price is null or price >= 0),
  availability text not null default 'Contact for availability' check (availability in ('In stock', 'Available to order', 'Contact for availability', 'Out of stock')),
  image_url text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  email text check (email is null or char_length(email) <= 254),
  interested_in text check (interested_in is null or char_length(interested_in) <= 160),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'New' check (status in ('New', 'Contacted', 'In Progress', 'Completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  company text,
  quote text not null,
  rating smallint check (rating is null or rating between 1 and 5),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists products_published_created_idx on public.products (is_published, created_at desc);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured = true;
create index if not exists categories_active_order_idx on public.categories (is_active, sort_order);
create index if not exists services_published_order_idx on public.services (is_published, sort_order);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists testimonials_published_idx on public.testimonials (is_published, created_at desc);

create or replace function public.is_adarsh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin', 'editor')
  );
$$;

revoke all on function public.is_adarsh_admin() from public;
grant execute on function public.is_adarsh_admin() to anon, authenticated;

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
  return new;
end;
$$;

revoke all on function public.handle_adarsh_auth_user() from public;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_adarsh_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    create trigger on_adarsh_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_adarsh_auth_user();
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.enquiries enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

grant select on public.profiles to authenticated;
grant select on public.categories, public.products, public.services, public.testimonials, public.site_settings to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant insert, update, delete on public.categories, public.products, public.services, public.testimonials, public.site_settings to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can read their own profile') then
    create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Admins can read profiles') then
    create policy "Admins can read profiles" on public.profiles for select to authenticated using ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'Public can read active categories') then
    create policy "Public can read active categories" on public.categories for select to anon, authenticated using (is_active or (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'Admins manage categories') then
    create policy "Admins manage categories" on public.categories for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Public can read published products') then
    create policy "Public can read published products" on public.products for select to anon, authenticated using (is_published or (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Admins manage products') then
    create policy "Admins manage products" on public.products for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'services' and policyname = 'Public can read published services') then
    create policy "Public can read published services" on public.services for select to anon, authenticated using (is_published or (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'services' and policyname = 'Admins manage services') then
    create policy "Admins manage services" on public.services for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Visitors can submit enquiries') then
    create policy "Visitors can submit enquiries" on public.enquiries for insert to anon, authenticated with check (status = 'New' and char_length(trim(name)) between 2 and 120 and char_length(trim(phone)) between 7 and 30 and char_length(trim(message)) between 10 and 4000);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins read enquiries') then
    create policy "Admins read enquiries" on public.enquiries for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins update enquiries') then
    create policy "Admins update enquiries" on public.enquiries for update to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins delete enquiries') then
    create policy "Admins delete enquiries" on public.enquiries for delete to authenticated using ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonials' and policyname = 'Public can read published testimonials') then
    create policy "Public can read published testimonials" on public.testimonials for select to anon, authenticated using (is_published or (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonials' and policyname = 'Admins manage testimonials') then
    create policy "Admins manage testimonials" on public.testimonials for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'Public can read public site settings') then
    create policy "Public can read public site settings" on public.site_settings for select to anon, authenticated using (is_public or (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'Admins manage site settings') then
    create policy "Admins manage site settings" on public.site_settings for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;
end;
$$;

insert into public.categories (name, slug, description, sort_order) values
  ('Desktop Computers', 'desktop-computers', 'Desktop systems for home, office and professional use.', 10),
  ('Laptops', 'laptops', 'Laptop options for work, study and everyday use.', 20),
  ('Computer Components', 'computer-components', 'Parts and components for desktop systems.', 30),
  ('Processors', 'processors', 'Processors and compatible upgrades.', 40),
  ('RAM', 'ram', 'Memory options for compatible systems.', 50),
  ('SSD and HDD', 'ssd-and-hdd', 'Storage drives and upgrades.', 60),
  ('Graphics Cards', 'graphics-cards', 'Graphics cards for compatible builds.', 70),
  ('Monitors', 'monitors', 'Displays for work and home setups.', 80),
  ('Keyboards and Mice', 'keyboards-and-mice', 'Input devices and accessories.', 90),
  ('Printers', 'printers', 'Printers and related supplies.', 100),
  ('Computer Accessories', 'computer-accessories', 'Accessories and peripherals.', 110),
  ('Networking Equipment', 'networking-equipment', 'Networking hardware and connectivity.', 120),
  ('Other Peripherals', 'other-peripherals', 'Additional computer peripherals.', 130)
on conflict (slug) do nothing;

insert into public.site_settings (key, value, is_public) values
  ('home', '{"headline":"Your Trusted Computer Hardware Partner.","description":"Thoughtful help with computer hardware and peripherals, from choosing the right setup to checking product availability.","tagline":"Making Technology Work For You"}'::jsonb, true),
  ('about', '{"description":"Adarsh Computers is a computer hardware and peripherals business based in Nehru Place, New Delhi.","story":"We help customers explore computer hardware and peripherals with clear product information and a direct local point of contact."}'::jsonb, true),
  ('business', '{"name":"Adarsh Computers","owner":"Siyacharan","email":"adarshcomputer203@gmail.com","phone":"7678570614","secondary_phone":"8506006504","address":"203, Osian Building, 12, Nehru Place, Near Nehru Enclave Metro Station Gate No. 2, New Delhi - 110019","gstin":"07FNERPK4184N1ZE","whatsapp":"7678570614","brands":["Dell","Intel","LG","HP","Canon","Lenovo"],"map_url":"https://maps.google.com/?q=203%2C%20Osian%20Building%2C%2012%2C%20Nehru%20Place%2C%20New%20Delhi%20110019"}'::jsonb, true)
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-media', 'business-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public can view business media') then
    create policy "Public can view business media" on storage.objects for select to anon, authenticated using (bucket_id = 'business-media');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins upload business media') then
    create policy "Admins upload business media" on storage.objects for insert to authenticated with check (bucket_id = 'business-media' and (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins update business media') then
    create policy "Admins update business media" on storage.objects for update to authenticated using (bucket_id = 'business-media' and (select public.is_adarsh_admin())) with check (bucket_id = 'business-media' and (select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins delete business media') then
    create policy "Admins delete business media" on storage.objects for delete to authenticated using (bucket_id = 'business-media' and (select public.is_adarsh_admin()));
  end if;
end;
$$;


