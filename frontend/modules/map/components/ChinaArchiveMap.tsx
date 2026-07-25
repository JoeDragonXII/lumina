"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, X } from "lucide-react";
import { chinaFeatures, makePath, makeProjection, provinceIdOf } from "@backend/lib/geo";
import { provinces } from "@backend/data/provinces";
import type { MapMarker } from "@/modules/map/components/AsiaMap";

const provinceById = new Map(provinces.map((province) => [province.id, province]));
type Selection = { kind: "province"; id: string } | { kind: "marker"; marker: MapMarker } | null;

export default function ChinaArchiveMap({ counts, markers }: Readonly<{ counts: Record<string, number>; markers: MapMarker[] }>) {
  const [selection, setSelection] = useState<Selection>(null);
  const width = 920;
  const height = 720;
  const projection = useMemo(() => makeProjection(width, height, 18), []);
  const path = useMemo(() => makePath(projection), [projection]);
  const selectedProvince = selection?.kind === "province" ? provinceById.get(selection.id) : null;

  return <div className="archive-map-shell china-map-shell">
    <div className="map-status-panel"><span className="status-dot" /><strong>{Object.keys(counts).length} Provinces</strong><span>{markers.length} Coordinates</span></div>
    <svg aria-label="中国摄影足迹地图" className="archive-map-svg china-map-svg" role="img" viewBox={`0 0 ${width} ${height}`}>
      {chinaFeatures.map((item) => {
        const provinceId = provinceIdOf(item);
        const province = provinceById.get(provinceId);
        const count = counts[provinceId] || 0;
        const provinceName = province?.name || provinceId;
        const selected = selection?.kind === "province" && selection.id === provinceId;
        const label = `${provinceName}${count ? ` · ${count} 个图集` : ""}`;
        return <path aria-label={`${provinceName}${count ? `，${count} 个图集` : ""}`} aria-pressed={selected} className="map-path archive-country-path" d={path(item as never) || ""} fill={selected ? "#cf665a" : count ? "#63bfa5" : "#14241f"} key={provinceId} onClick={() => setSelection({ kind: "province", id: provinceId })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelection({ kind: "province", id: provinceId }); } }} role="button" stroke="#63756d" strokeWidth={1} tabIndex={0}><title>{label}</title></path>;
      })}
      {markers.map((marker) => {
        const point = projection([marker.longitude, marker.latitude]);
        if (!point) return null;
        const selected = selection?.kind === "marker" && selection.marker.id === marker.id;
        return <g aria-label={`选择图集 ${marker.title}`} className="archive-map-marker" key={marker.id} onClick={() => setSelection({ kind: "marker", marker })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelection({ kind: "marker", marker }); } }} role="button" tabIndex={0} transform={`translate(${point[0].toFixed(3)} ${point[1].toFixed(3)})`}><circle fill={selected ? "#cf665a" : "#f2f7f4"} r={selected ? 10 : 7} stroke="#07110f" strokeWidth="2" /><circle fill="#07110f" r="2.5" /><title>{marker.title}</title></g>;
      })}
    </svg>
    <aside aria-live="polite" className={`map-info-drawer ${selection ? "is-open" : ""}`}>
      {selection ? <button aria-label="关闭地点信息" className="map-drawer-close" onClick={() => setSelection(null)} type="button"><X className="h-4 w-4" /></button> : null}
      <p className="public-kicker">{selection?.kind === "marker" ? "Selected Collection" : "Selected Province"}</p>
      {selection?.kind === "marker" ? <><h2>{selection.marker.title}</h2><p><MapPin className="h-4 w-4" />已确认的照片坐标</p><Link className="map-drawer-action" href={selection.marker.href}>查看图集<ArrowRight className="h-4 w-4" /></Link></> : selectedProvince ? <><h2>{selectedProvince.name}</h2><p>{counts[selectedProvince.id] || 0} 个公开图集</p><Link className="map-drawer-action" href={`/map/asia/cn/${selectedProvince.id}`}>进入省份档案<ArrowRight className="h-4 w-4" /></Link></> : <><h2>选择一个省份</h2><p>点击省份或照片坐标，查看关联的摄影档案。</p></>}
    </aside>
  </div>;
}
