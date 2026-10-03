# countries.geojson

A trimmed, simplified copy of Natural Earth's **1:10m Admin 0 Countries, India point-of-view** dataset.

- Source: `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries_ind.zip` (also mirrored at
  `https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries_ind.zip`), version 5.1.1.
- Retrieved: 2026-10-03.
- Licence: Natural Earth data is public domain. No attribution required.
- Why the India point-of-view file: Natural Earth ships several point-of-view variants for the same world, since a
  handful of borders are drawn differently depending on whose law you read. The parent asked for India's own view
  (Jammu and Kashmir and Ladakh drawn fully as India, not hatched as disputed), which is what this file does and
  the default (de facto control) file does not.
- How this file was made, so it can be regenerated: downloaded the zip above, then
  `npx mapshaper ne_10m_admin_0_countries_ind.shp -simplify 3% keep-shapes -filter-fields NAME,ISO_A2,CONTINENT -o format=geojson precision=0.01 countries.geojson`.
  `keep-shapes` matters: a plain simplify with the `-clean` step removed 71 of 248 countries, including several
  small ones this app actually uses (Netherlands, Switzerland, Sri Lanka, Bhutan).
- Only used by `scripts/maps/build-maps.ts` at build time (`npm run maps:build`), which renders one small SVG per
  country into `public/maps/`. Never read by the running app.
