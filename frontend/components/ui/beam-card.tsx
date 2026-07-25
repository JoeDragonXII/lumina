"use client";

import { cn } from "@/lib/utils";
import { m, useMotionTemplate, useMotionValue } from "motion/react";
import { type MouseEvent, useRef } from "react";

export function BeamCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const maskImage = useMotionTemplate`radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-6",
        "shadow-sm transition-shadow hover:shadow-lg",
        "dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      {/* Hover beam effect */}
      <m.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          background:
            "radial-gradient(400px circle, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.1) 50%, transparent 100%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
