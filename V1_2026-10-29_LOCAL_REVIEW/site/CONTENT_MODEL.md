# Virsapur V1 content model

All editable source records are JSON. IDs are permanent; slugs are readable URLs; statuses are `draft`, `review`, `published` or `archived`.

## Shared fields

Content records use `id`, `type`, `slug`, `status`, `title`, `summary`, imagery, relationships and SEO where relevant. Images carry `src`, `optimizedStem`, dimensions, alt, caption, credit, `focalX` and `focalY`.

## Archive Category and Story

Archive Categories are first-class records with stable IDs, slugs, workflow state, title/short title, summary, description, collection image, order, featured/homepage visibility and SEO. Every published category generates `/archives/category/{slug}/` automatically.

Stories use `primaryCategoryId` and `categoryIds[]` as the canonical taxonomy while retaining the migrated category text for compatibility. A story may belong to multiple categories without changing its `/archives/{story-slug}` URL. Stories also support province, district, district stable ID, author, dates, references and relationships to programmes/projects. `body` is an ordered block array. Supported public rendering includes paragraph, heading, quote, callout and references; the schema is ready for image, gallery and embed blocks.

## Project

Projects support a structured body, location, start/end dates, partners, outcomes, references, stories, programmes and districts. `/our-work` is an institutional landing page and does not depend on a project being published.

## Programme and occurrence

A programme is the durable offer: experience, workshop, course, event or project programme. Practical information and enquiry action live on the programme. An occurrence is a separate dated activity linked by `programmeId`, with dates, location/online designation, capacity, registration state and optional commerce configuration.

## Relationships

Records reference one another by stable IDs, never presentation HTML. District relationships stop at district level. No city geometry or city layer is introduced.

## Site and homepage

`site.json` is the only source for identity, purpose, mission, vision, contact details, production domain, navigation, footer, integrations and commerce state. `homepage.json` controls module order, visibility, headings, featured records and calls to action.

Homepage Programme, Story, Project and What’s On selections store stable IDs in owner-defined order. Quick Discovery is an editable ordered array. Explore by Theme is derived from Archive Categories marked `showOnHomepage`, ordered by `homepageOrder`; it is not duplicated in homepage data.

## Collaborator

Collaborators are ordered content records with name, logo, optional URL, workflow state and featured/homepage visibility. The original eight names and assets are preserved in `content/data/collaborators.json`.

## Fixtures

`content/fixtures/demo.json` is not authoritative content. Every fixture carries `demo: true`, a DEMO title and Studio-only presentation. Production does not load the file and its build guard rejects any demo record.
