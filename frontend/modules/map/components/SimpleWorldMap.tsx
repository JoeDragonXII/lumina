"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  geoCentroid,
  geoDistance,
  geoGraticule10,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { feature as topojsonFeature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-50m.json";

import { worldCountryByCode } from "@backend/modules/map/data/worldCountries";
import { GLOBAL_REGIONS, countryToRegion } from "@/modules/map/data/globalRegions";
import { chooseGridOwner } from "@/modules/map/gridOwnership";
import {
  createMapRenderPalette,
  type MapPaletteColors,
} from "@/modules/map/mapPalette";

const FALLBACK_WIDTH = 960;
const FALLBACK_HEIGHT = 620;
const DEFAULT_GLOBE_ZOOM = 2.35;
const DEFAULT_GLOBE_PAN_Y = -100;
const MAX_FLAT_ZOOM = 2.5;
const MAX_GLOBE_ZOOM = 3.25;
const DEFAULT_MARKERS = ["CN", "JP", "SG"];
const mapScenes: Record<
  string,
  { center: [number, number]; scale: number; offsetY?: number }
> = {
  all: { center: [8, 8], scale: 300 },
  asia: { center: [92, 28], scale: 700 },
  europe: { center: [14, 49], scale: 1180, offsetY: 90 },
  africa: { center: [20, 3], scale: 630 },
  "north-america": { center: [-100, 38], scale: 540 },
  "south-america": { center: [-61, -17], scale: 650 },
  oceania: { center: [145, -22], scale: 700 },
};
const globeCenters: Record<string, [number, number]> = {
  all: [105, 28],
  asia: [95, 25],
  europe: [15, 50],
  africa: [20, 5],
  "north-america": [-100, 40],
  "south-america": [-61, -17],
  oceania: [145, -22],
};
const globeGraticule = geoGraticule10();
const GRID_SIZE = 10;
const GRID_TILE_SIZE = 6.7;
const GRID_TILE_RADIUS = 1.4;
const GRID_SAMPLE_AXIS = 7;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const regionCodeSet = new Map<string, Set<string>>();
for (const region of GLOBAL_REGIONS) {
  regionCodeSet.set(region.key, new Set(region.codes));
}

const numericIdToCode: Record<string, string> = {};
for (const [code, info] of Object.entries(worldCountryByCode)) {
  if (info.numericId) {
    numericIdToCode[String(info.numericId).padStart(3, "0")] = code;
  }
}

const worldTopo = worldData as unknown as { objects: { countries: object } };
const allFeatures = (
  topojsonFeature(
    worldData as never,
    worldTopo.objects.countries as never,
  ) as unknown as FeatureCollection
).features as Feature<Geometry>[];

const featureByCode = new Map<string, Feature<Geometry>>();
for (const worldFeature of allFeatures) {
  const code = numericIdToCode[String(worldFeature.id ?? "").padStart(3, "0")];
  if (code) featureByCode.set(code, worldFeature);
}

export default function SimpleWorldMap({
  colors,
  counts,
  continent,
  isDark,
  mode,
  renderStyle,
}: {
  colors: MapPaletteColors;
  counts: Record<string, number>;
  continent?: string;
  isDark: boolean;
  mode: "flat" | "globe";
  renderStyle: "grid" | "classic";
}) {
  const initialGlobeCenter = globeCenters[continent ?? "all"] ?? globeCenters.all;
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originLongitude: number;
    originLatitude: number;
  } | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const suppressClickRef = useRef(false);
  const defaultCameraZoom = mode === "globe" ? DEFAULT_GLOBE_ZOOM : 1;
  const defaultCameraPanY = mode === "globe" ? DEFAULT_GLOBE_PAN_Y : 0;
  const [camera, setCamera] = useState({
    zoom: defaultCameraZoom,
    x: 0,
    y: defaultCameraPanY,
  });
  const [globeCenter, setGlobeCenter] = useState({
    longitude: initialGlobeCenter[0],
    latitude: initialGlobeCenter[1],
  });
  const [isInteractive, setIsInteractive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [viewport, setViewport] = useState({
    width: FALLBACK_WIDTH,
    height: FALLBACK_HEIGHT,
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    setIsInteractive(true);

    const updateViewport = () => {
      const { width, height } = shell.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      setViewport({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const clampPan = useCallback(
    (x: number, y: number, nextZoom: number) => ({
      x: clamp(x, -viewport.width * 0.45 * nextZoom, viewport.width * 0.45 * nextZoom),
      y: clamp(y, -viewport.height * 0.38 * nextZoom, viewport.height * 0.38 * nextZoom),
    }),
    [viewport],
  );

  const zoomAt = useCallback(
    (
      updateZoom: (currentZoom: number) => number,
      anchorX = viewport.width / 2,
      anchorY = viewport.height / 2,
    ) => {
      setCamera((current) => {
        const maxZoom = mode === "globe" ? MAX_GLOBE_ZOOM : MAX_FLAT_ZOOM;
        const nextZoom = clamp(updateZoom(current.zoom), 0.75, maxZoom);
        const ratio = nextZoom / current.zoom;
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        const nextPan = clampPan(
          (1 - ratio) * (anchorX - centerX) + ratio * current.x,
          (1 - ratio) * (anchorY - centerY) + ratio * current.y,
          nextZoom,
        );

        return { zoom: nextZoom, ...nextPan };
      });
    },
    [clampPan, mode, viewport],
  );

  const resetCamera = useCallback(() => {
    setCamera({ zoom: defaultCameraZoom, x: 0, y: defaultCameraPanY });
    setGlobeCenter({
      longitude: initialGlobeCenter[0],
      latitude: initialGlobeCenter[1],
    });
  }, [defaultCameraPanY, defaultCameraZoom, initialGlobeCenter]);

  useEffect(() => {
    const applyDrag = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaX = clientX - drag.startX;
      const deltaY = clientY - drag.startY;
      if (Math.hypot(deltaX, deltaY) > 4) suppressClickRef.current = true;

      if (mode === "globe") {
        const degreesPerPixel = 0.22 / camera.zoom;
        setGlobeCenter({
          longitude:
            ((drag.originLongitude - deltaX * degreesPerPixel + 540) % 360) - 180,
          latitude: clamp(drag.originLatitude + deltaY * degreesPerPixel, -80, 80),
        });
        return;
      }

      setCamera((current) => ({
        ...current,
        ...clampPan(drag.originX + deltaX, drag.originY + deltaY, current.zoom),
      }));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      pendingDragRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      if (dragFrameRef.current !== null) return;
      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pendingDrag = pendingDragRef.current;
        pendingDragRef.current = null;
        if (pendingDrag) {
          applyDrag(pendingDrag.clientX, pendingDrag.clientY);
        }
      });
    };

    const finishPointerDrag = (event: PointerEvent) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      const pendingDrag = pendingDragRef.current;
      pendingDragRef.current = null;
      if (pendingDrag) {
        applyDrag(pendingDrag.clientX, pendingDrag.clientY);
      }
      dragRef.current = null;
      setIsDragging(false);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", finishPointerDrag, true);
    document.addEventListener("pointercancel", finishPointerDrag, true);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", finishPointerDrag, true);
      document.removeEventListener("pointercancel", finishPointerDrag, true);
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      pendingDragRef.current = null;
    };
  }, [camera.zoom, clampPan, mode]);

  const activeCodes = continent ? regionCodeSet.get(continent) : null;
  const visibleFeatures = useMemo(
    () =>
      allFeatures.filter((worldFeature) => {
        const code = numericIdToCode[String(worldFeature.id ?? "").padStart(3, "0")];
        return Boolean(code && (mode === "globe" || !activeCodes || activeCodes.has(code)));
      }),
    [activeCodes, mode],
  );

  const projection = useMemo(() => {
    const scene = mapScenes[continent ?? "all"] ?? mapScenes.all;
    const topPadding = Math.max(96, viewport.height * 0.13);
    const bottomPadding = Math.max(36, viewport.height * 0.055);
    const availableHeight = viewport.height - topPadding - bottomPadding;
    const responsiveScale =
      viewport.width < 720
        ? viewport.width / 960
        : Math.min(viewport.width / 1920, Math.max(0.2, availableHeight / 900));

    const sceneCenter: [number, number] =
      viewport.width < 720 && !continent ? [58, scene.center[1]] : scene.center;
    const translate: [number, number] = [
      viewport.width / 2,
      topPadding + availableHeight / 2 + (scene.offsetY ?? 0) * responsiveScale,
    ];

    if (mode === "globe") {
      const globeScale = Math.min(
        viewport.width * (viewport.width < 720 ? 0.42 : 0.3),
        availableHeight * 0.46,
      );

      return geoOrthographic()
        .rotate([-globeCenter.longitude, -globeCenter.latitude, 0])
        .translate(translate)
        .scale(globeScale)
        .clipAngle(90)
        .precision(isDragging ? 0.8 : 0.3);
    }

    return geoNaturalEarth1()
      .center(sceneCenter)
      .translate(translate)
      .scale(scene.scale * responsiveScale);
  }, [continent, globeCenter, isDragging, mode, viewport]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const flatGridCountries = useMemo(() => {
    if (!isInteractive || mode !== "flat" || renderStyle !== "grid") return [];

    const columns = Math.ceil(viewport.width / GRID_SIZE);
    const rows = Math.ceil(viewport.height / GRID_SIZE);
    const featureEntries = visibleFeatures.flatMap((worldFeature) => {
      const code = numericIdToCode[String(worldFeature.id ?? "").padStart(3, "0")];
      if (!code) return [];
      const path = pathGenerator(worldFeature);
      return path ? [{ code, path }] : [];
    });
    const ownershipCanvas = document.createElement("canvas");
    ownershipCanvas.width = viewport.width;
    ownershipCanvas.height = viewport.height;
    const ownershipContext = ownershipCanvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });
    if (!ownershipContext) return [];

    ownershipContext.fillStyle = "#000";
    ownershipContext.fillRect(0, 0, viewport.width, viewport.height);
    const codeByColor = new Map<number, string>();
    featureEntries.forEach((entry, featureIndex) => {
      const colorIndex = featureIndex + 1;
      const red = colorIndex & 255;
      const green = (colorIndex >> 8) & 255;
      ownershipContext.fillStyle = `rgb(${red} ${green} 0)`;
      ownershipContext.fill(new Path2D(entry.path));
      codeByColor.set(red | (green << 8), entry.code);
    });
    const ownershipPixels = ownershipContext.getImageData(
      0,
      0,
      viewport.width,
      viewport.height,
    ).data;

    const pathsByCode = new Map<string, string[]>();
    const sampleOffset = GRID_SIZE / GRID_SAMPLE_AXIS;

    for (let cellIndex = 0; cellIndex < columns * rows; cellIndex += 1) {
      const column = cellIndex % columns;
      const row = Math.floor(cellIndex / columns);
      const cellX = column * GRID_SIZE;
      const cellY = row * GRID_SIZE;
      const sampleOwners: Array<string | null> = [];

      for (let sampleY = 0; sampleY < GRID_SAMPLE_AXIS; sampleY += 1) {
        for (let sampleX = 0; sampleX < GRID_SAMPLE_AXIS; sampleX += 1) {
          const pixelX = Math.min(
            viewport.width - 1,
            Math.floor(cellX + (sampleX + 0.5) * sampleOffset),
          );
          const pixelY = Math.min(
            viewport.height - 1,
            Math.floor(cellY + (sampleY + 0.5) * sampleOffset),
          );
          const pixelOffset = (pixelY * viewport.width + pixelX) * 4;
          const colorKey =
            ownershipPixels[pixelOffset] | (ownershipPixels[pixelOffset + 1] << 8);
          sampleOwners.push(codeByColor.get(colorKey) ?? null);
        }
      }

      const owner = chooseGridOwner(sampleOwners);
      if (!owner) continue;

      const tileInset = (GRID_SIZE - GRID_TILE_SIZE) / 2;
      const tileX = Math.round((cellX + tileInset) * 100) / 100;
      const tileY = Math.round((cellY + tileInset) * 100) / 100;
      const straightEdge = GRID_TILE_SIZE - GRID_TILE_RADIUS * 2;
      const tilePath =
        `M${tileX + GRID_TILE_RADIUS} ${tileY}` +
        `h${straightEdge}` +
        `a${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS} 0 0 1 ${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS}` +
        `v${straightEdge}` +
        `a${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS} 0 0 1 -${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS}` +
        `h-${straightEdge}` +
        `a${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS} 0 0 1 -${GRID_TILE_RADIUS} -${GRID_TILE_RADIUS}` +
        `v-${straightEdge}` +
        `a${GRID_TILE_RADIUS} ${GRID_TILE_RADIUS} 0 0 1 ${GRID_TILE_RADIUS} -${GRID_TILE_RADIUS}Z`;
      const countryTiles = pathsByCode.get(owner);
      if (countryTiles) {
        countryTiles.push(tilePath);
      } else {
        pathsByCode.set(owner, [tilePath]);
      }
    }

    return Array.from(pathsByCode, ([code, paths]) => ({
      code,
      path: paths.join(""),
    }));
  }, [isInteractive, mode, pathGenerator, renderStyle, viewport, visibleFeatures]);

  const countryPaths = useMemo(
    () =>
      visibleFeatures.map((worldFeature, featureIndex) => {
        const code = numericIdToCode[String(worldFeature.id ?? "").padStart(3, "0")];
        if (!code) return null;

        const path = pathGenerator(worldFeature);
        if (!path) return null;

        const country = worldCountryByCode[code];
        const count = counts[code] ?? 0;
        const hasData = count > 0;
        const isSelectedRegion = !activeCodes || activeCodes.has(code);
        const isChina = code === "CN";
        const regionKey = countryToRegion[code] ?? "other";

        return (
          <path
            key={`${code}-${featureIndex}`}
            d={path}
            className={[
              "world-country-path",
              hasData ? "has-data" : "no-data",
              isSelectedRegion ? "is-region-active" : "is-region-muted",
              isChina && isSelectedRegion ? "is-focus" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-country-code={code}
            onPointerEnter={() => setHoveredCode(code)}
            onPointerLeave={() =>
              setHoveredCode((current) => (current === code ? null : current))
            }
            onFocus={() => setHoveredCode(code)}
            onBlur={() =>
              setHoveredCode((current) => (current === code ? null : current))
            }
            onClick={() => {
              if (suppressClickRef.current || !isSelectedRegion) return;
              router.push(`/map/${regionKey}/${code.toLowerCase()}`);
            }}
            onKeyDown={(event) => {
              if (!isSelectedRegion) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/map/${regionKey}/${code.toLowerCase()}`);
              }
            }}
            role="button"
            tabIndex={isSelectedRegion ? 0 : -1}
            aria-hidden={!isSelectedRegion}
            aria-label={`${country?.name ?? code}${hasData ? `，${count} 个图集` : ""}`}
          >
            <title>{`${country?.name ?? code}${hasData ? ` · ${count} 个图集` : ""}`}</title>
          </path>
        );
      }),
    [activeCodes, counts, pathGenerator, router, visibleFeatures],
  );

  const markerPoints = useMemo(() => {
    const visibleVisited = Object.entries(counts)
      .filter(([code, count]) => count > 0 && (!activeCodes || activeCodes.has(code)))
      .toSorted(([, countA], [, countB]) => countB - countA)
      .map(([code]) => code);

    const markerCodes = [
      ...visibleVisited,
      ...DEFAULT_MARKERS.filter((code) => !activeCodes || activeCodes.has(code)),
    ]
      .filter((code, index, list) => list.indexOf(code) === index)
      .slice(0, 3);

    return markerCodes.flatMap((code) => {
      const worldFeature = featureByCode.get(code);
      if (!worldFeature) return [];
      if (
        mode === "globe" &&
        geoDistance(
          [globeCenter.longitude, globeCenter.latitude],
          geoCentroid(worldFeature),
        ) >=
          Math.PI / 2
      ) {
        return [];
      }
      const [rawX, rawY] = pathGenerator.centroid(worldFeature);
      const x = Math.round(rawX * 1000) / 1000;
      const y = Math.round(rawY * 1000) / 1000;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
      return [{ code, x, y }];
    });
  }, [activeCodes, counts, globeCenter, mode, pathGenerator]);

  const routePath =
    markerPoints.length >= 2
      ? `M ${markerPoints[0].x} ${markerPoints[0].y} Q ${
          (markerPoints[0].x + markerPoints[1].x) / 2
        } ${Math.min(markerPoints[0].y, markerPoints[1].y) - 48} ${markerPoints[1].x} ${
          markerPoints[1].y
        }`
      : null;
  const spherePath = mode === "globe" ? pathGenerator({ type: "Sphere" }) : null;
  const graticulePath = mode === "globe" ? pathGenerator(globeGraticule) : null;

  const cameraCenterX = viewport.width / 2;
  const cameraCenterY = viewport.height / 2;
  const cameraTranslateX = cameraCenterX + camera.x - camera.zoom * cameraCenterX;
  const cameraTranslateY = cameraCenterY + camera.y - camera.zoom * cameraCenterY;
  const mapTransform = `matrix(${camera.zoom} 0 0 ${camera.zoom} ${cameraTranslateX} ${cameraTranslateY})`;
  const sceneLabel =
    GLOBAL_REGIONS.find((region) => region.key === continent)?.label ?? "世界";
  const gridPalette = createMapRenderPalette(
    colors,
    isDark ? "night-violet" : "daylight",
  );
  const gridPatterns = [
    ["map-grid-land", gridPalette.land],
    ["map-grid-active", gridPalette.active],
    ["map-grid-muted", gridPalette.muted],
    ["map-grid-visited", gridPalette.visited],
    ["map-grid-focus", gridPalette.focus],
    ["map-grid-hover", gridPalette.hover],
    ["map-grid-visited-hover", gridPalette.visitedHover],
    ["map-grid-focus-hover", gridPalette.focusHover],
  ] as const;
  const flatGridPaths = flatGridCountries.map(({ code, path }) => {
    const hasData = (counts[code] ?? 0) > 0;
    const isFocus = code === "CN";
    const isHovered = hoveredCode === code;
    const fill = isFocus
      ? isHovered
        ? gridPalette.focusHover
        : gridPalette.focus
      : hasData
        ? isHovered
          ? gridPalette.visitedHover
          : gridPalette.visited
        : isHovered
          ? gridPalette.hover
          : gridPalette.active;

    return (
      <path
        key={code}
        className={[
          "map-grid-country",
          hasData ? "has-data" : "no-data",
          isFocus ? "is-focus" : "",
          isHovered ? "is-hovered" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-country-code={code}
        d={path}
        fill={fill}
      />
    );
  });

  return (
    <div
      ref={shellRef}
      data-globe-latitude={mode === "globe" ? globeCenter.latitude : undefined}
      data-globe-longitude={mode === "globe" ? globeCenter.longitude : undefined}
      className="archive-map-shell"
      data-map-mode={mode}
      data-map-style={renderStyle}
      data-map-scene={continent ?? "all"}
      data-map-zoom={camera.zoom}
      data-map-interactive={isInteractive ? "true" : "false"}
      data-map-dragging={isDragging ? "true" : "false"}
      onPointerDown={(event) => {
        if (
          event.button !== 0 ||
          (event.target as Element).closest(".map-zoom-controls")
        ) {
          return;
        }
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: camera.x,
          originY: camera.y,
          originLongitude: globeCenter.longitude,
          originLatitude: globeCenter.latitude,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
      }}
    >
      <svg
        className="archive-map-svg"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        aria-label={`${sceneLabel}摄影足迹地图`}
        onWheel={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const anchorX =
            ((event.clientX - bounds.left) * viewport.width) / bounds.width;
          const anchorY =
            ((event.clientY - bounds.top) * viewport.height) / bounds.height;
          zoomAt(
            (currentZoom) => currentZoom * Math.exp(-event.deltaY * 0.0015),
            anchorX,
            anchorY,
          );
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          const bounds = event.currentTarget.getBoundingClientRect();
          const anchorX =
            ((event.clientX - bounds.left) * viewport.width) / bounds.width;
          const anchorY =
            ((event.clientY - bounds.top) * viewport.height) / bounds.height;
          zoomAt(
            (currentZoom) => currentZoom * 1.35,
            anchorX,
            anchorY,
          );
        }}
      >
        <defs>
          {gridPatterns.map(([id, color]) => (
            <pattern
              key={id}
              id={id}
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <rect
                width={GRID_TILE_SIZE}
                height={GRID_TILE_SIZE}
                x={(GRID_SIZE - GRID_TILE_SIZE) / 2}
                y={(GRID_SIZE - GRID_TILE_SIZE) / 2}
                rx={GRID_TILE_RADIUS}
                fill={color}
              />
            </pattern>
          ))}
          <radialGradient id="map-globe-ocean-gradient" cx="36%" cy="30%" r="72%">
            <stop
              offset="0%"
              stopColor={isDark ? "#111735" : "#f7f7fc"}
            />
            <stop
              offset="48%"
              stopColor={isDark ? "#090d24" : "#e1e4f2"}
            />
            <stop
              offset="100%"
              stopColor={isDark ? "#03040e" : "#d4d9eb"}
            />
          </radialGradient>
          {spherePath ? (
            <clipPath id="map-globe-clip">
              <path d={spherePath} />
            </clipPath>
          ) : null}
        </defs>
        <g
          className={`map-zoom-layer ${isDragging ? "is-dragging" : ""}`}
          transform={mapTransform}
        >
          {spherePath ? <path className="map-globe-atmosphere" d={spherePath} /> : null}
          {spherePath ? (
            <path className="map-sphere" d={spherePath} fill="url(#map-globe-ocean-gradient)" />
          ) : null}
          <g clipPath={spherePath ? "url(#map-globe-clip)" : undefined}>
            {graticulePath ? <path className="map-globe-graticule" d={graticulePath} /> : null}
            <g key={`${continent ?? "all"}-${mode}`} className="map-scene-layer">
              {mode === "flat" && renderStyle === "grid" ? (
                <g
                  className="map-grid-layer"
                  data-grid-size={GRID_SIZE}
                  data-grid-sample-axis={GRID_SAMPLE_AXIS}
                  aria-hidden="true"
                >
                  {flatGridPaths}
                </g>
              ) : (
                <g className="map-country-layer">{countryPaths}</g>
              )}
              {routePath ? <path className="map-route-arc" d={routePath} /> : null}

              <g className="map-marker-layer" aria-hidden="true">
                {markerPoints.map((point, index) => (
                  <g
                    key={point.code}
                    className={`map-location-marker ${index === 0 ? "is-primary" : ""}`}
                    transform={`translate(${point.x} ${point.y})`}
                  >
                    <circle className="map-marker-halo" r="14" />
                    <circle className="map-marker-core" r="4.5" />
                  </g>
                ))}
              </g>
              {mode === "flat" && renderStyle === "grid" ? (
                <g className="map-country-hit-layer">{countryPaths}</g>
              ) : null}
            </g>
          </g>
          {spherePath ? <path className="map-globe-rim" d={spherePath} /> : null}
        </g>
      </svg>

      <div className="map-zoom-controls" aria-label="地图缩放控制">
        <button
          type="button"
          aria-label="放大地图"
          disabled={
            camera.zoom >= (mode === "globe" ? MAX_GLOBE_ZOOM : MAX_FLAT_ZOOM)
          }
          onClick={() => zoomAt((currentZoom) => currentZoom + 0.2)}
        >
          <Plus size={17} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          aria-label="缩小地图"
          disabled={camera.zoom <= 0.75}
          onClick={() => zoomAt((currentZoom) => currentZoom - 0.2)}
        >
          <Minus size={17} strokeWidth={1.7} />
        </button>
        <button type="button" aria-label="重置地图位置" onClick={resetCamera}>
          <LocateFixed size={16} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
