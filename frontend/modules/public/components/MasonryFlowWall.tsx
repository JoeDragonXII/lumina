"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  type MotionValue,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useMemo, useState } from "react";
import ParticleGlow from "./ParticleGlow";

export type FlowPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  title?: string;
  href?: string;
};

const colorCache = new Map<string, string>();

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
  mouseY,
  reduceMotion,
  origin,
  onClick,
}: Readonly<{
  photo: FlowPhoto;
  mouseY: MotionValue<number>;
  reduceMotion: boolean;
  origin: "left" | "right";
  onClick?: (photo: FlowPhoto) => void;
}>) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [glow, setGlow] = useState<string | null>(colorCache.get(photo.src) ?? null);

  const distance = useTransform(mouseY, (val) => {
    const rect = frame?.getBoundingClientRect();
    if (!rect) return val;
    return val - rect.top - rect.height / 2;
  });
  const scaleSync = useTransform(distance, [-320, 0, 320], [0.98, 1.1, 0.98]);
  const scale = useSpring(scaleSync, { mass: 0.12, stiffness: 170, damping: 14 });

  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.title ?? "照片"}
        className="home-flow-card-image"
        crossOrigin="anonymous"
        height={photo.height}
        loading="lazy"
        onLoad={(event) => {
          const color = extractDominantColor(event.currentTarget, photo.src);
          if (color) setGlow(color);
        }}
        src={photo.src}
        width={photo.width}
      />
      {photo.title ? (
        <span className="home-flow-card-caption">
          <strong>{photo.title}</strong>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  const className = "home-flow-card";
  return (
    <m.div
      ref={setFrame}
      className="home-flow-card-frame"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        reduceMotion
          ? undefined
          : {
              scale,
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
        <Link aria-label={photo.title ? `打开 ${photo.title}` : "打开照片"} className={className} href={photo.href}>
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
  photos,
  mouseY,
  reduceMotion,
  origin,
  duration,
  onPhotoClick,
}: Readonly<{
  photos: FlowPhoto[];
  mouseY: MotionValue<number>;
  reduceMotion: boolean;
  origin: "left" | "right";
  duration: string;
  onPhotoClick?: (photo: FlowPhoto) => void;
}>) {
  return (
    <div className="home-flow-column">
      <div className="home-flow-track" style={{ animationDuration: duration }}>
        {[0, 1].map((copy) => (
          <div aria-hidden={copy === 1} className="home-flow-group" key={`copy-${copy}`}>
            {photos.map((photo) => (
              <FlowCard
                key={`${copy}-${photo.id}`}
                mouseY={mouseY}
                onClick={onPhotoClick}
                origin={origin}
                photo={photo}
                reduceMotion={reduceMotion}
              />
            ))}
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
}: Readonly<{ photos: FlowPhoto[]; columns?: number; className?: string; onPhotoClick?: (photo: FlowPhoto) => void }>) {
  const reduceMotion = useReducedMotion() ?? false;
  const mouseY = useMotionValue(Infinity);

  const buckets = useMemo(() => splitColumns(photos, columns), [photos, columns]);
  // 每列独立时长，按列照片数微调，速度错开更自然
  const durations = useMemo(
    () => buckets.map((bucket, i) => `${52 + i * 6 + bucket.length}s`),
    [buckets],
  );

  if (photos.length === 0) {
    return (
      <div className="home-flow-empty">
        <p>照片会在这里组成流动的照片墙。</p>
      </div>
    );
  }

  return (
    <div
      className="home-flow-wall"
      aria-label="照片流"
      onMouseMove={(event) => mouseY.set(event.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      style={{ ["--hf-flow-columns" as string]: String(columns) }}
    >
      {buckets.map((bucket, i) => (
        <FlowColumn
          key={`col-${i}`}
          duration={durations[i]}
          mouseY={mouseY}
          onPhotoClick={onPhotoClick}
          origin={i === 0 ? "left" : "right"}
          photos={bucket}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
