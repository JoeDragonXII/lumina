"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, domAnimation, LazyMotion, m, MotionConfig, useScroll, useSpring } from "motion/react";
import { publicMotion } from "@/modules/public/motion";
import { BackgroundProvider } from "./BackgroundContext";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function reducedMotionServerSnapshot() {
  return false;
}

export default function PublicExperienceShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, reducedMotionServerSnapshot);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.24 });

  return (
    <BackgroundProvider>
      <MotionConfig reducedMotion="user" transition={{ ease: publicMotion.ease }}>
        <LazyMotion features={domAnimation} strict>
          <div className="public-experience" data-reduced-motion={reducedMotion ? "true" : "false"}>
            <m.div aria-hidden="true" className="site-scroll-progress" style={{ scaleX: smoothProgress }} />
            <AnimatePresence initial={false} mode="wait">
              <m.div
                animate={{ opacity: 1, y: 0 }}
                className="public-route-frame"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 12 }}
                key={pathname}
                transition={{ duration: publicMotion.duration.base }}
              >
                {children}
              </m.div>
            </AnimatePresence>
          </div>
        </LazyMotion>
      </MotionConfig>
    </BackgroundProvider>
  );
}
