"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type { PhotoAssetRecord } from "@backend/modules/library/types";
import { mediaUrl } from "@/modules/media/urls";
import { publicMotion } from "@/modules/public/motion";
import type { GalleryViewerState } from "@/modules/public/types";

const initialState: GalleryViewerState = { activeIndex: null, direction: 0 };
const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 48 : -48, scale: 0.985 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 48 : -48, scale: 0.985 }),
};

export default function CollectionGallery({ photos, title }: Readonly<{ photos: PhotoAssetRecord[]; title: string }>) {
  const [viewer, setViewer] = useState<GalleryViewerState>(initialState);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openedFromIndex = useRef<number | null>(null);
  const pointerStart = useRef<number | null>(null);
  const active = viewer.activeIndex;

  const close = useCallback(() => {
    const trigger = openedFromIndex.current === null ? null : triggerRefs.current[openedFromIndex.current];
    setViewer(initialState);
    window.setTimeout(() => {
      trigger?.focus({ preventScroll: true });
      openedFromIndex.current = null;
    }, publicMotion.duration.base * 1000 + 80);
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    setViewer((current) => current.activeIndex === null ? current : {
      activeIndex: (current.activeIndex + direction + photos.length) % photos.length,
      direction,
    });
  }, [photos.length]);

  useEffect(() => {
    if (active === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft" && photos.length > 1) move(-1);
      if (event.key === "ArrowRight" && photos.length > 1) move(1);
      if (event.key !== "Tab") return;
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keydown);
    };
  }, [active, close, move, photos.length]);

  function open(index: number) {
    openedFromIndex.current = index;
    setViewer({ activeIndex: index, direction: 0 });
  }

  function pointerUp(event: React.PointerEvent) {
    if (pointerStart.current === null || photos.length < 2) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) > 52) move(distance > 0 ? -1 : 1);
  }

  if (photos.length === 0) return <div className="gallery-empty">这组图集还没有可显示的照片。</div>;

  const previousIndex = active === null ? 0 : (active - 1 + photos.length) % photos.length;
  const nextIndex = active === null ? 0 : (active + 1) % photos.length;

  return (
    <>
      <div className="collection-mosaic">
        {photos.map((photo, index) => (
          <m.button
            aria-label={`打开 ${title} 第 ${index + 1} 张照片`}
            className={`collection-mosaic-item collection-mosaic-item-${index % 5}`}
            initial={{ opacity: 0, y: 24 }}
            key={photo.id}
            onClick={() => open(index)}
            ref={(node) => { triggerRefs.current[index] = node; }}
            transition={{ duration: publicMotion.duration.slow, delay: Math.min(index, 6) * 0.04, ease: publicMotion.ease }}
            type="button"
            viewport={{ amount: 0.12, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Image alt={photo.alt || `${title} 第 ${index + 1} 张`} className="collection-mosaic-image" height={photo.height} sizes="(max-width: 640px) 100vw, 50vw" src={mediaUrl(photo.id, "large")} width={photo.width} />
            <span className="collection-mosaic-number">{String(index + 1).padStart(2, "0")}</span>
          </m.button>
        ))}
      </div>

      <AnimatePresence custom={viewer.direction}>
        {active !== null ? (
          <m.div
            animate={{ opacity: 1 }}
            aria-label={`${title} 照片浏览`}
            aria-modal="true"
            className="cinematic-viewer"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="cinematic-viewer"
            onClick={(event) => { if (event.target === event.currentTarget) close(); }}
            onPointerDown={(event) => { pointerStart.current = event.clientX; }}
            onPointerUp={pointerUp}
            ref={overlayRef}
            role="dialog"
            transition={{ duration: publicMotion.duration.base }}
          >
            <div className="viewer-topbar"><span>Photo Archive / {title}</span><button aria-label="关闭照片浏览" className="viewer-icon-button" onClick={close} ref={closeButtonRef} type="button"><X /></button></div>
            <div className="viewer-stage">
              {photos.length > 1 ? <button aria-label="上一张照片" className="viewer-side viewer-side-previous" onClick={() => move(-1)} type="button"><Image alt="" aria-hidden="true" fill loading="eager" sizes="18vw" src={mediaUrl(photos[previousIndex].id, "display")} /><span><ChevronLeft /></span></button> : null}
              <AnimatePresence custom={viewer.direction} initial={false} mode="popLayout">
                <m.figure
                  animate="center"
                  className="viewer-current"
                  custom={viewer.direction}
                  exit="exit"
                  initial="enter"
                  key={photos[active].id}
                  transition={{ duration: publicMotion.duration.base, ease: publicMotion.ease }}
                  variants={slideVariants}
                >
                  <Image alt={photos[active].alt || title} className="viewer-current-image" height={photos[active].height} priority sizes="(max-width: 768px) 94vw, 64vw" src={mediaUrl(photos[active].id, "large")} width={photos[active].width} />
                  {photos[active].alt ? <figcaption>{photos[active].alt}</figcaption> : null}
                </m.figure>
              </AnimatePresence>
              {photos.length > 1 ? <button aria-label="下一张照片" className="viewer-side viewer-side-next" onClick={() => move(1)} type="button"><Image alt="" aria-hidden="true" fill loading="eager" sizes="18vw" src={mediaUrl(photos[nextIndex].id, "display")} /><span><ChevronRight /></span></button> : null}
            </div>
            <div aria-live="polite" className="viewer-footer"><span>{String(active + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><span>使用方向键或左右滑动浏览</span></div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
