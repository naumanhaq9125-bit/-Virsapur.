# Virsapur Public-Site Finesse & Temporary Photography Pass — QA

## Result

- Demo/sandbox build: **PASS** — 42 routes, 43 HTML files, 0 errors, 0 warnings.
- Clean local-production build: **PASS** — 18 routes, 12 indexable routes, 0 errors, 0 warnings.
- Security hardening suite: **PASS** — all checks passed, including demo exclusion, secret scan, public allowlist, Admin omission and dormant hosted endpoints.
- Responsive image integrity: **PASS** — all visible public-page images loaded. Archive images on inactive pagination pages remain intentionally lazy and hidden.
- Programme grid: **PASS** — 4 columns at 1280/1366/1440/1600/1920, 2 columns below 1280, 1 column at mobile.
- Mobile: **PASS** at 430×900 and 375×812.
- Header: **PASS** — fixed geometry retained; desktop navigation and mobile menu breakpoints unchanged.
- Measured grid/header matrix: 430px = 1 column / 74px header; 1024px = 2 columns / 84px header; 1280, 1366, 1440, 1600 and 1920px = 4 columns / 84px header.
- Hover states: **PASS** — Story, Programme, Project, Event, collaborator and navigation rest/hover screenshots captured.
- Heritage Map: **OUT OF SCOPE / UNTOUCHED** — zero Heritage Map-specific implementation or data files modified.
- Publish to Local Production: **PASS** — published through the existing local publishing endpoint at 2026-09-03T19:35:19.979Z; 18 routes, 12 indexable, QA passed with 0 errors and 0 warnings.

## Visual evidence

The folder `qa-screenshots/finesse-2026-09-03/` contains:

- 35 direct viewport screenshots: Homepage, Archives, Programmes, What’s On, Our Work, Why Virsapur and Contact at 1280, 1440, 1920, 430 and 375.
- Eight 1280px full-page screenshots, including a Heritage Tours programme detail page.
- Rest/hover pairs for Story, Programme, Project, Event, collaborator and navigation.
- `temporary-photography-contact-sheet.png` showing every temporary image.

## Modified source files in this pass

- `src/site-builder.mjs` — visual-only temporary image lookups; no route, schema, publication or SEO logic changed.
- `src/platform.css` — removed the terracotta card-edge flourish; retained restrained border, 12px radius, soft hover shadow and 1.026 image scale.
- `styles.css` — removed one dead reduced-motion reference to the deleted card-edge pseudo-element.
- `scripts/optimize_images.py` — now also processes local images in nested asset folders while excluding its own output folder.
- `content/data/temporary-image-overrides.json` — isolated visual replacement map.
- `assets/temporary/*` and corresponding `assets/optimized/temp-*` derivatives.
- This manifest, QA report and QA screenshot evidence.

## Protected systems verified unchanged

Studio behaviour, Preview/Sandbox semantics, Local Production semantics, Publish to Local Production, content schemas, record IDs, publication states, routes, redirects, SEO architecture, Archive/What’s On/Programme/Project logic, mock checkout/payment behaviour, authentication, security architecture, and dormant Supabase/Vercel code were not modified.
