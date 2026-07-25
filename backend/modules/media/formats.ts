export const rawPhotoFormats = {
  ".3fr": "image/x-hasselblad-3fr",
  ".arw": "image/x-sony-arw",
  ".cr2": "image/x-canon-cr2",
  ".cr3": "image/x-canon-cr3",
  ".crw": "image/x-canon-crw",
  ".dng": "image/x-adobe-dng",
  ".iiq": "image/x-phaseone-iiq",
  ".nef": "image/x-nikon-nef",
  ".nrw": "image/x-nikon-nrw",
  ".orf": "image/x-olympus-orf",
  ".pef": "image/x-pentax-pef",
  ".raf": "image/x-fuji-raf",
  ".raw": "image/x-panasonic-raw",
  ".rw2": "image/x-panasonic-rw2",
  ".sr2": "image/x-sony-sr2",
  ".srf": "image/x-sony-srf",
  ".srw": "image/x-samsung-srw",
} as const;

export type RawPhotoExtension = keyof typeof rawPhotoFormats;

export function getRawPhotoFormat(filename: string) {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return null;
  const extension = filename.slice(dot).toLowerCase() as RawPhotoExtension;
  const mimeType = rawPhotoFormats[extension];
  return mimeType ? { extension, mimeType } : null;
}

export function isRawPhotoName(filename: string) {
  return getRawPhotoFormat(filename) !== null;
}

export const studioPhotoAccept = [
  "image/jpeg",
  "image/png",
  "image/webp",
  ...Object.keys(rawPhotoFormats),
].join(",");

export const supportedUploadLabel = "JPEG、PNG、WebP 与常见 RAW（ARW、CR2、CR3、DNG、NEF、RAF 等）";
