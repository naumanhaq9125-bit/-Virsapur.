# Virsapur Local Production build guide

## Recommended workflow

Run `npm run studio` and choose **Publish to Local Production** in Studio. This is the safe publication path because it builds and checks a temporary candidate before replacing `dist-production/`.

Local Production is available at `http://127.0.0.1:4173/production/` and remains accessible only from the computer running Studio.

## Build rules

- The content source is always local JSON.
- The hosted CMS flag is always forced off.
- Only records marked `published` are included.
- Draft, review, archived, and demo records are excluded.
- Payment mode remains disabled.
- Canonical URLs use `http://127.0.0.1:4173/production`.
- Studio and Preview files never enter the clean release.

## Failure safety

The local publisher validates content, builds a candidate under `studio-data/`, and runs production QA against that candidate. The candidate replaces `dist-production/` only after QA passes. A validation or build failure leaves the last good Local Production unchanged.

Manual build and QA commands remain available for development, but the Studio publication button is the intended release control.

The Supabase/Vercel publishing implementation remains dormant future work and is not required or contacted by this local process.
