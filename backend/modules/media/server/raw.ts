import "server-only";

import sharp from "sharp";
import { ExifTool, type Tags } from "exiftool-vendored";
import {
  metadataCoordinate,
  metadataDate,
  metadataNumber,
  metadataShutterSpeed,
  metadataText,
  type PhotoMetadata,
} from "@backend/modules/media/server/metadata";

declare global {
  var __photoArchiveRawExifTool: ExifTool | undefined;
}

type PreviewCandidate = {
  buffer: Buffer;
  pixels: number;
};

function getRawExifTool() {
  globalThis.__photoArchiveRawExifTool ||= new ExifTool({ maxProcs: 1 });
  return globalThis.__photoArchiveRawExifTool;
}

export function normalizeRawMetadata(tags: Tags): PhotoMetadata {
  return {
    takenAt: metadataDate(tags.SubSecDateTimeOriginal || tags.DateTimeOriginal || tags.CreateDate),
    cameraMake: metadataText(tags.Make),
    cameraModel: metadataText(tags.Model),
    lens: metadataText(tags.LensModel || tags.LensID || tags.Lens),
    focalLength: metadataNumber(tags.FocalLength),
    aperture: metadataNumber(tags.FNumber || tags.Aperture),
    shutterSpeed: metadataShutterSpeed(tags.ExposureTime || tags.ShutterSpeed),
    iso: metadataNumber(tags.ISO),
    latitude: metadataCoordinate(tags.GPSLatitude, tags.GPSLatitudeRef),
    longitude: metadataCoordinate(tags.GPSLongitude, tags.GPSLongitudeRef),
  };
}

export async function extractRawMetadata(sourcePath: string) {
  return normalizeRawMetadata(await getRawExifTool().read(sourcePath));
}

async function inspectPreview(buffer: Buffer): Promise<PreviewCandidate | null> {
  try {
    const metadata = await sharp(buffer, { failOn: "error" }).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { buffer, pixels: metadata.width * metadata.height };
  } catch {
    return null;
  }
}

export async function extractRawPreview(sourcePath: string) {
  const tool = getRawExifTool();
  const extracted = await Promise.all(
    (["JpgFromRaw", "PreviewImage"] as const).map(async (tag) => {
      try {
        return await inspectPreview(await tool.extractBinaryTagToBuffer(tag, sourcePath));
      } catch {
        return null;
      }
    }),
  );
  const candidates = extracted.filter((candidate): candidate is PreviewCandidate => candidate !== null);

  if (candidates.length === 0) {
    try {
      const decoded = await sharp(sourcePath, { failOn: "error" }).rotate().jpeg({ quality: 95 }).toBuffer();
      const candidate = await inspectPreview(decoded);
      if (candidate) candidates.push(candidate);
    } catch {
      // The RAW may be valid but unsupported by the locally bundled libvips.
    }
  }

  const largest = candidates.sort((left, right) => right.pixels - left.pixels)[0];
  if (!largest) throw new Error("无法从 RAW 原件提取可显示的预览图。");
  return largest.buffer;
}

export async function closeRawPreviewExtractor() {
  const tool = globalThis.__photoArchiveRawExifTool;
  globalThis.__photoArchiveRawExifTool = undefined;
  if (tool) await tool.end();
}
