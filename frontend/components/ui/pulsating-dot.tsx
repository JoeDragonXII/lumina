"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

export function PulsatingDot({
  className,
  color = "bg-emerald-500",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <m.span
        animate={{ scale: [1, 1.8, 1], opacity: [1, 0.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inset-0 rounded-full", color)}
      />
      <span className={cn("relative h-full w-full rounded-full", color)} />
    </span>
  );
}
