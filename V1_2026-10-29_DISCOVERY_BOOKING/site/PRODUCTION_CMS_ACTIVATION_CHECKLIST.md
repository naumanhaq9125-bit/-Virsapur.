# Production CMS activation checklist

> Dormant future-hosting reference. The current workflow remains entirely local and uses **Publish to Local Production**; this checklist is not required now.

Do not set `PRODUCTION_CMS_ENABLED=true` until every box below is complete. Activation is a deliberate release, not a normal deploy.

## 1. Supabase, still private

- [ ] Create the production Supabase project; disable public sign-up.
- [ ] Apply `001_production_cms.sql`, then `002_security_hardening.sql` in order.
- [ ] Confirm RLS is enabled on every CMS table.
- [ ] Confirm `anon` and `authenticated` have no table/sequence/function privileges on CMS resources.
- [ ] Confirm `virsapur-media` is private (if it exists), `virsapur-private` is private, and `virsapur-public` accepts WebP only.
- [ ] Create one owner and one editor test user; add explicit `admin_profiles` roles.
- [ ] Run hosted anonymous attack tests:
  - set temporary local `SECURITY_TEST_SUPABASE_URL` and `SECURITY_TEST_SUPABASE_ANON_KEY`;
  - run `npm run qa:security`;
  - require denied responses for records, singletons, live snapshots, publication versions, and audit log.

## 2. Vercel, still disabled

- [ ] Add all secrets listed in `.env.example`; never paste them into source or browser settings.
- [ ] Keep `PRODUCTION_CMS_ENABLED=false` and `CMS_DATA_MODE=local` in Vercel.
- [ ] Configure `VERCEL_GIT_PROVIDER`, repository ID, ref, project ID, optional team ID, and narrowly scoped API token.
- [ ] Disable automatic production-domain assignment so production builds remain **Staged** until promoted.
- [ ] Enable Vercel Deployment Protection for candidate URLs and verify an unauthenticated visitor cannot open one.
- [ ] Deploy the disabled baseline and verify `/admin`, login, every `/api/*` CMS endpoint, and direct guessed paths return 404.

## 3. Import and verify baseline

- [ ] Run `npm run cms:migrate:dry`; expect 21 records, 2 singletons, checksum `sha256:50113b67e8976b52067516fc481dd9aeb59c33e7d83ed2d07b06c79282288827`.
- [ ] In a one-off trusted local shell only, set `PRODUCTION_CMS_ENABLED=true`, the Supabase server variables, and `CONFIRM_CMS_MIGRATION=VIRSAPUR-PRODUCTION`; run `npm run cms:migrate`.
- [ ] Verify working rows and `cms_live_snapshots` counts/checksum server-side.
- [ ] Remove the one-off shell secrets.

## 4. Role, CSRF, media, and failure tests

- [ ] Editor can save drafts, request review, upload to the private bucket, and obtain a five-minute signed preview.
- [ ] Editor receives 403 for homepage/site/navigation/SEO changes, publish/unpublish, promote, import/export, and activity.
- [ ] Owner can perform those actions.
- [ ] Missing/wrong Origin and CSRF token are rejected.
- [ ] Nine rapid login attempts trigger 429; publishing/media limits also trigger.
- [ ] Anonymous requests to original and derivative private media paths are denied.
- [ ] A published-media candidate bundles only referenced derivatives and they load in the protected candidate.
- [ ] Force a build failure and confirm live snapshots/domain remain unchanged and that job can never be promoted.
- [ ] Start an unrelated deployment and confirm status still follows only the stored deployment ID.

## 5. Controlled activation

- [ ] Set Vercel `PRODUCTION_CMS_ENABLED=true`, `CMS_DATA_MODE=production`, and `STUDIO_DATA_MODE=production` together.
- [ ] Create a staged production build with domain auto-assignment still off.
- [ ] Run public route, SEO, map, Admin, role, CSRF, media, secret, output, and visual regression tests against that exact staged deployment.
- [ ] Owner manually promotes that exact verified baseline deployment.
- [ ] Verify the production domain, then verify the matching database content version is live.
- [ ] Record deployment ID, content version, tester, time, and rollback deployment.

If any step fails, restore `PRODUCTION_CMS_ENABLED=false`, keep the known-good static deployment current, and investigate without exposing Admin.
