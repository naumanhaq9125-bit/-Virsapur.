# Virsapur Studio user guide

Virsapur currently uses one local editing workflow. Start it with `npm run studio`, then open `http://127.0.0.1:4173/studio/`.

## Know where you are

- **Studio** is the editing workspace. It reads and writes the local records in `content/data/`.
- **Preview** is the local sandbox at `http://127.0.0.1:4173/preview/`. It rebuilds after every save and includes drafts, review records, published records, and labelled demo fixtures.
- **Local Production** is the clean local release at `http://127.0.0.1:4173/production/`. It includes only published, non-demo content.

All three are localhost-only. No cloud account, login, Supabase project, or Vercel project is required.

## Save versus publish

**Save** updates the local working record and rebuilds Preview. It does not change Local Production.

When the sandbox is ready, choose **Publish to Local Production**. Studio validates and builds a temporary clean release. Local Production is replaced only after that release passes its checks. If anything fails, the previous Local Production remains available.

## Edit content

Choose a collection and select or create a record. Complete its title, stable slug, summary, editorial fields, image/alt text, SEO, and relationships. Use `draft` while writing, `review` when it is ready to check, `published` when it should enter the next Local Production build, and `archived` when it should remain out.

The body editor supports paragraph, heading, quote, image, gallery, callout, and embed blocks. Move blocks with the arrow buttons.

## Archive Categories and homepage curation

Use **Archive Categories** to create, edit, reorder, archive and publish collection taxonomy. Category pages are generated automatically from the saved slug. A Story’s **Primary category** and **Additional categories** choices always come from this collection.

Use **Homepage** to add/remove/reorder Quick Discovery links, choose and order Programmes, Stories, Projects and What’s On records, and move the public modules into their exact render order. Explore by Theme is managed through each Archive Category’s **Show on homepage** and **Homepage order** settings.

Use **Collaborators** to maintain the institution list, logo assets, optional links and homepage visibility without editing source code.

## Official heritage trips

Open **Official Trips / Schedule** and choose **Create official trip**. Add the trip name and short description, dates, and meeting point. Search **Heritage Places** to add stops and put them in visiting order. Optional travel details can be opened if you want to include transport, group size, budget or pace. Use the trip list below the form to edit a saved trip.

Choose **Save trip** to save the working draft and refresh Preview. To publish it locally, choose **Publish to Local Production** in the trip form. This saves the trip with published status, validates it, and rebuilds the visitor site. The separate **Local Production** link only opens the site. Production Admin uses its **Publish** action.

Published trip cards on **What’s On** and **Tours** open a dedicated `/trips/{slug}/` page with the full itinerary and practical details. When availability is set to **Places available**, visitors can reserve up to 10 seats per booking. Reservations are saved in `studio-data/official-trip-bookings.sqlite`; view them in Studio’s **Trip Bookings** section and cancel a reservation there to release its seats. No payment is collected and no confirmation email is sent; the visitor sees a booking reference on screen.

Official schedules are CMS records in `content/data/events.json`. They are distinct from private member plans in the SQLite `member_trips` table. Local seat reservations are kept in the separate SQLite booking database. For a hosted deployment, apply the still-unapplied `backend/supabase/migrations/004_official_trip_bookings.sql` and explicitly enable `TRIP_BOOKINGS_ENABLED`; the hosted reservations API stays disabled by default.

## Media and mock orders

Media uploads remain local and create local 640px and 1280px WebP derivatives. Preview supports clearly labelled mock checkout actions; they never process a real payment. Mock orders remain under `studio-data/` and never enter Local Production.

## Revisions

Studio keeps a dated local revision before overwriting a content file. Use the revision list to restore an earlier working version. Restoring also rebuilds Preview but does not publish.

The future hosted Admin remains dormant and is not part of this workflow.
