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

   Do not add a Supabase service-role or secret key to this app. Redeploy after changing environment variables.

If a build reports `NEXT_NO_VERSION`, confirm that the selected Root Directory and deployed Git commit both contain this project's `package.json` with `next` listed in `dependencies`. The `cache-dir` npm warning is separate; remove a nonstandard `cache-dir` entry from `.npmrc` or Vercel environment variables if one was added.

## Supabase setup before using admin or database features

1. In the Supabase SQL Editor, inspect existing public tables, policies, and the `business-media` bucket. The migration is additive and does not drop tables or data, but same-named objects with a different schema need to be reconciled before applying it.
2. Inspect the current schema, RLS policies and Storage bucket. Apply `supabase/migrations/202610300001_initial_business_schema.sql` if it has not already been applied, then apply `supabase/migrations/202610300002_store_orders_customers.sql`. Both migrations are additive; review and reconcile any existing same-named tables with a different schema first.
3. In Supabase Authentication settings, enable email/password customer sign-ups if you want customer accounts and keep email confirmation enabled. Public sign-ups receive the `customer` role only. Invite/create the owner through the dashboard and assign its `owner` role using the SQL in `README.md`.
4. In Supabase Authentication → URL Configuration, set the Site URL to the production URL and add `https://your-domain.com/auth/callback` to Redirect URLs. Keep `http://localhost:3000/auth/callback` for local confirmation and password reset flows. Add an exact preview URL only if you use preview deployments.
5. Test a customer sign-up, email confirmation, cart, checkout, WhatsApp prepared message and admin order view after the migration is applied. Do not treat the order as confirmed until the customer sends the WhatsApp message and the store confirms it.

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
