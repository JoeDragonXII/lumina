import type { MediaVariantName } from "@backend/modules/core/types";

export function mediaUrl(assetId: string, variant: MediaVariantName = "display") {
  // Bump when regenerating derivatives so immutable browser caches refresh.
  return `/api/media/${encodeURIComponent(assetId)}/${variant}?v=3`;
}

export function mediaSrcSet(photo: {id:string; width:number; height:number}) {
  const width = (size:number) => Math.max(1,Math.round(photo.width*Math.min(1,size/Math.max(photo.width,photo.height,1))));
  const thumbWidth=width(480), displayWidth=width(1600);
  return thumbWidth===displayWidth ? `${mediaUrl(photo.id,"display")} ${displayWidth}w` : `${mediaUrl(photo.id,"thumb")} ${thumbWidth}w, ${mediaUrl(photo.id,"display")} ${displayWidth}w`;
}
