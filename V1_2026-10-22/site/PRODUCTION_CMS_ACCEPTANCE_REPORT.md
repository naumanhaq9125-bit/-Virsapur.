# Virsapur production CMS acceptance report

Date: 1 September 2026  
Overall status: implementation and local verification complete; hosted acceptance pending external account configuration

## Passed locally

- Pre-change recovery snapshot: 149 files, 53,403,996 bytes, checksummed manifest.
- Provider-neutral export: 21 records and 2 singletons; demo fixtures rejected.
- Migration dry run: passed with baseline checksum.
- JavaScript syntax: 26 modules checked successfully at the foundation checkpoint.
- Production build: 18 routes, 12 indexable, 21 HTML files including two noindex Admin screens; zero QA errors/warnings.
- Demo/Studio build: 42 routes, zero indexable; zero QA errors/warnings.
- Public screenshot set: homepage, Heritage Map, programmes, programme detail, archives, story detail, Our Work, Why Virsapur, contact—captured before and after under `qa-screenshots/production-cms/`.
- Browser Studio check: Local Studio loads existing content; structured paragraph/heading/quote/image/gallery/callout/embed editor appears; raw body JSON editing is absent.
- Heritage Map browser check: 7 region paths loaded; Punjab opened with 41 district paths; Lahore District selection produced the expected country → province → district breadcrumb and summary.
- Public route count, H1s, SEO/sitemap filtering, map load scope, content IDs/slugs/statuses, mock-payment isolation, and demo isolation remained intact.

The three visually dynamic full-page screenshots (homepage, Why Virsapur, contact) produced small timing/lazy-render pixel differences, while visual inspection showed no design change; the remaining six page pairs were pixel-identical. The generated public templates changed only to support hosted media/block types and the content-provider boundary.

## Not claimed or simulated

The following were not run because no real Supabase/Vercel credentials or account access were supplied:

- applying SQL to a hosted Supabase project;
- creating the real owner/editor accounts;
- hosted content import and count/checksum comparison;
- real cloud upload/derivative retrieval;
- real middleware/session expiry on the deployed domain;
- real Deploy Hook and Ready/Failed polling;
- Draft → Preview → Publish → Live → Unpublish against the production domain;
- final return-to-baseline confirmation after that hosted test.

These are the only remaining acceptance items. Follow `BACKEND_SETUP_GUIDE.md`, then execute the acceptance sequence in `PRODUCTION_ADMIN_USER_GUIDE.md`. The system must not be described as fully live until those observations are recorded.
