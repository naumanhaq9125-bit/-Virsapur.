# Virsapur production CMS security report

Date: 1 September 2026  
Current disposition: **private by default; production CMS not activated**

## Immediate issues and disposition

| Immediate issue found | Risk before this pass | Resolution now |
|---|---|---|
| Production Admin was copied into every build | Login/Admin discovery before readiness | Admin files are physically omitted unless `PRODUCTION_CMS_ENABLED=true`; default is `false`. |
| CMS endpoints were always addressable | Authentication and mutation surface existed before activation | All 15 CMS/auth/media/publishing endpoints return a plain 404 before parsing input, reading cookies, or opening a backend connection when disabled. |
| Anonymous database reads were granted | Published and working columns shared rows; policy mistakes could expose drafts | All CMS grants/policies for `anon` and `authenticated` are removed. The browser never queries CMS tables. |
| Working `data` and `published_data` shared a table | Row exposure could reveal drafts | Public builds read the server-only `cms_live_snapshots` table; working tables are never public. Legacy columns remain only for transition compatibility and have no browser grants. |
| Publish mutated the snapshot before deployment | Failed deployment could leave data queued for a later accidental release | Publishing now creates an immutable candidate, builds an exactly correlated staged deployment, verifies that exact ID, and requires a second owner-only promotion. |
| Status used the newest deployment | Unrelated deployment could be mistaken for the requested publication | `jobId`, `publication_version_id`, `content_version`, and Vercel `deployment_id` are mandatory and stored together. No latest-deployment lookup remains. |
| Draft uploads used a public bucket | Unpublished media URLs were publicly fetchable | New uploads use `virsapur-private`; Admin previews use five-minute signed URLs; build-time publication bundles only referenced derivatives. |
| Owner/editor boundaries were too broad | Editors could publish or export | Publish, unpublish, promote, site/homepage/navigation/SEO changes, import/export, and operational activity are owner-only. |
| Mutation requests lacked CSRF checks | Cookie-authenticated cross-site requests were possible | Same-origin checks plus a double-submit CSRF token protect all hosted mutations. |
| No throttling for sensitive actions | Login/upload/publish abuse | Database-backed rate limits cover login, import, media, candidate creation, and promotion without logging raw IP addresses. |
| Backups lacked ignore rules | Private operational files could enter bundles/source control | `.gitignore` and `.vercelignore` exclude backups, screenshots, local revisions, logs, source maps, and demo output. |

## Public exposure with CMS disabled

- Public static routes, map data, styles, scripts, optimized images, `robots.txt`, `sitemap.xml`, route manifest, search index, and 404 documents remain.
- `/admin` has no generated file and resolves as a normal 404.
- CMS and login endpoints return 404 and cannot perform work.
- No Supabase URL, key, session cookie name, table name, draft-only title, demo fixture, backup, SQL, source map, or production secret appears in `dist-production`.
- The exact 84-file output and SHA-256 values are in `PRODUCTION_PUBLIC_FILE_MANIFEST.md`.

## Permission matrix

Direct database access is intentionally **none** for all browser roles. Owner/editor capabilities below are available only through authenticated server endpoints after activation.

| Capability | Anonymous | Editor | Owner | Server service credential |
|---|---:|---:|---:|---:|
| Read public website | Yes, static files | Yes | Yes | N/A |
| Query CMS tables directly | No | No | No | Yes |
| Sign in / view Admin | No | Yes | Yes | N/A |
| Read working content/revisions | No | Yes | Yes | Performs request |
| Save record drafts / review state | No | Yes | Yes | Performs request |
| Upload draft media privately / signed preview | No | Yes | Yes | Performs request |
| Edit homepage/site/navigation/global SEO | No | No | Yes | Performs request |
| Create publish or unpublish candidate | No | No | Yes | Performs request |
| Promote verified deployment live | No | No | Yes | Performs request |
| Import/export backup | No | No | Yes | Performs request |
| Read operational activity | No | No | Yes | Performs request |
| Destructive database/storage actions | No | No | No through Admin | Manual audited maintenance only |

## Endpoint inventory

Disabled by default (404): `/api/activity`, `/api/auth-login`, `/api/auth-logout`, `/api/auth-session`, `/api/content`, `/api/export`, `/api/import`, `/api/media`, `/api/media-preview`, `/api/preview`, `/api/publish`, `/api/publish-status`, `/api/publish-finalize`, `/api/revisions`, and the `/admin/*` middleware surface.

When activated, every endpoint is server-side, noindex/no-store, role checked, and mutations are same-origin/CSRF protected. `activity`, `export`, `import`, all publication actions, and global singleton mutations are owner-only.

## Verification results

| Check | Result |
|---|---|
| Default production build | PASS — 18 routes, 12 indexable, no QA errors/warnings |
| Admin absent | PASS |
| Disabled endpoint attacker test | PASS — all 15 endpoints returned 404 before action |
| Anonymous database policy audit | PASS — no anonymous grants or policies remain |
| Hosted anonymous database attack | NOT RUN — no Supabase project/anonymous test credential was supplied; activation is blocked until it passes |
| Owner-only exact publishing code path | PASS |
| Private media policy/build bundling | PASS (local/static); hosted Storage test required at activation |
| Draft-only title scan | PASS — 14 non-public titles checked |
| Secret/public output scan | PASS |
| Default staged-release marker absent | PASS |
| Production security header configuration | PASS — CSP, permissions, referrer, MIME-sniffing, and framing protections configured |
| Demo exclusion | PASS |
| Public file allowlist + hashes | PASS — 84 files |

## Public regression and visual freeze

- The homepage, Archives, Programmes, Our Work, Heritage Map, and Contact page each retain exactly one H1 and `index,follow,max-image-preview:large` robots metadata.
- The default public build contains no staged `virsapur-content-version` release marker.
- Heritage Map still renders seven regional paths and drills into all 35 Balochistan district paths, with both country-return and back controls available.
- Local Studio still opens at **Content overview** in the clearly labelled **DEV SANDBOX** environment.
- The demo What’s On page retains three mock checkout actions, and the success path confirms that no real payment was processed.
- Before/after captures are stored under `qa-screenshots/security-hardening/`. Contact, Heritage Map, Our Work, and Programmes were pixel-identical. Homepage (0.662342%) and Archives (1.472496%) differed only in localized lazy/dynamic image-render timing; visual inspection confirmed unchanged layout and content.

Machine-readable results: `security-qa-results.json`. The CMS remains off because no external Supabase/Vercel account was configured or tested in this pass.
