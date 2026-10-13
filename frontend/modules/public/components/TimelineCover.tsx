"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

export default function TimelineCover({ src, srcSet, priority = false }: { src: string | null; srcSet?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="flex h-full flex-col items-center justify-center gap-3 text-xs text-[var(--ui-muted)]"><ImageOff size={24} strokeWidth={1.3} aria-hidden="true" />{src ? "封面暂不可用" : "暂无照片"}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className="absolute inset-0 h-full w-full" src={src} srcSet={srcSet} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : "auto"} sizes="(max-width: 599px) calc(100vw - 56px), (max-width: 1100px) 40vw, 27vw" onError={() => setFailed(true)} />;
}
