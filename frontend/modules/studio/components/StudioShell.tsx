"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { BackgroundProvider } from "@/modules/public/components/BackgroundContext";
import { GlobalBackground } from "@/modules/public/components/GlobalBackground";
import PageAppearanceControl from "@/modules/public/components/PageAppearanceControl";
import StudioNav from "./StudioNav";
import styles from "./studio-paper.module.css";

export default function StudioShell({ children, showLogout }: { children: ReactNode; showLogout: boolean }) {
  return <BackgroundProvider>
    <div className={`studio-theme ${styles.shell}`}>
      <div className={styles.ambient} aria-hidden="true"><GlobalBackground /></div>
      <a className={styles.skipLink} href="#studio-content">跳至内容</a>
      <StudioNav showLogout={showLogout} />
      <div className={styles.workspace}>
        <div className={styles.masthead}>
          <Link className={styles.brand} href="/" aria-label="Lumina 首页"><Sparkles size={17} strokeWidth={1.4} />LUMINA</Link>
          <span className={styles.workspaceLabel}>STUDIO</span>
        </div>
        <main id="studio-content" tabIndex={-1}>{children}</main>
      </div>
      <PageAppearanceControl />
    </div>
  </BackgroundProvider>;
}
