import styles from "./timeline.module.css";

export default function TimelineLoading() {
  return <main className={styles.page} aria-busy="true" aria-label="时间线加载中">
    <header className={styles.header}><div className={styles.heading}><h1>时间线</h1></div><p role="status" className={styles.total}>正在加载图集…</p></header>
    <div className={styles.grid} aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.skeleton} />)}</div>
  </main>;
}
