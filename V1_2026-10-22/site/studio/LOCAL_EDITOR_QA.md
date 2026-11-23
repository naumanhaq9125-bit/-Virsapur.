# Local Studio collection and metadata extension

Scope: local editing only. `local-tools.js` and `local-editor.js` are loaded only when the pathname is not `/admin`. Existing hosted publishing/authentication code and quote-request view remain intact. No server, public template, canonical content or build files were edited by this UI task.

## Automated checks

Run `node studio/local-editor.test.mjs` from the website folder. It is read-only and does not start a browser/server or run a build.

Checks cover 1,000-record pagination, body-free keyword search, exact category/status/region/tag filters, immutable selected bulk status/category/tag changes, review-required publication guard, legacy reference retention, component unknown-field/coordinateSource preservation and CSV formula escaping.

All four edited/added browser JavaScript files passed `node --check`. Browser rendering and end-to-end saves are deliberately deferred until the main task coordinates the candidate server.

## Manual browser checklist — pending main-task QA

1. Stories: load 400+ records; inspect that at most 25 list rows exist. Search, filter status/category/region/tag, change pages and verify the current unsaved editor stays intact. Select across pages; bulk add category/tags and move to review. Verify one PUT, one revision and one Preview rebuild, not one request per record. Check selected-count and failure feedback. CSV/JSON exports must contain only selected IDs.
2. Story editor: edit references, legacy string references, AI/review flags, tags, primary keyword, social fields and noindex. Confirm all unrelated metadata survives. A review-required story must not be bulk or individually marked published until reviewed.
3. Body: edit and reorder paragraphs, headings, image, gallery, quote, callout, References and embed blocks. Add/remove gallery entries while retaining existing alt/caption/license/credit/unknown metadata. Existing nested `image` metadata must survive. References use `block.references`.
4. Heritage: search/filter/page 500+ records. Edit title/aliases/mapDisplay and source provenance. Edit/add/remove a component while retaining other unsaved form edits and all unknown component fields, especially coordinateSource. `verified-official` and unknown existing statuses must not reset. Geography remains derived/read-only. Blank coordinates remain null.
5. Rights: new/unknown media defaults to `productionCleared:false`. Enabling it without a source URL and license must fail. Saving a cleared record does not bypass server-side rights checks. No photographs are uploaded by these controls.
6. Programmes: tour enabled, startLocation, duration and bookingMode retain unknown tour fields. Origin defaults to `site.defaultTourOrigin` (Lahore fallback); exact Heritage selection order remains itinerary order. Related Story and Programme selectors must not create inverse duplicates or self-links.
7. Confirm Custom Tour Requests still opens root-owned `quotes.js`. Local saving must not alter Local Production or contact hosted services. Hosted `/admin` must not load either new module.
8. Narrow mobile viewport: filters, selected record, source rows and action buttons stay usable without horizontal overflow; labels and keyboard focus remain clear.

## Server/template contracts required

- Story: existing `references` array accepts strings and `{title,url,publisher,accessDate,...}`; tags[], aiAssisted, editorialReviewRequired; `seo.primaryKeyword/socialTitle/socialDescription/socialImage/noindex`.
- References block: `{type:'references',references:[...]}`; image and gallery entries preserve all fields.
- Image: credit, sourceUrl, license, approvedUsage, clearanceStatus plus explicit productionCleared boolean. Heritage uses flat productionCleared/imageCredit/imageSourceUrl/imageLicense/imageApprovedUsage/imageClearanceStatus.
- Heritage: mapDisplay (`featured` or `listed`), aliases[], existing component provenance fields; no field stripping. Geographic assignment must still derive from protected geometry server-side.
- Tour: `tour:{enabled,startLocation,duration,bookingMode,...}`; bookingMode choices enquiry/custom-quote/scheduled. Existing ordered `relatedHeritageIds` is reused.
- UI validation is not a security boundary. Enforce status/review/rights/reference validation and publication gates server-side. Bulk operations intentionally call the existing collection save once. The API still initially loads the complete collection, but only metadata is searched and 25 rows are rendered; API-level paging can be added later without changing the list model.

No deploy, build or browser/server startup was performed by this UI task.
