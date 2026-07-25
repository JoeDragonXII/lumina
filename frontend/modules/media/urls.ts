import type { MediaVariantName } from "@backend/modules/core/types";

export function mediaUrl(assetId: string, variant: MediaVariantName = "display") {
  return `/api/media/${encodeURIComponent(assetId)}/${variant}`;
}
