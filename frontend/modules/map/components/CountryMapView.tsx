"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { feature as topojsonFeature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-50m.json";
import { worldCountryByCode } from "@backend/modules/map/data/worldCountries";
import { countryToRegion } from "@/modules/map/data/globalRegions";
import CollectionCard from "@/modules/public/components/CollectionCard";
import type { CollectionRecord } from "@backend/modules/library/types";

const MAP_W = 800;
const MAP_H = 420;
const PADDING = 40;

const worldTopo = worldData as unknown as { objects: { countries: object } };
const allFeatures = (
  topojsonFeature(
    worldData as never,
    worldTopo.objects.countries as never,
  ) as unknown as FeatureCollection
).features;

interface CountryMarker {
  id: string;
  slug: string;
  title: string;
  city: string;
  px: number;
  py: number;
}

export default function CountryMapView({
  countryCode,
  countryName,
  collections,
}: {
  countryCode: string;
  countryName: string;
  collections: CollectionRecord[];
}) {
  const router = useRouter();

  const { pathD, markers } = useMemo(() => {
    // Find the country feature by numeric ID
    const countryInfo = worldCountryByCode[countryCode];
    const numericId = countryInfo?.numericId
      ? String(countryInfo.numericId).padStart(3, "0")
      : null;

    const countryFeature = numericId
      ? allFeatures.find(
          (f: Feature<Geometry>) =>
            String(f.id ?? "").padStart(3, "0") === numericId,
        )
      : null;

    // Build Mercator projection fitting the country
    const projection = geoMercator();
    if (countryFeature) {
      projection.fitExtent(
        [
          [PADDING, PADDING],
          [MAP_W - PADDING, MAP_H - PADDING],
        ],
        countryFeature,
      );
    }
    const pathGen = geoPath().projection(projection);

    // Generate path data
    let d = "";
    if (countryFeature?.geometry) {
      d = pathGen(countryFeature) ?? "";
    }

    // Extract markers from collections with GPS coordinates
    const markerList: CountryMarker[] = [];
    for (const col of collections) {
      const loc = col.location;
      if (loc?.latitude != null && loc?.longitude != null) {
        const [px, py] = projection([loc.longitude, loc.latitude]) ?? [0, 0];
        if (px != null && py != null) {
          markerList.push({
            id: col.id,
            slug: col.slug,
            title: col.title,
            city: loc.city || loc.regionName || col.slug,
            px,
            py,
          });
        }
      }
    }

    return { pathD: d, markers: markerList };
  }, [countryCode, collections]);

  const regionKey = countryToRegion[countryCode] ?? "asia";

  return (
    <div className="country-map-shell">
      {/* Back button + header */}
      <div className="country-map-header">
        <button
          className="country-map-back"
          onClick={() => router.push(`/map/${regionKey}`)}
        >
          <ArrowLeft size={16} />
          <span>返回 {regionKey === "asia" ? "亚洲" : regionKey}</span>
        </button>
        <h2 className="country-map-title">
          {countryName}
          <span className="country-map-count">{collections.length} 个图集</span>
        </h2>
      </div>

      {/* Country SVG map */}
      <div className="country-map-visual">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="country-map-svg"
          aria-label={`${countryName} 地图`}
        >
          {/* Country shape */}
          {pathD && (
            <path
              d={pathD}
              className="country-map-shape"
              fill="var(--map-footprint)"
              fillOpacity={0.25}
              stroke="var(--map-footprint-light)"
              strokeWidth={1.2}
            />
          )}

          {/* Markers */}
          {markers.map((m) => (
            <g key={m.id} className="country-map-marker-group">
              <circle
                cx={m.px}
                cy={m.py}
                r={5}
                className="country-map-marker-dot"
              />
              <Link href={`/map/${regionKey}/${countryCode.toLowerCase()}/${m.city}`}>
                <circle
                  cx={m.px}
                  cy={m.py}
                  r={16}
                  className="country-map-marker-hit"
                />
                <title>{m.title}</title>
              </Link>
            </g>
          ))}
        </svg>
      </div>

      {/* Collection cards grid */}
      <div className="country-map-cards">
        {collections.length === 0 ? (
          <div className="country-map-empty">
            <p className="public-kicker">暂无图集</p>
            <p style={{ color: "var(--public-muted)" }}>
              该国家下暂无公开图集。
            </p>
          </div>
        ) : (
          <div className="archive-grid">
            {collections.map((col, idx) => (
              <CollectionCard
                key={col.id}
                collection={col}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
