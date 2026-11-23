# Image Asset Inventory

## Runtime policy

The editable repository retains the 22 supplied raster sources. `scripts/optimize_images.py` produces WebP derivatives at up to 640 px and 1280 px without upscaling. The public `dist/` bundle copies only those derivatives; full-resolution source images are not deployed.

## Usage groups

- Identity: slate and white Virsapur logo variants.
- Homepage/social: Badshahi Mosque hero.
- Institutional: fresco imagery and two founder portraits.
- Programmes: Katas Raj, fresco strip, Mohenjo-daro wells and gurdwara imagery.
- Archives/draft records: supplied archaeology, architecture, temple and pillar imagery.
- Draft projects: two supplied project PNG sources, delivered publicly only as compressed WebP derivatives where a direct draft route is opened.

## Rendering rules

- Informative images require alt text; decorative images use empty alt.
- Width and height attributes prevent layout shift.
- Hero images are eager/high priority; below-fold images are lazy.
- Responsive `srcset` is emitted whenever more than one derivative size exists.
- Captions and credits remain separate fields and must be completed before publishing records that require them.

The build does not fetch or fabricate third-party heritage photography.
