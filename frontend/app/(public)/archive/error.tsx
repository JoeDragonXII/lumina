"use client";

import { Button } from "@/components/ui/controls";
import styles from "@/modules/public/components/PhotoLibrary.module.css";

export default function ArchiveError({ reset }: { reset: () => void }) {
  return <main className={styles.page}><section className={styles.empty} role="alert"><h1>暂时无法加载图集</h1><Button onClick={reset}>重试</Button></section></main>;
}
