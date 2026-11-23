# Developer Integration Handoff

## Release configuration

1. Confirm the final production domain.
2. Build with `SITE_ORIGIN` set to that exact HTTPS origin.
3. Run `npm test` and review `dist/route-manifest.json`.
4. Deploy `dist/`. The repository root contains editable source and audit documentation and is not the public bundle.

The current default origin is the supplied Vercel deployment. It is a configuration fallback, not a final-domain assertion.

## Contact form integration

The contact form is marked with `data-action="contact-submit"`. Integration state is defined once in `content/site.mjs` under `integrations.contact` and exposed on the page body as `data-contact-connected`.

Current state: disconnected. The interface prevents a fake success state and directs a valid enquiry to the verified email address. To connect it:

1. Add an approved server-side endpoint with spam protection, rate limiting, input validation and privacy controls.
2. Store the endpoint and method in the site-settings integration record.
3. Change `connected` only after an end-to-end staging submission reaches the intended mailbox or CRM.
4. Update `app.js` to submit with `fetch`, handle server validation, expose pending/error/success states accessibly and clear the form only after confirmed success.
5. Re-test keyboard use, offline/error handling and double-submit protection.

Do not place private service credentials in frontend files.

## CMS migration

Map the modules in `content/` directly to CMS collections using `FUTURE_ADMIN_CONTENT_CONTRACT.md`. Preserve all stable IDs and slugs. Make publication status a required controlled field, and ensure public queries always filter to `published`.

## SEO and redirects

Canonical URLs, Open Graph URLs, social-image URLs, sitemap URLs and robots sitemap location derive from `SITE_ORIGIN`. Vercel redirects cover `/home` and the four legacy camelCase programme URLs. Reproduce these redirects if the hosting platform changes.

The build emits structured WebPage data for every rendered page, WebSite and Organization on the homepage, CollectionPage for the Heritage Map, and BreadcrumbList only for nested content routes.

## Heritage Map

The existing map data architecture is retained. Country geometry loads when the map approaches the viewport; district files continue to load on demand. The map component resolves district scripts from the site root, so deep links such as `/heritage-map/#map/punjab/kot-addu` remain stable.

When administrative data changes, update the dated snapshot, source attribution, stable identifiers and district runtime together. Do not silently redraw boundaries without source review.

## Images and performance

Run `scripts/optimize_images.py` after changing raster sources, then rebuild. Rendered pages use responsive WebP derivatives with intrinsic dimensions and lazy loading below the fold. Hero images load eagerly with high priority. Only `assets/optimized` and required map runtime files are copied to `dist/`.

## Final launch checks

- Replace the fallback origin with the confirmed production domain.
- Connect and test the contact endpoint, or keep the form’s disconnected-state message accurate.
- Review all draft/review records; publish only complete, approved content.
- Confirm image credits and permissions.
- Test `/`, `/home`, every published programme, the map deep link, contact form failure/success states and the 404 page on the production host.
- Submit the generated sitemap after deployment.
