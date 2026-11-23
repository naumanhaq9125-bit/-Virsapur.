# Virsapur final local build — 22 October 2026

Deployment state: **NOT DEPLOYED**. This plan tracks implementation, not completed acceptance.

## Current authoritative baseline

The current checkout contains 221 published Heritage Places (240 components), 12 draft story records with empty bodies, six published Archive categories, four published Programmes, no Events, two draft Projects and no Media catalogue entries. A new SHA-256 baseline is in `BASELINE.json`; protected checks cover existing Production, ADM geometry, and all current Heritage IDs, slugs and component objects.

## Architecture decisions

- Keep JSON as the local canonical content provider and the existing PostgreSQL/Supabase-compatible hosted provider dormant. No remote credentials or service activation.
- Reuse `stories` for Articles and the existing six Archive categories. Add tags, structured references, editorial provenance and SEO overrides without a parallel article collection. AI-assisted prose enters `review`, accessible in Preview/Studio and excluded from release publication.
- Keep `relatedHeritageIds` as canonical outbound relationships. Derive Place-to-article/tour/event/project relationships; do not duplicate inverse state.
- Add `mapDisplay` independently of editorial `featured`. All 221 inherited Places retain featured-pin eligibility. New accepted research normally uses `listed`. Only marker rendering filters this field; geographic scope, search, pages and Tours retain the complete eligible inventory.
- Preserve ADM1/ADM2 geometry and component coordinates. Research discrepancies go into a backlog, not moved coordinates. One serial property remains one Place with multiple components.
- Tours remain Programmes with ordered Heritage IDs and practical/booking fields. Add `/tours` and `/tours/custom`; retain all durable `/service/...` URLs. Origin is one site setting, initially Lahore.
- Custom-tour quotes are a separate private operational collection, never public content or a static export of customer data. Local submissions use a validated loopback API and private storage, with admin-only internal fields. No automatic price, email or payment. Hosted contract/migration remain unapplied.
- Emit body-free discovery metadata and bounded list/card rendering. Keep full article bodies on their own pages, not in the search payload.
- Extend the existing Studio editor, relationship selector, media metadata, lists and bulk workflow. Preserve fields not edited by a control, including coordinate provenance.
- Build a separate `dist-production-candidate`. Review-only content, demo records, private quote data and rights-uncleared photography must not become public candidate dependencies.
- Final self-contained handoff lives only at `D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22/`; the working checkout stays in place.

## Sequence and evidence

| Phase | Scope | State |
| --- | --- | --- |
| A | Current-state audit and protection snapshot | Audit captured; baseline saved |
| B | Data architecture | Decisions above; implementation pending |
| C | National district-grid research | In progress, regional proposals separate from canonical content |
| D | Atlas complete list / curated pins | Pending |
| E | Tours and custom-quote workflow | Pending |
| F | 400–500-topic plan, actual sourced article batches, deduplication | Pending; empty legacy records are not an article corpus |
| G | Technical/content SEO | Pending |
| H | Rights-cleared media and no-image fallbacks | Pending |
| I | Existing Studio extensions | Pending |
| J | Dormant backend contracts, migrations and neutral exports | Pending |
| K | Integration, responsive, accessibility, scale and crawl QA | Pending |
| L | Separate local Release Candidate | Pending |
| M | D: handoff, clean-run verification and manifest | Pending |

## Guardrails

Do not run existing default `npm test` / `build:production` during this pass because those replace `dist-production`. Add and use a separate candidate command. Do not invoke Publish to Local Production. No hosting upload, deployment, remote migrations, live database writes, live emails, merchant credentials or DNS changes. Classify outstanding work as BLOCKING, NON-BLOCKING, DEVELOPER HANDOFF ITEM, EDITORIAL REVIEW ITEM or RIGHTS/PERMISSION ITEM; do not mislabel incomplete implementation as merely an external developer task.
