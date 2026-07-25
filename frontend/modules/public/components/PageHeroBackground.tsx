"use client";

import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * 通用 Aceternity 风格 Hero 背景包装器。
 * 使用 AuroraBackground 作为动态背景，可选叠加封面图片。
 */
export function PageHeroBackground({
  className,
  children,
  coverUrl,
  coverAlt = "",
  heroHeightClass = "min-h-screen",
}: {
  className?: string;
  children: ReactNode;
  coverUrl?: string | null;
  coverAlt?: string;
  heroHeightClass?: string;
}) {
  return (
    <section className={cn("page-hero-aceternity relative overflow-hidden", heroHeightClass, className)}>
      <AuroraBackground className={heroHeightClass}>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="relative h-full w-full flex flex-col items-center justify-center">
            {children}
          </div>
        </div>
      </AuroraBackground>

      {/* Optional cover image overlay at low opacity */}
      {coverUrl ? (
        <div className="pointer-events-none absolute inset-0 z-[5] opacity-[0.08]">
          <Image
            alt={coverAlt}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={coverUrl}
          />
        </div>
      ) : null}

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-32 bg-gradient-to-t from-[var(--night,#07110f)] to-transparent" />
    </section>
  );
}
