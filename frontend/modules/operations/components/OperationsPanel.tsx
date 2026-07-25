"use client";

import { useState } from "react";
import { Archive, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CollectionRecord } from "@backend/modules/library/types";
import type { ArchiveBackup } from "@backend/modules/operations/server/backups";

const reasonLabel = { manual: "手动备份", reset: "清空前备份", "before-restore": "恢复前备份" } as const;

export default function OperationsPanel({ backups, deleted }: Readonly<{ backups: ArchiveBackup[]; deleted: CollectionRecord[] }>) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function operate(action: "backup" | "reset" | "restore", backupId?: string) {
    if (action === "restore" && !window.confirm("用这个恢复点替换当前资料库？当前状态会先自动备份。")) return;
    setBusy(action + (backupId || ""));
    setMessage("");
    const response = await fetch("/api/studio/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, backupId, confirmation }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; restored?: number; cleared?: boolean } | null;
    setBusy("");
    setMessage(response.ok ? (action === "backup" ? "备份已创建。" : action === "reset" ? "资料库已清空，可从恢复点找回。" : `已恢复 ${payload?.restored || 0} 个图集。`) : payload?.error || "操作失败。");
    if (response.ok) { setConfirmation(""); router.refresh(); }
  }

  async function restoreCollection(id: string) {
    const response = await fetch(`/api/studio/collections/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore" }) });
    if (response.ok) router.refresh();
  }

  return <div className="space-y-12">
    <section className="border-t border-neutral-300 pt-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold">本地备份</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">备份包含 SQLite 内容库和全部照片文件，保存在项目外观不可见的本地恢复目录。</p></div><button className="inline-flex items-center gap-2 border border-neutral-900 px-4 py-2.5 text-sm font-semibold disabled:opacity-50" disabled={Boolean(busy)} onClick={() => operate("backup")} type="button"><Archive className="h-4 w-4" />创建备份</button></div>
      {backups.length > 0 ? <div className="mt-6 divide-y divide-neutral-300 border-y border-neutral-300">{backups.map((backup) => <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={backup.id}><div><p className="text-sm font-semibold">{new Date(backup.createdAt).toLocaleString("zh-CN")}</p><p className="mt-1 text-xs text-neutral-500">{reasonLabel[backup.reason]} · {backup.collectionCount} 个图集</p></div><button className="inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-50" disabled={Boolean(busy)} onClick={() => operate("restore", backup.id)} type="button"><RefreshCcw className="h-4 w-4" />恢复</button></div>)}</div> : <p className="mt-5 text-sm text-neutral-500">还没有恢复点。</p>}
    </section>
    <section className="border-t border-neutral-300 pt-6"><h2 className="text-lg font-semibold">回收站</h2>{deleted.length > 0 ? <div className="mt-5 divide-y divide-neutral-300 border-y border-neutral-300">{deleted.map((item) => <div className="flex items-center justify-between py-4" key={item.id}><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-neutral-500">{item.deletedAt ? new Date(item.deletedAt).toLocaleString("zh-CN") : ""}</p></div><button aria-label={`恢复 ${item.title}`} className="icon-button" onClick={() => restoreCollection(item.id)} title="恢复图集" type="button"><RotateCcw className="h-4 w-4" /></button></div>)}</div> : <p className="mt-5 text-sm text-neutral-500">回收站为空。</p>}</section>
    <section className="border-t border-red-300 pt-6"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 h-5 w-5 text-red-700" /><div><h2 className="text-lg font-semibold">清空全部数据</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">执行前会自动创建恢复点。输入“清空全部数据”后才能继续。</p></div></div><div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row"><input className="form-input mt-0" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="清空全部数据" /><button className="shrink-0 bg-red-800 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={confirmation !== "清空全部数据" || Boolean(busy)} onClick={() => operate("reset")} type="button">清空并建立恢复点</button></div></section>
    {message ? <p className="border-l-2 border-neutral-900 pl-3 text-sm" role="status">{message}</p> : null}
  </div>;
}
