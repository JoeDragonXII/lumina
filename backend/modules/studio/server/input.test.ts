import { describe, expect, it } from "vitest";
import { parseCollectionInput } from "@backend/modules/studio/server/input";

describe("parseCollectionInput", () => {
  it("normalizes visibility, tags and location numbers", () => {
    const input = parseCollectionInput({
      title: "东京",
      slug: "tokyo",
      category: "旅行",
      visibility: "public",
      tags: ["夜景", 123, "城市"],
      assetIds: ["a", null, "b"],
      location: {
        countryCode: "jp",
        countryName: "日本",
        displayName: "日本 · 东京",
        latitude: "35.67",
        longitude: "139.65",
        source: "exif",
        confirmed: true,
      },
    });

    expect(input.visibility).toBe("public");
    expect(input.tags).toEqual(["夜景", "城市"]);
    expect(input.assetIds).toEqual(["a", "b"]);
    expect(input.location?.countryCode).toBe("JP");
    expect(input.location?.latitude).toBe(35.67);
  });

  it("falls back to a draft for invalid visibility", () => {
    expect(parseCollectionInput({ visibility: "everyone" }).visibility).toBe("draft");
  });
});
