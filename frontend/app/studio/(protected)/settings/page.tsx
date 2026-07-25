import { libraryRepository } from "@backend/modules/library/server/repository";
import OperationsPanel from "@/modules/operations/components/OperationsPanel";
import { listBackups } from "@backend/modules/operations/server/backups";

export default async function StudioSettingsPage() {
  const backups = await listBackups();
  const deleted = libraryRepository.listCollections({ visibility: "all", includeDeleted: true }).filter((item) => item.deletedAt);
  return <div className="mx-auto max-w-5xl"><header className="border-b border-neutral-300 pb-7"><p className="eyebrow">Operations</p><h1 className="mt-2 text-3xl font-semibold">数据与恢复</h1><p className="mt-3 text-sm text-neutral-600">管理本地备份、回收站和资料库重置。</p></header><div className="py-9"><OperationsPanel backups={backups} deleted={deleted} /></div></div>;
}
