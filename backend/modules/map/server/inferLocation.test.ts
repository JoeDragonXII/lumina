import { describe, expect, it } from "vitest";
import { inferLocationFromCoordinates } from "@backend/modules/map/server/inferLocation";

describe("inferLocationFromCoordinates", () => {
  it("maps Chinese GPS coordinates to a province and nearest prefecture city", () => {
    expect(inferLocationFromCoordinates(34.7466, 113.6254)).toMatchObject({
      countryCode: "CN",
      countryName: "中国",
      regionCode: "henan",
      regionName: "河南",
      city: "郑州",
      source: "exif",
      confirmed: false,
    });
  });

  it("maps Asian coordinates to a country even when local city data is unavailable", () => {
    expect(inferLocationFromCoordinates(35.6762, 139.6503)).toMatchObject({
      countryCode: "JP",
      countryName: "日本",
      displayName: "日本",
    });
  });

  it("does not invent an Asian location for coordinates outside the supported map", () => {
    expect(inferLocationFromCoordinates(48.8566, 2.3522)).toBeNull();
  });
});
