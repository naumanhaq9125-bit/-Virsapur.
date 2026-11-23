# Virsapur V1 developer handoff

**NOT DEPLOYED.** This is a local, reviewable release candidate, not a hosted launch. The canonical delivery is `D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22/`. Check `PACKAGE_STATE.json` before using it: a staging copy is not final acceptance.

## Start here

Use Node **24.19.x** (the package supports Node >=24.19.0 and <25) and npm **12.2.1**. Open a terminal in the handoff's `site` directory. Install from the lockfile and run the safe candidate workflow:

```powershell
cd D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22/site
npm ci
npm test
npm run build
node scripts/final-release-qa.mjs
node scripts/security-qa.mjs --dir=dist-production-candidate
node scripts/heritage-inventory-qa.mjs
npm run studio
```

The server binds only to `127.0.0.1`, on port 4173 by default. It builds Preview at startup. If that port is occupied, use `$env:STUDIO_PORT='4174'` before `npm run studio`, and substitute 4174 in the URLs below. Stop with Ctrl+C. No Vercel or Supabase account is needed.

- Studio: `http://127.0.0.1:4173/studio/` — local editing of working JSON.
- Preview: `http://127.0.0.1:4173/preview/` — local sandbox including Draft/Review records and labelled demonstration fixtures. It is not the public release.
- Candidate: `http://127.0.0.1:4173/candidate/` — separate generated `dist-production-candidate`; published-content rules and release-cleared photography.
- Local Production: `http://127.0.0.1:4173/production/` — the user's separately published local clean release. The existing working repository's version was protected, not replaced or copied into this handoff as the candidate.

Opening `index.html` directly with `file://` is not a supported preview: map data, modules and API requests require the local server. There is no automatic candidate rebuild after a Studio save. Save updates Preview; run `npm run build:candidate` to refresh the separate candidate after review.

`npm run build` is deliberately the candidate build. **Do not run `build:production`, `qa:production`, `cms:migrate -- --apply`, or click Publish to Local Production merely to inspect this package.** The first two can replace the local Production folder; the migration apply command is for a separately authorized future hosted operation. Publish to Local Production remains an explicit, local-only action in the existing Studio; it was not used by this finalization pass.

## What is in the package

| Folder / file | Purpose |
| --- | --- |
| `site/` | Reproducible application source, local Studio, dormant hosted Admin/API, protected geography, source assets, scripts, configuration templates and lockfile. |
| `release-candidate/` | Captured local static release candidate; generated separately from existing Local Production. |
| `content/` | Canonical working content, with publication states and editorial/rights metadata. |
| `database/` | Unapplied migrations and provider-neutral export / working-content seed. Never credentials or operational requests. |
| `media/` | Cleared original photographs. Production WebP derivatives are in the source/candidate asset trees. |
| `qa/` | Actual test results, current screenshots, research manifests and editorial quality reports. |
| `FINAL_REPORT.md` | Final counts, acceptance results, explicit remaining review/activation items. |
| `FILE_MANIFEST.csv` | Package-relative file paths, purposes, byte sizes and SHA-256 checksums. The manifest and the two self-generated verification reports (`qa/FILE_INVENTORY.json`, `qa/PACKAGE_VERIFICATION.json`) are excluded to avoid circular hashes. |

Historical repository reports are retained for provenance, but this README, `FINAL_REPORT.md` and current `qa/` results take precedence over their old counts or completion claims. Source-only Preview images are not automatically release-cleared. The candidate's rights gate controls public image inclusion.

Before installing dependencies or making changes, verify the untouched package from its `site` directory with `node scripts/verify-handoff.mjs --dir=..`. This compares the real files with the CSV, checks source/export/seed consistency and confirms the candidate's complete recorded build-input/output file sets. After development or dependency installation, the folder is no longer the immutable delivery; keep the original handoff/ZIP for comparison.

## Architecture and content

`build.mjs` imports `src/site-builder.mjs`. This data-driven static builder produces HTML, CSS, browser modules, JSON search/Atlas indexes, route manifests, robots and split sitemaps. `content/data/*.json` is the local source of truth; `src/cms/` contains provider and validation boundaries. The six established Archive categories are retained. Stable record IDs/slugs and authored forward relationships are preserved; inverse related-content displays are derived, not duplicated editorial state.

Heritage records have exact sourced components, protected-geometry-derived geography, and `mapDisplay` (`featured` or `listed`). Featured places can appear as pins; all accepted places remain searchable in scoped inventories, have canonical `/archives/place/<slug>` pages and are selectable for custom tours. Serial properties remain one property with multiple components. Do not replace unknown coordinates with city/district centroids or alter boundaries to fit a source.

AI-assisted articles are deliberately in **Review**, with references, provenance, SEO and relationship metadata. Preview exposes them for editorial assessment; they do not become public merely because a candidate is built. A reviewer must verify facts, attribution, sensitive claims and media rights, clear `editorialReviewRequired`, and make an explicit publication decision. A publication hold is not a publishable short article. No fictitious author, date, price, customer review or scheduled departure should be invented to fill a page.

The candidate may therefore have an intentionally sparse Article listing while the complete research corpus is visible in Studio/Preview. Three curated itinerary proposals are also Review records, not confirmed scheduled offers. No future occurrence dates were invented; confirm the operational calendar before creating published events.

## Owner editing

Studio edits existing collections, not a second CMS. Articles have 25-record paging, text/status/category/region/tag filters, selected-record bulk changes, references, structured content blocks, SEO and rights metadata. Heritage editing includes components and coordinate provenance, read-only derived geography, map display and an inverse connected-content overview. Programme relationships preserve itinerary order. Media includes upload processing and editable provenance/clearance metadata; upload alone never grants publication rights.

Save is not Publish. Draft / Review / Published / Archived are retained. Unknown fields survive structured editing. Authenticated hosted Admin uses shared editor widgets behind the existing disabled feature boundary; it is source-ready, not activated or tested against a live authentication provider.

## Tours and private requests

`/tours` connects curated programme routes with `/tours/custom`. The builder supports searchable provincial/district/category filters, add/remove/reorder, 1–40 eligible places and browser-local itinerary IDs. The configured V1 origin is Lahore (`site.defaultTourOrigin`). It never calculates an automatic price.

The quote form collects only operational contact/itinerary requirements. The local server validates and saves private requests under `studio-data/custom-tour-quote-requests.json`; that runtime directory is deliberately excluded from the handoff. Studio supports New, Reviewing, Quoted, Confirmed and Closed plus manual internal notes/amount. No real customer message, email, booking or payment is sent. The QA request used fictitious contact information and was removed after verification.

Future hosted endpoints and SQL contract are documented in `backend/BACKEND_HANDOFF.md`. Both hosted flags remain false. Private quotes must never enter content exports, static search, sitemaps or public CMS snapshots.

## Export, database and future hosted integration

File-only export and unapplied seed generation:

```powershell
npm run content:export -- --output=../database/content-export.json --seed-output=../database/working-content-seed.sql
```

The export uses an allowlist, geometry-derived facets and a checksum. It excludes demonstration IDs, private requests, orders, sessions, auth users and secrets. The SQL seed inserts working content only with conflict protection; it does not publish live snapshots. Review SQL and run migrations 001, 002 and 003 in order against an isolated disposable/staging database before any authorized live activation. SQL source/static tests are not proof that triggers, RLS and grants have been executed successfully in PostgreSQL.

`.env.example` is a configuration reference with empty secrets and disabled hosted flags. The supplied Node commands read environment variables; they do not automatically load this file. Configure values in the future host or shell, never in browser code or committed JSON. Hosted activation, database credentials, owner authentication, origin/CSRF policy, trusted request-IP forwarding, retention, email delivery and provider integration need a developer's staged deployment/security review. Keep mock/payment flows disabled until a separately approved provider implementation and test cycle.

## SEO and release workflow

Pages use durable routes, one primary heading, titles/descriptions, canonicals, breadcrumbs, appropriate structured data and separate sitemap families. Preview is noindex. The local server adds `X-Robots-Tag: noindex, nofollow` even when serving the local candidate. That safety header must not accidentally be copied onto a future live public host.

For a future authorized hosting build, set `CANDIDATE_SITE_ORIGIN` to the final HTTPS origin before building; never ship localhost canonicals. Review navigation, calendar, contact details, robots, sitemap URLs and all article/photography approvals. The safe candidate command always forces local content and disables hosted activation/payments. It does not build or publish an enabled hosted Admin; that separate deployment architecture is documented under `backend/`.

Run automated checks and the documented browser matrix before promoting any build. Preserve the previous immutable release/content export for rollback, stop new publication while investigating a failure, and restore the prior release plus compatible content snapshot through the approved hosting workflow. Database schema rollback needs a reviewed migration/backup plan rather than deleting tables. No remote rollback or deployment command is part of this local delivery.

## Security and limits

Local Studio is an editing tool for a trusted computer, not a public server. Never bind it to `0.0.0.0`, expose it through a tunnel or host its private runtime directory. Keep secrets server-only. Review the supplied security tests and documented hosted activation prerequisites. Final responsive and browser coverage, source limitations, editorial holds and rights gaps are recorded explicitly in the final report; do not interpret an excluded/held item as approved content.
