import { describe, expect, it } from "vitest";
import { shouldShowPublicIntro } from "@/modules/public/experience";
import { getPublicSceneId } from "@/modules/public/navigation";

describe("public experience routing", () => {
  it("maps nested public routes to the correct scene", () => {
    expect(getPublicSceneId("/")).toBe("home");
    expect(getPublicSceneId("/works/night-walk")).toBe("works");
    expect(getPublicSceneId("/timeline?year=2026")).toBe("timeline");
    expect(getPublicSceneId("/map/china/henan")).toBe("map");
    expect(getPublicSceneId("/province/henan")).toBe("map");
  });

  it("shows the intro once per home-page session", () => {
    expect(shouldShowPublicIntro("/", null)).toBe(true);
    expect(shouldShowPublicIntro("/", "1")).toBe(false);
    expect(shouldShowPublicIntro("/works", null)).toBe(false);
  });
});
