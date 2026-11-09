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

Open <http://localhost:3000>. Create `.env.local` in the project root from `.env.example` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the server-only `SUPABASE_SERVICE_ROLE_KEY` for enquiry/privacy intake. The file is excluded from Git and from the delivery ZIP. Never expose the service-role key in browser code or commit `.env.local`.

## Supabase schema and data safety

The additive migrations are in `supabase/migrations/`. Before applying them, inspect the existing `public` tables, policies and `business-media` Storage bucket in the Supabase dashboard. They create new objects or add columns and do not drop tables or clear data. The files are migration scripts only and must be applied to the remote project before using the database-backed features.

Apply the reviewed migrations in filename order in the Supabase SQL Editor. Migrations 001 and 002 create the original business schema, customer details, discount codes, orders and order items. Migration 003 updates the map location. Migration 004 adds payment bookkeeping fields, order notes and status history, internal admin notifications, dashboard statistics, Realtime publication entries, and an authenticated-customer-only order RPC. Migration 005 grants order deletion only to authorized admins; order items, notes, status history and the linked order notification are removed with the order. Existing orders and enquiries are retained by the migrations. If a same-named table has a different schema, review and reconcile it before applying the relevant migration.
Migration `202611090001_privacy_requests_and_public_intake.sql` adds the private privacy-request queue and rate limits. Apply it after the five existing migrations. It also removes direct anonymous enquiry insert permissions; the app's server-only intake API uses the service-role secret. It does not delete existing enquiries.

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
- Public visitors submit enquiries through a server-only validated and throttled endpoint; direct anonymous table inserts are disabled. Visitors cannot read, update or delete enquiries. Admins receive persistent in-dashboard notifications for new enquiries and orders; Supabase Realtime updates the dashboard and falls back to a 30-second refresh when the live channel is unavailable.
- Order totals are calculated from current published product prices in a database function; discount codes are validated there and usage limits are incremented atomically.
- Customers can browse and build a cart without signing in, but must sign in before checkout. The login redirect returns them to checkout and the cart is preserved. Authenticated customers can only read their own orders; administrators can manage all orders and internal notes.
- Remember Me stores the Supabase session in secure, same-site cookies for up to 30 days. Without it, the session uses browser-session cookies. Supabase email confirmation remains enabled.
- The existing checkout prepares an order for WhatsApp confirmation; it does not collect online payment and there is no payment gateway or webhook in this project. Order payment fields are administrator bookkeeping only, and dashboard revenue includes orders manually marked paid.
- Only authenticated owner/admin/editor profiles can manage catalogue data, orders, discount codes, settings, testimonials, enquiry statuses and Storage objects.
- Profile role changes are available only to a trusted project owner through Supabase Auth and the SQL Editor.
- Product, category, service and logo uploads use the `business-media` bucket. Accepted image formats are JPEG, PNG, WebP and AVIF, with a 5 MB limit.
- Products support one main photo and up to four additional detail photos. Product photos upload directly to Supabase Storage under administrator-only upload policies; existing listings retain their current galleries.
- Privacy requests (access, correction, deletion, consent withdrawal or another privacy concern) are submitted through `/privacy-request` and reviewed at `/admin/privacy-requests`. Only authorized admins can read or update the queue. The interface requires an admin to mark identity verified before moving a request into progress or completing it; no record is automatically erased.
- Public privacy/legal pages explain current account, enquiry, cart, order, Google Maps and WhatsApp flows. Google Maps is click-to-load. No marketing or analytics tracking is configured. These pages are operational notices, not a compliance certificate.
- The additive privacy migration creates private request and rate-limit tables and disables direct anonymous enquiry inserts. Public form intake uses `SUPABASE_SERVICE_ROLE_KEY` only on the server; keep it secret and never use a `NEXT_PUBLIC_` prefix.
- The privacy migration records the notice version and timestamp for affirmative account, profile, checkout, enquiry and privacy-request choices. Public forms have request-size limits and server-side rate checks; the connection fingerprint is hashed before rate-limit storage.
- Security review: authenticated admin routes and data actions retain server-side role checks; public catalogue media is intentionally readable while uploads and mutations remain admin-only under RLS. Public enquiries now use a validated server-only intake path. HTTP hardening headers were added. The review did not connect to the live Supabase project or constitute a penetration test.
- Deployment readiness depends on applying the privacy migration and setting encrypted server-only `SUPABASE_SERVICE_ROLE_KEY`; without both, public enquiry and privacy-request submissions are unavailable. This source package does not change the live database or hosting environment.

## Rollback

- Back up the Supabase database before applying migrations. Roll back an application deployment by redeploying the preceding known-good source release.
- The new privacy migration is additive and preserves existing enquiry rows. Do not drop privacy requests or consent records as part of an application rollback.
- After the privacy migration, the earlier browser-direct enquiry insert is revoked. The old application contact form will remain blocked unless an administrator deliberately restores the former insert permission and policy, which also restores a less protected public intake path. Prefer retaining the new server intake route and its encrypted service-role environment variable.
- If a public form reports unavailable, restore `SUPABASE_SERVICE_ROLE_KEY` in encrypted hosting settings and redeploy.

See [`PRIVACY-SECURITY-REVIEW.md`](PRIVACY-SECURITY-REVIEW.md) for the audit scope, controls, verification results and remaining business setup.

## Project structure

```text
src/app/(site)/        Public pages, product detail, cart, checkout and customer accounts
src/app/admin/         Login, password recovery and protected dashboard
src/app/api/               Validated public enquiry and privacy-request endpoints
src/components/        Public, admin and shadcn-style UI components
src/lib/supabase/      Browser, server and Proxy clients
src/lib/actions/       Customer/auth, checkout and administrator-only database actions
supabase/migrations/   Additive database, RLS, order history, Realtime and privacy-intake migrations
```

## Commands

- `pnpm dev` — local development server
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm typecheck` — TypeScript check
