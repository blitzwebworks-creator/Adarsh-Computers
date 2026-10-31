# Adarsh Computers

A production-oriented Next.js website and Supabase-backed admin workspace for Adarsh Computers, Nehru Place, New Delhi.

## Stack

- Next.js App Router, React and TypeScript
- Tailwind CSS v4 with shadcn/ui configuration and reusable components
- Supabase Auth with `@supabase/ssr` cookie sessions and `@supabase/supabase-js`
- PostgreSQL tables, Row Level Security and Supabase Storage

## Run locally

Node.js 20.9 or newer and pnpm are required.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The project includes a local `.env.local`; it is excluded from Git. If you use a different Supabase project, update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` there. Do not add a service-role key to browser code or commit `.env.local`.

## Supabase schema and data safety

The additive migrations are `supabase/migrations/202610300001_initial_business_schema.sql` and `supabase/migrations/202610300002_store_orders_customers.sql`. Before applying them, inspect the existing `public` tables, policies and `business-media` Storage bucket in the Supabase dashboard. Both migrations create new objects or add columns; they do not drop tables or clear data. The files are migration scripts only and must be applied to the remote project before using the database-backed features.

Apply the reviewed migrations in order in the Supabase SQL Editor. Migration 001 creates the original business schema and policies. Migration 002 adds product gallery/specification fields, customer details, discount codes, orders, order items, server-side price/discount validation functions and guest order-access tokens. Order and customer records have RLS; guest order creation and token-authorized confirmation reads use narrowly scoped database functions. If an existing table has a different schema, review and reconcile it before applying the relevant migration.

## Initial administrator setup

Customer account registration is available at `/account/signup`; the database auth trigger assigns new accounts the `customer` role. There is no public administrator registration or role-assignment endpoint. Admin sign-in remains at `/admin/login` and checks the existing authorized roles server-side.

1. In Supabase **Authentication → Settings**, enable email/password customer sign-ups if you want customer accounts. Keep email confirmation enabled. New sign-ups receive only the `customer` role from the database trigger.
2. In **Authentication → Users**, invite or create the first owner account using a trusted email address. The database trigger initially creates a non-admin `customer` profile.
3. In the Supabase SQL Editor, replace the email below and run this owner-only statement. Check that exactly one row was affected:

   ```sql
   insert into public.profiles (id, email, role)
   select id, email, 'owner'
   from auth.users
   where lower(email) = lower('owner@example.com')
   on conflict (id) do update
     set email = excluded.email,
         role = 'owner';
   ```

4. Add `http://localhost:3000/auth/callback` and each deployed site's `/auth/callback` URL to Supabase **Authentication → URL Configuration → Redirect URLs**.
5. Sign in at `/admin/login`. The app verifies the session and profile role on the server; the Next.js Proxy refreshes Supabase cookie sessions. Production cookies use `Secure` and `SameSite=Lax`.
6. To add another administrator, invite that Auth user in Supabase and assign `admin` or `editor` in the SQL Editor. Do not grant roles through client-side input.

The public website can be viewed before setting up an administrator. The admin console requires the migration and an authorized profile.

## Database and storage access

- Public visitors can read active categories and published products, services, testimonials and public settings. Product photos use Next.js image optimization for the configured Supabase Storage host.
- Public visitors can insert new enquiries with the `New` status. They cannot read, update or delete enquiries.
- Order totals are calculated from current published product prices in a database function; discount codes are validated there and usage limits are incremented atomically.
- Guest orders can be created, but order/customer details are not publicly selectable. A short-lived HTTP-only browser cookie carries a random access token for the order-ready page. Authenticated customers can only read their own orders.
- Only authenticated owner/admin/editor profiles can manage catalogue data, orders, discount codes, settings, testimonials, enquiry statuses and Storage objects.
- Profile role changes are available only to a trusted project owner through Supabase Auth and the SQL Editor.
- Product, category, service and logo uploads use the `business-media` bucket. Accepted image formats are JPEG, PNG, WebP and AVIF, with a 5 MB limit.

## Project structure

```text
src/app/(site)/        Public pages, product detail, cart, checkout and customer accounts
src/app/admin/         Login, password recovery and protected dashboard
src/app/api/enquiries/ Validated enquiry endpoint
src/components/        Public, admin and shadcn-style UI components
src/lib/supabase/      Browser, server and Proxy clients
src/lib/actions/       Customer/auth, checkout and administrator-only database actions
supabase/migrations/   Additive database and RLS migration
```

## Commands

- `pnpm dev` — local development server
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm typecheck` — TypeScript check
