# Virsapur — local review, 29 October 2026

Double-click START_VIRSAPUR.cmd. Windows starts a hidden localhost server with the included Node runtime. No installation, publishing account or internet service is required. Startup rebuilds development Preview from the included source, but does not change Local Production.

- Website: http://127.0.0.1:4174/production/
- Development Preview: http://127.0.0.1:4174/preview/
- Admin Studio: http://127.0.0.1:4174/studio/
- Payment demonstration: http://127.0.0.1:4174/production/payment-preview/

Do not open individual website HTML files directly. Browser restrictions prevent their modules and local services from working under file://. START_HERE.html is a safe guide with the correct links.

## Included current content

420 archive articles; 606 heritage places; 8 programme records; 2 project records. Existing publication states are preserved. Draft and Review records are deliberately visible in this private local Production review. Twelve isolated, clearly labelled sample activities exercise the complete booking flow: three fixed tours, six language cohorts, a workshop, research and a cultural event. Their dates and prices are examples authorized for local review; canonical events remain unchanged.

The programme landing page shows all five programme families. Individual fixed tours and custom itineraries live under Heritage Tours. Active activities appear in a searchable catalogue beneath the five activity families. All five families have local preview imagery; temporary illustrative images remain subject to replacement/clearance before a public release.

## Photographs and map symbols

420 is the article count, not a photograph library. 606 is the Heritage Place count. The ten release-cleared media records cover seven heritage places; the remaining places do not have release-cleared site-specific photography. 65 source heritage records currently have local/reference images; these remain available where present. A small point is a heritage location, a number is a cluster/components, and a photograph appears where one is assigned. UNESCO status remains separately labelled.

In Studio choose Media, upload a JPG/PNG/WebP (under 12 MB), add credit/licence/source information, then choose Map Heritage and the site. Use “Photograph from media library”, then Validate and save. The photograph appears in development Preview. Local Production is a separate snapshot. From site/ run the bundled runtime with scripts/stage-local-production.mjs to refresh this private all-real-content review. The existing Publish to Local Production action retains its published-only clean-release semantics.

The integrated booking walkthrough supports participants, server-calculated sample prices, success/decline/cancellation, capacity checks and duplicate protection. Successful simulations create one numbered ticket per participant, downloaded together as a printable HTML file. They are not valid admission tickets. Sample bookings are saved only on this computer and are visible in Studio Mock Orders. No email is sent. No card/bank data is requested. No payment provider, hosted CMS, Supabase or Vercel is enabled.

## Complete heritage discovery

All 606 records participate in map markers and clusters, including the 385 formerly list-only records. Browse all opens the full searchable inventory. Clusters expand as you zoom or click; district names use internal labels without long leaders. The homepage and full map share clean province borders. At minimum zoom, one further outward wheel movement returns to the parent level; inward zoom over a province/district enters it. Drag or use the horizontal/vertical scrollbars to pan a zoomed map. The complete province fits above the closed drawer.

## Sample activity editing

The isolated content/fixtures/booking-preview.json file contains sample dates, prices, capacities and locations. It is loaded only in local-review/demo modes. Real content statuses and canonical events remain separate. studio/booking-store.mjs and its tests own local ticket generation. A hosted release does not load sample activities and cannot use this local checkout.

## Developer files

- site/src, components, styles.css, app.js: website source.
- site/content, data, assets/maps: canonical content and geography.
- site/dist-production: complete private local Production build (1075 routes, all noindex).
- site/dist-demo: development Preview, including labelled demo fixtures.
- site/studio: local Admin source; run through the server.
- site/backend and api: retained future integration code, dormant.
- site/node_modules and runtime: ready-to-run Windows dependencies, with upstream licences. package.json and lockfile support normal developer installation on other systems.
- qa: checks and screenshots for this repair; FILES.sha256.json verifies the packaged files.

The previous V1_2026-10-22 release candidate remains unchanged in its own folder. This package is a private review, not a public release. STOP_VIRSAPUR.cmd stops only the server launched by this package. Runtime data created later (uploads, revisions, quotes and mock orders) is local and is not part of the initial handoff.
