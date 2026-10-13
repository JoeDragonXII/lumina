"use client";

import { MapPin, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PhotoCardDialog, { type CardPhoto } from "@/components/ui/PhotoCardDialog";
import { BeamCard } from "@/components/ui/beam-card";
import { hasValidPhotoCoordinates } from "@/modules/map/photoRoute";
import PrintedPhotoMap, { type PhotoPlace } from "./PrintedPhotoMap";
import styles from "./MapCollectionExperience.module.css";

export type MapAlbumPhoto = CardPhoto & {
  thumb: string;
  width: number;
  height: number;
  takenAt?: string;
  position: number;
  latitude: number | null;
  longitude: number | null;
};

export type MapAlbum = {
  id: string;
  slug: string;
  title: string;
  location: string;
  photos: MapAlbumPhoto[];
};

function AlbumPanel({
  album,
  selectedPhotoId,
  onClose,
  onSelectPhoto,
}: {
  album: MapAlbum;
  selectedPhotoId?: string;
  onClose: () => void;
  onSelectPhoto: (photoId: string) => void;
}) {
  const positionedCount = album.photos.filter(hasValidPhotoCoordinates).length;
  const selectedIndex = album.photos.findIndex(photo=>photo.id===selectedPhotoId);
  const [windowState,setWindowState] = useState({selectedPhotoId,page:Math.max(0,Math.floor(selectedIndex/60))});
  if(windowState.selectedPhotoId !== selectedPhotoId) {
    setWindowState({selectedPhotoId,page:selectedIndex>=0 ? Math.floor(selectedIndex/60) : windowState.page});
  }
  const page=windowState.page;
  const pageCount=Math.max(1,Math.ceil(album.photos.length/60));

  return (
    <aside className={styles.panel} aria-label="图集照片瀑布流">
      <header>
        <div>
          <h1>{album.title}</h1>
          <p>{album.photos.length} 张照片</p>
          {album.location ? (
            <p><MapPin size={13} />{album.location}</p>
          ) : null}
        </div>
        <button type="button" aria-label="关闭图集" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      {album.photos.length > 0 && positionedCount === 0 ? (
        <p className={styles.mapHint}>这组照片未记录单张 GPS，仍可正常浏览。</p>
      ) : null}

      <div className={styles.waterfall}>
        {album.photos.slice(page*60,(page+1)*60).map((photo, offset) => { const index=page*60+offset; return (
          <BeamCard key={photo.id} className={styles.photoCard}><button
            type="button"
            key={photo.id}
            aria-label={`查看 ${photo.title || album.title} 第 ${index + 1} 张照片`}
            aria-pressed={selectedPhotoId === photo.id}
            data-map-photo-id={photo.id}
            data-selected={selectedPhotoId === photo.id ? "true" : undefined}
            onClick={() => onSelectPhoto(photo.id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumb}
              alt={photo.title || album.title}
              width={photo.width}
              height={photo.height}
              decoding="async"
              loading={offset < 4 ? "eager" : "lazy"}
            />
          </button></BeamCard>
        );})}
      </div>
      {pageCount>1 && <nav className={styles.pagination} aria-label="地图照片分页">
        <button type="button" disabled={page===0} onClick={()=>setWindowState({selectedPhotoId,page:page-1})}>上一页</button>
        <span>{page+1} / {pageCount}</span>
        <button type="button" disabled={page>=pageCount-1} onClick={()=>setWindowState({selectedPhotoId,page:page+1})}>下一页</button>
      </nav>}
      {!album.photos.length ? (
        <p className={styles.empty}>这个图集还没有照片</p>
      ) : null}
    </aside>
  );
}

export default function MapCollectionExperience({
  places,
  albumSummaries,
}: {
  places: PhotoPlace[];
  albumSummaries: Array<Pick<MapAlbum, "id" | "slug" | "title">>;
}) {
  const router = useRouter();
  const albumCache = useRef(new Map<string, MapAlbum>());
  const [loadedAlbum, setLoadedAlbum] = useState<MapAlbum | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => { if (document.visibilityState === "visible" && Date.now()-lastRefresh>1000) {
      lastRefresh=Date.now(); albumCache.current.clear(); setReload(value=>value+1); router.refresh();
    } };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const experienceRef = useRef<HTMLDivElement>(null);
  const pendingPhotoFocusId = useRef<string | null>(null);
  const serializedParams = searchParams.toString();
  const slug = searchParams.get("collection");
  const photoId = searchParams.get("photo");
  const albumSummary = albumSummaries.find(item=>item.slug===slug);
  const albumSummaryId = albumSummary?.id;
  const album = loadedAlbum?.slug === slug ? loadedAlbum : null;
  useEffect(() => {
    if (!slug || !albumSummaryId) return;
    const cached = albumCache.current.get(slug);
    if (cached) { setLoadedAlbum(cached); setLoadError(""); return; }
    const controller = new AbortController();
    setLoadedAlbum(null);
    setLoadError("");
    fetch(`/api/public/albums/${encodeURIComponent(slug)}`, {signal:controller.signal,cache:"no-store"})
      .then(async response=>{ const payload=await response.json(); if(!response.ok) throw new Error(payload.error || "加载失败"); return payload.album as MapAlbum; })
      .then(value=>{if(controller.signal.aborted)return; if(albumCache.current.size>=8) albumCache.current.delete(albumCache.current.keys().next().value!); albumCache.current.set(slug,value); setLoadedAlbum(value);})
      .catch(error=>{if(!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "加载失败");});
    return ()=>controller.abort();
  }, [slug, albumSummaryId, reload]);
  const selectedPhoto = album?.photos.find((photo) => photo.id === photoId);
  const selectedPhotoIndex = selectedPhoto
    ? album?.photos.findIndex((photo) => photo.id === selectedPhoto.id) ?? -1
    : -1;

  useEffect(() => {
    const connection = (navigator as Navigator & {connection?: {saveData?:boolean}}).connection;
    if(selectedPhotoIndex<0 || connection?.saveData) return;
    const next=album?.photos[selectedPhotoIndex+1];
    if(!next) return;
    const image=new window.Image(); image.decoding="async"; image.fetchPriority="low"; image.src=next.src;
    return ()=>{image.src="";};
  }, [album,selectedPhotoIndex]);

  const navigate = useCallback((
    nextAlbum?: Pick<MapAlbum, "slug">,
    nextPhotoId?: string,
    method: "push" | "replace" = "push",
  ) => {
    const query = new URLSearchParams(serializedParams);
    if (nextAlbum) query.set("collection", nextAlbum.slug);
    else query.delete("collection");
    if (nextAlbum && nextPhotoId) query.set("photo", nextPhotoId);
    else query.delete("photo");
    const queryString = query.toString();
    window.history[method === "push" ? "pushState" : "replaceState"](null, "", queryString ? `${pathname}?${queryString}` : pathname);
  }, [pathname, serializedParams]);

  const selectCollection = useCallback((id?: string) => {
    navigate(albumSummaries.find((item) => item.id === id));
  }, [albumSummaries, navigate]);

  const selectPhoto = useCallback((id: string, method: "push" | "replace" = "push") => {
    if (!album?.photos.some((photo) => photo.id === id)) return;
    navigate(album, id, method);
  }, [album, navigate]);

  useEffect(() => {
    if (photoId && album && !selectedPhoto) navigate(album, undefined, "replace");
  }, [album, navigate, photoId, selectedPhoto]);

  useEffect(() => {
    if (selectedPhoto || !pendingPhotoFocusId.current) return;
    const photoToFocus = pendingPhotoFocusId.current;
    const frame = window.requestAnimationFrame(() => {
      const trigger = Array.from(experienceRef.current?.querySelectorAll<HTMLButtonElement>("[data-map-photo-id]") ?? [])
        .find((button) => button.dataset.mapPhotoId === photoToFocus);
      trigger?.focus();
      pendingPhotoFocusId.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedPhoto]);

  const positionedPhotos = useMemo(
    () => album?.photos.filter(hasValidPhotoCoordinates) ?? [],
    [album],
  );

  return (
    <div
      ref={experienceRef}
      className={styles.experience}
      data-album-open={Boolean(slug)}
      data-positioned-photos={positionedPhotos.length}
    >
      <PrintedPhotoMap
        places={places}
        production
        selectedPlaceId={albumSummary?.id}
        photos={album?.photos}
        selectedPhotoId={selectedPhoto?.id}
        onOpenCollection={selectCollection}
        onOpenPhoto={selectPhoto}
      />

      {album ? (
        <AlbumPanel
          key={album.id}
          album={album}
          selectedPhotoId={selectedPhoto?.id}
          onClose={() => navigate()}
          onSelectPhoto={selectPhoto}
        />
      ) : null}

      {slug && !album ? (
        <aside className={styles.panel} aria-label="图集不可用">
          <header>
            <h1>{albumSummary ? albumSummary.title : "图集暂不可用"}</h1>
            <button type="button" aria-label="关闭图集" onClick={() => navigate()}>
              <X size={18} />
            </button>
          </header>
          <p className={styles.empty} role="status">{!albumSummary ? "该图集不存在或尚未公开。" : loadError || "正在加载照片…"}</p>
          {albumSummary && loadError && <button type="button" onClick={()=>setReload(value=>value+1)}>重试</button>}
        </aside>
      ) : null}

      <PhotoCardDialog
        photo={selectedPhoto ?? null}
        index={selectedPhotoIndex >= 0 ? selectedPhotoIndex : undefined}
        total={album?.photos.length}
        onClose={() => {
          if (!album) return;
          pendingPhotoFocusId.current = selectedPhoto?.id ?? null;
          navigate(album);
        }}
        hasPrev={selectedPhotoIndex > 0}
        hasNext={Boolean(album && selectedPhotoIndex >= 0 && selectedPhotoIndex < album.photos.length - 1)}
        onPrev={() => {
          const previous = album?.photos[selectedPhotoIndex - 1];
          if (previous) selectPhoto(previous.id, "replace");
        }}
        onNext={() => {
          const next = album?.photos[selectedPhotoIndex + 1];
          if (next) selectPhoto(next.id, "replace");
        }}
      />
    </div>
  );
}
