# Privacy and security review

**Review date:** 9 November 2026  
**Scope:** existing Adarsh Computers Next.js and Supabase source in this package. The production database and hosting account were not accessed or modified.

## Existing system reviewed

- Next.js App Router, TypeScript and React, with Supabase Auth, SSR cookies, Postgres, Row Level Security and Storage.
- Public catalogue, product details, services, About and Contact pages, cart and WhatsApp order request, customer accounts, and a role-protected admin dashboard.
- The checkout saves an order request and prepares a WhatsApp message. It does not take online payment and has no payment gateway or payment webhook.
- Product, category, service and business-media images use the existing public `business-media` bucket. Upload and mutation access is administrator-only; the project limits accepted image MIME types and size.
- Personal data includes account email/name, saved delivery/contact details, order contents and statuses, enquiry details, and the new privacy-request fields. The cart remains in browser local storage. The map embed loads only after the visitor asks to load it; WhatsApp opens only when selected.

## Changes in this update

- Added legal information pages for privacy, cookies/browser storage, terms, shipping/delivery, cancellations/refunds, grievances and privacy requests. The copy describes the currently implemented WhatsApp order flow and does not invent a payment, delivery, refund or warranty promise.
- Added separate, unchecked consent controls for account registration, profile saves, order requests, enquiries and privacy requests. Each submitted consent is tied to a notice version and timestamp.
- Added a privacy-request intake and private administrator review queue. The database limits access to authorized administrators; the workflow requires identity verification before requests can be moved to `In progress` or `Completed`. Requests are reviewed manually; submitting a request does not automatically erase records.
- Replaced direct anonymous enquiry inserts with a server-side validated endpoint. The additive migration adds request-body limits, honeypot handling and per-connection hourly rate limits. The rate-limit table stores a hash instead of the raw connection fingerprint and cleans old entries during later intake.
- Added an identity-verification database constraint, privacy-request notifications, and links from the public footer and admin navigation.
- Added HTTP hardening headers including `nosniff`, frame denial, a restrictive referrer policy, a permissions policy and production HSTS.
- Added a server-only Supabase service-role client for these public intake endpoints. The secret is not in client modules or the example environment file.

## Controls preserved

- Admin pages and server actions retain server-side role checks; the migration relies on existing role-aware RLS and does not disable RLS.
- Public product data remains readable. Customer profiles and orders remain owner-scoped under existing RLS, while administrator permissions remain role-scoped.
- The privacy migration is additive and does not delete existing enquiries, orders or products. Direct anonymous enquiry insertion is intentionally revoked after the new intake route is deployed.
- Email confirmation remains enabled; existing password/session behavior and website features are retained.

## Deployment tasks and known gaps

1. Review the current Supabase schema and policies for same-named objects, take a database backup, then apply `supabase/migrations/202611090001_privacy_requests_and_public_intake.sql` after the existing migrations. This migration has **not** been run against production.
2. Set `SUPABASE_SERVICE_ROLE_KEY` as an encrypted server-only hosting variable, then redeploy. Never expose it with a `NEXT_PUBLIC_` prefix.
3. Confirm the hosting provider supplies a trustworthy client IP header; otherwise rate limits will share the fallback fingerprint or may not distinguish visitors as intended.
4. The business has not supplied a named privacy/grievance contact or retention durations. Add the real contact and approve a retention schedule before presenting those as settled policy.
5. Review privacy, customer terms, shipping and cancellation copy with a qualified India privacy/consumer-law adviser. This software review is not legal advice or a compliance certification.
6. The consent audit stores a notice version, purpose and timestamp. Keep notice versions stable and increment the application constant when the notice text changes materially.
7. Privacy requests are queued for human review. Administrators must verify identity, assess applicable retention obligations, and take any approved action outside the automatic form-submission flow.

## Verification performed

- TypeScript check: passed on the source copy.
- Next.js production compilation: passed in isolated `--experimental-build-mode compile` with a single build worker and placeholder environment values.
- Full static generation: blocked in this restricted Windows environment by `EPERM` while Next.js tried to create `.next/server/app/_global-error.segments/_global-error`. The normal Turbopack build also encountered a worker-process panic. This is an environment build limitation; a complete deploy build still needs to pass in the target build environment.
- No automated test or lint script is defined in `package.json`. No production Supabase, storage, sign-in, admin, or end-to-end form test was run because the migration and server secret were not applied/configured.
- Reviewed the legal phase-in against the official Gazette commencement notification and MeitY's notified Rules/corrigendum. The principal 18-month tranche is scheduled for May 2027; this does not mean other legal obligations are absent today.
