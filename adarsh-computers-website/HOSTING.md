# Hosting Adarsh Computers

This is a Next.js application with server-rendered pages and Supabase-backed server actions. Deploy it to a Next.js hosting provider such as Vercel; it is not a static HTML export.

## Deploy with Vercel

1. Extract the project ZIP.
2. Put the extracted project files in a private GitHub repository, excluding `.env.local` (it is already excluded by `.gitignore`). Alternatively, from the project folder, use the Vercel CLI: `pnpm install`, `pnpm exec vercel`, then `pnpm exec vercel --prod`.
3. Import the repository in Vercel. Set **Root Directory** to the folder that contains this project's `package.json` and `pnpm-lock.yaml` (`./` when those files are at the repository root). Vercel should then detect Next.js; leave the default build settings.
4. In the Vercel project settings, configure these environment variables for Preview and Production:

   - `NEXT_PUBLIC_SUPABASE_URL` — `https://wmhxydqmyzlmjxbrbmbx.supabase.co`.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key.
   - `NEXT_PUBLIC_SITE_URL` — the production site URL, for example `https://your-domain.com`.

   Also set `SUPABASE_SERVICE_ROLE_KEY` to the Supabase service-role secret for server-side public-form intake only. Store it only in encrypted hosting environment variables; never prefix it with `NEXT_PUBLIC_`, include it in browser code, or commit it. Redeploy after changing environment variables. Contact and privacy-request forms report unavailable until it is configured.

If a build reports `NEXT_NO_VERSION`, confirm that the selected Root Directory and deployed Git commit both contain this project's `package.json` with `next` listed in `dependencies`. The `cache-dir` npm warning is separate; remove a nonstandard `cache-dir` entry from `.npmrc` or Vercel environment variables if one was added.

## Supabase setup before using admin or database features

1. In the Supabase SQL Editor, inspect existing public tables, policies, and the `business-media` bucket. The migration is additive and does not drop tables or data, but same-named objects with a different schema need to be reconciled before applying it.
2. Inspect the current schema, RLS policies and Storage bucket. Review and apply the SQL migrations in filename order: `202610300001_initial_business_schema.sql`, `202610300002_store_orders_customers.sql`, `202610310001_update_business_maps_location.sql`, `202611010001_admin_realtime_order_management.sql`, and `202611010002_admin_delete_orders.sql`. They preserve existing rows. Reconcile any same-named tables with different schemas before applying them. The final migration enables deletion for authorized administrators only; order items, notes, status history and the linked order notification are deleted with the order.
3. In Supabase Authentication settings, enable email/password customer sign-ups if you want customer accounts and keep email confirmation enabled. Public sign-ups receive the `customer` role only. Invite/create the owner through the dashboard and assign its `owner` role using the SQL in `README.md`.
4. In Supabase Authentication → URL Configuration, set the Site URL to the production URL and add `https://your-domain.com/auth/callback` to Redirect URLs. Keep `http://localhost:3000/auth/callback` for local confirmation and password reset flows. Add an exact preview URL only if you use preview deployments.
5. Test customer sign-up and email confirmation, sign-in with Remember Me, logout, protected checkout redirect, cart preservation, enquiry submission, WhatsApp order preparation, and the admin order/notification views after migrations are applied. The current checkout does not collect payment and no payment gateway/webhook is configured; orders remain pending WhatsApp confirmation until the store confirms them. Payment status fields in admin are bookkeeping only.
6. The final migration adds `orders`, `enquiries`, and `admin_notifications` to the Supabase Realtime publication when that publication exists. Check Supabase Realtime is available for the project. The admin interface indicates whether the live subscription is connected and polls every 30 seconds only while disconnected.

## Local production build

```bash
pnpm install
pnpm build
pnpm start
```

The site is served at `http://localhost:3000`.

## References

- [Vercel deployment methods](https://vercel.com/docs/deployments)
- [Supabase Auth redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)

## Privacy-specific setup

- Also inspect and apply `supabase/migrations/202611090001_privacy_requests_and_public_intake.sql` after the listed existing migrations. It adds a private privacy-request queue and rate-limit table, routes public enquiries through server-only functions, and disables direct anonymous enquiry inserts. Existing enquiry data is preserved.
- Review the privacy notice, cookie notice, terms, shipping/delivery, cancellation/refund, grievance and privacy-request pages with the business's legal adviser before relying on them as final terms.
- The business must decide and document retention periods for enquiries, customer profiles, orders and privacy requests. The website does not invent fixed periods or automatically erase records.
- No named privacy/grievance contact has been supplied. Confirm who handles these requests and add that real contact detail before making public legal claims.
- No marketing or analytics tracking is configured. There are no marketing consent boxes. The Google map loads only after the visitor selects “Load map”.
- The public form limit is six submissions per connection fingerprint per hour for each form type. A trustworthy client IP header must be supplied by the hosting platform for the limit to distinguish visitors.
- The rate-limit table stores a one-way hash of the server-provided connection fingerprint, and cleans old entries when later forms are submitted. It does not store raw IP addresses in that table.
- Do not claim full DPDP Act compliance based on code changes alone. Verify actual business purposes, retention, rights handling, complaint handling and applicable legal obligations.

## Rollback

- Back up Supabase before applying migrations. To roll back application code, redeploy the previous known-good deployment.
- Keep the additive privacy-request and consent tables after an application rollback; do not drop submitted requests or consent records as part of a code rollback.
- The privacy migration revokes the old direct browser enquiry insert. A previous app's contact form will not work unless an administrator restores that insert grant and policy, which also brings back a less protected intake path. Prefer retaining the new server API and encrypted server key.
- Restore `SUPABASE_SERVICE_ROLE_KEY` in encrypted hosting settings and redeploy if either public form endpoint reports unavailable.
