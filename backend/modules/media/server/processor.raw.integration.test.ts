import { existsSync, readFileSync, statSync } from "fs";
import { basename } from "path";
import { createHash } from "crypto";
import { expect, it } from "vitest";
import { processPhotoUpload } from "@backend/modules/media/server/processor";

const samples = [
  {
    path: "Z:\\Photo_Database\\M6\\2020\\2020-11-08\\20201108-10-101.CR2",
    camera: "Canon EOS M6",
    takenAt: "2020-11-08T10:02:36",
    lens: "EF-M15-45mm f/3.5-6.3 IS STM",
    shutterSpeed: "1/30s",
  },
  {
    path: "Z:\\Photo_Database\\2024\\2024_A7M4\\2024-01-13\\DSC01990.ARW",
    camera: "ILCE-7M4",
    takenAt: "2024-01-13T17:27:40",
    lens: "E 28-200mm F2.8-5.6 A071",
    shutterSpeed: "1/40s",
  },
];

it.runIf(samples.every((sample) => existsSync(sample.path)))(
  "imports real CR2 and ARW samples without modifying their sources",
  async () => {
    for (const sample of samples) {
      const beforeStat = statSync(sample.path);
      const sourceBuffer = readFileSync(sample.path);
      const beforeHash = createHash("sha256").update(sourceBuffer).digest("hex");
      const imported = await processPhotoUpload({
        name: basename(sample.path),
        type: "",
        buffer: sourceBuffer,
      });

      expect(imported.asset.cameraModel).toBe(sample.camera);
      expect(imported.asset.takenAt).toMatch(new RegExp(`^${sample.takenAt}`));
      expect(imported.asset.lens).toBe(sample.lens);
      expect(imported.asset.shutterSpeed).toBe(sample.shutterSpeed);
      expect(imported.asset.latitude).toBeNull();
      expect(imported.asset.longitude).toBeNull();
      expect(imported.asset.variants.map((variant) => variant.variant).sort()).toEqual(["display", "large", "thumb"]);
      const afterStat = statSync(sample.path);
      const afterHash = createHash("sha256").update(readFileSync(sample.path)).digest("hex");
      expect(afterHash).toBe(beforeHash);
      expect(afterStat.size).toBe(beforeStat.size);
      expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
    }
  },
  120_000,
);
