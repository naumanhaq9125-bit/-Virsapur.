# Virsapur production CMS content migration report

Date: 1 September 2026  
Migration status: validated locally; hosted import not run because Supabase/Vercel credentials were not supplied

## Baseline export

- Export: `backups/pre-production-cms-migration/2026-09-01/content-export.json`
- Format: `virsapur-content-export/v1`
- Checksum: `sha256:50113b67e8976b52067516fc481dd9aeb59c33e7d83ed2d07b06c79282288827`
- Singletons: 2 (`site`, `homepage`)
- Records: 21
- Programmes: 4
- Stories: 12
- Projects: 2
- Events: 0
- People: 2
- Testimonials: 1
- Media records: 0

The migration dry run passed. All 21 records have stable IDs; no duplicate global ID was found. Demo fixture IDs and mock orders are excluded by policy and by executable validation.

## Preservation rules

The importer preserves the complete `data` object for every record, including ID, slug, status, dates, previous slugs, geographic links, relationships, media references, SEO, and ordering. Records already published receive a matching `published_data` snapshot. Draft/review/archived records receive no public snapshot.

Site and homepage singletons are imported as published snapshots so the existing public site can be reproduced immediately. No local file is deleted or rewritten during hosted import.

## Fixtures excluded from production

`content/fixtures/demo.json` remains available only to `dist-demo`. `scripts/export-content.mjs` checks both `demo: true` and known fixture IDs and stops if either appears in canonical data. `scripts/migrate-to-production-cms.mjs` checks again before any hosted write.

## Hosted verification still required

After credentials are configured:

1. Apply the SQL migration.
2. Run the importer with the confirmation guard.
3. Export from Production Admin.
4. Confirm 21 records/2 singletons and compare IDs, slugs, statuses, and checksum-relevant content.
5. Confirm no fixture ID exists in `cms_records`.
6. Build once with `CMS_DATA_MODE=production` and compare route manifest, sitemap, canonical metadata, and screenshots.

Until these checks run against a real Supabase project, the migration is correctly described as prepared and locally validated—not completed online.
