import "server-only";

import path from "path";
import { access, cp, mkdir, readFile, readdir, rename, rm, writeFile } from "fs/promises";
import Database from "better-sqlite3";
import { getDatabase, getDataRoot } from "@backend/modules/library/server/database";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { getMediaRoot } from "@backend/modules/media/server/storage";

export interface ArchiveBackup {
  id: string;
  createdAt: string;
  reason: "manual" | "reset" | "before-restore";
  collectionCount: number;
}

const tables = ["locations", "photo_assets", "photo_variants", "collections", "collection_photos", "tags", "collection_tags"] as const;
const deleteOrder = [...tables].reverse();

export function getBackupRoot() {
  if (process.env.PHOTO_ARCHIVE_BACKUP_DIR) {
    return path.resolve(/* turbopackIgnore: true */ process.env.PHOTO_ARCHIVE_BACKUP_DIR);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".local-backups");
}

function safeBackupId(id: string) {
  if (!/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(id)) throw new Error("恢复点标识无效。");
  return id;
}

async function exists(value: string) {
  try { await access(value); return true; } catch { return false; }
}

async function writeManifest(directory: string, manifest: ArchiveBackup) {
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export async function createBackup(reason: ArchiveBackup["reason"] = "manual", moveMedia = false) {
  const createdAt = new Date().toISOString();
  const id = `backup-${createdAt.replace(/[:.]/g, "-")}`;
  const directory = path.join(getBackupRoot(), /* turbopackIgnore: true */ id);
  const mediaDestination = path.join(directory, "media");
  await mkdir(directory, { recursive: true });

  const { client } = getDatabase();
  await client.backup(path.join(directory, "library.sqlite"));
  const mediaRoot = getMediaRoot();
  if (await exists(mediaRoot)) {
    if (moveMedia) await rename(mediaRoot, mediaDestination);
    else await cp(mediaRoot, mediaDestination, { recursive: true });
  }

  const manifest: ArchiveBackup = {
    id,
    createdAt,
    reason,
    collectionCount: libraryRepository.listCollections({ visibility: "all", includeDeleted: true }).length,
  };
  await writeManifest(directory, manifest);
  return manifest;
}

export async function listBackups() {
  const root = getBackupRoot();
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const backups: ArchiveBackup[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("backup-")) continue;
    try {
      const manifest = JSON.parse(
        await readFile(path.join(root, /* turbopackIgnore: true */ entry.name, "manifest.json"), "utf8"),
      ) as ArchiveBackup;
      if (manifest.id === entry.name) backups.push(manifest);
    } catch {
      // Ignore incomplete restore points.
    }
  }
  return backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function resetArchive() {
  const backup = await createBackup("reset", true);
  libraryRepository.clearContent();
  await mkdir(getDataRoot(), { recursive: true });
  return backup;
}

function copyDatabaseRows(sourcePath: string) {
  const source = new Database(sourcePath, { readonly: true });
  const { client } = getDatabase();
  try {
    client.pragma("foreign_keys = OFF");
    client.transaction(() => {
      for (const table of deleteOrder) client.prepare(`DELETE FROM ${table}`).run();
      for (const table of tables) {
        const rows = source.prepare(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>;
        for (const row of rows) {
          const columns = Object.keys(row);
          const names = columns.map((column) => `\"${column}\"`).join(", ");
          const parameters = columns.map((column) => `@${column}`).join(", ");
          client.prepare(`INSERT INTO ${table} (${names}) VALUES (${parameters})`).run(row);
        }
      }
    })();
  } finally {
    client.pragma("foreign_keys = ON");
    source.close();
  }
}

export async function restoreBackup(id: string) {
  const backupId = safeBackupId(id);
  const directory = path.join(getBackupRoot(), /* turbopackIgnore: true */ backupId);
  const databasePath = path.join(directory, "library.sqlite");
  if (!(await exists(databasePath))) throw new Error("恢复点不存在或不完整。");

  await createBackup("before-restore");
  copyDatabaseRows(databasePath);

  const mediaRoot = getMediaRoot();
  await rm(mediaRoot, { recursive: true, force: true });
  const backupMedia = path.join(directory, "media");
  if (await exists(backupMedia)) await cp(backupMedia, mediaRoot, { recursive: true });
  return libraryRepository.listCollections({ visibility: "all" }).length;
}
