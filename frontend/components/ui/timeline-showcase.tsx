"use client";

import { cn } from "@/lib/utils";
import { m } from "motion/react";

type TimelineItem = {
  date: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function TimelineShowcase({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />

      <div className="flex flex-col gap-8">
        {items.map((item, idx) => (
          <m.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: idx * 0.15, duration: 0.5 }}
            className="relative flex gap-6"
          >
            {/* Dot on the line */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
              {item.icon || (
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                />
              )}
            </div>

            <div className="pt-1">
              <span className="mb-1 block text-xs font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
                {item.date}
              </span>
              <h4 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {item.title}
              </h4>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {item.description}
              </p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}
