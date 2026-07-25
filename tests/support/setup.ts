import { rmSync } from "fs";
import path from "path";
import { afterAll, beforeAll } from "vitest";

const testDataRoot = path.join(process.cwd(), ".test-data", `vitest-${process.pid}`);
process.env.PHOTO_ARCHIVE_DATA_DIR = testDataRoot;
process.env.PHOTO_ARCHIVE_BACKUP_DIR = path.join(testDataRoot, "backups");

beforeAll(() => {
  rmSync(testDataRoot, { recursive: true, force: true });
});

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
