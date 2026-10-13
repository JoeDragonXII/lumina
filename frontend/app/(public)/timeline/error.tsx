"use client";

import { Button } from "@/components/ui/controls";
import styles from "./timeline.module.css";

export default function TimelineError({ reset }: { reset: () => void }) {
  return <main className={styles.page}><section className={styles.empty} role="alert"><h1>暂时无法加载时间线</h1><Button onClick={reset}>重试</Button></section></main>;
}
