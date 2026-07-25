"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, m } from "motion/react";
import { X, ZoomIn, ZoomOut, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { feature as topojsonFeature } from "topojson-client";
import type { Feature, Geometry } from "geojson";

import { worldCountryByCode } from "@backend/modules/map/data/worldCountries";
import { countryToRegion } from "@/modules/map/data/globalRegions";
import { publicMotion } from "@/modules/public/motion";

/* ── Types ── */

export interface MapMarker {
  id: string;
  title: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  href: string;
  imageUrl?: string;
}

type Selection =
  | { kind: "marker"; marker: MapMarker }
  | { kind: "country"; code: string; title: string };

interface PointerState {
  startX: number;
  startY: number;
  startLon: number;
  startPanY: number;
}

interface WorldMapProps {
  counts: Record<string, number>;
  markers: MapMarker[];
  regionFilter?: string | null;
}

/* ── Constants ── */

const SVG_W = 960;
const SVG_H = 500;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

// Natural Earth projection — world width at zoom=1
const WORLD_PX_ZOOM1 = 432;
const PX_PER_DEG = WORLD_PX_ZOOM1 / 360;
// Globe visual diameter (circle clip uses this)
const GLOBE_R = Math.min(CX, CY) * 0.92; // 230px

const DIMS: Record<string, { cx: number; cy: number; w: number; h: number }> = {
  tr: { cx: 0.5, cy: -0.1, w: 0.5, h: 0.5 },
  tl: { cx: -0.5, cy: -0.1, w: 0.5, h: 0.5 },
  br: { cx: 0.5, cy: 0.9, w: 0.5, h: 0.5 },
  bl: { cx: -0.5, cy: 0.9, w: 0.5, h: 0.5 },
  rt: { cx: 0.55, cy: 0.5, w: 0.5, h: 1 },
  lt: { cx: -0.55, cy: 0.5, w: 0.5, h: 1 },
  rb: { cx: 0.55, cy: 0.3, w: 0.5, h: 1 },
  lb: { cx: -0.55, cy: 0.3, w: 0.5, h: 1 },
};

function getPopupDir(
  px: number,
  py: number,
): { pos: { left: string; top: string }; dir: string } {
  const kx = px / SVG_W;
  const ky = py / SVG_H;
  let best = "tr";
  let bestFit = Infinity;
  for (const [dir, d] of Object.entries(DIMS)) {
    const cx = kx + d.cx;
    const cy = ky + d.cy;
    if (cx < 0.02 || cx > 0.98 - d.w || cy < 0.02 || cy > 0.98 - d.h) continue;
    const fit = Math.abs(cx - 0.45) + Math.abs(cy - 0.45);
    if (fit < bestFit) { bestFit = fit; best = dir; }
  }
  const d = DIMS[best];
  const left = ((kx + d.cx) * 100).toFixed(1);
  const top = ((ky + d.cy) * 100).toFixed(1);
  return { pos: { left: `${left}%`, top: `${top}%` }, dir: best };
}

/* ── Polygon → SVG d-string ── */

type ProjectFn = ([x, y]: [number, number]) => [number, number];

function polygonPath(
  rings: number[][][],
  proj: ProjectFn,
): string | null {
  return rings
    .map((ring) => {
      const pts = ring
        .map(([lon, lat]) => {
          const p = proj([lon, lat]);
          return p ? p.join(",") : null;
        })
        .filter(Boolean)
        .join("L");
      return pts ? `M${pts}Z` : null;
    })
    .filter(Boolean)
    .join(" ");
}

/* ── Component ── */

export default function WorldMap({ counts, markers, regionFilter }: Readonly<WorldMapProps>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const stripRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<PointerState | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [geoData, setGeoData] = useState<Feature<Geometry>[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);

  // View state — only committed on drag-end or zoom; during drag we write transforms via ref
  const [centerLon, setCenterLon] = useState(105);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const latestZoomRef = useRef(1);

  const clampZoom = useCallback((k: number) => Math.max(1, Math.min(6, k)), []);

  /* ── Load TopoJSON ── */

  useEffect(() => {
    let cancelled = false;
    import("world-atlas/countries-50m.json")
      .then((topology) => {
        if (cancelled) return;
        const atlas = "default" in topology ? topology.default : topology;
        const features = (
          topojsonFeature(
            atlas as never,
            (atlas as unknown as { objects: { countries: object } }).objects.countries as never,
          ) as unknown as { type: "FeatureCollection"; features: Feature<Geometry>[] }
        ).features;
        setGeoData(features);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  /* ── Flat Natural Earth projection — depends ONLY on zoom ── */

  const projection = useMemo<ProjectFn>(() => {
    return ([lon, lat]: [number, number]): [number, number] => {
      const lambda = (lon * Math.PI) / 180;
      const phi = (lat * Math.PI) / 180;
      const f = 6;
      const x = (2 * Math.sqrt(2) * Math.cos(phi) * Math.sin(lambda / f)) / Math.PI;
      const y = (Math.sqrt(2) * Math.sin(phi)) / Math.PI;
      return [CX + x * CX * zoom, CY - y * CY * zoom];
    };
  }, [zoom]);

  /* ── Path cache — recomputed only on zoom / geoData change ── */

  const pathCache = useMemo(() => {
    const map = new Map<string, { d: string | null; numericId: string; idx: number }>();
    geoData.forEach((item, idx) => {
      const rawId = item.id != null ? String(item.id) : `_idx_${idx}`;
      const numericId = rawId.padStart(3, "0");
      const d =
        item.geometry.type === "Polygon"
          ? polygonPath(item.geometry.coordinates as number[][][], projection)
          : item.geometry.type === "MultiPolygon"
            ? (item.geometry.coordinates as number[][][][])
                .map((poly) => polygonPath(poly, projection))
                .filter(Boolean)
                .join(" ")
            : null;
      map.set(`${numericId}-${idx}`, { d, numericId, idx });
    });
    return map;
  }, [geoData, projection]);

  const worldCountryByNumericId = useMemo(() => {
    const map = new Map<string, (typeof worldCountryByCode)[string]>();
    for (const c of Object.values(worldCountryByCode)) {
      map.set(String(c.numericId).padStart(3, "0"), c);
    }
    return map;
  }, []);

  /* ── Visited country codes ── */

  const visitedCodes = useMemo(() => {
    const set = new Set<string>();
    for (const [numericId, c] of Object.entries(counts)) {
      if (c > 0) set.add(numericId.padStart(3, "0"));
    }
    return set;
  }, [counts]);

  /* ── Selection handlers ── */

  const selectCountry = useCallback((code: string) => {
    const c = worldCountryByCode[code];
    if (!c) return;
    setSelection((prev) =>
      prev?.kind === "country" && prev.code === code
        ? null
        : { kind: "country", code, title: c.name },
    );
  }, []);

  const selectMarker = useCallback(
    (marker: MapMarker) => {
      setSelection((prev) =>
        prev?.kind === "marker" && prev.marker.id === marker.id
          ? null
          : { kind: "marker", marker },
      );
    },
    [],
  );

  /* ── Country <path> elements (recomputed only on zoom / geoData change) ── */

  const countryPaths = useMemo(() => {
    return Array.from(pathCache.entries()).map(([key, { d, numericId, idx }]) => {
      const isVisited = visitedCodes.has(numericId);
      const isDimmed =
        regionFilter != null &&
        (() => {
          const country = worldCountryByNumericId.get(numericId);
          if (!country) return false;
          const r = countryToRegion[country.code];
          return r !== regionFilter;
        })();
      const country = worldCountryByNumericId.get(numericId);
      const code = country?.code ?? "";
      return (
        <path
          key={key}
          id={`country-${key}`}
          d={d ?? ""}
          fill={
            d === null ? "none"
            : isVisited ? "var(--primary)"
            : isDimmed ? "rgb(255 255 255 / 0.05)"
            : "rgb(255 255 255 / 0.08)"
          }
          stroke={
            d === null ? "none"
            : isVisited ? "var(--night)"
            : "rgb(255 255 255 / 0.04)"
          }
          strokeWidth={0.5}
          className="map-country"
          data-code={code}
          data-visited={isVisited ? "1" : "0"}
          onClick={
            d !== null && country
              ? (e) => { e.stopPropagation(); selectCountry(code); }
              : undefined
          }
        />
      );
    });
  }, [pathCache, visitedCodes, regionFilter, worldCountryByNumericId, selectCountry]);

  /* ── Marker positions (projected in flat reference space) ── */

  const projectedMarkers = useMemo(() => {
    return markers.map((m) => {
      const [px, py] = projection([m.longitude, m.latitude]);
      return { ...m, px, py };
    });
  }, [markers, projection]);

  const markerElements = useMemo(() => {
    return projectedMarkers.map((m) => {
      const isDimmed =
        regionFilter != null &&
        m.countryCode &&
        countryToRegion[m.countryCode] !== regionFilter;
      if (isDimmed) return null;
      return (
        <g
          key={`marker-${m.id}`}
          className="map-marker"
          transform={`translate(${m.px}, ${m.py})`}
          onClick={(e) => { e.stopPropagation(); selectMarker(m); }}
        >
          <circle r={4} fill="var(--primary)" />
          <circle r={9} fill="none" stroke="var(--primary)" strokeWidth={1} opacity={0.5} />
        </g>
      );
    }).filter(Boolean);
  }, [projectedMarkers, regionFilter, selectMarker]);

  /* ── Pointer handlers: drag → update CSS transform via ref (instant); commit on up ── */

  const applyRotation = useCallback((lon: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const worldPx = WORLD_PX_ZOOM1 * latestZoomRef.current;
    let tx = -lon * PX_PER_DEG * latestZoomRef.current;
    tx = ((tx % worldPx) + worldPx) % worldPx;
    if (tx > worldPx / 2) tx -= worldPx;
    strip.style.transform = `translateX(${tx}px)`;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      pointerRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLon: centerLon,
        startPanY: 0,
      };
      latestZoomRef.current = zoom;
      setIsDragging(false);
      // Disable CSS transition during drag for instant response
      if (stripRef.current) stripRef.current.style.transition = "none";
    },
    [centerLon, zoom],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = pointerRef.current;
      if (!p) return;
      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setIsDragging(true);
      const targetLon = p.startLon - dx / (PX_PER_DEG * latestZoomRef.current);

      // Direct CSS transform for instant feedback, RAF-batched state commit
      applyRotation(targetLon);

      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(() => {
          animFrameRef.current = null;
          const pp = pointerRef.current;
          if (!pp) return;
          const ddx = (e.clientX - pp.startX);
          const tgtLon = pp.startLon - ddx / (PX_PER_DEG * latestZoomRef.current);
          setCenterLon(tgtLon);
        });
      }
    },
    [applyRotation],
  );

  const handlePointerUp = useCallback(() => {
    pointerRef.current = null;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Re-enable smooth transition for non-drag position changes
    if (stripRef.current) {
      stripRef.current.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)";
    }
    setIsDragging(false);
  }, []);

  /* ── Wheel zoom ── */

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      setZoom((prev) => clampZoom(prev * factor));
    },
    [clampZoom],
  );

  /* ── Keyboard ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((prev) => clampZoom(prev * 1.25));
      }
      if (e.key === "-") {
        e.preventDefault();
        setZoom((prev) => clampZoom(prev * 0.8));
      }
      if (e.key === "0") {
        e.preventDefault();
        setCenterLon(105);
        setZoom(1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clampZoom]);

  /* ── Sync CSS transform when state changes (zoom, reset) ── */

  useEffect(() => {
    latestZoomRef.current = zoom;
    applyRotation(centerLon);
  }, [centerLon, zoom, applyRotation]);

  /* ── Popup anchor ── */

  const popupAnchor = useMemo(() => {
    if (!selection) return null;
    const marker = selection.kind === "marker" ? selection.marker : null;
    if (!marker) return null;
    const [px, py] = projection([marker.longitude, marker.latitude]);
    const worldPx = WORLD_PX_ZOOM1 * zoom;
    let rawTx = -centerLon * PX_PER_DEG * zoom;
    rawTx = ((rawTx % worldPx) + worldPx) % worldPx;
    if (rawTx > worldPx / 2) rawTx -= worldPx;
    let sx = px + rawTx;
    if (sx < CX - GLOBE_R * zoom + 10) sx += worldPx;
    if (sx > CX + GLOBE_R * zoom - 10) sx -= worldPx;
    return getPopupDir(sx, py);
  }, [selection, projection, centerLon, zoom]);

  /* ── Country info for popup ── */

  const countryInfo = useMemo(() => {
    if (selection?.kind !== "country") return null;
    const c = worldCountryByCode[selection.code];
    if (!c) return null;
    const nid = String(c.numericId).padStart(3, "0");
    return { ...c, numericId: nid, photoCount: counts[nid] ?? 0 };
  }, [selection, counts]);

  /* ── Render ── */

  const worldPx = WORLD_PX_ZOOM1 * zoom;
  const globeD = GLOBE_R * 2 * zoom;
  const globeCx = CX;
  const globeCy = CY;

  return (
    <div className="archive-map-shell" style={{ position: "relative" }}>
      {/* ── Globe container with CSS 3D perspective ── */}
      <div
        className="map-globe-container"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: globeD,
          height: globeD,
          marginLeft: -globeD / 2,
          marginTop: -globeD / 2,
          borderRadius: "50%",
          overflow: "hidden",
          perspective: "900px",
          perspectiveOrigin: "center",
          background: "var(--night)",
        }}
      >
        {/* ── Inner strip (CSS 3D rotateY for pseudo-globe curvature) ── */}
        <div
          style={{
            width: `${worldPx}px`,
            height: "100%",
            perspective: "900px",
            transformStyle: "preserve-3d",
            transform: "rotateY(0deg)",
          }}
        >
          {/* ── SVG map (three copies for seamless wrapping) ── */}
          <svg
            ref={svgRef}
            className="archive-map-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={worldPx}
            height={globeD}
            style={{ display: "block", position: "absolute", top: 0, left: 0 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Three copies for seamless horizontal wrapping */}
            <g ref={stripRef} style={{ transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)" }}>
              <g>{countryPaths}{markerElements}</g>
              <g transform={`translate(${worldPx}, 0)`}>{countryPaths}{markerElements}</g>
              <g transform={`translate(${-worldPx}, 0)`}>{countryPaths}{markerElements}</g>
            </g>
          </svg>
        </div>

        {/* ── 3D shading overlay ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 40% 35%, transparent 55%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Globe outline ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid var(--public-line)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Country popup ── */}
      {countryInfo && (
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "var(--night)",
            border: "1px solid var(--public-line)",
            borderRadius: "0.75rem",
            padding: "1rem 1.5rem",
            minWidth: "14rem",
          }}
        >
          <p style={{ color: "var(--public-contrast)", fontWeight: 600, margin: 0 }}>
            {countryInfo.name}
          </p>
          <p style={{ color: "var(--public-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            {countryInfo.photoCount} 张照片
          </p>
        </div>
      )}

      {/* ── Marker popup ── */}
      <AnimatePresence>
        {selection?.kind === "marker" && popupAnchor && (
          <m.div
            key="marker-popup"
            className="map-marker-popup"
            style={{ position: "absolute", zIndex: 10, ...popupAnchor.pos }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="map-marker-popup-card">
              <button
                className="map-marker-popup-close"
                onClick={() => setSelection(null)}
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <p className="map-marker-popup-title">{selection.marker.title}</p>
              <Link href={selection.marker.href} className="map-marker-popup-link">
                查看 <ArrowRight size={14} />
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Zoom controls ── */}
      <div className="map-zoom-controls">
        <button
          className="map-zoom-btn"
          onClick={() => setZoom((prev) => clampZoom(prev * 1.25))}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="map-zoom-btn"
          onClick={() => setZoom((prev) => clampZoom(prev * 0.8))}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
      </div>
    </div>
  );
}
