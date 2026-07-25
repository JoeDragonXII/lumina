import { ExifDateTime, type Tags } from "exiftool-vendored";
import { describe, expect, it } from "vitest";
import { normalizeRawMetadata } from "@backend/modules/media/server/raw";

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
