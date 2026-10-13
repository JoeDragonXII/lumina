"use client";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./controls";
import styles from "./photo-card.module.css";

export type CardPhoto = {
  id: string; src: string; title?: string; date?: string; location?: string;
  camera?: string; lens?: string; description?: string; settings?: string;
  width?: number; height?: number; latitude?: number | null; longitude?: number | null;
};
export default function PhotoCardDialog({ photo, onClose, onPrev, onNext, hasPrev, hasNext, index, total, ariaLabel = "照片详情" }: {
  photo: CardPhoto | null; onClose: () => void; onPrev?: () => void; onNext?: () => void; hasPrev?: boolean; hasNext?: boolean;
  index?: number; total?: number; ariaLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ src: string; width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState("");
  const [failed, setFailed] = useState("");
  const [retry, setRetry] = useState(0);
  const isOpen = Boolean(photo);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    closeButton.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; if (trigger?.isConnected) trigger.focus(); };
  }, [isOpen]);
  const width = photo?.width || (dimensions?.src === photo?.src ? dimensions?.width : undefined);
  const height = photo?.height || (dimensions?.src === photo?.src ? dimensions?.height : undefined);
  const ratio = width && height ? width / height : 1.5;
  const hasExif = photo && Boolean(photo.date || photo.camera || photo.lens || photo.settings);
  const hasGps = photo && typeof photo.latitude === "number" && Number.isFinite(photo.latitude) && Math.abs(photo.latitude) <= 90
    && typeof photo.longitude === "number" && Number.isFinite(photo.longitude) && Math.abs(photo.longitude) <= 180;
  return <dialog ref={dialog} className={styles.dialog} style={{ "--photo-ratio": ratio } as CSSProperties} aria-label={ariaLabel} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
  }} onKeyDown={e => {
    if (e.key === "ArrowLeft" && hasPrev && onPrev) { e.preventDefault(); onPrev(); }
    if (e.key === "ArrowRight" && hasNext && onNext) { e.preventDefault(); onNext(); }
  }}>{photo ? <article className={styles.card}>
    <header className={styles.topbar}>
      <span aria-live="polite">{index !== undefined && total ? `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}` : ""}</span>
      <Button ref={closeButton} variant="ghost" className={styles.iconButton} type="button" aria-label="关闭" onClick={onClose}><X size={20}/></Button>
    </header>
    <div className={styles.body}>
    <div className={styles.primary}>
    <div className={styles.image} aria-busy={loaded !== photo.src && failed !== photo.src}
      onPointerDown={event => { if (event.pointerType !== "mouse" || event.button === 0) gesture.current = { x: event.clientX, y: event.clientY }; }}
      onPointerCancel={() => { gesture.current = null; }}
      onPointerUp={event => {
        const start = gesture.current;
        gesture.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx > 0 && hasPrev) onPrev?.();
          if (dx < 0 && hasNext) onNext?.();
        }
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" key={photo.src + retry} src={photo.src} alt={photo.title || "照片"} draggable={false} onLoad={event => { setLoaded(photo.src); setDimensions({ src: photo.src, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); }} onError={() => setFailed(photo.src)} style={{opacity: loaded === photo.src ? 1 : 0}} />
      {failed === photo.src ? <div className={styles.imageStatus}><span>照片暂时无法加载</span><button type="button" onClick={() => {setFailed("");setRetry(n=>n+1);}}>重试</button></div> : loaded !== photo.src ? <span role="status" className={styles.imageStatus}>加载照片…</span> : null}
    </div>
    {onPrev || onNext ? <footer className={styles.footer}>
      <Button variant="ghost" className={styles.iconButton} type="button" aria-label="上一张" disabled={!hasPrev} onClick={onPrev}><ChevronLeft size={20}/></Button>
      <Button variant="ghost" className={styles.iconButton} type="button" aria-label="下一张" disabled={!hasNext} onClick={onNext}><ChevronRight size={20}/></Button>
    </footer> : null}
    </div>
    <aside className={styles.info} aria-label="图片信息">
      {hasExif && <section><h2>EXIF</h2><dl>
        {photo.date && <div><dt>DATE</dt><dd>{photo.date}</dd></div>}
        {photo.camera && <div><dt>CAMERA</dt><dd>{photo.camera}</dd></div>}
        {photo.lens && <div><dt>LENS</dt><dd>{photo.lens}</dd></div>}
        {photo.settings && <div><dt>EXPOSURE</dt><dd>{photo.settings}</dd></div>}
      </dl></section>}
      <section><h2>FILE / GEO</h2><dl>
        {width && height ? <div><dt>SIZE</dt><dd>{width} × {height}</dd></div> : null}
        {photo.location && <div><dt>PLACE</dt><dd>{photo.location}</dd></div>}
        {hasGps && <div><dt>GPS</dt><dd>{Math.abs(photo.latitude!).toFixed(4)}° {photo.latitude! < 0 ? "S" : "N"}<br />{Math.abs(photo.longitude!).toFixed(4)}° {photo.longitude! < 0 ? "W" : "E"}</dd></div>}
      </dl></section>
    </aside>
    </div>
  </article> : null}</dialog>;
}
