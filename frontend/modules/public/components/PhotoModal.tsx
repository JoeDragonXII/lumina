"use client";

import { m, AnimatePresence } from "motion/react";
import { X, MapPin, Calendar, Camera, Aperture, User, Tag, Palette } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { FlowPhoto } from "./MasonryFlowWall";

export type PhotoDetail = FlowPhoto & {
  date?: string;
  location?: string;
  description?: string;
  camera?: string;
  lens?: string;
  settings?: string;
  photographer?: string;
  tags?: string[];
};

type Props = {
  photo: PhotoDetail | null;
  onClose: () => void;
};

function extractPalette(img: HTMLImageElement): string[] {
  try {
    const size = 16;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const bins: Array<{ r: number; g: number; b: number; count: number }> = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      if (luminance < 20 || luminance > 240) continue;
      const existing = bins.find((bin) => bin.r === r && bin.g === g && bin.b === b);
      if (existing) existing.count += 1;
      else bins.push({ r, g, b, count: 1 });
    }
    return bins
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ r, g, b }) => `rgb(${r} ${g} ${b})`);
  } catch {
    return [];
  }
}

export default function PhotoModal({ photo, onClose }: Props) {
  const [palette, setPalette] = useState<string[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!photo) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPalette([]);
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [photo, onClose]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setPalette([]);
      onClose();
    }
  };

  const handleClose = () => {
    setPalette([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {photo && (
        <m.div
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-neutral-950/80 px-4 py-8 backdrop-blur-2xl sm:px-6 sm:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={handleBackdrop}
          aria-modal="true"
          role="dialog"
          aria-label={`查看照片：${photo.title ?? "未命名"}`}
        >
          <m.div
            className={cn(
              "relative grid w-full max-w-5xl overflow-hidden",
              "rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl",
              "grid-cols-1 md:grid-cols-[1.3fr_1fr]",
              "max-h-[calc(100dvh-4rem)] md:max-h-[calc(100dvh-6rem)]"
            )}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 关闭按钮 — 遵循 aceternity 图标容器风格 */}
            <m.button
              type="button"
              onClick={handleClose}
              aria-label="关闭"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "absolute right-4 top-4 z-10 inline-flex items-center justify-center",
                "rounded-xl bg-neutral-800 p-2.5 text-neutral-400",
                "transition-colors hover:bg-neutral-700 hover:text-neutral-200",
                "shadow-lg"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </m.button>

            {/* === 左侧：大图区 === */}
            <div className="relative flex min-h-[35vh] items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-5 md:p-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt={photo.title ?? "照片"}
                className="relative max-h-[55vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl shadow-black/70 md:max-h-[calc(100dvh-12rem)]"
                crossOrigin="anonymous"
                height={photo.height}
                onLoad={(e) => {
                  const colors = extractPalette(e.currentTarget);
                  setPalette(colors);
                }}
                src={photo.src}
                width={photo.width}
              />
            </div>

            {/* === 右侧：信息卡片 === */}
            <div className="flex flex-col gap-5 overflow-y-auto border-t border-neutral-800 p-6 md:border-l md:border-t-0 md:p-7">
              {/* 标题区 */}
              <div className="space-y-2 pr-12">
                <h2 className="text-lg font-semibold text-neutral-100">
                  {photo.title ?? "未命名"}
                </h2>
                {photo.photographer && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300">
                    <User className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                    <span>{photo.photographer}</span>
                  </div>
                )}
              </div>

              {/* 元信息 chips */}
              {(photo.date || photo.location) && (
                <div className="flex flex-wrap gap-2">
                  {photo.date && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-800/50 px-3 py-1.5 text-xs text-neutral-300">
                      <Calendar className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                      {photo.date}
                    </span>
                  )}
                  {photo.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-800/50 px-3 py-1.5 text-xs text-neutral-300">
                      <MapPin className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                      {photo.location}
                    </span>
                  )}
                </div>
              )}

              {/* 描述 */}
              {photo.description && (
                <p className="text-sm leading-relaxed text-neutral-400">
                  {photo.description}
                </p>
              )}

              {/* 拍摄参数 */}
              {(photo.camera || photo.lens || photo.settings) && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-800/40 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    拍摄参数
                  </div>
                  <div className="space-y-2.5">
                    {(photo.camera || photo.lens) && (
                      <div className="flex items-start gap-3">
                        <Camera className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" aria-hidden="true" />
                        <span className="text-sm text-neutral-300">
                          {[photo.camera, photo.lens].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    )}
                    {photo.settings && (
                      <div className="flex items-start gap-3">
                        <Aperture className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" aria-hidden="true" />
                        <span className="font-mono text-sm text-neutral-300">
                          {photo.settings}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 色板 */}
              {palette.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-800/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <Palette className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>主色调</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {palette.map((color, i) => (
                      <m.button
                        key={i}
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                        title={color}
                      >
                        <span
                          className="block h-9 w-9 rounded-full border border-white/5 shadow-lg"
                          style={{ background: color, boxShadow: `0 0 16px ${color}88` }}
                        />
                      </m.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 标签 */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <Tag className="h-3.5 w-3.5 text-neutral-600" aria-hidden="true" />
                  {photo.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400",
                        "transition-colors hover:bg-neutral-700 hover:text-neutral-200"
                      )}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
