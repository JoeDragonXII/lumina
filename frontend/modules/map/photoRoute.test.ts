import { describe, expect, it } from "vitest";

import { buildPhotoRoute, hasValidPhotoCoordinates } from "./photoRoute";

describe("photo route", () => {
  it("accepts finite map coordinates and rejects invalid values", () => {
    expect(hasValidPhotoCoordinates({ latitude: 23.1, longitude: 113.2 })).toBe(true);
    expect(hasValidPhotoCoordinates({ latitude: null, longitude: 113.2 })).toBe(false);
    expect(hasValidPhotoCoordinates({ latitude: 86, longitude: 113.2 })).toBe(false);
    expect(hasValidPhotoCoordinates({ latitude: 23.1, longitude: 181 })).toBe(false);
    expect(hasValidPhotoCoordinates({ latitude: Number.NaN, longitude: 0 })).toBe(false);
  });

  it("orders dated photos first and falls back to collection position", () => {
    expect(buildPhotoRoute([
      { id: "undated", latitude: 3, longitude: 3, position: 0 },
      { id: "later", latitude: 2, longitude: 2, position: 2, takenAt: "2026-02-02" },
      { id: "earlier", latitude: 1, longitude: 1, position: 9, takenAt: "2026-01-01" },
    ]).map((point) => point.id)).toEqual(["earlier", "later", "undated"]);
  });

  it("filters invalid positions and removes consecutive duplicate coordinates", () => {
    expect(buildPhotoRoute([
      { id: "a", latitude: 23, longitude: 113, position: 0 },
      { id: "same", latitude: 23, longitude: 113, position: 1 },
      { id: "invalid", latitude: 91, longitude: 0, position: 2 },
      { id: "b", latitude: 24, longitude: 114, position: 3 },
    ])).toEqual([
      { id: "a", latitude: 23, longitude: 113 },
      { id: "b", latitude: 24, longitude: 114 },
    ]);
  });

  it("returns fewer than two points when a route cannot be drawn", () => {
    expect(buildPhotoRoute([])).toEqual([]);
    expect(buildPhotoRoute([
      { id: "only", latitude: 23, longitude: 113, position: 0 },
    ])).toHaveLength(1);
  });
});
