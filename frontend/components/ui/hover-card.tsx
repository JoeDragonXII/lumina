"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";
import { useState } from "react";

export function HoverCard({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <m.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-6",
        "shadow-sm transition-shadow hover:shadow-xl hover:shadow-neutral-200/50",
        "dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-neutral-900/50",
        className,
      )}
    >
      {/* Gradient overlay on hover */}
      <m.div
        animate={{ opacity: hovered ? 1 : 0 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
      />

      <div className="relative z-10">
        {icon && (
          <m.div
            animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
            className="mb-4 inline-flex rounded-xl bg-neutral-100 p-3 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {icon}
          </m.div>
        )}
        <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>
        {children}
      </div>
    </m.div>
  );
}
