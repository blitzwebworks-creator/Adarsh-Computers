-- Additive order workflow, audit notes and durable admin notifications.
-- Existing customers, orders and enquiries are retained.

alter table public.orders
  add column if not exists payment_status text not null default 'not_required',
  add column if not exists payment_method text not null default 'WhatsApp',
  add column if not exists payment_transaction_id text;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Pending', 'New', 'WhatsApp Contacted', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded'));

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('New', 'Unread', 'Read', 'Contacted', 'In Progress', 'Resolved', 'Completed'));

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null check (char_length(trim(note)) between 1 and 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_notes_order_created_idx on public.order_notes(order_id, created_at desc);
alter table public.order_notes enable row level security;
grant select, insert on public.order_notes to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_notes' and policyname='Admins read order notes') then
    create policy "Admins read order notes" on public.order_notes for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_notes' and policyname='Admins add order notes') then
    create policy "Admins add order notes" on public.order_notes for insert to authenticated with check ((select public.is_adarsh_admin()) and created_by = (select auth.uid()));
  end if;
end $$;

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint order_status_event_once unique(order_id, created_at)
);
create index if not exists order_status_events_order_created_idx on public.order_status_events(order_id, created_at desc);
alter table public.order_status_events enable row level security;
grant select on public.order_status_events to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_status_events' and policyname='Admins read order status events') then
    create policy "Admins read order status events" on public.order_status_events for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
end $$;
insert into public.order_status_events(order_id, from_status, to_status, changed_by, created_at)
select id, null, status, null, created_at from public.orders
on conflict (order_id, created_at) do nothing;
create or replace function public.record_adarsh_order_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_events(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
revoke all on function public.record_adarsh_order_status_change() from public, anon, authenticated;
drop trigger if exists adarsh_order_status_history_update on public.orders;
create trigger adarsh_order_status_history_update after update of status on public.orders for each row execute function public.record_adarsh_order_status_change();

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('order', 'enquiry')),
  reference_id uuid not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint admin_notifications_once unique(type, reference_id)
);
create unique index if not exists admin_notifications_type_reference_once_idx on public.admin_notifications(type, reference_id);
create index if not exists admin_notifications_created_idx on public.admin_notifications(created_at desc);
create index if not exists admin_notifications_unread_idx on public.admin_notifications(is_read, created_at desc);
alter table public.admin_notifications enable row level security;
grant select on public.admin_notifications to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_notifications' and policyname='Admins read notifications') then
    create policy "Admins read notifications" on public.admin_notifications for select to authenticated using ((select public.is_adarsh_admin()));
  end if;
end $$;

create or replace function public.notify_adarsh_order()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_notifications(type, reference_id, title, message)
  values ('order', new.id, 'New Order Received!', new.reference || ' · ' || new.customer_name || ' · ₹' || new.total::text)
  on conflict (type, reference_id) do nothing;
  return new;
end;
$$;
create or replace function public.notify_adarsh_enquiry()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_notifications(type, reference_id, title, message)
  values ('enquiry', new.id, 'New Customer Enquiry!', new.name || ' · ' || coalesce(new.interested_in, 'General enquiry'))
  on conflict (type, reference_id) do nothing;
  return new;
end;
$$;
revoke all on function public.notify_adarsh_order() from public, anon, authenticated;
revoke all on function public.notify_adarsh_enquiry() from public, anon, authenticated;
drop trigger if exists adarsh_order_notification_insert on public.orders;
create trigger adarsh_order_notification_insert after insert on public.orders for each row execute function public.notify_adarsh_order();
drop trigger if exists adarsh_enquiry_notification_insert on public.enquiries;
create trigger adarsh_enquiry_notification_insert after insert on public.enquiries for each row execute function public.notify_adarsh_enquiry();

create or replace function public.mark_adarsh_notification_read(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_adarsh_admin() then raise exception 'Administrator access required.'; end if;
  update public.admin_notifications set is_read = true where id = p_id;
  return found;
end;
$$;
create or replace function public.mark_all_adarsh_notifications_read()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not public.is_adarsh_admin() then raise exception 'Administrator access required.'; end if;
  update public.admin_notifications set is_read = true where not is_read;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.mark_adarsh_notification_read(uuid) from public, anon;
revoke all on function public.mark_all_adarsh_notifications_read() from public, anon;
grant execute on function public.mark_adarsh_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_adarsh_notifications_read() to authenticated;

create or replace function public.get_adarsh_admin_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_stats jsonb;
begin
  if not public.is_adarsh_admin() then raise exception 'Administrator access required.'; end if;
  select jsonb_build_object(
    'total_products', (select count(*) from public.products),
    'active_products', (select count(*) from public.products where is_published),
    'new_enquiries', (select count(*) from public.enquiries where status in ('New','Unread')),
    'total_categories', (select count(*) from public.categories),
    'total_revenue', coalesce((select sum(total) from public.orders where payment_status = 'paid' and status <> 'Cancelled'), 0),
    'total_orders', (select count(*) from public.orders),
    'new_orders', (select count(*) from public.orders where status in ('Pending','New')),
    'processing_orders', (select count(*) from public.orders where status in ('Confirmed','Processing','Packed')),
    'shipped_orders', (select count(*) from public.orders where status = 'Shipped'),
    'delivered_orders', (select count(*) from public.orders where status = 'Delivered'),
    'cancelled_orders', (select count(*) from public.orders where status = 'Cancelled'),
    'total_enquiries', (select count(*) from public.enquiries),
    'unread_enquiries', (select count(*) from public.enquiries where status in ('New','Unread')),
    'registered_customers', (select count(*) from public.profiles where role = 'customer'),
    'unread_notifications', (select count(*) from public.admin_notifications where not is_read)
  ) into v_stats;
  return v_stats;
end;
$$;
revoke all on function public.get_adarsh_admin_stats() from public, anon;
grant execute on function public.get_adarsh_admin_stats() to authenticated;

-- Place orders only through authenticated customer accounts. No payment gateway
-- exists in this project, so the orders remain pending WhatsApp confirmation.
create or replace function public.create_adarsh_order(p_items jsonb, p_customer jsonb, p_discount_code text, p_access_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
  if auth.uid() is null or not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer') then
    raise exception 'Sign in to a customer account before placing an order.';
  end if;
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
  insert into public.customer_details (user_id, full_name, phone, email, address, city, state, pincode, updated_at)
  values (auth.uid(), v_name, v_phone, v_email, v_address, coalesce(p_customer->>'city', ''), coalesce(p_customer->>'state', ''), coalesce(p_customer->>'pincode', ''), now())
  on conflict (user_id) do update set full_name = excluded.full_name, phone = excluded.phone, email = excluded.email, address = excluded.address, city = excluded.city, state = excluded.state, pincode = excluded.pincode, updated_at = now();

  return jsonb_build_object('id', v_order_id, 'reference', v_reference, 'subtotal', v_subtotal, 'discount_amount', v_discount, 'discount_code', v_code_text, 'total', v_total, 'items', v_lines);
end;
$$;
revoke all on function public.create_adarsh_order(jsonb, jsonb, text, text) from anon, public;
grant execute on function public.create_adarsh_order(jsonb, jsonb, text, text) to authenticated;

alter table public.orders replica identity full;
alter table public.enquiries replica identity full;
alter table public.admin_notifications replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then alter publication supabase_realtime add table public.orders; end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='enquiries') then alter publication supabase_realtime add table public.enquiries; end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='admin_notifications') then alter publication supabase_realtime add table public.admin_notifications; end if;
  end if;
end $$;
