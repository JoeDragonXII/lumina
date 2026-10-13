import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll } from "vitest";

const testDataRoot = mkdtempSync(path.join(tmpdir(), "lumina-vitest-"));
process.env.PHOTO_ARCHIVE_DATA_DIR = testDataRoot;
process.env.PHOTO_ARCHIVE_DB_PATH = path.join(testDataRoot, "library.sqlite");
process.env.PHOTO_ARCHIVE_BACKUP_DIR = path.join(testDataRoot, "backups");

afterAll(async () => {
  const rawGlobal = globalThis as typeof globalThis & { __photoArchiveRawExifTool?: unknown };
  if (rawGlobal.__photoArchiveRawExifTool) {
    const { closeRawPreviewExtractor } = await import("@backend/modules/media/server/raw");
    await closeRawPreviewExtractor();
  }
  const { closeDatabases } = await import("@backend/modules/library/server/database");
  closeDatabases();
  rmSync(testDataRoot, { recursive: true, force: true });
});
