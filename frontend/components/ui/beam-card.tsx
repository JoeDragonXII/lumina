"use client";

import { cn } from "@/lib/utils";
import { m, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { type MouseEvent, useRef } from "react";

export function BeamCard({
  className,
  children,
  beamGradient,
  contentClassName,
}: {
  className?: string;
  children: React.ReactNode;
  beamGradient?: string;
  contentClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  const handleMouseMove = (e: MouseEvent) => {
    if (reduceMotion) return;
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
        "ui-surface ui-beam-card",
        className,
      )}
    >
      {/* Hover beam effect */}
      <m.div
        className="ui-beam-light"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          background: beamGradient ??
            "radial-gradient(400px circle, rgb(195 144 89 / 0.14), rgb(141 164 157 / 0.07) 50%, transparent)",
        }}
      />
      <div className={cn("ui-beam-content", contentClassName)}>{children}</div>
    </div>
  );
}
