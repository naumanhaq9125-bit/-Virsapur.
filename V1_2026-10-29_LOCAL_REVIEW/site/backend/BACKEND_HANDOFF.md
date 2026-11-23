# Dormant hosted backend contract — 22 October 2026

## Activation boundary

This is a source-only handoff. No database migration, remote connection, deployment, credential setup, email or payment action has occurred. Local Studio, Preview and Local Production continue using their existing local architecture. Nothing here is imported by the local quote server.

The new quote endpoints return 404 before authentication, configuration or network work unless **both** `PRODUCTION_CMS_ENABLED=true` and `CUSTOM_TOUR_QUOTES_ENABLED=true` are explicitly configured in a future hosted server environment. Neither flag is enabled by this work. Server-only Supabase credentials remain in runtime environment variables, never exports or browser bundles. Existing owner/editor authentication, secure cookies, CSRF checks and rate-limit middleware are reused unchanged.

Future activation is a separate owner-reviewed operation, not an instruction to activate now. It requires a disposable/staging database review of migrations 001 → 002 → 003, RLS/role integration tests, hosted routing verification, configured secrets and authentication, a trusted edge that replaces client-supplied forwarding headers, abuse protection, retention decisions and a successful security review. Do not weaken database grants to make a browser request work.

## Content/source contract

`backend/content-contract.mjs` is the provider-neutral allowlist shared by the hosted provider and file/API exports:

- Singletons: `site`, `homepage`.
- Collections: `archiveCategories`, `collaborators`, `programmes`, `stories`, `projects`, `events`, `people`, `testimonials`, `media`, `heritagePlaces`.

These match the current local provider. There is no canonical `heritageCategories` CMS collection/file; the actual editorial taxonomy is `archiveCategories`. Existing geographic/category JavaScript configuration, protected GeoJSON, `atlas-scope-media.json` and temporary image overrides remain file-based assets/configuration, not newly invented CMS collections. They still belong in the source/deployment package; a content JSON export alone is not a complete website backup.

Canonical JSONB remains the source of truth. A record is addressed by `(collection,id)`; stable IDs, slugs, status and complete existing data are preserved. The existing verified-publication workflow remains the only route to live snapshots. Save does not create newly published records, does not remove missing IDs, and does not mutate live snapshots.

Hosted reads page deterministically at 200 rows per request, up to a fail-closed 100,000-row transport guard. Working and live loads include every supported collection. Saves fetch every existing row before deletion/publication checks, skip unchanged rows, retain revisions, and POST at most 100 rows / 512 KiB per batch. All request bodies are capped at 1 MiB. Individual oversized records are rejected, not silently truncated. Multi-batch saves are **not** one database transaction; a failure may leave earlier working batches saved. Re-read and retry after fixing the failure. This does not promote any public snapshot.

## Unapplied migration 003

`backend/supabase/migrations/003_discovery_and_private_quotes.sql` is new; migrations 001 and 002 are unchanged.

| Table | Contract |
| --- | --- |
| `cms_discovery_index` | Body-free metadata, title/summary/category/province/district/tag/type facets and `simple` text-search index. Composite key `(scope,collection,record_id)`. `scope` is explicitly `working` or `live`; never mix them for a public query. |
| `cms_content_relationships` | Authored forward ID arrays with stable positions and an inverse lookup index. Does not write reciprocal relationships back into editorial JSON. Source deletion cascades. Targets may reference geography or another collection, so no incorrect single-table target FK is imposed. |
| `cms_heritage_components` | All source component IDs, order, exact numeric point, coordinate status/source and original component JSON. Missing coordinates stay NULL. Invalid/mismatched coordinate pairs fail the transaction; no guessed centroids, rounding or geometry rewrite. |
| `custom_tour_quote_requests` | Separate private operational store, never a CMS content collection or public snapshot. Visitor JSON is field-allowlisted; manual status/notes/amount/currency and actor/time fields are separate columns. |

Triggers rebuild discovery, relationships and components from working records and live snapshots independently, atomically with the corresponding source write. Backfill reads existing sources without altering them. Geographic facets copy explicit canonical IDs (including component assignments); legacy free-text locality/source labels are not guessed into IDs. The file export and Admin heritage-save/read paths now run the established protected-geometry assignment pipeline before handing off records, so the supplied export/seed includes derived facets. Legacy database rows imported outside those paths still require that pipeline; source locality text never overrides coordinates. Static local map behaviour is unchanged.

The four new tables have RLS enabled, no public policies, all privileges revoked from `public`, `anon` and `authenticated`, and explicit service-role-only CRUD. Security-definer projection functions use a fixed search path and are not executable by those public roles. These protections apply equally to working and live projections; there is no new direct public database endpoint. A future public search handler must use **live scope only**, select a body-free allowlist and paginate; the tables themselves are not browser APIs.

Quote indexes cover status/date and date ordering; a full-text index is provided for future guarded search. Current admin substring search is bounded but is **not** represented as full-text-index-backed. Server service-role access is privileged: do not expose its key to clients.

## Quote HTTP contract (dormant)

### `POST /api/custom-tour-quotes`

Same-origin JSON only, at most 32 KiB. Uses existing fail-closed rate limiter: five submissions per address per hour. The future edge must supply trustworthy address headers. No cookies/authentication are required for a visitor request; admin fields are never accepted.

Allowed visitor fields, validated by `src/tour-contract.mjs`:

| Field | Constraint |
| --- | --- |
| `heritagePlaceIds` | 1–40 unique stable IDs; each must exist in live snapshots and be a published tangible cultural Place. ID syntax is bounded before constructing the database filter. |
| `groupSize` | Integer 1–200. |
| `customerName`, `email`, `phone` | Required; shared contact-format validation and maxima 120 / 254 / 40 characters. |
| `durationPreference` | Required, at most 120 characters. |
| `requestedDate` | Optional valid date, today or later, or null. |
| `transportPreference`, `specialRequirements`, `notes` | Optional, at most 120 / 1,500 / 3,000 characters. |

The server sets `VQ-<uuid>`, timestamps, origin from the live site default (fallback Lahore), `status=new`, empty internal notes, null amount and PKR currency. Response 201 is `{ok:true,receipt:{id,createdAt,environment:'hosted'}}` only. It does not echo contact information or issue a quote, booking, payment, email or confirmation. Unsupported visitor fields, unavailable places and invalid inputs return 422; body/type problems 413/415; same-origin failures 403; throttling 429. Server failures use a generic message without database details.

### `GET /api/admin-custom-tour-quotes`

Existing authenticated owner/editor session required. Query fields: `page` (default 1), `pageSize` (default 20, maximum 50), optional exact `status`, optional `q` (maximum 200 characters). Count is checked at offset zero, then page is clamped and loaded; this avoids out-of-range database offsets. Search wildcards are removed from user input. Response `{ok,items,total,page,pages,pageSize}` includes private request/admin fields only after authentication. Default order: newest creation timestamp, then ID descending. Responses are no-store/noindex.

### `PATCH /api/admin-custom-tour-quotes?id=VQ-<uuid>`

Existing authenticated owner/editor session **and** same-origin CSRF cookie/header check required. Accepts only `status`, `internalNotes`, `quotedAmount`, `quoteCurrency` via the shared admin validator. Statuses are `new`, `reviewing`, `quoted`, `confirmed`, `closed`. Notes maximum 10,000 characters; amount is null or 0–100,000,000; currency is a three-letter uppercase code. Contact/itinerary fields cannot be rewritten through this endpoint. Server writes the authenticated actor and update timestamp. Unknown ID returns 404. There is no bulk/export/delete public quote API.

Private requests need a future documented retention/deletion policy and controlled access review. They must never enter static output, public search, normal content export or seed files. No real quote requests were created by this work.

## Export and seed

`scripts/export-content.mjs` reads only the explicit canonical content files and fixture-ID denylist. `api/export.js` retains the existing hosted flag and **owner-only** guard and uses the same `createContentExport` contract. The v1 bundle contains IDs, statuses, full content records/singletons, counts and a SHA-256 checksum. Only allowlisted content is included. Demo records, duplicate IDs, invalid states and secret-like nested fields fail closed. Quote tables, local private Studio files, credentials, sessions, auth users, mock orders and environment configuration are not read or serialized.

An optional `--seed-output=<path>` produces SQL text via `createWorkingSeedSql`. It is **unapplied**: inserts working records/singletons only, preserves record workflow status, uses `ON CONFLICT DO NOTHING`, and cannot populate live snapshots, quote requests, users or secrets. Existing data is not overwritten. The flag does not open a database connection. JSONB content may still contain rights-restricted or editorial draft material, so this owner review bundle is not an anonymous public-data release or automatic photography clearance.

## Verification and limits

Run `node scripts/backend-contract-qa.mjs` for offline synthetic tests. The suite covers 606 heritage Places + 420 stories + categories/collaborators, working/live pagination, changed-only batched saves, request limits, export/seed exclusion, disabled endpoints, same-origin/rate limiting, visitor allowlisting, live-place eligibility, auth/CSRF, strict manual quote updates, safe failures and static migration privacy checks. No canonical fake records are added.

At handoff: 9 test groups pass; 1,028 synthetic content records; **zero network calls**, no database applied and no build/deployment performed. JavaScript syntax is checked. SQL is reviewed as source but has not been executed against PostgreSQL/Supabase; trigger, grant, RLS, role and query-plan integration tests remain mandatory before any future hosted activation. Browser/local application verification belongs to the parent integration pass.
