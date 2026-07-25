import { existsSync } from "fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { processPhotoUpload } from "@backend/modules/media/server/processor";
import { resolveDataPath } from "@backend/modules/media/server/storage";
import { createBackup, listBackups, resetArchive, restoreBackup } from "@backend/modules/operations/server/backups";

describe("archive backups", () => {
  it("backs up, clears and restores database records with media", async () => {
    const buffer = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#5b6f63" } }).jpeg().toBuffer();
    const imported = await processPhotoUpload({ name: "backup.jpg", type: "image/jpeg", buffer });
    libraryRepository.createCollection({ title: "备份测试图集", slug: "backup-test-album", category: "日常", visibility: "public", assetIds: [imported.asset.id] });
    const internal = libraryRepository.getPhotoAssetInternal(imported.asset.id)!;
    const manual = await createBackup("manual");

    expect((await listBackups()).some((item) => item.id === manual.id)).toBe(true);
    expect(existsSync(resolveDataPath(internal.originalPath))).toBe(true);

    await resetArchive();
    expect(libraryRepository.listCollections()).toHaveLength(0);
    expect(existsSync(resolveDataPath(internal.originalPath))).toBe(false);

    const restored = await restoreBackup(manual.id);
    expect(restored).toBeGreaterThan(0);
    expect(libraryRepository.getCollectionBySlug("backup-test-album")?.title).toBe("备份测试图集");
    expect(existsSync(resolveDataPath(internal.originalPath))).toBe(true);
  });
});
