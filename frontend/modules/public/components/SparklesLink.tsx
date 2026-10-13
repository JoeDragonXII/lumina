"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";

/**
 * 带闪光效果的导航链接，外观与 SparklesButton 一致但渲染为 Next.js Link。
 */
export function SparklesLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "ui-button ui-button-secondary relative overflow-hidden px-6",
        className,
      )}
    >
      {/* Animated sparkle dots */}
      <SparkleDots />
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

function SparkleDots() {
  const reduceMotion = useReducedMotion();
  const dots = [
    { x: "10%", y: "15%", delay: 0 },
    { x: "85%", y: "20%", delay: 0.4 },
    { x: "15%", y: "75%", delay: 0.8 },
    { x: "88%", y: "72%", delay: 1.2 },
    { x: "50%", y: "10%", delay: 0.2 },
    { x: "50%", y: "82%", delay: 0.6 },
  ];

  return (
    <>
      {dots.map((dot, i) => (
        <m.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[var(--ui-accent-soft)]"
          animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0, 0.7, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 2, delay: dot.delay, ease: "easeInOut" }}
          style={{ left: dot.x, top: dot.y }}
        />
      ))}
    </>
  );
}
