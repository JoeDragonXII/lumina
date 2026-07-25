import { existsSync, readFileSync } from "fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { processPhotoUpload } from "@backend/modules/media/server/processor";
import { emptyPhotoMetadata } from "@backend/modules/media/server/metadata";
import { resolveDataPath } from "@backend/modules/media/server/storage";

describe("processPhotoUpload", () => {
  it("stores an original and three bounded web variants", async () => {
    const buffer = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "#4c6f5d" },
    })
      .png()
      .toBuffer();

    const imported = await processPhotoUpload({ name: "landscape.png", type: "image/png", buffer });
    const internal = libraryRepository.getPhotoAssetInternal(imported.asset.id)!;

    expect(imported.duplicate).toBe(false);
    expect(imported.asset.variants.map((item) => item.variant).sort()).toEqual(["display", "large", "thumb"]);
    expect(existsSync(resolveDataPath(internal.originalPath))).toBe(true);
    expect(imported.asset.variants.every((item) => item.width <= 2560 && item.height <= 2560)).toBe(true);
  });

  it("reuses duplicate files", async () => {
    const buffer = await sharp({
      create: { width: 100, height: 80, channels: 3, background: "#8a7562" },
    })
      .jpeg()
      .toBuffer();
    const first = await processPhotoUpload({ name: "first.jpg", type: "image/jpeg", buffer });
    const second = await processPhotoUpload({ name: "again.jpg", type: "image/jpeg", buffer });

    expect(second.duplicate).toBe(true);
    expect(second.asset.id).toBe(first.asset.id);
  });

  it("applies EXIF orientation before deriving dimensions", async () => {
    const buffer = await sharp({
      create: { width: 80, height: 40, channels: 3, background: "#4c586f" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const imported = await processPhotoUpload({ name: "portrait.jpg", type: "image/jpeg", buffer });

    expect(imported.asset.height).toBeGreaterThan(imported.asset.width);
  });

  it("archives a RAW original and derives display images from its preview", async () => {
    const rawBuffer = Buffer.from("simulated-sony-raw");
    const preview = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: "#5f6472" },
    })
      .jpeg()
      .toBuffer();

    const imported = await processPhotoUpload(
      { name: "sample.ARW", type: "", buffer: rawBuffer },
      {
        rawMetadataExtractor: async () => emptyPhotoMetadata(),
        rawPreviewExtractor: async (sourcePath) => {
          expect(readFileSync(sourcePath)).toEqual(rawBuffer);
          return preview;
        },
      },
    );
    const internal = libraryRepository.getPhotoAssetInternal(imported.asset.id)!;

    expect(internal.extension).toBe(".arw");
    expect(internal.mimeType).toBe("image/x-sony-arw");
    expect(readFileSync(resolveDataPath(internal.originalPath))).toEqual(rawBuffer);
    expect(imported.asset.variants).toHaveLength(3);

    const refreshed = await processPhotoUpload(
      { name: "sample.ARW", type: "", buffer: rawBuffer },
      {
        rawMetadataExtractor: async () => ({
          ...emptyPhotoMetadata(),
          takenAt: "2024-01-13T17:27:40.173+08:00",
          cameraModel: "ILCE-7M4",
          latitude: 34.7466,
          longitude: 113.6254,
        }),
      },
    );
    expect(refreshed.duplicate).toBe(true);
    expect(refreshed.asset).toMatchObject({
      takenAt: "2024-01-13T17:27:40.173+08:00",
      cameraModel: "ILCE-7M4",
      latitude: 34.7466,
      longitude: 113.6254,
    });
  });

  it("rejects corrupt input without creating an asset", async () => {
    await expect(
      processPhotoUpload({ name: "broken.jpg", type: "image/jpeg", buffer: Buffer.from("not-an-image") }),
    ).rejects.toThrow();
    expect(libraryRepository.getPhotoAssetByHash("not-an-image")).toBeNull();
  });
});
