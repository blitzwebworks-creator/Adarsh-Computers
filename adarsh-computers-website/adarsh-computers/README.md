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

The additive migration is `supabase/migrations/202610300001_initial_business_schema.sql`. Before applying it, inspect the existing `public` tables and the `business-media` Storage bucket in the Supabase dashboard. It uses `create table if not exists`, `create index if not exists`, and `on conflict do nothing`; it contains no table drops or data-clearing statements. If a same-named table already exists with a different schema, stop and reconcile its columns and policies before applying the migration. The migration is a file only; it has not been applied to the remote project.

Apply the reviewed migration in the Supabase SQL Editor. It creates `profiles`, `categories`, `products`, `services`, `enquiries`, `testimonials` and `site_settings`, enables RLS, applies public-read/admin-write policies, seeds the provided business information and category taxonomy only when those keys/slugs are absent, and creates a public-read `business-media` bucket with administrator-only uploads and deletes. If that bucket already exists, review its visibility and limits manually; the migration intentionally does not change its existing configuration.

## Initial administrator setup

There is no public registration page or role-assignment endpoint.

1. In Supabase **Authentication → Settings**, disable new user sign-ups. Keep email/password sign-in enabled for invited administrators.
2. In **Authentication → Users**, invite or create the first owner account using a trusted email address. The database trigger creates a profile with the non-admin `customer` role.
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

4. Add `http://localhost:3000/auth/callback` and your deployed site's `/auth/callback` URL to Supabase **Authentication → URL Configuration → Redirect URLs**.
5. Sign in at `/admin/login`. The app verifies the session and profile role on the server; the Next.js Proxy refreshes Supabase cookie sessions. Production cookies use `Secure` and `SameSite=Lax`.
6. To add another administrator, create/invite that Auth user in the Supabase dashboard and assign `admin` or `editor` in the SQL Editor. Do not grant roles through client-side input.

The public website can be viewed before setting up an administrator. The admin console requires the migration and an authorized profile.

## Database and storage access

- Public visitors can read active categories and published products, services, testimonials and public settings.
- Public visitors can insert new enquiries with the `New` status. They cannot read, update or delete enquiries.
- Only authenticated owner/admin/editor profiles can manage catalog data, settings, testimonials, enquiry statuses and Storage objects.
- Profile role changes are available only to a trusted project owner through Supabase Auth and the SQL Editor.
- Product, category, service and logo uploads use the `business-media` bucket. Accepted image formats are JPEG, PNG, WebP and AVIF, with a 5 MB limit.

## Project structure

```text
src/app/(site)/        Public pages
src/app/admin/         Login, password recovery and protected dashboard
src/app/api/enquiries/ Validated enquiry endpoint
src/components/        Public, admin and shadcn-style UI components
src/lib/supabase/      Browser, server and Proxy clients
src/lib/actions/       Auth and administrator-only database actions
supabase/migrations/   Additive database and RLS migration
```

## Commands

- `pnpm dev` — local development server
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm typecheck` — TypeScript check
