"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function TimelineFilters({ children, count, className, countClassName }: { children: ReactNode; count: number; className: string; countClassName: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);
  return <details className={className} ref={ref}><summary className="ui-button ui-button-ghost"><SlidersHorizontal size={15} aria-hidden="true" />筛选{count > 0 && <span className={countClassName}>{count}</span>}</summary>{children}</details>;
}
