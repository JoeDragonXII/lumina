"use client";

import { m } from "motion/react";
import { publicMotion, revealVariant } from "@/modules/public/motion";

export default function SectionReveal({ children, className = "", delay = 0 }: Readonly<{ children: React.ReactNode; className?: string; delay?: number }>) {
  return (
    <m.div
      className={className}
      initial="hidden"
      transition={{ duration: publicMotion.duration.slow, delay, ease: publicMotion.ease }}
      variants={revealVariant}
      viewport={{ amount: 0.18, once: true }}
      whileInView="visible"
    >
      {children}
    </m.div>
  );
}
