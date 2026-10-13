"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";
import { HoverCard } from "./hover-card";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function GridFeatures({
  features,
  className,
}: {
  features: Feature[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {features.map((feature, idx) => (
        <m.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
          className="min-w-0"
        >
          <HoverCard {...feature} className="h-full" />
        </m.div>
      ))}
    </div>
  );
}
