-- Allow authorized administrators to delete orders while keeping customer data protected.
-- Existing order items, team notes, and status events use ON DELETE CASCADE.

grant delete on table public.orders to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'Admins delete orders'
  ) then
    create policy "Admins delete orders"
      on public.orders
      for delete
      to authenticated
      using ((select public.is_adarsh_admin()));
  end if;
end
$$;

-- Notifications are polymorphic (orders and enquiries), so remove an order notification
-- in the same transaction when its order is deleted.
create or replace function public.cleanup_adarsh_order_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.admin_notifications
  where type = 'order' and reference_id = old.id;
  return old;
end;
$$;

revoke all on function public.cleanup_adarsh_order_notification() from public, anon, authenticated;
drop trigger if exists adarsh_order_notification_cleanup on public.orders;
create trigger adarsh_order_notification_cleanup
  after delete on public.orders
  for each row execute function public.cleanup_adarsh_order_notification();
