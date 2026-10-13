"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  m,
  useReducedMotion,
} from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import ParticleGlow from "./ParticleGlow";
import { composePhotoWall, type WallBlock } from "@/modules/library/photoWallLayout";

export type FlowPhoto = {
  id: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  title?: string;
  date?: string;
  href?: string;
};

const colorCache = new Map<string, string>();
const subscribeHydration = () => () => {};

function extractDominantColor(img: HTMLImageElement, cacheKey: string): string | null {
  const cached = colorCache.get(cacheKey);
  if (cached) return cached;
  try {
    const size = 8;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      if (luminance < 24 || luminance > 235) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
    if (n === 0) return null;
    const color = `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`;
    colorCache.set(cacheKey, color);
    return color;
  } catch {
    return null;
  }
}

function splitColumns(photos: FlowPhoto[], columns: number): FlowPhoto[][] {
  const buckets: FlowPhoto[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const photo of photos) {
    const shortest = heights.indexOf(Math.min(...heights));
    buckets[shortest].push(photo);
    heights[shortest] += photo.height / Math.max(1, photo.width);
  }
  return buckets;
}

function FlowCard({
  photo,
  reduceMotion,
  origin,
  onClick,
}: Readonly<{
  photo: FlowPhoto;
  reduceMotion: boolean;
  origin: "left" | "right";
  onClick?: (photo: FlowPhoto) => void;
}>) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [hovered, setHovered] = useState(false);
  const [glow, setGlow] = useState<string | null>(colorCache.get(photo.src) ?? null);

  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        decoding="async"
        srcSet={photo.srcSet}
        sizes={photo.sizes}
        alt={photo.title ?? "照片"}
        className="home-flow-card-image"
        crossOrigin="anonymous"
        height={photo.height}
        loading="lazy"
        onLoad={(event) => {
          if (!hovered || reduceMotion) return;
          const color = extractDominantColor(event.currentTarget, photo.src);
          if (color) setGlow(color);
        }}
        src={photo.src}
        width={photo.width}
      />
      {photo.title || photo.date ? (
        <span className="home-flow-card-caption">
          <span className="home-flow-card-meta">
            {photo.title ? <strong>{photo.title}</strong> : null}
            {photo.date ? <time dateTime={photo.date}>{photo.date}</time> : null}
          </span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  const className = "home-flow-card";
  return (
    <m.div
      className="home-flow-card-frame"
      onHoverStart={() => {
        setHovered(true);
        if (!reduceMotion && imageRef.current?.complete && imageRef.current.naturalWidth) {
          const color = extractDominantColor(imageRef.current, photo.src);
          if (color) setGlow(color);
        }
      }}
      onHoverEnd={() => setHovered(false)}
      whileHover={reduceMotion ? undefined : { scale: 1.18 }}
      transition={{ type: "spring", mass: 0.12, stiffness: 170, damping: 14 }}
      style={
        reduceMotion
          ? undefined
          : {
              transformOrigin: origin === "left" ? "left center" : "right center",
              ["--card-glow" as string]: glow ?? undefined,
            }
      }
    >
      {onClick ? (
        <button
          type="button"
          className={`${className} home-flow-card-clickable`}
          onClick={() => onClick(photo)}
          aria-label={photo.title ? `查看 ${photo.title} 详情` : "查看照片详情"}
        >
          {inner}
        </button>
      ) : photo.href ? (
        <Link prefetch={false} aria-label={photo.title ? `打开 ${photo.title}` : "打开照片"} className={className} href={photo.href}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
      {hovered && !reduceMotion ? <ParticleGlow color={glow} /> : null}
    </m.div>
  );
}

function FlowColumn({
  blocks,
  reduceMotion,
  origin,
  speed,
  onPhotoClick,
}: Readonly<{
  blocks: WallBlock<FlowPhoto>[];
  reduceMotion: boolean;
  origin: "left" | "right";
  speed: number;
  onPhotoClick?: (photo: FlowPhoto) => void;
}>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      setDuration((track.getBoundingClientRect().height + gap) / 2 / speed);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    measure();
    return () => observer.disconnect();
  }, [speed]);
  return (
    <div className="home-flow-column">
      <div ref={trackRef} className="home-flow-track" style={{ animationDuration: `${duration}s` }}>
        {[0, 1].map((copy) => (
          <div aria-hidden={copy === 1} className="home-flow-group" key={`copy-${copy}`}>
            {blocks.map((block) => <div key={block.photos[0].id} className={`home-flow-block home-flow-block-${block.kind}`}>
            {block.photos.map((photo) => (
              <FlowCard
                key={`${copy}-${photo.id}`}
                onClick={onPhotoClick}
                origin={origin}
                photo={photo}
                reduceMotion={reduceMotion}
              />
            ))}
            </div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MasonryFlowWall({
  photos,
  columns = 2,
  className,
  onPhotoClick,
  layoutSeed,
}: Readonly<{ photos: FlowPhoto[]; columns?: number; className?: string; onPhotoClick?: (photo: FlowPhoto) => void; layoutSeed?: number }>) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const reduceMotion = hydrated && prefersReducedMotion;

  const buckets = useMemo(() => layoutSeed === undefined
    ? splitColumns(photos, columns).map(bucket => bucket.map(photo => ({ kind: "solo" as const, photos: [photo] })))
    : composePhotoWall(photos, columns, layoutSeed), [photos, columns, layoutSeed]);

  if (photos.length === 0) {
    return (
      <div className="home-flow-empty">
        <p>照片会在这里组成流动的照片墙。</p>
      </div>
    );
  }

  return (
    <div
      className={["home-flow-wall", layoutSeed !== undefined && "home-flow-wall-varied", className].filter(Boolean).join(" ")}
      aria-label="照片流"
      style={{ ["--hf-flow-columns" as string]: String(columns) }}
    >
      {buckets.map((bucket, i) => (
        <FlowColumn
          key={`col-${i}`}
          speed={24 + i * 4}
          onPhotoClick={onPhotoClick}
          origin={i === 0 ? "left" : "right"}
          blocks={bucket}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
