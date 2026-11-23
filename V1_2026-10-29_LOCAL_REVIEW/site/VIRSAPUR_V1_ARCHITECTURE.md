# Virsapur V1 architecture

## One source, two outputs

Virsapur has one rendering system behind a content-provider boundary. In local mode it reads canonical JSON from `content/data/`; in production CMS mode it reads Supabase published snapshots. `src/site-builder.mjs` produces:

- `dist-production/`: public, deployable, published-only output.
- `dist-demo/`: noindex development preview containing drafts and clearly labelled fixtures.

The local Studio does not have a second visual implementation. Its Preview iframe serves `dist-demo/`, so the public CSS, templates, map and interactions are identical to the production renderer.

## Main folders

- `src/`: shared page renderer, platform styles and QA.
- `content/data/`: editable canonical site, homepage, story, project, programme, event, people, testimonial and media JSON.
- `content/fixtures/`: unmistakably artificial demo records. Production never reads this folder.
- `assets/`: source and responsive image assets.
- `data/`, `components/`, `config/`: preserved administrative map data and runtime.
- `studio/`: localhost server and local editor UI.
- `api/`, `middleware.js`: protected production Auth, content, preview, media, revision, export/import and publishing endpoints.
- `backend/supabase/`: hosted database/storage schema and RLS migration.
- `studio-data/revisions/`: automatic pre-save backups.
- `studio-data/mock-orders.json`: local mock-commerce records.
- `dist-production/`, `dist-demo/`: generated outputs only.

## Request flow

`npm run studio` in local mode starts a server bound to `127.0.0.1`. Studio writes through a local JSON API with validation, atomic replacement and revisions. With `STUDIO_DATA_MODE=production`, it redirects to the hosted authenticated `/admin/` so production secrets and authorization are never bypassed on localhost.

## Retained V1 foundations

The accepted typography, colour system, responsive imagery, accessible navigation, footer logo treatment and controlled corner scale remain. The Heritage Map keeps the same country/province/district geometry, stable IDs, lazy-loaded district files and keyboard interactions. The only map extension is a data-driven related-content list after district selection.

## Production boundaries

The public route manifest contains static HTML, CSS, minimal public JavaScript, responsive images and the preserved map runtime. Production additionally exposes a separately protected, noindex `/admin/` shell plus server functions. It contains no demo fixture data, mock orders or payment simulation; production payments remain disabled.
