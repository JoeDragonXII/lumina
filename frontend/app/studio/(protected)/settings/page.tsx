import { libraryRepository } from "@backend/modules/library/server/repository";
import OperationsPanel from "@/modules/operations/components/OperationsPanel";
import { listBackups } from "@backend/modules/operations/server/backups";
import styles from "@/modules/studio/components/studio-paper.module.css";

export default async function StudioSettingsPage() {
  const backups = await listBackups();
  const deleted = libraryRepository.listCollections({ visibility: "all", includeDeleted: true }).filter((item) => item.deletedAt);
  return <div className={styles.settings}><header className={styles.header}><div><h1>数据与恢复</h1><p>本地备份 · 回收站</p></div></header><OperationsPanel backups={backups} deleted={deleted} /></div>;
}
