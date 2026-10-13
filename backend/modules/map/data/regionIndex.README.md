# Public map province labels

Source: Natural Earth 1:10m Admin-1 States and Provinces, public domain.
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/

The snapshot stores only label points and names, never polygon boundaries. Rebuild with
`node scripts/build-map-region-index.mjs <decoded-admin-1-dbf-rows.json>`.
DBF text must be decoded as UTF-8; the generator removes NULL padding.

Overview labels include records with scalerank <= 6. Smaller subdivisions retain the
basemap's state layer after zoom 7. Independent region labels begin at zoom 3, before
major cities (4.5), and end at zoom 7. Country names and capitals have higher collision
priority; region names precede other cities. Chinese administrative suffixes are omitted
for compact labels; directly administered cities keep their province-level label.
