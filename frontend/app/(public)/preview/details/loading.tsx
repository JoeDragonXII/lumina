import styles from "./page.module.css";
export default function Loading() {
  return <main className={styles.page}><p role="status" className={styles.status}>正在展开照片…</p></main>;
}
