# Virsapur secure backend setup

> Dormant future-hosting reference. Do not follow this setup for the current localhost-only workflow. Supabase and Vercel are not required or used by Studio, Preview, or Local Production.

The public website works without a backend. Production CMS code is present but inert until the strict flag is true.

## Required order

1. Create a private Supabase project and disable public account registration.
2. Apply `backend/supabase/migrations/001_production_cms.sql` and then `002_security_hardening.sql`.
3. Create Auth users manually. Add `owner` or `editor` rows to `admin_profiles`; begin with one owner.
4. Confirm through SQL/grant inspection that browser roles have no CMS or Storage write access and no CMS reads.
5. Add environment values from `.env.example` to Vercel while keeping `PRODUCTION_CMS_ENABLED=false` and `CMS_DATA_MODE=local`.
6. Disable automatic production-domain assignment and enable protection on candidate deployments.
7. Run the import dry check, then the one-time server-authorized import described in the activation checklist.
8. Run hosted anonymous-denial and private-media tests.
9. Only then activate and promote the exact tested staged build.

## Secrets and environment values

`SUPABASE_SECRET_KEY` and `VERCEL_API_TOKEN` are server-only. The publishable key is used by server authentication calls; it is not used by public website JavaScript. Do not use a Deploy Hook—the publishing path creates and follows an exact versioned deployment.

Required for activation: `PRODUCTION_CMS_ENABLED=true`, `CMS_DATA_MODE=production`, `STUDIO_DATA_MODE=production`, `SITE_ORIGIN`, `PAYMENT_MODE=disabled`, Supabase URL/publishable/secret keys, both storage bucket names, Vercel token, project ID, project name, repository/provider/ref, and optional team ID.

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
