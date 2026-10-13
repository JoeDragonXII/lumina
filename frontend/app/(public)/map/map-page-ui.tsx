"use client";

import Link from "next/link";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/controls";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type MotionValue,
  m,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import MapColorCustomizer from "@/modules/map/components/MapColorCustomizer";
import PhotoGridPreviewOverlay from "@/modules/map/components/PhotoGridPreviewOverlay";
import SimpleWorldMap from "@/modules/map/components/SimpleWorldMap";
import { GLOBAL_REGIONS } from "@/modules/map/data/globalRegions";
import {
  MAP_COLOR_PRESETS,
  MAP_COLOR_STORAGE_KEY,
  createMapRenderPalette,
  isMapPaletteColors,
  type MapPaletteColors,
  type MapPaletteTheme,
} from "@/modules/map/mapPalette";

const ALL_REGIONS = "all";

function MagnifyingMapLink({
  mouseX,
  href,
  className,
  ariaCurrent,
  baseWidth,
  expandedWidth,
  baseHeight,
  expandedHeight,
  shellClassName,
  children,
}: Readonly<{
  mouseX: MotionValue<number>;
  href: string;
  className: string;
  ariaCurrent?: "page";
  baseWidth: number;
  expandedWidth: number;
  baseHeight: number;
  expandedHeight: number;
  shellClassName: string;
  children: ReactNode;
}>) {
  const shellRef = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (value) => {
    const bounds = shellRef.current?.getBoundingClientRect();
    if (!bounds) return Number.POSITIVE_INFINITY;
    return value - bounds.x - bounds.width / 2;
  });
  const widthTarget = useTransform(
    distance,
    [-140, 0, 140],
    [baseWidth, expandedWidth, baseWidth],
  );
  const heightTarget = useTransform(
    distance,
    [-140, 0, 140],
    [baseHeight, expandedHeight, baseHeight],
  );
  const width = useSpring(widthTarget, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTarget, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <m.div
      ref={shellRef}
      className={shellClassName}
      style={{ width, height }}
      whileTap={{ scale: 0.94 }}
    >
      <Link
        href={href}
        className={className}
        aria-current={ariaCurrent}
      >
        {children}
      </Link>
    </m.div>
  );
}

export default function MapPageUI({
  counts,
  continent,
  display,
  photoGridPreview = false,
  routeRoot = "/map",
  theme,
  view,
}: Readonly<{
  counts: Record<string, number>;
  continent?: string;
  display?: string;
  photoGridPreview?: boolean;
  routeRoot?: "/map" | "/preview/map" | "/preview/map-legacy";
  theme?: string;
  view?: string;
}>) {
  const activeRegion = continent ?? ALL_REGIONS;
  const canUseGlobe = activeRegion === ALL_REGIONS;
  const mapMode = canUseGlobe && view === "globe" ? "globe" : "flat";
  const mapStyle = display === "classic" ? "classic" : "grid";
  const paletteTheme: MapPaletteTheme =
    theme === "daylight" ? "daylight" : "night-violet";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isColorCustomizerOpen, setIsColorCustomizerOpen] = useState(false);
  const [paletteColors, setPaletteColors] = useState<MapPaletteColors>(
    MAP_COLOR_PRESETS[paletteTheme],
  );

  useEffect(() => {
    let nextColors = MAP_COLOR_PRESETS[paletteTheme];
    try {
      const stored = window.localStorage.getItem(MAP_COLOR_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      const savedColors = parsed[paletteTheme];
      if (isMapPaletteColors(savedColors)) nextColors = savedColors;
    } catch {
      // Use the reference preset when stored values are unavailable.
    }
    const frame = window.requestAnimationFrame(() => setPaletteColors(nextColors));
    return () => window.cancelAnimationFrame(frame);
  }, [paletteTheme]);

  const updatePaletteColors = (colors: MapPaletteColors) => {
    setPaletteColors(colors);
    try {
      const stored = window.localStorage.getItem(MAP_COLOR_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        MAP_COLOR_STORAGE_KEY,
        JSON.stringify({ ...parsed, [paletteTheme]: colors }),
      );
    } catch {
      // The live preview still works when storage is unavailable.
    }
  };

  const switchPaletteTheme = (nextTheme: MapPaletteTheme) => {
    const query = new URLSearchParams(searchParams.toString());
    if (nextTheme === "daylight") {
      query.set("theme", "daylight");
    } else {
      query.delete("theme");
    }
    const queryString = query.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const renderPalette = useMemo(
    () => createMapRenderPalette(paletteColors, paletteTheme),
    [paletteColors, paletteTheme],
  );
  const paletteStyle = {
    "--map-custom-accent": paletteColors.accent,
    "--map-custom-focus": paletteColors.focus,
    "--map-custom-land": paletteColors.land,
    "--map-custom-hover": renderPalette.hover,
    "--map-custom-accent-hover": renderPalette.visitedHover,
    "--map-custom-focus-hover": renderPalette.focusHover,
  } as CSSProperties;
  const buildMapHref = (
    pathname: string,
    options?: {
      nextRegion?: string;
      nextStyle?: "grid" | "classic";
      nextView?: "flat" | "globe";
    },
  ) => {
    const query = new URLSearchParams();
    const nextRegion = options?.nextRegion ?? activeRegion;
    if (routeRoot !== "/map" && nextRegion !== ALL_REGIONS) {
      query.set("continent", nextRegion);
    }
    if (options?.nextView === "globe") query.set("view", "globe");
    if ((options?.nextStyle ?? mapStyle) === "classic") {
      query.set("display", "classic");
    }
    if (paletteTheme === "daylight") query.set("theme", "daylight");
    const queryString = query.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };
  const scenePath = (region: string) =>
    routeRoot === "/map" && region !== ALL_REGIONS
      ? `${routeRoot}/${region}`
      : routeRoot;
  const regionMouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const viewMouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const styleMouseX = useMotionValue(Number.POSITIVE_INFINITY);

  return (
    <div
      className="public-map-page"
      data-map-mode={mapMode}
      data-map-style={mapStyle}
      data-map-scene={activeRegion}
      data-theme={paletteTheme === "night-violet" ? "map-night-gold" : "map-daylight"}
      data-map-palette={paletteTheme}
      style={paletteStyle}
    >
      <Button className="page-appearance-action" variant="secondary" aria-label="地图配色" title="地图配色" aria-pressed={isColorCustomizerOpen} onClick={() => setIsColorCustomizerOpen(current => !current)}><Palette size={18} aria-hidden="true" /></Button>

      <MapColorCustomizer
        colors={paletteColors}
        isOpen={isColorCustomizerOpen}
        onClose={() => setIsColorCustomizerOpen(false)}
        onColorsChange={updatePaletteColors}
        onReset={() => updatePaletteColors(MAP_COLOR_PRESETS[paletteTheme])}
        onThemeChange={switchPaletteTheme}
        theme={paletteTheme}
      />

      <m.main
        className="map-page-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav
          className="map-region-dock floating-dock"
          aria-label="地图区域筛选"
          onMouseMove={(event) => regionMouseX.set(event.pageX)}
          onMouseLeave={() => regionMouseX.set(Number.POSITIVE_INFINITY)}
        >
          <MagnifyingMapLink
            mouseX={regionMouseX}
            href={buildMapHref(
              scenePath(ALL_REGIONS),
              canUseGlobe && mapMode === "globe"
                ? { nextRegion: ALL_REGIONS, nextView: "globe" }
                : { nextRegion: ALL_REGIONS },
            )}
            shellClassName="map-region-item-shell"
            className={`map-region-pill floating-dock-icon ${
              activeRegion === ALL_REGIONS ? "floating-dock-icon-active" : ""
            }`}
            ariaCurrent={activeRegion === ALL_REGIONS ? "page" : undefined}
            baseWidth={80}
            expandedWidth={108}
            baseHeight={44}
            expandedHeight={56}
          >
            {activeRegion === ALL_REGIONS ? (
              <m.span
                className="map-region-selection"
                layoutId="map-region-selection"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="map-region-label">全部</span>
          </MagnifyingMapLink>

          {GLOBAL_REGIONS.map((region) => (
            <MagnifyingMapLink
              key={region.key}
              mouseX={regionMouseX}
              href={buildMapHref(scenePath(region.key), {
                nextRegion: region.key,
              })}
              shellClassName="map-region-item-shell"
              className={`map-region-pill floating-dock-icon ${
                activeRegion === region.key ? "floating-dock-icon-active" : ""
              }`}
              ariaCurrent={activeRegion === region.key ? "page" : undefined}
              baseWidth={80}
              expandedWidth={108}
              baseHeight={44}
              expandedHeight={56}
            >
              {activeRegion === region.key ? (
                <m.span
                  className="map-region-selection"
                  layoutId="map-region-selection"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="map-region-label">{region.label}</span>
            </MagnifyingMapLink>
          ))}
        </nav>

        {canUseGlobe ? (
          <nav
            className="map-view-switch"
            aria-label="地图显示模式"
            onMouseMove={(event) => viewMouseX.set(event.pageX)}
            onMouseLeave={() => viewMouseX.set(Number.POSITIVE_INFINITY)}
          >
            <MagnifyingMapLink
              mouseX={viewMouseX}
              href={buildMapHref(scenePath(ALL_REGIONS), {
                nextRegion: ALL_REGIONS,
              })}
              shellClassName="map-view-item-shell"
              className={mapMode === "flat" ? "is-active" : ""}
              ariaCurrent={mapMode === "flat" ? "page" : undefined}
              baseWidth={64}
              expandedWidth={82}
              baseHeight={35}
              expandedHeight={45}
            >
              {mapMode === "flat" ? (
                <m.span
                  className="map-view-selection"
                  layoutId="map-view-selection"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span>平面</span>
            </MagnifyingMapLink>
            <MagnifyingMapLink
              mouseX={viewMouseX}
              href={buildMapHref(scenePath(ALL_REGIONS), {
                nextRegion: ALL_REGIONS,
                nextView: "globe",
              })}
              shellClassName="map-view-item-shell"
              className={mapMode === "globe" ? "is-active" : ""}
              ariaCurrent={mapMode === "globe" ? "page" : undefined}
              baseWidth={64}
              expandedWidth={82}
              baseHeight={35}
              expandedHeight={45}
            >
              {mapMode === "globe" ? (
                <m.span
                  className="map-view-selection"
                  layoutId="map-view-selection"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span>地球</span>
            </MagnifyingMapLink>
          </nav>
        ) : null}

        <nav
          className={`map-style-switch ${canUseGlobe ? "" : "is-style-only"}`}
          aria-label="地图样式切换"
          onMouseMove={(event) => styleMouseX.set(event.pageX)}
          onMouseLeave={() => styleMouseX.set(Number.POSITIVE_INFINITY)}
        >
          <MagnifyingMapLink
            mouseX={styleMouseX}
            href={buildMapHref(scenePath(activeRegion), {
              nextRegion: activeRegion,
              nextStyle: "grid",
              nextView: mapMode,
            })}
            shellClassName="map-style-item-shell"
            className={mapStyle === "grid" ? "is-active" : ""}
            ariaCurrent={mapStyle === "grid" ? "page" : undefined}
            baseWidth={64}
            expandedWidth={82}
            baseHeight={35}
            expandedHeight={45}
          >
            {mapStyle === "grid" ? (
              <m.span
                className="map-style-selection"
                layoutId="map-style-selection"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span>方格</span>
          </MagnifyingMapLink>
          <MagnifyingMapLink
            mouseX={styleMouseX}
            href={buildMapHref(scenePath(activeRegion), {
              nextRegion: activeRegion,
              nextStyle: "classic",
              nextView: mapMode,
            })}
            shellClassName="map-style-item-shell"
            className={mapStyle === "classic" ? "is-active" : ""}
            ariaCurrent={mapStyle === "classic" ? "page" : undefined}
            baseWidth={64}
            expandedWidth={82}
            baseHeight={35}
            expandedHeight={45}
          >
            {mapStyle === "classic" ? (
              <m.span
                className="map-style-selection"
                layoutId="map-style-selection"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span>地图</span>
          </MagnifyingMapLink>
        </nav>

        <section className="map-stage-section" aria-label="摄影足迹地图">
          <SimpleWorldMap
            key={`${activeRegion}-${mapMode}-${mapStyle}-${paletteTheme}`}
            allowCountryNavigation={!photoGridPreview}
            colors={paletteColors}
            counts={counts}
            continent={activeRegion === ALL_REGIONS ? undefined : activeRegion}
            isDark={paletteTheme === "night-violet"}
            mode={mapMode}
            renderOverlay={
              photoGridPreview
                ? (context) => (
                    <PhotoGridPreviewOverlay context={context} />
                  )
                : undefined
            }
            renderStyle={mapStyle}
            showMarkers={!photoGridPreview}
          />
        </section>
      </m.main>
    </div>
  );
}
