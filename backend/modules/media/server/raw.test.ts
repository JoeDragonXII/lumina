import { ExifDateTime, type Tags } from "exiftool-vendored";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { normalizeRawMetadata, orientRawPreview } from "@backend/modules/media/server/raw";

describe("normalizeRawMetadata", () => {
  it("normalizes timezone-aware dates, exposure values and signed GPS coordinates", () => {
    const metadata = normalizeRawMetadata({
      DateTimeOriginal: ExifDateTime.fromISO("2024-01-13T17:27:40.173+08:00"),
      Make: "SONY",
      Model: "ILCE-7M4",
      LensModel: "E 28-200mm F2.8-5.6 A071",
      FocalLength: "89.0 mm",
      FNumber: 4.5,
      ExposureTime: "1/40",
      ISO: 640,
      GPSLatitude: "34 deg 44' 47.76\"",
      GPSLatitudeRef: "N",
      GPSLongitude: "113 deg 37' 31.44\"",
      GPSLongitudeRef: "E",
    } as Tags);

    expect(metadata).toMatchObject({
      takenAt: "2024-01-13T17:27:40.173+08:00",
      cameraMake: "SONY",
      cameraModel: "ILCE-7M4",
      lens: "E 28-200mm F2.8-5.6 A071",
      focalLength: 89,
      aperture: 4.5,
      shutterSpeed: "1/40s",
      iso: 640,
    });
    expect(metadata.latitude).toBeCloseTo(34.7466, 6);
    expect(metadata.longitude).toBeCloseTo(113.6254, 6);
  });
});

describe("RAW preview orientation", () => {
  const pixels = Buffer.from([1, 2, 3, 4, 5, 6].flatMap(value => [value, value, value]));
  const expected = [
    [1, 2, 3, 4, 5, 6], [3, 2, 1, 6, 5, 4],
    [6, 5, 4, 3, 2, 1], [4, 5, 6, 1, 2, 3],
    [1, 4, 2, 5, 3, 6], [4, 1, 5, 2, 6, 3],
    [6, 3, 5, 2, 4, 1], [3, 6, 2, 5, 1, 4],
  ];
  async function preview(orientation?: number) {
    const image = sharp(pixels, { raw: { width: 3, height: 2, channels: 3 } });
    return (orientation ? image.withMetadata({ orientation }) : image).png().toBuffer();
  }
  it.each([1, 2, 3, 4, 5, 6, 7, 8])("applies RAW orientation %i to an untagged preview", async orientation => {
    const buffer = await orientRawPreview(await preview(), orientation);
    // The upload pipeline auto-orients again; this must not rotate twice.
    const output = await sharp(buffer).rotate().raw().toBuffer({ resolveWithObject: true });
    expect(output.info.width).toBe(orientation >= 5 ? 2 : 3);
    expect(output.info.height).toBe(orientation >= 5 ? 3 : 2);
    expect([...output.data].filter((_, i) => i % output.info.channels === 0)).toEqual(expected[orientation - 1]);
  });
  it.each([1, 6, 8])("respects a preview's own orientation %i instead of the container", async orientation => {
    const buffer = await orientRawPreview(await preview(orientation), 8);
    const output = await sharp(buffer).rotate().raw().toBuffer({ resolveWithObject: true });
    expect([...output.data].filter((_, i) => i % output.info.channels === 0)).toEqual(expected[orientation - 1]);
  });
  it("keeps untagged landscapes unchanged", async () => {
    const buffer = await preview();
    expect(await orientRawPreview(buffer)).toBe(buffer);
  });
});
