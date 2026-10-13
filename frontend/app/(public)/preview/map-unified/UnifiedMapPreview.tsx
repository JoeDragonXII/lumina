"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  Clock3,
  Compass,
  Crosshair,
  Home,
  Images,
  Layers3,
  LocateFixed,
  Map as MapIcon,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import PhotoCardDialog from "@/components/ui/PhotoCardDialog";
import { tintMapForNight } from "@/modules/map/mapAppearance";
import { FloatingDock } from "@/components/ui/floating-dock";

import styles from "./page.module.css";

type Instrument = "data" | "layers";

type PreviewPhoto = {
  coordinates: [number, number];
  id: string;
  label: string;
  src: string;
  takenAt?: string;
  camera?: string;
  lens?: string;
};

const PHOTOS: PreviewPhoto[] = [
  {
    coordinates: [113.2644, 23.1291],
    id: "guangzhou-arcade",
    label: "广州",
    src: "/preview/map-unified/guangzhou-arcade.webp",
  },
  {
    coordinates: [113.52, 23.48],
    id: "pearl-river-ferry",
    label: "珠江",
    src: "/preview/map-unified/pearl-river-ferry.webp",
  },
  {
    coordinates: [114.72, 26.05],
    id: "train-window",
    label: "车窗",
    src: "/preview/map-unified/train-window.webp",
  },
  {
    coordinates: [115.8582, 28.6829],
    id: "nanchang-river",
    label: "南昌",
    src: "/preview/map-unified/nanchang-river.webp",
  },
  {
    coordinates: [120.1551, 30.2741],
    id: "hangzhou-canal",
    label: "杭州",
    src: "/preview/map-unified/hangzhou-canal.webp",
  },
  {
    coordinates: [121.4737, 31.2304],
    id: "shanghai-dusk",
    label: "上海",
    src: "/preview/map-unified/shanghai-dusk.webp",
  },
];

const MAP_STYLE_URL = "/api/openfreemap/styles/positron";

const GRID_DATA: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    ...Array.from({ length: 8 }, (_, index) => 110 + index * 2).map((longitude) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: [[longitude, 20], [longitude, 34]] },
    })),
    ...Array.from({ length: 8 }, (_, index) => 20 + index * 2).map((latitude) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: [[110, latitude], [124, latitude]] },
    })),
  ],
};

export default function UnifiedMapPreview() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const [activePhotoId, setActivePhotoId] = useState(PHOTOS[0]!.id);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(null);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const activeIndex = PHOTOS.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = PHOTOS[activeIndex] ?? PHOTOS[0]!;

  useEffect(() => {
    document.body.classList.add("map-unified-preview");
    return () => document.body.classList.remove("map-unified-preview");
  }, []);

  const selectPhoto = useCallback((photoId: string, moveMap = true) => {
    const photo = PHOTOS.find((item) => item.id === photoId);
    if (!photo) return;
    setActivePhotoId(photoId);
    if (moveMap) {
      mapRef.current?.easeTo({
        center: photo.coordinates,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520,
        essential: false,
        zoom: Math.max(mapRef.current.getZoom(), 5.4),
      });
    }
  }, []);

  useEffect(() => {
    markerElementsRef.current.forEach((element, id) => {
      element.dataset.selected = String(id === activePhotoId);
    });
  }, [activePhotoId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map?.getLayer("preview-coordinate-grid")) return;
    map.setLayoutProperty("preview-coordinate-grid", "visibility", isGridVisible ? "visible" : "none");
  }, [isGridVisible, isMapLoaded]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let disposed = false;
    let map: import("maplibre-gl").Map | null = null;
    const markers: import("maplibre-gl").Marker[] = [];
    const markerElements = markerElementsRef.current;

    void import("maplibre-gl")
      .then(({ Map: MapLibre, Marker }) => {
        if (disposed) return;
        map = new MapLibre({
          attributionControl: false,
          center: [117.25, 27.45],
          container,
          crossSourceCollisions: false,
          fadeDuration: 0,
          maxZoom: 13,
          minZoom: 3,
          maxPitch: 0,
          pitchWithRotate: false,
          renderWorldCopies: false,
          style: MAP_STYLE_URL,
          zoom: 4.55,
        });
        mapRef.current = map;

        map.on("load", () => {
          if (!map || disposed) return;
          tintMapForNight(map);
          map.addSource("preview-grid", { type: "geojson", data: GRID_DATA });
          map.addLayer({
            id: "preview-coordinate-grid",
            type: "line",
            source: "preview-grid",
            paint: {
              "line-color": "#9aaba8",
              "line-opacity": 0.18,
              "line-width": 0.7,
            },
            layout: { visibility: "none" },
          });

          PHOTOS.filter((_, index) => [0, 2, 3, 4, 5].includes(index)).forEach((photo) => {
            const index = PHOTOS.findIndex((item) => item.id === photo.id);
            const button = document.createElement("button");
            button.type = "button";
            button.className = styles.photoMarker;
            button.dataset.selected = String(photo.id === PHOTOS[0]!.id);
            button.dataset.markerIndex = String(index);
            button.setAttribute("aria-label", `查看${photo.label}照片`);
            const card = document.createElement("span");
            card.className = styles.photoMarkerCard;
            const image = document.createElement("img");
            image.src = photo.src;
            image.alt = "";
            image.decoding = "async";
            image.draggable = false;
            const label = document.createElement("span");
            label.className = styles.photoMarkerLabel;
            label.textContent = photo.label;
            if (index === 0) {
              const nearbyCount = document.createElement("small");
              nearbyCount.textContent = "+1";
              label.append(nearbyCount);
            }
            const order = document.createElement("span");
            order.className = styles.photoMarkerOrder;
            order.textContent = String(index + 1).padStart(2, "0");
            card.append(image, order, label);
            button.append(card);
            button.addEventListener("click", () => {
              selectPhoto(photo.id, false);
              setViewerOpen(true);
            });
            markerElements.set(photo.id, button);
            markers.push(
              new Marker({
                anchor: "bottom",
                element: button,
                offset: [0, -8],
                subpixelPositioning: true,
              })
                .setLngLat(photo.coordinates)
                .addTo(map!),
            );
          });

          const compact = container.clientWidth < 720;
          map.fitBounds(
            [[112.9, 22.7], [121.9, 31.65]],
            {
              duration: 0,
              padding: compact
                ? { bottom: 150, left: 72, right: 72, top: 102 }
                : { bottom: 140, left: 190, right: 125, top: 100 },
            },
          );
          setIsMapLoaded(true);
        });
        map.on("error", () => {
          if (!map?.isStyleLoaded()) setMapError(true);
        });
      })
      .catch(() => setMapError(true));

    return () => {
      disposed = true;
      markerElements.clear();
      markers.forEach((marker) => marker.remove());
      map?.remove();
      mapRef.current = null;
    };
  }, [selectPhoto]);

  const dockItems = [
    { icon: <Home aria-hidden="true" size={20} />, label: "首页", href: "/" },
    { icon: <Images aria-hidden="true" size={20} />, label: "图集", href: "/archive" },
    { icon: <MapIcon aria-hidden="true" size={20} />, label: "地图预览", href: "/preview/map-unified", active: true },
    { icon: <Clock3 aria-hidden="true" size={20} />, label: "时间线", href: "/timeline" },
  ];

  return (
    <main className={styles.page} data-grid-visible={isGridVisible}>
      <div ref={mapContainerRef} className={styles.map} aria-label="广州与上海影像位置地图" />
      <div className={styles.paperWash} aria-hidden="true" />
      <div className={styles.starryEdge} aria-hidden="true" />

      {!isMapLoaded && !mapError ? <div className={styles.loading}>正在展开地图…</div> : null}
      {mapError ? (
        <div className={styles.mapError} role="alert">
          <strong>地图暂时没有抵达</strong>
          <span>请检查网络后刷新页面。</span>
          <button type="button" onClick={() => window.location.reload()}>重新加载</button>
        </div>
      ) : null}

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="返回 Lumina 首页">
          <Sparkles aria-hidden="true" size={18} strokeWidth={1.5} />
          <span>LUMINA</span>
        </Link>

        <div className={styles.headerTools}>
          <span className={styles.photoCount}>影像地图 <i /> 6 张照片</span>
        </div>
      </header>

      <nav className={styles.desktopDock} aria-label="预览全站导航">
        <FloatingDock items={dockItems} orientation="vertical" />
      </nav>

      <aside className={styles.mapNote} aria-hidden="true">
        <span>有光的地方</span>
        <span>就有记忆</span>
        <i />
        <small>PLACES, THROUGH PHOTOGRAPHS</small>
      </aside>

      <div className={styles.coordinates} aria-live="polite">
        <Crosshair aria-hidden="true" size={14} />
        <span>{activePhoto.coordinates[1].toFixed(4)}° N · {activePhoto.coordinates[0].toFixed(4)}° E</span>
      </div>

      <div className={styles.mapControls} aria-label="地图控制">
        <button type="button" aria-label="放大地图" onClick={() => mapRef.current?.zoomIn()}><ZoomIn aria-hidden="true" size={18} /></button>
        <button type="button" aria-label="缩小地图" onClick={() => mapRef.current?.zoomOut()}><ZoomOut aria-hidden="true" size={18} /></button>
        <button type="button" aria-label="查看全部照片位置" onClick={() => mapRef.current?.fitBounds([[112.9, 22.7], [121.9, 31.65]], { padding: 100, duration: 420 })}><LocateFixed aria-hidden="true" size={18} /></button>
      </div>

      <div className={styles.compass} aria-hidden="true">
        <Compass size={25} strokeWidth={1.2} />
        <span>N</span>
      </div>

      <aside className={styles.instrumentArea}>
        {activeInstrument ? (
          <section className={styles.instrumentPanel} aria-label={`${activeInstrument}仪器面板`}>
            <div className={styles.instrumentPanelHeader}>
              <span>{activeInstrument === "layers" ? "地图图层" : "位置数据"}</span>
              <button type="button" aria-label="收起仪器面板" onClick={() => setActiveInstrument(null)}><X aria-hidden="true" size={16} /></button>
            </div>
            {activeInstrument === "layers" ? (
              <button className={styles.instrumentAction} type="button" aria-pressed={isGridVisible} onClick={() => setIsGridVisible((value) => !value)}>
                <span>坐标网格</span><b>{isGridVisible ? "开启" : "关闭"}</b>
              </button>
            ) : null}
            {activeInstrument === "data" ? (
              <dl className={styles.dataList}>
                <div><dt>位置</dt><dd>{activePhoto.label}</dd></div>
                <div><dt>纬度</dt><dd>{activePhoto.coordinates[1].toFixed(4)}° N</dd></div>
                <div><dt>经度</dt><dd>{activePhoto.coordinates[0].toFixed(4)}° E</dd></div>
              </dl>
            ) : null}
          </section>
        ) : null}

        <div className={styles.instrumentDock} aria-label="地图仪器坞">
          <button type="button" data-active={activeInstrument === "layers"} aria-pressed={activeInstrument === "layers"} onClick={() => setActiveInstrument((value) => value === "layers" ? null : "layers")}>
            <Layers3 aria-hidden="true" size={18} /><span>图层</span><i />
          </button>
          <button type="button" data-active={activeInstrument === "data"} aria-pressed={activeInstrument === "data"} onClick={() => setActiveInstrument((value) => value === "data" ? null : "data")}>
            <Crosshair aria-hidden="true" size={18} /><span>数据</span>
          </button>
        </div>
      </aside>

      <nav className={styles.mobileNav} aria-label="移动端全站导航">
        <Link href="/"><Home aria-hidden="true" size={20} /><span>首页</span></Link>
        <Link href="/archive"><Images aria-hidden="true" size={20} /><span>图集</span></Link>
        <Link className={styles.activeNav} href="/preview/map-unified" aria-current="page"><MapIcon aria-hidden="true" size={20} /><span>地图</span></Link>
        <Link href="/timeline"><Clock3 aria-hidden="true" size={20} /><span>时间线</span></Link>
      </nav>

      <PhotoCardDialog
        photo={viewerOpen ? { id: activePhoto.id, src: activePhoto.src, title: activePhoto.label + "摄影作品", location: activePhoto.label, width: 1440, height: 1080, latitude: activePhoto.coordinates[1], longitude: activePhoto.coordinates[0], date: activePhoto.takenAt, camera: activePhoto.camera, lens: activePhoto.lens } : null}
        ariaLabel={activePhoto.label + "照片查看器"}
        index={activeIndex} total={PHOTOS.length}
        onClose={() => setViewerOpen(false)}
        hasPrev hasNext
        onPrev={() => selectPhoto(PHOTOS[(activeIndex - 1 + PHOTOS.length) % PHOTOS.length]!.id)}
        onNext={() => selectPhoto(PHOTOS[(activeIndex + 1) % PHOTOS.length]!.id)}
      />
    </main>
  );
}
