# Virsapur V1 functional QA report

Date: 27 August 2026

## Automated results

- Production: 18 generated routes, 12 indexable routes, 19 HTML files, 0 errors, 0 warnings.
- Demo/Studio: 42 generated routes, 0 indexable routes, 43 HTML files, 0 errors, 0 warnings.
- Source migration: 12 Archive records and 2 Project records preserved as editable drafts.

## Browser-tested production behavior

- Home is visible in desktop and mobile navigation.
- Responsive menu opens and exposes Home at 375px.
- Contact form does not claim success; it directs the visitor to email because no endpoint is connected.
- Production Archives contains no demo/draft cards.
- Production has no What’s On route in navigation while its occurrence collection is empty.
- Production output contains no Studio files, fixture markers, mock checkout or mock orders.

## Browser-tested Studio behavior

- Dashboard loads status totals and revision controls.
- A temporary story was created, edited, published, previewed and unpublished.
- The pre-test story revision was restored; the canonical collection returned to 12 records.
- Homepage module controls and record editors render without console errors.
- Demo Archive filter returned 3 Archaeology results with query parameters.
- Global search returned results for “courtyard”.
- Mock checkout recorded both success and decline outcomes and displayed them in Mock Orders.
- The country map loaded 7 regions, Punjab loaded 41 districts, and a district selection entered District View.

## Visual QA files

Screenshots are under `qa-screenshots/v1-platform/`:

- Populated demo homepage: 1440×900, 1280×800, 768×1024, 430×932 and 375×812.
- Demo Archives, story, Our Work, project, programme-with-schedule and What’s On at 1280×800.
- Studio dashboard, story editor, homepage editor and mock checkout.
- Production homepage at all five sizes, plus production Archives, Our Work and programme detail.

## Limits of this QA

The content is not launch-approved. Most original story and project records intentionally remain drafts with incomplete research. External contact delivery, analytics, newsletter delivery, hosting redirects and a real payment provider were not connected or tested.
