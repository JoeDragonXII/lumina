"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

export function SparklesButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <m.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3",
        "bg-neutral-900 font-medium text-white shadow-lg",
        "transition-shadow hover:shadow-xl hover:shadow-neutral-900/20",
        "dark:bg-white dark:text-neutral-900 dark:hover:shadow-white/20",
        className,
      )}
    >
      {/* Sparkle effect */}
      <m.span
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
        className="absolute inset-y-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {children}
    </m.button>
  );
}
