"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

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
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-6",
            "shadow-sm transition-shadow hover:shadow-xl hover:shadow-neutral-200/50",
            "dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-neutral-900/50",
          )}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative z-10">
            <m.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {feature.icon}
            </m.div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {feature.description}
            </p>
          </div>
        </m.div>
      ))}
    </div>
  );
}
