# Vercel deployment

## What this deployment contains

The configured Vercel build publishes the static public site from `dist-production`. All 33 `/api/...` route paths dispatch through one catch-all Vercel Function, keeping the project below the Hobby plan's 12-function limit while preserving the API URLs. The Node 24 handlers support hosted signup/login/profile, wishlist and visited places, saved trips, saved articles, member custom-trip requests, admin quote/booking review, official trip seat reservations, and Stripe Checkout/webhook confirmation. These functions use Supabase Auth and service-role database calls; no member state is kept in browser storage.

Hosted flows remain deliberately disabled until the required migrations, content migration, secrets, Supabase Auth settings, and test steps below are complete. Enabling flags alone is not sufficient, and local SQLite data does not move to Vercel automatically.

## Vercel project settings

Import this `site` directory as the project root. Use these settings (the tracked `vercel.json` also declares the build and output):

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `npm run build:production` |
| Output directory | `dist-production` |
| Install command | `npm install` (Vercel default is also fine) |
| Node.js version | 24.x |

Deploy a Preview first and inspect the build log, public routes, images, map assets, sitemap, and `robots.txt`. Add the production custom domain in Vercel, then deploy Production after setting `SITE_ORIGIN` to that exact HTTPS origin (for example, `https://www.example.com`, without a path or trailing slash). This value is embedded in canonical URLs and sitemap links at build time, so changing it requires a new deployment.

## Initial public-site deployment

Set these in Vercel for Preview and Production as appropriate:

| Variable | Initial value |
| --- | --- |
| `SITE_ORIGIN` | The environment's public HTTPS origin; use the production custom domain for Production. |
| `PRODUCTION_CMS_ENABLED` | `false` |
| `CMS_DATA_MODE` | `local` |
| `STUDIO_DATA_MODE` | `local` |
| `PAYMENT_MODE` | `disabled` |
| `TRIP_BOOKINGS_ENABLED` | `false` |
| `CUSTOM_TOUR_QUOTES_ENABLED` | `false` |

Do not copy the local `.env` file into Vercel. Never set local SQLite paths or put secrets in `SITE_ORIGIN`, source files, or browser code. Secrets are only needed when activating hosted integrations.

## Activate hosted member accounts, CMS, custom requests and bookings

1. Create a Supabase project and configure its Auth Site URL and allowed redirect URLs for your Vercel Preview and production HTTPS domains. Choose whether signup requires email confirmation; the site supports either confirmation-required or immediate sessions.
2. Apply `backend/supabase/migrations/001_production_cms.sql` through `006_hosted_member_data.sql` in numeric order. Keep the service role key server-only. The migrations install strict RLS, hosted member tables, quote metadata and atomic capacity checks. They do not import your local data.
3. Use the documented CMS migration process to transfer reviewed/published content from `content/data/` into Supabase, then verify that the expected public CMS snapshots exist. The source currently has no published stories, so publish story records before expecting public article bookmarks to have options.
4. Add Vercel environment variables for Preview and Production: `PRODUCTION_CMS_ENABLED=true`, `CMS_DATA_MODE=production`, `STUDIO_DATA_MODE=production`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `SITE_ORIGIN`. The `SUPABASE_SECRET_KEY` must be the server-side service-role/secret key. For Studio staged publishing, also configure `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_PROJECT_NAME`, `VERCEL_GIT_REPOSITORY_ID`, and `VERCEL_GIT_REF` (plus `VERCEL_TEAM_ID` when applicable).
5. Deploy a Preview and test signup, email confirmation (if enabled), login/logout, profile edits, wishlist, visited places, saved articles, custom itineraries, Admin request decisions, and trip schedule edits using test accounts.
6. Enable `CUSTOM_TOUR_QUOTES_ENABLED=true` after verifying the quote migration and Admin inbox. Enable `TRIP_BOOKINGS_ENABLED=true` only after verifying seat availability and approval flows. The database transaction rejects over-capacity reservations and counts pending/confirmed seats.

## Enable Stripe Checkout

Set `PAYMENT_MODE=stripe`, `STRIPE_SECRET_KEY` to a Stripe test secret, and `STRIPE_WEBHOOK_SECRET` to the signing secret for the deployed endpoint. In Stripe, add a webhook endpoint at `https://<your-domain>/api/stripe/webhook` subscribed to `checkout.session.completed`, `checkout.session.expired`, and `checkout.session.async_payment_failed` (and `checkout.session.async_payment_succeeded` if delayed payment methods are enabled). Stripe sends events directly to the deployed endpoint; the local `stripe listen` command is only for local testing. Test checkout, payment success, expiration, webhook retry, admin approval, and declined/refund handling before switching to live keys.

Optional confirmation email requires `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Refunds for paid reservations must be performed in Stripe before an Admin changes the booking status.

## Build verification

Run these locally before pushing a deployment:

```powershell
npm ci
npm test
npm run qa:production
npm run qa:security
```

The Vercel build command runs the production build, route QA, and security QA. Security QA checks that hosted Admin routes redirect to login and unauthenticated admin APIs are denied when the CMS is enabled. Complete a live Preview test against your own Supabase and Stripe test environments before using Production; these external credentials are not present in this checkout.
