import PhotoLibraryShell from "@/modules/public/components/PhotoLibraryShell";
import styles from "@/modules/public/components/PhotoLibrary.module.css";

export default function ArchiveLoading() {
  return <PhotoLibraryShell title="图集" meta="正在加载…"><section className={styles.albumGrid} aria-label="正在加载图集" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.albumCover} />)}</section></PhotoLibraryShell>;
}
