# Virsapur Website V1

Virsapur V1 currently runs as a completely local website workspace. Nothing in the active editing or publishing flow requires Supabase, Vercel, a cloud account, or an internet connection.

## The three local environments

| Environment | Address | Purpose |
|---|---|---|
| Studio | `http://127.0.0.1:4173/studio/` | Edit and save the local working content. |
| Preview | `http://127.0.0.1:4173/preview/` | Local sandbox. Rebuilds after each save and shows drafts, review records, published records, and demo fixtures. |
| Local Production | `http://127.0.0.1:4173/production/` | Clean local release. Contains only published, non-demo content and changes only after explicit publication. |

Start all three with `npm run studio`.

## Publishing locally

Choose **Publish to Local Production** in Studio. The publisher:

1. reads only the local files in `content/data/`;
2. validates all content marked as published;
3. builds and checks a temporary release;
4. replaces `dist-production/` only after every check passes; and
5. keeps the previous Local Production intact if validation or building fails.

Saving in Studio updates Preview only. It never publishes automatically.

## Editing content

The canonical working records live in `content/data/`:

- `site.json` — identity, navigation, footer, contact details and integration flags
- `homepage.json` — homepage hierarchy and calls to action
- `archive-categories.json` — editable Archive taxonomy, collection-page imagery, homepage eligibility and SEO
- `collaborators.json` — collaborator names, logos, visibility and order
- `programmes.json`, `projects.json`, `stories.json`, `events.json` — repeatable records with stable IDs
- `people.json`, `testimonials.json`, `media.json` — people, endorsements and media metadata

Only records with `status: "published"` appear in Local Production. Supported states are `draft`, `review`, `published`, and `archived`.

`/archives/` is the curated Archive entry point, `/archives/all/` is the complete searchable database, and every published Archive Category automatically receives `/archives/category/{slug}/`.

## Hosted CMS status

The future hosted CMS, Supabase provider, Vercel publishing functions, and related migrations remain in the repository as dormant future work. They are not used by the local workflow and stay disabled through `PRODUCTION_CMS_ENABLED=false` and `CMS_DATA_MODE=local`.
