# Virsapur targeted local repairs — 29 October 2026

Nothing was deployed or published. The October 22 developer handoff remains intact.

## Review entry points

- Local Production: http://127.0.0.1:4174/production/
- All 420 archive articles: http://127.0.0.1:4174/production/archives/all/
- Heritage Atlas: http://127.0.0.1:4174/production/heritage-map/
- Experiences & Programmes: http://127.0.0.1:4174/production/programmes/
- Custom itinerary: http://127.0.0.1:4174/production/tours/custom/
- Mock payment walkthrough: http://127.0.0.1:4174/production/payment-preview/
- Admin Studio: http://127.0.0.1:4174/studio/
- Development Preview: http://127.0.0.1:4174/preview/

Use START_VIRSAPUR.cmd in the new handoff folder. Direct file:// pages cannot run the browser modules or local services; an explicit notice now explains this when such a page is opened.

## Changes

- Local Production contains all 420 real archive articles, 606 heritage places, eight programme records and two project records. Existing statuses remain unchanged. The added language family is Review. Twelve demo records remain excluded from Local Production; the separate payment walkthrough is deliberately labelled as a demonstration.
- Experiences & Programmes has five illustrated pathways: Heritage Tours, workshops, research/restoration, cultural events/collaborations and language learning. Tour proposals/custom itineraries are reached through Heritage Tours. All six evidenced language offerings are named; no unconfirmed dates or fees were invented.
- District labels stay within their own geography, without leader lines. Dense names reveal progressively on zoom, and every district remains selectable. The province fills more of its available frame. On phones the initial province view gives names priority; major-heritage markers return above 1.4× zoom and in district views. The inventory drawer retains all records.
- Existing unillustrated heritage pins are compact points. Actual assigned photographs remain photo pins. Numbered clusters remain interactive. Ten release-cleared media records cover seven places; 65 source places already carry reference images. The site does not contain 420 distinct site photographs.
- Preview uses cleared photography in preference to temporary reference images where available. An explicitly selected owner image takes precedence. Source records are not silently rewritten by this rendering policy.
- Admin → Media retains image upload and processing. Admin → Map Heritage now has a media-library picker that fills the image, alt text, credit, source and clearance fields. Choosing does not save until the user validates and saves the place.
- The local payment walkthrough displays a sample price and quantity, supports success/decline/cancellation, and records MOCK orders only. Failed local requests no longer falsely claim an order was saved. No real payment provider is enabled.

## Verification

- Local Production: 1,063 routes, 1,064 HTML files, 35,039 local references checked; zero broken references, warnings or orphan routes. All pages remain noindex; sitemap empty.
- Existing content architecture, archive discovery, tours, itinerary state, Studio editor, backend contract and media regression suites pass. Media regression now includes cleared-photo fallback, preservation of the source record and owner-image precedence.
- Browser: 420-story count; real itinerary menus with seven regions, 131 populated districts and eight categories; Punjab → Lahore gives 37 places; itinerary selection works.
- Browser: five programme cards, five loaded images; language offerings present; desktop and 430-pixel mobile have no horizontal overflow. Itinerary also checked at 375 pixels.
- Browser: all seven province/region views; Punjab → Lahore; no district leader lines. At 430 pixels Punjab has ten readable overview labels; at 1.64× zoom more labels and major-heritage pins appear. At 375 pixels overview labels remain available. Screenshots are included.
- Browser: mock success, decline and cancellation; two guests calculate PKR 10,000 from the explicitly illustrative PKR 5,000 amount. Tests use Demo Visitor only.
- Admin media picker tested without saving test edits. Bundled Sharp successfully processes an image offline. The existing upload transport is retained; no test upload or real customer data was added to the handoff.
- Windows launcher starts the new D-drive package with its bundled runtime, serving Production, Preview and Studio on 127.0.0.1 only.

## Main files for technical review

Source paths below are relative to the handoff's site/ folder:

- src/site-builder.mjs, content/data/programmes.json, content/data/site.json, src/platform.css
- components/heritage-map.js, src/atlas-interface.css
- src/media-policy.mjs, studio/local-editor.js, app.js
- scripts/stage-local-production.mjs, scripts/media-validation-regression-qa.mjs
- scripts/local-handoff/, scripts/package-local-review.mjs

Protected geography, existing content states, route destinations, hosted CMS/payment activation flags and the older production candidate were not changed. Local Studio's existing published-only Publish to Local Production action remains separate from this all-real-content review snapshot.
