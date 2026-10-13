"use client";

import { useEffect, useState } from "react";
import type { PhotoAssetRecord } from "@backend/modules/library/types";
import { mediaUrl, mediaSrcSet } from "@/modules/media/urls";
import PhotoCardDialog from "@/components/ui/PhotoCardDialog";
import { BeamCard } from "@/components/ui/beam-card";

export default function CollectionGallery({ photos, title }: Readonly<{ photos: PhotoAssetRecord[]; title: string }>) {
  const [visibleCount, setVisibleCount] = useState(60);
  const [active, setActive] = useState<number | null>(null);
  const selected = active === null ? null : photos[active];
  useEffect(() => {
    if(active===null || (navigator as Navigator & {connection?: {saveData?:boolean}}).connection?.saveData) return;
    const next=photos[active+1]; if(!next)return;
    const image=new window.Image(); image.decoding="async"; image.fetchPriority="low"; image.src=mediaUrl(next.id,"display");
    return ()=>{image.src="";};
  }, [photos,active]);
  if (photos.length === 0) return <div className="gallery-empty">这组图集还没有可显示的照片。</div>;

  return <>
    <div className="collection-mosaic">
      {photos.slice(0,visibleCount).map((photo, index) => (
        <BeamCard className={"collection-mosaic-item collection-mosaic-item-" + index % 5} key={photo.id}>
          <button aria-label={"打开 " + title + " 第 " + (index + 1) + " 张照片"} className="block h-full w-full" onClick={() => setActive(index)} type="button">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" srcSet={mediaSrcSet(photo)} alt={photo.alt || title + " 第 " + (index + 1) + " 张"} className="collection-mosaic-image" height={photo.height} sizes="(max-width: 640px) 100vw, 50vw" src={mediaUrl(photo.id, "thumb")} width={photo.width} />
            <span className="collection-mosaic-number">{String(index + 1).padStart(2, "0")}</span>
          </button>
        </BeamCard>
      ))}
    </div>
    {visibleCount < photos.length && <button type="button" className="ui-button" onClick={()=>setVisibleCount(value=>value+60)}>加载更多 · {Math.min(visibleCount,photos.length)} / {photos.length}</button>}
    <PhotoCardDialog
      ariaLabel={title + " 照片浏览"}
      photo={selected ? {
        id: selected.id, src: mediaUrl(selected.id, "display"),
        title: selected.alt || title, width: selected.width, height: selected.height,
        date: selected.takenAt || undefined, camera: selected.cameraModel || selected.cameraMake || undefined,
        lens: selected.lens || undefined, latitude: selected.latitude, longitude: selected.longitude,
        settings: [selected.focalLength ? selected.focalLength + "mm" : "", selected.aperture ? "ƒ/" + selected.aperture : "", selected.shutterSpeed || "", selected.iso ? "ISO " + selected.iso : ""].filter(Boolean).join(" · "),
      } : null}
      index={active ?? undefined} total={photos.length}
      onClose={() => setActive(null)}
      hasPrev={photos.length > 1} hasNext={photos.length > 1}
      onPrev={() => setActive(current => current === null ? null : (current - 1 + photos.length) % photos.length)}
      onNext={() => setActive(current => current === null ? null : (current + 1) % photos.length)}
    />
  </>;
}
