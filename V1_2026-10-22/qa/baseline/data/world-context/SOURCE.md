# World context source

The Virsapur Heritage Atlas world-context layer uses **Natural Earth 1:110m Admin 0 — Countries, version 5.1.0**.

- Source page: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/
- GeoJSON repository: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Terms: Natural Earth data is public domain.

The source GeoJSON remains separate from Virsapur's authoritative Pakistan province and district datasets. `scripts/build-world-context.mjs` strips non-visual attributes and rounds the already simplified 1:110m coordinates before generating `data/world-context.js` for the decorative, non-interactive atlas layer.

At runtime, the South/Central Asia context and Virsapur's unchanged Pakistan province polygons are both projected from longitude/latitude with the same local equirectangular transform into the same SVG coordinate system. The desktop regional extent is 54°E–85°E and 20°N–40.5°N; mobile uses a tighter crop of 57°E–83°E and 20.5°N–40°N. Only the viewport extent changes. No independent Pakistan scaling or translation is applied after projection. The small world inset continues to use a separate full-world equirectangular view and is not part of the working-map overlay.
