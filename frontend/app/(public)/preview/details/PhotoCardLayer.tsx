"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, MapPin, Camera, CalendarDays } from "lucide-react";
import styles from "@/components/ui/photo-card.module.css";

type Photo = { id: string; src: string; title: string; date: string; camera?: string; exposure?: string };
export default function PhotoCardLayer({ children, photos, location, description, initiallyOpen }: {
  children: ReactNode; photos: Photo[]; location?: string; description: string; initiallyOpen?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(initiallyOpen);
  const [loadedSource, setLoadedSource] = useState("");
  const [failedSource, setFailedSource] = useState("");
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const index = Math.max(0, photos.findIndex(p => p.id === selected));
  const photo = photos[index];
  const isOpen = selected !== undefined;
  useEffect(() => {
    const element = dialog.current;
    if (!element || !isOpen) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; };
  }, [isOpen]);
  const close = () => { dialog.current?.close(); setSelected(undefined); trigger.current?.focus(); };
  const intercept = (event: MouseEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    const url = new URL(link.href);
    if (url.pathname !== "/preview/details" || url.searchParams.get("view") !== "photo") return;
    event.preventDefault();
    event.stopPropagation();
    trigger.current = link;
    setSelected(url.searchParams.get("photo") || photos[0]?.id);
  };
  return <div onClickCapture={intercept}>{children}
    <dialog ref={dialog} className={styles.dialog} data-variant="quiet" aria-label="照片详情" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }} onKeyDown={event => { if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); setSelected(photos[index - 1].id); } if (event.key === "ArrowRight" && index < photos.length - 1) { event.preventDefault(); setSelected(photos[index + 1].id); } }}>
      {photo ? <article className={styles.card}>
        <div className={styles.image} aria-busy={loadedSource !== photo.src && failedSource !== photo.src}>
          <Image key={photo.src + retry} src={photo.src} alt={photo.title} fill sizes="(max-width: 640px) 92vw, 520px" priority onLoad={() => setLoadedSource(photo.src)} onError={() => setFailedSource(photo.src)} style={{ opacity: loadedSource === photo.src ? 1 : 0 }} />
          {failedSource === photo.src ? <div className={styles.imageStatus}><span>照片暂时无法加载</span><button type="button" onClick={() => { setFailedSource(""); setRetry(value => value + 1); }}>重试</button></div> : loadedSource !== photo.src ? <span className={styles.imageStatus} role="status">加载照片…</span> : null}
          <button className={styles.close} onClick={close} aria-label="关闭照片" type="button"><X size={18}/></button>

        </div>
        <div className={styles.info}><h2>{photo.title}</h2><div className={styles.metadata}>
          {location ? <span><MapPin size={14}/>{location}</span> : null}
          <span><CalendarDays size={14}/>{photo.date}</span>
          {photo.camera ? <span><Camera size={14}/>{photo.camera}</span> : null}
        </div>
        {photo.exposure ? <div className={styles.exposure}>{photo.exposure}</div> : null}
          {description ? <details className={styles.description}><summary>拍摄手记</summary><p>{description}</p></details> : null}
          <footer><span aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><div><button aria-label="上一张" disabled={index === 0} onClick={() => setSelected(photos[index - 1].id)} type="button"><ChevronLeft size={18}/></button><button aria-label="下一张" disabled={index === photos.length - 1} onClick={() => setSelected(photos[index + 1].id)} type="button"><ChevronRight size={18}/></button></div></footer>
        </div>
      </article> : null}
    </dialog>
  </div>;
}
