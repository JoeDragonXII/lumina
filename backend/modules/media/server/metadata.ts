import "server-only";

export interface PhotoMetadata {
  takenAt: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  latitude: number | null;
  longitude: number | null;
}

export function emptyPhotoMetadata(): PhotoMetadata {
  return {
    takenAt: null,
    cameraMake: null,
    cameraModel: null,
    lens: null,
    focalLength: null,
    aperture: null,
    shutterSpeed: null,
    iso: null,
    latitude: null,
    longitude: null,
  };
}

export function metadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function metadataNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

export function metadataDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();

  if (typeof value === "object" && "toISOString" in value) {
    const toISOString = (value as { toISOString?: () => string | null | undefined }).toISOString;
    if (typeof toISOString === "function") {
      const iso = toISOString.call(value);
      if (iso) return iso;
    }
  }

  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function metadataShutterSpeed(value: unknown) {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    return text.endsWith("s") ? text : `${text}s`;
  }
  const seconds = metadataNumber(value);
  if (!seconds || seconds <= 0) return null;
  if (seconds >= 1) return `${Number(seconds.toFixed(2))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

export function metadataCoordinate(value: unknown, reference: unknown) {
  let coordinate = typeof value === "number" && Number.isFinite(value) ? value : null;
  if (coordinate === null && typeof value === "string") {
    const parts = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (parts.length === 1) coordinate = parts[0];
    if (parts.length >= 2) {
      const sign = parts[0] < 0 ? -1 : 1;
      coordinate = sign * (Math.abs(parts[0]) + parts[1] / 60 + (parts[2] || 0) / 3600);
    }
  }
  if (coordinate === null) return null;
  const hemisphere = [reference, value]
    .filter((item): item is string => typeof item === "string")
    .join(" ")
    .trim()
    .toUpperCase();
  return /(^|\s)(S|W)(\s|$)/.test(hemisphere) && coordinate > 0 ? -coordinate : coordinate;
}
