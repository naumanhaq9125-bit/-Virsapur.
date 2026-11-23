# Virsapur Review Package Manifest

Created from the exact local project state on 2026-09-05. The website was not rebuilt, refactored, optimized, published, or otherwise modified while these review packages were assembled.

## Packages

- `Virsapur_CODE_REVIEW.zip` — technical-review source, configuration, geographic data, Studio source, selected generated build files, and QA documentation.
- `Virsapur_VISUAL_QA.zip` — current-build screenshots only. No earlier baseline screenshots are included. An interaction recording is not included because the existing local browser runtime has no video encoder installed.

## Included directories — CODE_REVIEW

Directory inclusion is recursive. Every child directory beneath these entries is included unless a narrower rule is stated.

- `api/`
- `assets/maps/` — all map JavaScript, GeoJSON, source geography, runtime geography, provenance, and administrative data.
- `backend/`
- `components/`
- `config/`
- `content/`
- `data/`
- `dist-production/` — only `.html`, `.css`, `.js`, `.mjs`, `.json`, `.geojson`, `.md`, `.txt`, `.yml`, and `.yaml` files; photographic and other binary assets are omitted.
- `qa-artifacts/` — QA reports, manifests, baselines expressed as JSON, and QA documentation only. Screenshot, recording, and duplicate production-candidate directories are excluded below.
- `scripts/`
- `src/`
- `studio/`
- `studio-data/`

The generated `dist-studio/` directory does not exist in the current project. The complete Studio source is included from `studio/`, together with its local JSON state in `studio-data/`.

## Included root files — CODE_REVIEW

- All root `.json`, `.geojson`, `.js`, `.mjs`, `.css`, `.html`, `.md`, `.txt`, `.yml`, and `.yaml` files.
- `.env.example`
- `.gitignore`
- `.vercelignore`
- `build.mjs`
- `qa.mjs`
- `site.config.mjs`
- `package.json`
- `vercel.json`

No package lockfile exists in the current project.

## Included directory — VISUAL_QA

- `review-package-work/visual-qa/` — only the newly captured current-build `.png` screenshots, covering country, all seven province/region views, Lahore, Larkana/Moenjodaro, Rawalpindi/Taxila, filtered UNESCO panels, collapsed and expanded drawers, marker selection, 1440×900, 1920×1080, 430×932, and 375×812.

## Excluded directories

- `.git/` — version-control internals.
- `node_modules/` — installed dependencies.
- Cache directories, including any `.cache/`, `.parcel-cache/`, `.vite/`, and coverage caches if present.
- `assets/optimized/` — large public photography library.
- `assets/collaborators/` — binary collaborator imagery.
- `backups/` — duplicate historical project/build backups and their media.
- `dist-demo/` — duplicate generated sandbox build; the requested production build is included instead.
- `dist-production/assets/optimized/` — generated photographic assets.
- `dist-production/assets/collaborators/` — generated binary collaborator assets.
- `qa-screenshots/` — earlier QA screenshot collection.
- `qa-artifacts/**/screenshots/` — earlier QA screenshots.
- `qa-artifacts/**/recordings/` — earlier QA recordings.
- `qa-artifacts/**/baseline/` — earlier visual baselines; JSON geography baselines remain included where they are not image-only.
- `qa-artifacts/**/after/` — earlier visual comparison captures.
- `qa-artifacts/**/phase-a/` — earlier visual phase captures.
- `qa-artifacts/heritage-discovery/production-candidate/` — duplicate temporary generated build used for QA.
- `review-package-work/` — package-assembly staging and the temporary capture script; only its current visual files are copied into `Virsapur_VISUAL_QA.zip`.
- `work/` — empty scratch directory.
- All pre-existing `.zip`, `.7z`, `.rar`, and `.tar` archives.
- Video files and large temporary photography/image libraries outside the explicit current visual-QA set.

## Excluded file types from generated build folders

Photographic and binary asset formats such as `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, font files, audio, and video are excluded from `Virsapur_CODE_REVIEW.zip`. Map and application files using the protected source/data extensions remain included.

## Integrity notes

- `Virsapur_VISUAL_QA.zip` contains only the current capture set produced from the running Preview build.
- The code package preserves project-relative paths.
- Local Production content was not published or regenerated for this packaging task.
