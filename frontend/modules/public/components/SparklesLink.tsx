"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { m } from "motion/react";

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
        "relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3",
        "border border-white/20 bg-white/10 text-sm font-medium text-white",
        "shadow-[0_0_15px_rgba(99,102,241,0.15)]",
        "transition-all duration-300 hover:bg-white/20 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]",
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
          className="absolute h-1 w-1 rounded-full bg-indigo-300/70"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: dot.x, top: dot.y }}
        />
      ))}
    </>
  );
}
