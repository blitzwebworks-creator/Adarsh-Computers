-- Additive store expansion for product details, discounts, customer profiles and orders.
-- Existing catalogue, profiles and business data are preserved.

create extension if not exists pgcrypto with schema extensions;

alter table public.products
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists specifications jsonb not null default '{}'::jsonb;

create table if not exists public.customer_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  pincode text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  amount numeric(12, 2) not null check (amount > 0 and (discount_type <> 'percentage' or amount <= 100)),
  minimum_subtotal numeric(12, 2) not null default 0 check (minimum_subtotal >= 0),
  maximum_discount numeric(12, 2) check (maximum_discount is null or maximum_discount > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_code_date_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index if not exists discount_codes_code_upper_idx on public.discount_codes (upper(code));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  guest_token_hash text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  delivery_address text not null,
  city text,
  state text,
  pincode text,
  notes text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  discount_code text,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'WhatsApp Contacted', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  brand text,
  image_url text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists discount_codes_active_idx on public.discount_codes (is_active, ends_at);

alter table public.customer_details enable row level security;
alter table public.discount_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select, insert, update on public.customer_details to authenticated;
grant select, insert, update, delete on public.discount_codes to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_details' and policyname = 'Customers manage their own details') then
    create policy "Customers manage their own details" on public.customer_details for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'discount_codes' and policyname = 'Admins manage discount codes') then
    create policy "Admins manage discount codes" on public.discount_codes for all to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Customers read their own orders') then
    create policy "Customers read their own orders" on public.orders for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Admins read all orders') then
    create policy "Admins read all orders" on public.orders for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Admins update orders') then
    create policy "Admins update orders" on public.orders for update to authenticated using ((select public.is_adarsh_admin())) with check ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'Customers read their own order items') then
    create policy "Customers read their own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'Admins read all order items') then
    create policy "Admins read all order items" on public.order_items for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
end $$;

create or replace function public.validate_adarsh_discount(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code public.discount_codes%rowtype;
  v_discount numeric(12,2);
begin
  if p_subtotal is null or p_subtotal < 0 then
    return jsonb_build_object('valid', false, 'message', 'Invalid order subtotal.');
  end if;
  select * into v_code from public.discount_codes where upper(code) = upper(trim(coalesce(p_code, '')));
  if not found or not v_code.is_active then
    return jsonb_build_object('valid', false, 'message', 'That discount code is not available.');
  end if;
  if v_code.starts_at is not null and now() < v_code.starts_at then
    return jsonb_build_object('valid', false, 'message', 'That discount code is not active yet.');
  end if;
  if v_code.ends_at is not null and now() >= v_code.ends_at then
    return jsonb_build_object('valid', false, 'message', 'That discount code has expired.');
  end if;
  if v_code.usage_limit is not null and v_code.used_count >= v_code.usage_limit then
    return jsonb_build_object('valid', false, 'message', 'That discount code has reached its usage limit.');
  end if;
  if p_subtotal < v_code.minimum_subtotal then
    return jsonb_build_object('valid', false, 'message', 'Your cart does not meet the minimum for that code.');
  end if;
  v_discount := case when v_code.discount_type = 'percentage' then round(p_subtotal * v_code.amount / 100, 2) else v_code.amount end;
  v_discount := least(v_discount, p_subtotal, coalesce(v_code.maximum_discount, v_discount));
  return jsonb_build_object('valid', true, 'code', v_code.code, 'discount_amount', v_discount, 'message', 'Discount applied.');
end;
$$;

create or replace function public.create_adarsh_order(p_items jsonb, p_customer jsonb, p_discount_code text, p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_reference text;
  v_item jsonb;
  v_product record;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_qty integer;
  v_product_id uuid;
  v_code public.discount_codes%rowtype;
  v_code_text text := nullif(upper(trim(coalesce(p_discount_code, ''))), '');
  v_name text := trim(coalesce(p_customer->>'full_name', ''));
  v_phone text := trim(coalesce(p_customer->>'phone', ''));
  v_email text := trim(coalesce(p_customer->>'email', ''));
  v_address text := trim(coalesce(p_customer->>'address', ''));
begin
  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'Your cart is empty or contains too many products.';
  end if;
  if char_length(v_name) not between 2 and 120 or char_length(v_phone) not between 7 and 30 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' or char_length(v_address) not between 5 and 500 then
    raise exception 'Please enter valid required customer details.';
  end if;
  if nullif(p_access_token, '') is null then raise exception 'Order access token is missing.'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_product_id := (v_item->>'id')::uuid;
      v_qty := (v_item->>'quantity')::integer;
    exception when others then raise exception 'Your cart contains an invalid product.';
    end;
    if v_qty < 1 or v_qty > 20 then raise exception 'Choose a quantity between 1 and 20.'; end if;
    select p.id, p.name, p.brand, p.image_url, p.price, p.availability, p.stock_quantity
      into v_product from public.products p
      where p.id = v_product_id and p.is_published = true and p.availability <> 'Out of stock'
      for share;
    if not found or v_product.price is null then raise exception 'A product in your cart is no longer available at a listed price.'; end if;
    if v_product.stock_quantity is not null and v_qty > v_product.stock_quantity then raise exception 'A product in your cart no longer has enough stock.'; end if;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'brand', v_product.brand,
      'image_url', v_product.image_url, 'unit_price', v_product.price, 'quantity', v_qty,
      'line_total', round(v_product.price * v_qty, 2)
    ));
  end loop;

  if v_code_text is not null then
    select * into v_code from public.discount_codes where upper(code) = v_code_text for update;
    if not found or not v_code.is_active or (v_code.starts_at is not null and now() < v_code.starts_at) or (v_code.ends_at is not null and now() >= v_code.ends_at) or (v_code.usage_limit is not null and v_code.used_count >= v_code.usage_limit) or v_subtotal < v_code.minimum_subtotal then
      raise exception 'The discount code is no longer valid. Review your cart and try again.';
    end if;
    v_discount := case when v_code.discount_type = 'percentage' then round(v_subtotal * v_code.amount / 100, 2) else v_code.amount end;
    v_discount := least(v_discount, v_subtotal, coalesce(v_code.maximum_discount, v_discount));
  end if;
  v_total := greatest(0, v_subtotal - v_discount);
  v_reference := 'AC-' || to_char(now() at time zone 'UTC', 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (id, reference, user_id, guest_token_hash, customer_name, customer_phone, customer_email, delivery_address, city, state, pincode, notes, subtotal, discount_amount, discount_code, total)
  values (v_order_id, v_reference, auth.uid(), encode(extensions.digest(convert_to(p_access_token, 'UTF8'), 'sha256'), 'hex'), v_name, v_phone, v_email, v_address,
    nullif(trim(coalesce(p_customer->>'city', '')), ''), nullif(trim(coalesce(p_customer->>'state', '')), ''), nullif(trim(coalesce(p_customer->>'pincode', '')), ''),
    nullif(left(trim(coalesce(p_customer->>'notes', '')), 2000), ''), v_subtotal, v_discount, v_code_text, v_total);

  insert into public.order_items (order_id, product_id, product_name, brand, image_url, unit_price, quantity, line_total)
  select v_order_id, (line->>'product_id')::uuid, line->>'name', nullif(line->>'brand', ''), nullif(line->>'image_url', ''), (line->>'unit_price')::numeric, (line->>'quantity')::integer, (line->>'line_total')::numeric
  from jsonb_array_elements(v_lines) line;

  if v_code_text is not null then update public.discount_codes set used_count = used_count + 1, updated_at = now() where id = v_code.id; end if;

  if auth.uid() is not null then
    insert into public.customer_details (user_id, full_name, phone, email, address, city, state, pincode, updated_at)
    values (auth.uid(), v_name, v_phone, v_email, v_address, coalesce(p_customer->>'city', ''), coalesce(p_customer->>'state', ''), coalesce(p_customer->>'pincode', ''), now())
    on conflict (user_id) do update set full_name = excluded.full_name, phone = excluded.phone, email = excluded.email, address = excluded.address, city = excluded.city, state = excluded.state, pincode = excluded.pincode, updated_at = now();
  end if;

  return jsonb_build_object('id', v_order_id, 'reference', v_reference, 'subtotal', v_subtotal, 'discount_amount', v_discount, 'discount_code', v_code_text, 'total', v_total, 'items', v_lines);
end;
$$;

create or replace function public.get_adarsh_order(p_reference text, p_access_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id, 'reference', o.reference, 'customer_name', o.customer_name, 'customer_phone', o.customer_phone,
    'customer_email', o.customer_email, 'delivery_address', o.delivery_address, 'city', o.city, 'state', o.state,
    'pincode', o.pincode, 'notes', o.notes, 'subtotal', o.subtotal, 'discount_amount', o.discount_amount,
    'discount_code', o.discount_code, 'total', o.total, 'status', o.status, 'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_id', i.product_id, 'product_name', i.product_name, 'brand', i.brand, 'image_url', i.image_url, 'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total) order by i.created_at)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.reference = p_reference and (
    (auth.uid() is not null and o.user_id = auth.uid()) or
    (p_access_token is not null and o.guest_token_hash = encode(extensions.digest(convert_to(p_access_token, 'UTF8'), 'sha256'), 'hex'))
  )
  limit 1;
$$;

revoke all on function public.validate_adarsh_discount(text, numeric) from public;
revoke all on function public.create_adarsh_order(jsonb, jsonb, text, text) from public;
revoke all on function public.get_adarsh_order(text, text) from public;
grant execute on function public.validate_adarsh_discount(text, numeric) to anon, authenticated;
grant execute on function public.create_adarsh_order(jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.get_adarsh_order(text, text) to anon, authenticated;
