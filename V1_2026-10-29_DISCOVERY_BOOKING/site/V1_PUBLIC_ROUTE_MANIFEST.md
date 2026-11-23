# V1 Public Route Manifest

This manifest distinguishes public V1 pages from preserved but incomplete records. `dist/route-manifest.json` is the machine-readable source generated with every build.

## Public, indexable and included in sitemap

| Route | Type | Purpose |
|---|---|---|
| `/` | Homepage | Primary task-oriented entry point |
| `/why-virsapur` | Institutional | Purpose, approach and founders |
| `/programmes` | Programme index | All published programme pathways in configured content order |
| `/service/heritage-tours` | Programme | Heritage tour overview and enquiry |
| `/service/cultural-and-educational-workshops` | Programme | Workshop overview and enquiry |
| `/service/research-and-restoration-projects` | Programme | Research and restoration overview and enquiry |
| `/service/cultural-events-and-collaborations` | Programme | Events and collaboration overview and enquiry |
| `/heritage-map` | Discovery | Dedicated three-level Heritage Map |
| `/archives` | Archive discovery | Curated collections, global search entry and selected stories |
| `/archives/all` | Archive database | Complete searchable, filterable and paginated Story collection |
| `/archives/category/{category-slug}` | Archive collection | One automatically generated route per published Archive Category |
| `/contact` | Contact | Verified contact details and integration-ready form |

## Redirects, unlisted and excluded from sitemap

- `/home` redirects permanently to `/`.
- Four camelCase legacy programme URLs redirect permanently to their kebab-case programme routes.

## Draft, unlisted, `noindex,nofollow` and excluded from sitemap

- Collection routes: `/trails`, `/workshops`, `/courses`, `/projects`.
- Two project records under `/projects/{slug}`.
- Archive records under `/archives/{slug}` remain stable and follow each Story record’s workflow state.

These routes preserve stable IDs and URLs for editorial work. They must not be linked from public navigation or listings until their records pass review and their `status` is deliberately changed to `published`.

## Utility

- `/404` and `404.html` provide the branded not-found experience and are `noindex`.

## Publication rule

Public navigation, homepage feature modules, index listings, sitemap generation and indexability all derive from content status. Empty feature modules are omitted rather than displaying incomplete cards.
