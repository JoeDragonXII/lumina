import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { GlobalBackground } from "./GlobalBackground";
import styles from "./PhotoLibrary.module.css";

export default function PhotoLibraryShell({ title, meta, actions, children }: { title: string; meta: string; actions?: ReactNode; children: ReactNode }) {
  return <main className={styles.page} data-photo-library>
    <div className={styles.ambient} aria-hidden="true"><GlobalBackground /></div>
    <header className={styles.header}><div><Link className={styles.brand} href="/" aria-label="Lumina 首页"><Sparkles size={17} strokeWidth={1.4} />LUMINA</Link><h1>{title}</h1></div>
      <div>{actions && <div className={styles.headerActions}>{actions}</div>}<p className={styles.meta}>{meta}</p></div>
    </header>{children}
  </main>;
}
