"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

export default function UIProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig>;
}
