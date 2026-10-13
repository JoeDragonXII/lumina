import { describe, expect, it } from "vitest";
import { composePhotoWall } from "./photoWallLayout";

describe("varied photo wall", () => {
  const photos = Array.from({ length: 30 }, (_, i) => ({ id: String(i), width: i % 3 ? 1600 : 900, height: i % 3 ? 900 : 1600 }));
  it("keeps every photo once, with its original orientation and dimensions", () => {
    const wall = composePhotoWall(photos, 2, 42);
    const actual = wall.flatMap(lane => lane.flatMap(block => block.photos));
    expect(new Set(actual.map(photo => photo.id)).size).toBe(photos.length);
    expect(actual).toHaveLength(photos.length);
    for (const photo of actual) expect(photo).toBe(photos.find(item => item.id === photo.id));
    expect(new Set(wall.flat().map(block => block.kind)).size).toBeGreaterThanOrEqual(3);
  });
  it("is stable within a visit and varies between seeds", () => {
    expect(composePhotoWall(photos, 2, 42)).toEqual(composePhotoWall(photos, 2, 42));
    expect(composePhotoWall(photos, 2, 42)).not.toEqual(composePhotoWall(photos, 2, 43));
  });
  it("handles an empty library and a single portrait", () => {
    expect(composePhotoWall([], 2, 1)).toEqual([[], []]);
    expect(composePhotoWall(photos.slice(0, 1), 2, 1).flat().flatMap(block => block.photos)).toEqual(photos.slice(0, 1));
  });
});
