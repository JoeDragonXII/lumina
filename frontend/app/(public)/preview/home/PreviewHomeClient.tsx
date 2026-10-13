"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowLeft, Images, MapPin } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BeamCard } from "@/components/ui/beam-card";
import { TextGenerate } from "@/components/ui/text-generate";
import MasonryFlowWall, {
  type FlowPhoto,
} from "@/modules/public/components/MasonryFlowWall";
import styles from "./page.module.css";

type PreviewHomeClientProps = {
  photos: FlowPhoto[];
  collectionCount: number;
};

export default function PreviewHomeClient({
  photos,
  collectionCount,
}: Readonly<PreviewHomeClientProps>) {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className={styles.shell}
      data-theme="dark"
      onPointerMove={(event) => {
        event.currentTarget.style.setProperty("--pointer-x", `${event.clientX}px`);
        event.currentTarget.style.setProperty("--pointer-y", `${event.clientY}px`);
      }}
    >
      <AuroraBackground className={styles.aurora}>
        <div className={styles.pointerLight} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.previewBar}>
          <Link className={styles.brand} href="/" aria-label="返回正式首页">
            <ArrowLeft aria-hidden="true" size={15} />
            <span>LUMINA</span>
          </Link>
          <span className={styles.previewTag}>HOME / STUDY 01</span>
        </header>

        <section className={styles.stage}>
          <div className={styles.copy}>
            <m.p
              className={styles.kicker}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65 }}
            >
              PHOTOGRAPHIC ARCHIVE
            </m.p>

            <h1 className={styles.title}>
              <TextGenerate words="光， 在时间里 停留。" delay={0.18} />
            </h1>

            <m.p
              className={styles.subtitle}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              从影像进入记忆。
            </m.p>

            <m.div
              className={styles.portals}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.82, duration: 0.7 }}
            >
              <Link href="/archive" className={styles.portalLink}>
                <BeamCard className={styles.portal}>
                  <span className={styles.portalIcon}>
                    <Images aria-hidden="true" size={17} />
                  </span>
                  <span>
                    <strong>图集</strong>
                    <small>{collectionCount || "—"}</small>
                  </span>
                  <ArrowDownRight aria-hidden="true" size={16} />
                </BeamCard>
              </Link>

              <Link href="/map" className={styles.portalLink}>
                <BeamCard className={styles.portal}>
                  <span className={styles.portalIcon}>
                    <MapPin aria-hidden="true" size={17} />
                  </span>
                  <span>
                    <strong>地图</strong>
                    <small>EXPLORE</small>
                  </span>
                  <ArrowDownRight aria-hidden="true" size={16} />
                </BeamCard>
              </Link>
            </m.div>
          </div>

          <m.div
            className={styles.flowStage}
            initial={reduceMotion ? false : { opacity: 0, x: 40, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className={styles.flowHalo} aria-hidden="true" />
            <div className={styles.flowViewport}>
              <MasonryFlowWall photos={photos} />
            </div>
          </m.div>
        </section>

        <div className={styles.edgeLabel} aria-hidden="true">
          2026 · PERSONAL ARCHIVE
        </div>
      </AuroraBackground>
    </main>
  );
}
