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

## Local member accounts and saved articles

When the site is served by the default local Studio server, member data is stored in SQLite: `studio-data/member-accounts.sqlite` contains `member_accounts`, `member_sessions`, `member_places` (wishlist and visited places), and `member_trips`; `studio-data/saved-articles.sqlite` contains saved article bookmarks; and `studio-data/custom-tour-quotes.sqlite` contains submitted custom-tour quote requests. Each member-owned row is associated with the authenticated account. Passwords are stored as salted scrypt hashes, and session tokens are hashed in the database. The browser uses an HttpOnly session cookie to authenticate requests, while profile data and saved member records are fetched from the backend rather than copied into Web Storage.

These databases live on this computer and are not synced to a hosted database. Old browser-stored profile, wishlist, visited-place, and trip data is imported for the signed-in member and removed after a successful transfer. The public tour builder keeps an unsent selection only in page memory; submitting a quote stores it in the local quote database. CMS content and Studio editing data remain file-based. The Supabase migrations remain dormant; a hosted site needs a separately configured authentication and database service.

## Editing content

The canonical working records live in `content/data/`:

- `site.json` — identity, navigation, footer, contact details and integration flags
- `homepage.json` — homepage hierarchy and calls to action
- `archive-categories.json` — editable Archive taxonomy, collection-page imagery, homepage eligibility and SEO
- `collaborators.json` — collaborator names, logos, visibility and order
- `programmes.json`, `projects.json`, `stories.json`, `events.json` — repeatable records with stable IDs
- `people.json`, `testimonials.json`, `media.json` — people, endorsements and media metadata

Only records with `status: "published"` appear in Local Production. Supported states are `draft`, `review`, `published`, and `archived`.

Official visitor-facing trip schedules are managed in Studio under **Official Trips / Schedule** and saved as event records in `content/data/events.json`. Published trips appear as cards on What’s On and Tours, linking to `/trips/{slug}/` for the itinerary and seat reservation form. Local reservations are stored in `studio-data/official-trip-bookings.sqlite` and managed in Studio under **Trip Bookings**; seat reservations do not collect payment or send email. These official schedules are separate from each member’s private plans in the SQLite `member_trips` table. Hosted reservations remain disabled unless migration `004_official_trip_bookings.sql` is applied and `TRIP_BOOKINGS_ENABLED=true` is set.

`/archives/` is the curated Archive entry point, `/archives/all/` is the complete searchable database, and every published Archive Category automatically receives `/archives/category/{slug}/`.

## Hosted CMS status

The future hosted CMS, Supabase provider, Vercel publishing functions, and related migrations remain in the repository as dormant future work. They are not used by the local workflow and stay disabled through `PRODUCTION_CMS_ENABLED=false` and `CMS_DATA_MODE=local`.
