# Virsapur — Discovery & Booking Fixes

Local-only review dated 29 October 2026. Nothing deployed and no real payment provider enabled.

## Changes

- All 606 heritage records now participate in the full atlas markers and clusters; previously the 385 listed records were omitted from the marker renderer. The complete searchable inventory opens from Browse all. Multi-component sites remain one canonical place. Province counts total 609 memberships because serial properties span regions.
- Homepage and Explore use the same thin, shadow-free province boundary treatment. Coordinates and geographic datasets were not changed.
- Closed drawers no longer cover the bottom districts. Zoomed maps have independent vertical/horizontal scrollbars, mouse drag and existing touch controls. Heritage panels have bounded independent scrolling.
- Wheel zoom enters the province/district under the pointer; after returning to minimum zoom, continued outward scrolling returns one level. A short transition cooldown prevents accidental multi-level jumps. At country minimum, outward wheel scroll returns to the webpage.
- Experiences & Programmes retains its five activity families and adds a searchable, filterable list of 12 sample activities. Each opens an individual page. Tours index also lists scheduled tour samples, with the custom itinerary builder kept on the main Tours page.
- Fixed tour summaries, facts and buttons now describe fixed itineraries. Individual tour pages show sample prices and departures rather than a custom-quote CTA.
- Sample booking captures participants and contact details, calculates totals from the server-side sample price, simulates success/decline/cancellation and generates one numbered ticket per participant on success. Tickets download as printable HTML. No card details or email delivery.
- Sample bookings appear in Studio Mock Orders and remain in private local runtime storage. Price tampering, invalid participant counts, duplicate submissions and concurrent capacity requests are checked.

## What remains deliberately illustrative

The user authorized invented dates and prices for visual review. All 12 activities live in content/fixtures/booking-preview.json, separate from canonical events. Local Preview and local Production include them; hosted production mode does not. Final ticket styling, real payment integration and email delivery remain future work. Some existing preview photographs are illustrative or await clearance. No new site-specific image claims were invented.

## Verification

- Local Production: 1,075 routes, 420 archive articles, 606 heritage places, 8 programme records, 12 isolated sample activities. Canonical publication states preserved. All routes noindex; robots disallows indexing.
- Six booking-store tests passed: authoritative pricing, ticket counts, duplicate protection, concurrent capacity, decline/cancellation, invalid/expired requests.
- Existing content architecture, archive discovery, tour contract/storage (19 checks), itinerary persistence (3/10/20 selections), media validation (5 checks), backend contract (9 checks) and local editor checks passed.
- Browser checked 1440×900 desktop and 430×932 / 375×812 mobile. All seven provinces/regions include their complete record counts; all district polygons fit above the closed drawer; no horizontal page overflow.
- Browser wheel path: Pakistan → Punjab → Bahawalpur → Punjab; outward province → Pakistan. Zoomed map scrollbars changed map position independently.
- Programme search French returned one activity; type filters returned three tours / six language programmes. Two-person Lahore booking showed PKR 9,000, declined then successfully retried; two uniquely numbered tickets downloaded. A mobile French sample cancellation issued no ticket.
- Baseline and after screenshots, downloaded sample tickets, technical QA and region coverage results are in this directory.

## Files to review

- components/heritage-map.js, src/atlas-interface.css
- src/site-builder.mjs, src/tour-pages.mjs, src/booking-pages.mjs, src/booking.css
- components/programme-booking.js
- studio/booking-store.mjs, studio/booking-store.test.mjs, studio/server.mjs
- content/data/programmes.json, content/fixtures/booking-preview.json
- scripts/stage-local-production.mjs, scripts/package-local-review.mjs, scripts/archive-local-review.ps1, scripts/local-handoff/START_HERE.html

The prior October 22 and October 29 LOCAL_REVIEW packages remain intact. The new handoff contains source, generated local Production, development Preview, Admin, Windows launchers and runtime. It excludes private requests, bookings, credentials and old backup folders.

## Delivered-package check

The bundled D: package was started on 127.0.0.1:4174. Local Production and development Preview both showed 12 sample activities. The delivered atlas rendered 606 unique heritage record IDs. A two-person local booking generated two tickets and appeared in Admin Studio Mock Orders. The stop launcher was corrected to use PowerShell-safe quoting; the previous package was not modified.
