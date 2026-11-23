# Virsapur V1 — Production CMS Migration Plan

Date: 1 September 2026  
Status: implementation baseline approved by the supplied production-admin brief

## Guardrails

This pass adds a production content service and authenticated Admin without redesigning the public site. The existing public templates, navigation, route paths, map behaviour, content IDs, slugs, redirects, SEO rules, payment-disabled production posture, and local demo fixtures remain authoritative unless a regression fix is necessary.

No production content is deleted or overwritten as part of setup. The local JSON files remain the rollback source until the hosted migration has been verified. Demo fixtures are never imported into the production database.

## Current-state audit

- Public output is statically generated into `dist-production/`; demo and draft preview output is generated into `dist-demo/`.
- Canonical content lives in `content/data/*.json`. Demo records live separately in `content/fixtures/demo.json`.
- The current Studio is a local-only Node service at `/studio/`. It writes JSON, creates local revisions, builds previews, and stores mock orders locally.
- The public builder reads JSON directly. It already prevents demo records and non-published records from entering the production output.
- Vercel currently runs `npm run build:production` and publishes `dist-production`.
- There is no hosted authentication, database, object storage, server-side Admin API, deployment-hook workflow, or production environment contract yet.
- Payments are not connected and must remain disabled in production.

## Target architecture

1. Keep one set of public rendering templates and one content contract.
2. Put all data access behind a provider interface selected by `STUDIO_DATA_MODE=local|production` and `CMS_DATA_MODE=local|production`.
3. Use Supabase for hosted Postgres, Auth, Row Level Security, and Storage. Browser code never receives the service-role key.
4. Put privileged operations behind Vercel server functions. Every Admin write verifies the signed-in user and their `owner` or `editor` role on the server.
5. Keep Save and Publish separate. Save creates a draft/review revision; Publish validates the record, promotes the selected revision, records an audit event, and triggers a Vercel deploy hook.
6. The Vercel production build reads the published snapshot from the hosted provider. Public pages change only after the deployment succeeds.
7. Keep previews authenticated and `noindex,nofollow`; use the same renderer and responsive styles as the public build.
8. Store media in cloud object storage with metadata and generated derivatives. Prevent deletion while a media item is referenced by content.

## Phased implementation

### Phase A — snapshot and baseline

- Create a dated, checksummed snapshot of content and CMS-sensitive code.
- Export canonical content to a provider-neutral JSON bundle.
- Record content counts, IDs, slugs, workflow states, redirects, and exclusions.
- Capture baseline public and demo-preview screenshots and run existing QA.

Rollback: restore the dated files; no external data has changed.

### Phase B — isolated backend foundation

- Add provider modules, environment validation, Supabase schema/policies, protected server functions, session handling, roles, audit logs, revisions, redirects, publish jobs, and cloud media APIs.
- Add documented `.env.example` values without secrets.
- Preserve local provider behaviour as the default for development.

Rollback: leave both data-mode variables on `local`; Vercel continues using the local content source.

### Phase C — Admin and publishing workflow

- Reuse the Studio’s visual language for `/admin/` while replacing raw JSON editing with structured fields and rich content blocks.
- Add login, role-aware controls, autosave, revision comparison/restore, responsive authenticated previews, media management, validation, publish/unpublish, and live-deployment status.
- Keep mock checkout available only in local/demo mode.

Rollback: remove the Admin rewrite/function configuration; local Studio remains available.

### Phase D — migration and production cutover

- Dry-run the canonical export against schema validation.
- Import singletons and collections with original IDs, slugs, status, dates, relationships, media references, and redirect history.
- Prove that fixture IDs are absent from the hosted database.
- Set the production build to `CMS_DATA_MODE=production`, trigger a controlled deployment, and compare route/SEO/map output to baseline.

Rollback: set `CMS_DATA_MODE=local` and redeploy the last known-good static source. The dated JSON snapshot remains intact.

### Phase E — acceptance and handoff

- Exercise Draft → Preview → Publish → Live → Unpublish with a temporary test record.
- Restore public content to the pre-test baseline.
- Verify roles, sessions, audit logs, backups, restore steps, media derivatives, route protection, mobile/tablet/desktop previews, and core public/map/SEO regressions.
- Record any remaining account-level configuration. Do not describe the hosted system as complete until real Auth, Storage, database, deploy-hook, and live-domain behaviour have been observed.

## Unchanged public contract

- Homepage and all current public page designs
- `/heritage-map` and its country → region → district interaction
- Programme, archive, project, about, contact, search, and utility routes
- Stable IDs, slugs, previous slugs, redirects, relationships, and geographic identifiers
- Production filtering: only complete `published` records are indexable
- Canonical, Open Graph, structured-data, sitemap, and robots behaviour
- Production payment mode remains disabled

## External prerequisites for live verification

- A Supabase project URL, anon key, server-only service-role key, and configured owner account
- A Supabase Storage bucket and the supplied SQL migration applied
- A Vercel deploy-hook URL plus a read-only deployment API token/project identifiers if live status polling is enabled
- Production environment variables entered in Vercel

Implementation can be completed and tested locally without these credentials. Hosted acceptance cannot be truthfully signed off until they are supplied and exercised.
