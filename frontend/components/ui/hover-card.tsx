"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";
import { useState } from "react";
import { BeamCard } from "./beam-card";

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
    <BeamCard className={cn("p-6", className)}><m.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      {/* Gradient overlay on hover */}
      <m.div
        animate={{ opacity: hovered ? 1 : 0 }}
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative z-10">
        {icon && (
          <m.div
            animate={{ scale: hovered ? 1.04 : 1 }}
            className="ui-feature-icon mb-4 inline-flex rounded-xl p-3"
          >
            {icon}
          </m.div>
        )}
        <h3 className="mb-2 text-lg font-semibold text-[var(--ui-ink)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--ui-muted)]">{description}</p>
        {children}
      </div>
    </m.div></BeamCard>
  );
}
