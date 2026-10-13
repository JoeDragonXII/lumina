# Public map city index

Source: Natural Earth 5.1.2, 1:10m Populated Places, public domain.
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/

Rebuild with `node scripts/build-map-city-index.mjs <ne_10m_populated_places.geojson>`.
The snapshot is bundled; rendering never queries a geocoder or external city service.

These are cartographic priorities, not official or current demographic classifications:
1. Natural Earth's national capital flag.
2. Population estimate of at least five million, or its world-city flag.
3. Regional capitals of at least 250,000, Chinese provincial centres, or cities of at least one million.

Language names use the source's translations for the country's local language, with English as fallback.
China uses Chinese; Tokyo uses 東京. The source's population estimates are historical.
Multilingual countries use a default language; this can be refined per city in the generator.
Smaller cities and towns retain the basemap's native `name` and appear only at closer zooms.
