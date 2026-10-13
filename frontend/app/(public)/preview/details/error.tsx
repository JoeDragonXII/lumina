"use client";
import Link from "next/link";
import styles from "./page.module.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className={styles.page}><div className={styles.status}><h1>照片暂时无法加载</h1><button onClick={reset} type="button">重试</button><Link href="/map">返回地图</Link></div></main>;
}
