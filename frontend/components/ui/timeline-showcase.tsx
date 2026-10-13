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
      <div className="ui-timeline-line absolute left-[19px] top-2 bottom-2 w-px" />

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
            <div className="ui-surface relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              {item.icon || (
                <m.div
                  className="h-2.5 w-2.5 rounded-full bg-[var(--ui-accent)]"
                />
              )}
            </div>

            <div className="pt-1">
              <span className="mb-1 block text-xs font-medium tracking-wide text-[var(--ui-muted)] uppercase">
                {item.date}
              </span>
              <h4 className="mb-1 text-base font-semibold text-[var(--ui-ink)]">
                {item.title}
              </h4>
              <p className="text-sm leading-relaxed text-[var(--ui-muted)]">
                {item.description}
              </p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}
