# Virsapur secure backend setup

> Hosted setup for Vercel. The default local Studio workflow remains separate and continues using SQLite.

The public website can deploy as a static build. Hosted member data, admin editing, booking requests and Stripe checkout use Supabase/Vercel endpoints and remain unavailable until the full setup is completed.

## Required order

1. Create a Supabase project and configure password authentication plus email confirmation behavior. Member signup is public; admin access is restricted by the `admin_profiles` role table.
2. Apply migrations `001_production_cms.sql` through `006_hosted_member_data.sql` in numeric order.
3. Create the initial Admin Auth user through Supabase, then add its `owner` row to `admin_profiles` using the verified user UUID.
4. Confirm through SQL/grant inspection that browser roles have no CMS, member, booking or Storage read/write access.
5. Import and verify approved content. Member wishlist, saved-trip, saved-article, quote and booking rows are created online after activation; existing local SQLite member data must be exported and migrated separately if it should carry over.
6. Set the Vercel environment values, first with hosted mutation flags disabled. Protect Preview deployments and verify the domain/canonical URL.
7. Test the member and Admin flows in a Preview deployment with test accounts, then enable quote and booking flags.
8. Set up Stripe's deployed webhook and test checkout, expiry, retry and admin decisions using Stripe test mode before enabling live payments.

## Secrets and environment values

`SUPABASE_SECRET_KEY` and `VERCEL_API_TOKEN` are server-only. The publishable key is used by server authentication calls; it is not used by public website JavaScript. Do not use a Deploy Hook—the publishing path creates and follows an exact versioned deployment.

Required for hosted accounts/Admin: `PRODUCTION_CMS_ENABLED=true`, `CMS_DATA_MODE=production`, `STUDIO_DATA_MODE=production`, `SITE_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`. Staged CMS publishing also needs Vercel token, project ID, project name, repository/provider/ref, and optional team ID. Enable `CUSTOM_TOUR_QUOTES_ENABLED=true` and `TRIP_BOOKINGS_ENABLED=true` only after their migrations and Preview tests. Stripe additionally requires `PAYMENT_MODE=stripe`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.

## Database and storage shape

- Working content: `cms_records`, `cms_singletons`
- Immutable candidates: `cms_publication_versions`
- Public-build source: `cms_live_snapshots`
- Correlation/operations: `cms_publish_jobs`, `cms_audit_log`
- Recovery: `cms_revisions`, owner exports
- Draft assets: private `virsapur-private`
- Published derivative layer: static deployment assets (and reserved WebP-only `virsapur-public` if an archival copy workflow is added)

The service credential is the only database principal used for CMS reads/writes. Every request first validates the Auth user and `admin_profiles` role. Database functions independently require an owner actor for staging and promotion.

## Local commands

- `npm run build:production` — public build, platform QA, security QA
- `npm run qa:security` — disabled endpoints, output, draft, secret, policy, media, and publication checks
- `npm run cms:migrate:dry` — validates the dated baseline without writes
- `npm run cms:migrate` — guarded one-time import; follow the activation checklist
- `npm run studio` — local-only Studio and demo preview; production mode is rejected while the flag is false

No external account was configured by this implementation pass.
