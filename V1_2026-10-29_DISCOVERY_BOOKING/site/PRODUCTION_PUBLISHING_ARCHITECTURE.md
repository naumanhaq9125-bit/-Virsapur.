# Virsapur staged publishing architecture

> Dormant future-hosting reference. The active publishing architecture is the localhost-only flow documented in `LOCAL_ENVIRONMENT_WORKFLOW.md`.

## Security boundary

```text
public browser → static deployment only
Admin browser → authenticated server endpoints → server-only Supabase/Vercel credentials
                                                ↓
working rows → immutable candidate → exact staged deployment → verification → owner promotion → live snapshot
```

The public browser never queries Supabase. Default builds use local approved JSON and contain no Admin. After activation, static builds read `cms_live_snapshots` server-side. Candidate builds start with live snapshots and overlay exactly one immutable `cms_publication_versions` row selected by `CMS_PUBLICATION_VERSION`.

## Publication state machine

1. **Save:** changes working data and revisions only.
2. **Stage:** owner validates a record or singleton. `stage_cms_publication` freezes its candidate JSON and SHA-256 content version. It does not alter live snapshots.
3. **Build:** the server creates a staged production deployment with candidate/content metadata and stores the returned deployment ID and timestamp.
4. **Verify:** status requests require a specific job ID and retrieve only its stored deployment ID. `READY` becomes `verified`; `ERROR`/`CANCELED` becomes terminal `failed`.
5. **Promote:** a second CSRF-protected owner request rechecks the exact deployment, promotes it, then transactionally updates `cms_live_snapshots` and marks the version live.
6. **Unpublish:** uses the same state machine with a null candidate; removal is not live until verified promotion.

There is no “latest deployment” query and no Deploy Hook. A failed version remains failed. An uncertain promotion blocks all later staging until an owner reconciles the exact deployment and database state.

Vercel must have automatic production-domain assignment disabled. This implements [Vercel’s documented staged-production workflow](https://vercel.com/docs/deployments/promoting-a-deployment): build without domain assignment, verify, then promote the exact deployment. Candidate URLs must also use Deployment Protection. After promotion, the server verifies the exact content-version marker on `SITE_ORIGIN` before changing the database live pointer.

## Singletons and global controls

Homepage and site/navigation/SEO are working singletons. Owners may save and publish them; editors cannot mutate global settings. The same candidate mechanism handles singleton publication, eliminating the earlier record-only limitation.

## Media lifecycle

Uploads go only to `virsapur-private` and create draft metadata with storage paths, never public URLs. Authenticated Admin previews request a five-minute signed URL. During a candidate build, the server downloads only private derivatives referenced by the candidate/live content and bundles them under `assets/cms/`. The protected candidate verifies them; promotion makes that exact static artifact public. A failed candidate does not place draft assets in a public bucket.

## Authentication and request protection

- Supabase verifies passwords and users; public sign-up stays disabled.
- Access/refresh cookies are `HttpOnly`, `Secure`, and SameSite; the CSRF cookie is Secure/SameSite and must match the custom request header.
- Middleware and each endpoint fail with 404 while disabled.
- Every enabled endpoint rechecks role server-side.
- Login and sensitive actions use database-backed rate limits with hashed request keys.
- Responses are no-store/noindex; global security headers include nosniff, frame denial, strict referrer policy, a restrictive permissions policy, and a map-compatible CSP.

## Failure behavior

- Supabase unavailable: Admin fails closed; existing static site remains.
- Candidate build fails: immutable version/job fail; live snapshot/domain remain.
- Unrelated deployment: ignored because IDs cannot match.
- Promotion response uncertain: publishing locks and requires owner reconciliation; nothing is silently retried.
- CMS flag false: Admin absent, endpoints 404, public website stays fully static.
