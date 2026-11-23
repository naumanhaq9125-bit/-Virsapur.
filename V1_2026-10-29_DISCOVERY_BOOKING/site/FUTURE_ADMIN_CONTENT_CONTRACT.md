# Future Admin Content Contract

This is the migration contract for a future CMS or admin interface. The current `content/` modules are the canonical editable data source until that migration occurs.

## Shared rules

Every repeatable record requires:

- `id`: immutable machine identifier; never derive relationships from a title.
- `slug`: URL-safe and unique within its content family.
- `status`: one of `draft`, `review`, `published`, `archived`.
- `title`, `summary`, `sortOrder` and `featured` where applicable.
- `seo.title`, `seo.description` and an appropriate social image.
- `featuredImage.src`, `optimizedStem`, intrinsic `width` and `height`, descriptive `alt`, optional `caption` and `credit`.

Changing a slug after publication requires a redirect from the previous slug. Changing a title does not change the stable ID.

## Publication workflow

1. `draft` — editable, unlisted, excluded from sitemap, `noindex`.
2. `review` — awaiting editorial/factual approval, still unlisted and `noindex`.
3. `published` — eligible for public routes, listings, relationships and sitemap.
4. `archived` — retained for history or redirects, excluded from listings and sitemap.

A CMS must never infer publication from the presence of a title or image. Only `status: "published"` grants public eligibility.

## Programme

Required: `id`, `slug`, `status`, `title`, `summary`, `body`, `sortOrder`, image and SEO. Optional practical fields are `audience`, `format`, `duration`, `location`, `availability` and `price`; empty fields must not render. CTA fields are `type`, `label` and `target`. Relationships use `relatedStoryIds`.

## Story

Required before publication: `id`, `slug`, `status`, `title`, `summary`, `category`, geographic values where known, author, publication date, complete body, image metadata, references and SEO. Relationships use stable programme/project IDs. A story without approved body, author/date and image credit review must remain draft or review.

## Project

Required before publication: `id`, `slug`, `status`, `title`, `summary`, complete body, location, dates, partners/outcomes as relevant, image metadata and SEO. Relationships use stable story IDs.

## Person and testimonial

People require stable ID, status, name, role, biography, image and order. Testimonials require stable ID, verified quotation, attribution, role, status and order. Consent and exact attribution should be verified outside the CMS before publication.

## Site settings

Global identity, navigation, footer, verified email/phone, optional address, social profiles and integration flags belong in one site-settings record. Empty legal or social collections must not generate empty UI.

## Homepage

The homepage is a curated composition, not a separate copy of programme/story data. Service cards read from published programme records. Featured story/project modules must query `status: "published"` and `featured: true`; if none qualify, omit the module.

## Geographic relationships

Use the stable region and district identifiers already defined by the Heritage Map data. Do not create public geographic landing pages merely because an identifier exists. Geography links editorial records to the map; publication remains controlled by the record status.

## Media processing

On upload, produce WebP derivatives near 640 px and 1280 px without upscaling, retain intrinsic dimensions, require meaningful alt text for informative images, and capture caption/credit separately. Deployment should contain derivatives required by rendered pages, not the CMS source library.
