# Stripe checkout for official heritage trips

## Runtime setup

The local Node server handles Stripe Checkout and booking webhooks. The static site never receives or embeds a Stripe secret key.

- `PAYMENT_MODE=disabled` keeps the existing no-payment booking request flow.
- `PAYMENT_MODE=stripe` enables paid reservations when `STRIPE_SECRET_KEY` is configured.
- `STRIPE_WEBHOOK_SECRET` is required for verified booking status updates.
- For local development, run `stripe listen --forward-to 127.0.0.1:4173/api/stripe/webhook` and put the listener's `whsec_...` value in `.env`.
- Restart `node studio/server.mjs` after changing `.env`.

Start with Stripe test keys (`sk_test_...`) and test card numbers from Stripe's documentation. Never commit `.env`, paste secret keys into chat, or place them in browser code.

## Admin trip pricing

Official trip records have a `commerce.amount` per-seat price in PKR, separate from `officialTrip.budget`, which is informational. Admins set the price in Studio before opening paid reservations. The server reads the saved trip, verifies its price/currency and availability, then creates a Stripe-hosted Checkout Session. The browser cannot supply the charge amount.

## Booking and payment states

Starting Checkout writes a `pending` booking in `studio-data/official-trip-bookings.sqlite` with a 30-minute seat hold, Stripe Checkout Session ID, amount and currency. Checkout expiration or failed payment releases the hold. A verified, idempotently processed Stripe webhook marks a paid reservation `confirmed` and sends the existing confirmation email when SMTP is configured.

Stripe webhook event IDs are recorded in `stripe_webhook_events`. Card details and provider secrets are never stored in Virsapur's database. Refunds are not automated: an administrator must handle a refund in Stripe before changing a paid booking.

## Scope

This implementation covers the active local Node/SQLite workflow. The dormant hosted Supabase/Vercel CMS path has no hosted Stripe webhook backend. A real public deployment needs a reachable HTTPS Node payment endpoint and webhook URL before it can accept production payments.
