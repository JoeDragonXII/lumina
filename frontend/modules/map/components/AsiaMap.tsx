"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, X } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-50m.json";
import { asianCountryByCode, asianCountryByNumericId } from "@backend/modules/map/data/asianCountries";

export interface MapMarker {
  id: string;
  title: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  href: string;
}

type Props = {
  counts: Record<string, number>;
  markers: MapMarker[];
};

type Selection = { kind: "country"; code: string } | { kind: "marker"; marker: MapMarker } | null;

const world = worldData as { objects: { countries: object } };
const allFeatures = (feature(worldData as never, world.objects.countries as never) as unknown as FeatureCollection).features;
const asiaFeatures = allFeatures.filter((item) => asianCountryByNumericId.has(String(item.id).padStart(3, "0")));
const collection: FeatureCollection = { type: "FeatureCollection", features: asiaFeatures };

export default function AsiaMap({ counts, markers }: Readonly<Props>) {
  const [selection, setSelection] = useState<Selection>(null);
  const width = 1100;
  const height = 650;
  const projection = useMemo(() => geoMercator().fitExtent([[35, 30], [width - 35, height - 30]], collection), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const selectedCountry = selection?.kind === "country" ? asianCountryByCode.get(selection.code) : selection?.kind === "marker" ? asianCountryByCode.get(selection.marker.countryCode) : null;

  function selectCountry(code: string) {
    setSelection({ kind: "country", code });
  }

  return (
    <div className="archive-map-shell">
      <div className="map-status-panel"><span className="status-dot" /><strong>{Object.keys(counts).length} Countries</strong><span>{markers.length} Coordinates</span></div>
      <svg aria-label="亚洲摄影足迹地图" className="archive-map-svg" role="img" viewBox={`0 0 ${width} ${height}`}>
        {asiaFeatures.map((item: Feature<Geometry>) => {
          const numericId = String(item.id).padStart(3, "0");
          const country = asianCountryByNumericId.get(numericId);
          if (!country) return null;
          const count = counts[country.code] || 0;
          const selected = selection?.kind === "country" && selection.code === country.code;
          const label = `${country.name}${count ? ` · ${count} 个图集` : ""}`;
          return <path aria-label={`${country.name}${count ? `，${count} 个图集` : ""}`} aria-pressed={selected} className="map-path archive-country-path" d={path(item) || ""} fill={selected ? "#cf665a" : count ? "#63bfa5" : "#14241f"} key={numericId} onClick={() => selectCountry(country.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCountry(country.code); } }} role="button" stroke="#63756d" strokeWidth={0.8} tabIndex={0}><title>{label}</title></path>;
        })}
        {markers.map((marker) => {
          const point = projection([marker.longitude, marker.latitude]);
          if (!point) return null;
          const selected = selection?.kind === "marker" && selection.marker.id === marker.id;
          return <g aria-label={`选择图集 ${marker.title}`} className="archive-map-marker" key={marker.id} onClick={() => setSelection({ kind: "marker", marker })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelection({ kind: "marker", marker }); } }} role="button" tabIndex={0} transform={`translate(${point[0].toFixed(3)} ${point[1].toFixed(3)})`}><circle className="marker-pulse" fill={selected ? "#cf665a" : "#f2f7f4"} r={selected ? 10 : 7} stroke="#07110f" strokeWidth="2" /><circle fill="#07110f" r="2.5" /><title>{marker.title}</title></g>;
        })}
      </svg>
      <aside aria-live="polite" className={`map-info-drawer ${selection ? "is-open" : ""}`}>
        {selection ? <button aria-label="关闭地点信息" className="map-drawer-close" onClick={() => setSelection(null)} type="button"><X className="h-4 w-4" /></button> : null}
        <p className="public-kicker">{selection?.kind === "marker" ? "Selected Collection" : "Selected Place"}</p>
        {selection?.kind === "marker" ? <><h2>{selection.marker.title}</h2><p><MapPin className="h-4 w-4" />{selectedCountry?.name || selection.marker.countryCode}</p><Link className="map-drawer-action" href={selection.marker.href}>查看图集<ArrowRight className="h-4 w-4" /></Link></> : selectedCountry ? <><h2>{selectedCountry.name}</h2><p>{counts[selectedCountry.code] || 0} 个公开图集</p><Link className="map-drawer-action" href={selectedCountry.code === "CN" ? "/map/china" : `/map/${selectedCountry.code.toLowerCase()}`}>进入地点档案<ArrowRight className="h-4 w-4" /></Link></> : <><h2>选择一个地点</h2><p>点击国家或照片坐标，查看关联的摄影档案。</p></>}
      </aside>
    </div>
  );
}
