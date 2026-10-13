"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
} from "maplibre-gl";
import { ArrowLeft, Compass, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  hasValidPhotoCoordinates,
  type PositionedPhoto,
} from "@/modules/map/photoRoute";
import styles from "./PrintedPhotoMap.module.css";
import { projectAndCluster, type MarkerSubject, type ProjectedCluster } from "@/modules/map/markerClusters";
import { tintMapForNight } from "@/modules/map/mapAppearance";
import PhotoMapChrome from "./PhotoMapChrome";

export interface PhotoPlace {
  href?: string;
  count: number;
  id: string;
  imageUrl: string;
  label: string;
  latitude: number;
  longitude: number;
  note: string;
}

export interface PhotoMapItem extends PositionedPhoto {
  thumb: string;
  title?: string;
}

interface PhotoMarkerRecord {
  marker: MapLibreMarker;
  cluster: ProjectedCluster;
}

interface StoredMapView {
  center: [number, number];
  zoom: number;
}

const MAP_STYLE_URL = "/api/openfreemap/styles/positron?detail=photo&styleVersion=5";
const MAP_VIEW_STORAGE_KEY = "lumina-photo-map-view-v1";

const PHOTO_PLACES: PhotoPlace[] = [
  { count: 18, id: "guangzhou", imageUrl: "/photos/guangzhou-1.png", label: "广州", latitude: 23.1291, longitude: 113.2644, note: "夏日街角与缓慢的光" },
  { count: 11, id: "hong-kong", imageUrl: "/photos/hongkong-1.png", label: "香港", latitude: 22.3193, longitude: 114.1694, note: "海港、雨幕与夜色" },
  { count: 12, id: "shanghai", imageUrl: "/photos/shanghai-1.png", label: "上海", latitude: 31.2304, longitude: 121.4737, note: "楼宇之间的城市切片" },
  { count: 9, id: "hangzhou", imageUrl: "/photos/hangzhou-1.png", label: "杭州", latitude: 30.2741, longitude: 120.1551, note: "湖边的雾与树影" },
  { count: 7, id: "qingdao", imageUrl: "/photos/qingdao-1.png", label: "青岛", latitude: 36.0671, longitude: 120.3826, note: "海风经过旧城区" },
  { count: 8, id: "jinan", imageUrl: "/photos/jinan-1.png", label: "济南", latitude: 36.6512, longitude: 117.1201, note: "泉水与石墙的纹理" },
  { count: 6, id: "zhengzhou", imageUrl: "/photos/zhengzhou-1.png", label: "郑州", latitude: 34.7466, longitude: 113.6254, note: "穿过平原的日常" },
  { count: 5, id: "zhuhai", imageUrl: "/photos/zhuhai-1.png", label: "珠海", latitude: 22.2707, longitude: 113.5767, note: "沿海公路的白昼" },
  { count: 4, id: "macau", imageUrl: "/photos/macau-1.png", label: "澳门", latitude: 22.1987, longitude: 113.5439, note: "转角处的南方色彩" },
];

function readStoredMapView(): StoredMapView | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MAP_VIEW_STORAGE_KEY) ?? "null") as Partial<StoredMapView> | null;
    const longitude = parsed?.center?.[0];
    const latitude = parsed?.center?.[1];
    const zoom = parsed?.zoom;
    if (
      typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180 &&
      typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 85 &&
      typeof zoom === "number" && Number.isFinite(zoom) && zoom >= 0 && zoom <= 13
    ) {
      return { center: [longitude, latitude], zoom };
    }
  } catch {
    // A malformed or unavailable store must not block the map.
  }
  return null;
}

export default function PrintedPhotoMap({
  places = PHOTO_PLACES,
  photos = [],
  production = false,
  selectedPlaceId,
  selectedPhotoId,
  onOpenCollection,
  onOpenPhoto,
}: {
  places?: PhotoPlace[];
  photos?: PhotoMapItem[];
  production?: boolean;
  selectedPlaceId?: string;
  selectedPhotoId?: string;
  onOpenCollection?: (id: string) => void;
  onOpenPhoto?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRecordsRef = useRef<Map<string, PhotoMarkerRecord>>(new Map());
  const placesRef = useRef(places);
  const photosRef = useRef(photos);
  const selectedPlaceRef = useRef(selectedPlaceId);
  const selectedPhotoRef = useRef(selectedPhotoId);
  const openCollectionRef = useRef(onOpenCollection);
  const openPhotoRef = useRef(onOpenPhoto);
  const renderPresentationRef = useRef<() => void>(() => undefined);
  const focusSelectionRef = useRef<(animate: boolean) => void>(() => undefined);
  const [activeCluster, setActiveCluster] = useState<ProjectedCluster | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([116.7, 31.4]);
  const placesKey = useMemo(
    () => places.map((place) => `${place.id}:${place.latitude}:${place.longitude}:${place.count}`).join("|"),
    [places],
  );
  const photosKey = useMemo(
    () => photos.map((photo) => `${photo.id}:${photo.latitude}:${photo.longitude}:${photo.position}`).join("|"),
    [photos],
  );

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    photosRef.current = photos;
    selectedPlaceRef.current = selectedPlaceId;
    selectedPhotoRef.current = selectedPhotoId;
    openCollectionRef.current = onOpenCollection;
    openPhotoRef.current = onOpenPhoto;
  }, [onOpenCollection, onOpenPhoto, photos, selectedPhotoId, selectedPlaceId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setActiveCluster(null);
      renderPresentationRef.current();
      focusSelectionRef.current(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [photosKey, selectedPhotoId, selectedPlaceId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let map: MapLibreMap | null = null;
    let MarkerClass: typeof import("maplibre-gl").Marker | null = null;
    let cityPopup: import("maplibre-gl").Popup | null = null;
    let hasConfirmedRender = false;
    let clusterFrame: number | null = null;

    const clearPhotoMarkers = () => {
      markerRecordsRef.current.forEach(({ marker }) => marker.remove());
      markerRecordsRef.current.clear();
    };

    const fitOverview = (animate: boolean) => {
      if (!map) return;
      const currentPlaces = placesRef.current;
      const duration = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 600 : 0;
      if (production && currentPlaces.length) {
        map.fitBounds([
          [Math.min(...currentPlaces.map((place) => place.longitude)), Math.min(...currentPlaces.map((place) => place.latitude))],
          [Math.max(...currentPlaces.map((place) => place.longitude)), Math.max(...currentPlaces.map((place) => place.latitude))],
        ], {
          padding: container.clientWidth < 768
            ? { top: 142, right: 70, bottom: 140, left: 70 }
            : { top: 160, right: 120, bottom: 110, left: 150 },
          maxZoom: 8, duration,
        });
        return;
      }
      map.easeTo({ center: [116.7, 31.4], duration, essential: false, zoom: 4.3 });
    };

    const focusSelection = (animate: boolean) => {
      if (!map || !hasConfirmedRender) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = animate && !reduceMotion ? 620 : 0;
      const currentPhotos = photosRef.current;
      const selectedPhoto = currentPhotos.find((photo) => photo.id === selectedPhotoRef.current);
      const selectedPlace = placesRef.current.find((place) => place.id === selectedPlaceRef.current);
      const compact = container.clientWidth < 768;
      const offset: [number, number] = compact ? [0, -Math.min(150, container.clientHeight * 0.18)] : [-200, 40];

      if (selectedPhoto && hasValidPhotoCoordinates(selectedPhoto)) {
        map.easeTo({
          center: [selectedPhoto.longitude, selectedPhoto.latitude],
          zoom: Math.max(map.getZoom(), 12),
          offset,
          duration,
          essential: false,
        });
        return;
      }

      // A photo without GPS belongs to its album, never a fabricated point on the map.
      if (selectedPhoto && selectedPlace) {
        map.easeTo({ center: [selectedPlace.longitude, selectedPlace.latitude], zoom: Math.max(map.getZoom(), 8), offset, duration, essential: false });
        return;
      }
      const positioned = currentPhotos.filter(hasValidPhotoCoordinates);
      if (positioned.length > 1) {
        map.fitBounds([
          [Math.min(...positioned.map((point) => point.longitude)), Math.min(...positioned.map((point) => point.latitude))],
          [Math.max(...positioned.map((point) => point.longitude)), Math.max(...positioned.map((point) => point.latitude))],
        ], {
          padding: !compact
            ? { top: 150, right: 460, bottom: 100, left: 120 }
            : { top: 140, right: 50, bottom: Math.min(410, container.clientHeight * 0.52), left: 50 },
          maxZoom: 12,
          duration,
        });
        return;
      }

      if (positioned[0]) {
        map.easeTo({ center: [positioned[0].longitude, positioned[0].latitude], zoom: 11, offset, duration, essential: false });
        return;
      }
      if (selectedPlace) {
        map.easeTo({ center: [selectedPlace.longitude, selectedPlace.latitude], zoom: Math.max(map.getZoom(), 8), offset, duration, essential: false });
        return;
      }
      fitOverview(animate);
    };

    const renderMarkers = () => {
      if (!map || !MarkerClass || disposed || !hasConfirmedRender) return;
      const selectedCollectionId = selectedPlaceRef.current;
      const positionedPhotos = photosRef.current.filter(hasValidPhotoCoordinates);
      const collectionSubjects: MarkerSubject[] = placesRef.current
        .filter((place) => place.id !== selectedCollectionId || positionedPhotos.length === 0)
        .map((place) => ({
        count: place.count,
        id: place.id,
        imageUrl: place.imageUrl,
        kind: "collection",
        label: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
        note: place.note,
      }));
      const photoSubjects: MarkerSubject[] = positionedPhotos.map((photo) => ({
        count: 1,
        id: photo.id,
        imageUrl: photo.thumb,
        kind: "photo",
        label: photo.title || "照片",
        latitude: photo.latitude,
        longitude: photo.longitude,
        note: photo.takenAt?.slice(0, 10) || "拍摄位置",
      }));
      const clusters = [
        ...projectAndCluster(map, collectionSubjects, "collection"),
        ...projectAndCluster(map, photoSubjects, "photo"),
      ];

      const activeIds = new Set(clusters.map(cluster=>cluster.id));
      for (const [id, record] of markerRecordsRef.current) {
        if (!activeIds.has(id)) { record.marker.remove(); markerRecordsRef.current.delete(id); }
      }
      for (const cluster of clusters) {
        const existing = markerRecordsRef.current.get(cluster.id);
        if (existing) {
          existing.cluster = cluster;
          existing.marker.setLngLat([cluster.longitude,cluster.latitude]);
          const button = existing.marker.getElement();
          button.dataset.selected = cluster.memberIds.includes(cluster.kind === "photo" ? selectedPhotoRef.current || "" : selectedCollectionId || "") ? "true" : "false";
          if(cluster.kind === "collection") button.className = [styles.photoMarker, selectedCollectionId && !cluster.memberIds.includes(selectedCollectionId) ? styles.mutedCollection : "", cluster.memberIds.includes(selectedCollectionId || "") ? styles.selectedCollection : ""].filter(Boolean).join(" ");
          button.setAttribute("aria-label",`${cluster.label}，${cluster.kind === "photo" ? cluster.memberIds.length : cluster.count} 张照片`);
          const image = button.querySelector("img");
          if(image && image.getAttribute("src") !== cluster.imageUrl) image.src=cluster.imageUrl;
          const count = button.querySelector(`.${cluster.kind === "photo" ? styles.exactPhotoCount : styles.referenceCount}`);
          if(count) count.textContent=String(cluster.kind === "photo" ? cluster.memberIds.length : cluster.count);
          continue;
        }
        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.dataset.markerKind = cluster.kind;
        markerButton.dataset.markerMembers = cluster.memberIds.join(",");
        if (cluster.kind === "collection") {
          markerButton.dataset.clusterMembers = cluster.memberIds.join(",");
        }
        markerButton.setAttribute("aria-label", cluster.kind === "photo"
          ? `${cluster.label}，${cluster.memberIds.length} 张照片`
          : `${cluster.label}，${cluster.count} 张照片`);
        markerButton.style.setProperty("--marker-rotation", `${cluster.rotation * 0.55}deg`);

        if (cluster.kind === "photo") {
          markerButton.className = styles.exactPhotoMarker;
          markerButton.dataset.selected = cluster.memberIds.includes(selectedPhotoRef.current ?? "") ? "true" : "false";
        } else {
          const isSelected = cluster.memberIds.includes(selectedCollectionId ?? "");
          markerButton.className = [
            styles.photoMarker,
            selectedCollectionId && !isSelected ? styles.mutedCollection : "",
            isSelected ? styles.selectedCollection : "",
          ].filter(Boolean).join(" ");
        }

        const card = document.createElement("span");
        card.className = cluster.kind === "photo" ? styles.exactPhotoCard : styles.referenceCard;
        const image = document.createElement("img");
        image.alt = "";
        image.decoding = "async";
        image.draggable = false;
        image.loading = cluster.kind === "photo" ? "lazy" : "eager";
        image.src = cluster.imageUrl;
        card.append(image);

        if (cluster.kind === "collection" || cluster.memberIds.length > 1) {
          const count = document.createElement("span");
          count.className = cluster.kind === "photo" ? styles.exactPhotoCount : styles.referenceCount;
          count.textContent = String(cluster.kind === "photo" ? cluster.memberIds.length : cluster.count);
          card.append(count);
        }
        markerButton.append(card);

        const clusterId = cluster.id;
        markerButton.addEventListener("click", () => {
          const cluster = markerRecordsRef.current.get(clusterId)?.cluster;
          if (!cluster) return;
          if (cluster.kind === "photo") {
            if (cluster.memberIds.length === 1 || (map?.getZoom() ?? 0) >= 12.5) {
              openPhotoRef.current?.(cluster.memberIds[0]!);
            } else {
              map?.easeTo({
                center: [cluster.longitude, cluster.latitude],
                zoom: Math.min(13, (map?.getZoom() ?? 8) + 2),
                duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520,
              });
            }
            return;
          }
          if (cluster.memberIds.length === 1 && openCollectionRef.current) {
            setActiveCluster(null);
            openCollectionRef.current(cluster.memberIds[0]!);
            return;
          }
          setActiveCluster(cluster);
          map?.easeTo({
            center: [cluster.longitude, cluster.latitude],
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620,
            essential: false,
            zoom: Math.max(map?.getZoom() ?? 0, 6.15),
          });
        });

        const marker = new MarkerClass({ anchor: "bottom", element: markerButton, offset: [0, production ? -4 : -3], subpixelPositioning: true })
          .setLngLat([cluster.longitude, cluster.latitude])
          .addTo(map);
        markerRecordsRef.current.set(cluster.id, { marker, cluster });
      }
      container.dataset.clusterPasses = String(Number(container.dataset.clusterPasses ?? "0") + 1);
      container.dataset.positionedPhotos = String(positionedPhotos.length);
    };

    const renderPresentation = () => {
      if (!hasConfirmedRender) return;
      container.dataset.routePoints = "0";
      renderMarkers();
    };
    renderPresentationRef.current = renderPresentation;
    focusSelectionRef.current = focusSelection;

    const storedView = production && !selectedPlaceRef.current && !selectedPhotoRef.current
      ? readStoredMapView()
      : null;

    void import("maplibre-gl")
      .then(({ AttributionControl, Map: MapLibre, Marker, NavigationControl, Popup }) => {
        if (disposed) return;
        MarkerClass = Marker;
        map = new MapLibre({
          attributionControl: false,
          center: storedView?.center ?? [116.7, 31.4],
          container,
          crossSourceCollisions: production,
          fadeDuration: 0,
          maxZoom: 13,
          minZoom: production ? 0 : 3,
          pitchWithRotate: false,
          renderWorldCopies: false,
          style: MAP_STYLE_URL,
          zoom: storedView?.zoom ?? 4.3,
        });
        mapRef.current = map;
        if (production) {
          map.on("click", ["lumina-city-tier-1", "lumina-city-tier-2", "lumina-city-tier-3"], event => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point" || !map) return;
            const content = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent = String(feature.properties.name ?? "");
            content.append(name);
            const translation = feature.properties.zh;
            if (translation && translation !== feature.properties.name) {
              const detail = document.createElement("div");
              detail.textContent = String(translation);
              content.append(detail);
            }
            cityPopup?.remove();
            cityPopup = new Popup({ className: styles.cityPopup, closeButton: false, offset: 12 })
              .setLngLat(feature.geometry.coordinates as [number, number]).setDOMContent(content).addTo(map);
          });
        }

        if (production && !storedView && !selectedPlaceRef.current && placesRef.current.length) {
          fitOverview(false);
        }

        if (!production) map.addControl(new NavigationControl({ showCompass: false, showZoom: true, visualizePitch: false }), "bottom-right");
        map.addControl(new AttributionControl({ compact: true, customAttribution: "OpenFreeMap" }), "bottom-right");

        const handleStyleReady = () => {
          hasConfirmedRender = false;
          if (clusterFrame !== null) window.cancelAnimationFrame(clusterFrame);
          clusterFrame = null;
          clearPhotoMarkers();
          setIsLoaded(false);
          if (production) tintMapForNight(map!);
        };
        const handleMapRender = () => {
          if (!map || hasConfirmedRender) return;
          const renderedFeatureCount = map.queryRenderedFeatures().length;
          container.dataset.renderedFeatures = String(renderedFeatureCount);
          if (map.isStyleLoaded() && map.areTilesLoaded() && renderedFeatureCount > 0) {
            hasConfirmedRender = true;
            renderPresentation();
            if (!storedView || selectedPlaceRef.current || selectedPhotoRef.current) focusSelection(false);
            setIsLoaded(true);
            setLoadError(null);
          }
        };
        const scheduleMarkerRender = () => {
          if (!hasConfirmedRender || clusterFrame !== null) return;
          clusterFrame = window.requestAnimationFrame(() => {
            clusterFrame = null;
            renderMarkers();
          });
        };
        const handleMoveEnd = () => {
          scheduleMarkerRender();
          if (!production || !map) return;
          const currentCenter = map.getCenter();
          setCenter([currentCenter.lng, currentCenter.lat]);
          try {
            const center = map.getCenter();
            window.localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({
              center: [center.lng, center.lat],
              zoom: map.getZoom(),
            }));
          } catch {
            // Persistence is an enhancement; browsing remains available without it.
          }
        };
        const handleMapError = (event: { error?: Error }) => {
          if (!map?.isStyleLoaded()) {
            clearPhotoMarkers();
            setIsLoaded(false);
            setLoadError(event.error?.message ?? "地图底图暂时无法加载");
          }
        };

        map.on("style.load", handleStyleReady);
        map.on("render", handleMapRender);
        map.on("resize", scheduleMarkerRender);
        map.on("moveend", handleMoveEnd);
        map.on("error", handleMapError);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        setLoadError(error instanceof Error ? error.message : "地图引擎暂时无法加载");
      });

    return () => {
      disposed = true;
      if (clusterFrame !== null) window.cancelAnimationFrame(clusterFrame);
      renderPresentationRef.current = () => undefined;
      focusSelectionRef.current = () => undefined;
      clearPhotoMarkers();
      cityPopup?.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, [placesKey, production]);

  const resetView = () => {
    setActiveCluster(null);
    try {
      window.localStorage.removeItem(MAP_VIEW_STORAGE_KEY);
    } catch {
      // The map can still reset when storage is unavailable.
    }
    focusSelectionRef.current(true);
  };

  return (
    <main className={styles.page} data-unified-map={production} data-collection-selected={Boolean(selectedPlaceId)}>
      <div
        ref={containerRef}
        className={styles.map}
        role="application"
        aria-label="手绘印刷风格摄影地图，可拖动和缩放"
      />
      <div className={styles.paperWash} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      {production ? <PhotoMapChrome
        count={places.reduce((total, place) => total + place.count, 0)}
        center={center}
        onReset={resetView}
        onZoom={direction => {
          const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 260;
          if (direction === 1) mapRef.current?.zoomIn({ duration });
          else mapRef.current?.zoomOut({ duration });
        }}
      /> : <header className={styles.header}>
        <Link className={styles.backLink} href={production ? "/" : "/map"} aria-label={production ? "返回首页" : "返回正式地图"}>
          <ArrowLeft aria-hidden="true" size={16} />
          <span>LUMINA</span>
        </Link>
        <button className={styles.resetButton} type="button" onClick={resetView} aria-label="回到当前摄影范围" title="回到当前摄影范围">
          <Compass aria-hidden="true" size={17} />
        </button>
      </header>}

      {!isLoaded && !loadError ? (
        <div className={styles.loading} role="status">
          <span className={styles.loadingMark} aria-hidden="true"><MapPin size={18} /></span>
          <span>加载地图</span>
        </div>
      ) : null}

      {loadError ? (
        <div className={styles.errorPanel} role="alert">
          <strong>地图暂时无法加载</strong>
          <span>请检查网络后重试</span>
          <button type="button" onClick={() => window.location.reload()}>重新加载</button>
        </div>
      ) : null}

      {production && isLoaded && places.length === 0 ? (
        <div className={styles.loading} role="status">暂无带位置的公开图集</div>
      ) : null}

      {activeCluster ? (
        <aside className={styles.selection} aria-label="选中的照片图集">
          <div>
            <strong>{activeCluster.label}</strong>
            <span>{activeCluster.count} 张照片</span>
            {production ? (
              <div className={styles.collectionLinks}>
                {places.filter((place) => activeCluster.memberIds.includes(place.id) && place.href).map((place) => (
                  onOpenCollection ? (
                    <button key={place.id} type="button" onClick={() => { setActiveCluster(null); onOpenCollection(place.id); }}>{place.label} ↗</button>
                  ) : (
                    <Link key={place.id} href={place.href!}>{place.label} ↗</Link>
                  )
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={() => setActiveCluster(null)} aria-label="关闭照片图集信息">
            <X aria-hidden="true" size={16} />
          </button>
        </aside>
      ) : null}
    </main>
  );
}
