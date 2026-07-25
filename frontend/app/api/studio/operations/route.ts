import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession, requireSameOrigin } from "@backend/lib/server/auth";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { createBackup, listBackups, resetArchive, restoreBackup } from "@backend/modules/operations/server/backups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  return NextResponse.json({
    backups: await listBackups(),
    deleted: libraryRepository.listCollections({ visibility: "all", includeDeleted: true }).filter((item) => item.deletedAt),
  });
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const payload = (await request.json().catch(() => null)) as { action?: unknown; confirmation?: unknown; backupId?: unknown } | null;

  try {
    if (payload?.action === "backup") return NextResponse.json({ backup: await createBackup("manual") });
    if (payload?.action === "reset") {
      if (payload.confirmation !== "清空全部数据") return NextResponse.json({ error: "请输入完整确认文字。" }, { status: 400 });
      return NextResponse.json({ backup: await resetArchive(), cleared: true });
    }
    if (payload?.action === "restore" && typeof payload.backupId === "string") {
      return NextResponse.json({ restored: await restoreBackup(payload.backupId) });
    }
    return NextResponse.json({ error: "未知操作。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败。" }, { status: 400 });
  }
}
