import "server-only";

import { createHash, randomUUID } from "crypto";
import path from "path";
import exifr from "exifr";
import sharp from "sharp";
import { libraryRepository } from "@backend/modules/library/server/repository";
import type { MediaVariantName } from "@backend/modules/core/types";
import type { ImportedPhoto } from "@backend/modules/media/types";
import { getRawPhotoFormat } from "@backend/modules/media/formats";
import {
  metadataCoordinate,
  metadataDate,
  metadataNumber,
  metadataShutterSpeed,
  metadataText,
  type PhotoMetadata,
} from "@backend/modules/media/server/metadata";
import {
  getDerivedRoot,
  getOriginalsRoot,
  removeStoredAsset,
  resolveDataPath,
  toDataRelativePath,
  writeStoredFile,
} from "@backend/modules/media/server/storage";

const variants: Array<{ name: MediaVariantName; size: number; quality: number }> = [
  { name: "thumb", size: 480, quality: 78 },
  { name: "display", size: 1600, quality: 84 },
  { name: "large", size: 2560, quality: 88 },
];

const acceptedRenderedFormats = new Map([
  ["jpeg", { extension: ".jpg", mimeType: "image/jpeg" }],
  ["png", { extension: ".png", mimeType: "image/png" }],
  ["webp", { extension: ".webp", mimeType: "image/webp" }],
]);

type ExifData = {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  Make?: string;
  Model?: string;
  LensModel?: string;
  Lens?: string;
  FocalLength?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  latitude?: number;
  longitude?: number;
};

async function extractRenderedMetadata(buffer: Buffer): Promise<PhotoMetadata> {
  const exif = ((await exifr.parse(buffer, {
    tiff: true,
    exif: true,
    gps: true,
    reviveValues: true,
    translateValues: false,
  }).catch(() => null)) || {}) as ExifData;

  return {
    takenAt: metadataDate(exif.DateTimeOriginal || exif.CreateDate),
    cameraMake: metadataText(exif.Make),
    cameraModel: metadataText(exif.Model),
    lens: metadataText(exif.LensModel || exif.Lens),
    focalLength: metadataNumber(exif.FocalLength),
    aperture: metadataNumber(exif.FNumber),
    shutterSpeed: metadataShutterSpeed(exif.ExposureTime),
    iso: metadataNumber(exif.ISO),
    latitude: metadataCoordinate(exif.latitude, null),
    longitude: metadataCoordinate(exif.longitude, null),
  };
}

export async function processPhotoUpload(input: {
  name: string;
  type: string;
  buffer: Buffer;
}, options: {
  rawPreviewExtractor?: (sourcePath: string) => Promise<Buffer>;
  rawMetadataExtractor?: (sourcePath: string) => Promise<PhotoMetadata>;
} = {}): Promise<ImportedPhoto> {
  if (input.buffer.length === 0) throw new Error("照片文件为空。");

  const sha256 = createHash("sha256").update(input.buffer).digest("hex");
  const rawFormat = getRawPhotoFormat(input.name);
  const duplicate = libraryRepository.getPhotoAssetByHash(sha256);
  if (duplicate) {
    if (rawFormat) {
      const internal = libraryRepository.getPhotoAssetInternal(duplicate.id);
      if (internal) {
        try {
          const rawTools = await import("@backend/modules/media/server/raw");
          const metadata = await (options.rawMetadataExtractor || rawTools.extractRawMetadata)(
            resolveDataPath(internal.originalPath),
          );
          const refreshed = libraryRepository.updatePhotoAssetMetadata(duplicate.id, metadata);
          if (refreshed) return { asset: refreshed, duplicate: true };
        } catch {
          // Reusing a valid existing asset is preferable to failing on optional metadata refresh.
        }
      }
    }
    return { asset: duplicate, duplicate: true };
  }

  let format: { extension: string; mimeType: string } | null = rawFormat;
  if (!format) {
    const metadata = await sharp(input.buffer, { failOn: "error" }).metadata();
    format = metadata.format ? acceptedRenderedFormats.get(metadata.format) || null : null;
  }
  if (!format) throw new Error("仅支持 JPEG、PNG、WebP 与常见 RAW 照片。");

  const id = randomUUID();
  const originalAbsolutePath = path.join(getOriginalsRoot(), `${id}${format.extension}`);
  const derivedDirectory = path.join(getDerivedRoot(), id);

  try {
    await writeStoredFile(originalAbsolutePath, input.buffer);
    const rawTools = rawFormat ? await import("@backend/modules/media/server/raw") : null;
    const metadata = rawTools
      ? await (options.rawMetadataExtractor || rawTools.extractRawMetadata)(originalAbsolutePath)
      : await extractRenderedMetadata(input.buffer);
    let renderBuffer = input.buffer;
    if (rawFormat) {
      const rawPreviewExtractor = options.rawPreviewExtractor || rawTools!.extractRawPreview;
      renderBuffer = await rawPreviewExtractor(originalAbsolutePath);
    }

    const generated = [];
    for (const variant of variants) {
      const output = await sharp(renderBuffer, { failOn: "error" })
        .rotate()
        .resize({ width: variant.size, height: variant.size, fit: "inside", withoutEnlargement: true })
        .webp({ quality: variant.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      const absolutePath = path.join(derivedDirectory, `${variant.name}.webp`);
      await writeStoredFile(absolutePath, output.data);
      generated.push({
        variant: variant.name,
        relativePath: toDataRelativePath(absolutePath),
        width: output.info.width,
        height: output.info.height,
        mimeType: "image/webp",
        bytes: output.info.size,
      });
    }

    const largest = generated.at(-1)!;
    const asset = libraryRepository.createPhotoAsset(
      {
        id,
        sha256,
        originalName: input.name,
        mimeType: format.mimeType,
        extension: format.extension,
        originalPath: toDataRelativePath(originalAbsolutePath),
        width: largest.width,
        height: largest.height,
        ...metadata,
        iso: metadata.iso === null ? null : Math.round(metadata.iso),
        createdAt: new Date().toISOString(),
      },
      generated,
    );

    if (!asset) throw new Error("照片元数据保存失败。");
    return { asset, duplicate: false };
  } catch (error) {
    await removeStoredAsset(id, originalAbsolutePath);
    throw error;
  }
}

export const browserPhotoImportSource = {
  id: "browser-upload",
  label: "浏览器上传",
  async import(files: Array<{ name: string; type: string; buffer: Buffer }>) {
    const results: ImportedPhoto[] = [];
    for (const file of files) results.push(await processPhotoUpload(file));
    return results;
  },
};
