import { describe, expect, it } from "vitest";
import type { CollectionRecord } from "@backend/modules/library/types";
import { selectHomePhotos } from "./homePhotos";

const album = (id: string, photos: string[], featured = false) => ({ id, featured, photos: photos.map(id => ({ id })) }) as CollectionRecord;
describe("home photo selection", () => {
  it("prioritizes featured albums and shows a shared photo only once", () => {
    const collections = [album("new", ["shared", "other"]), album("featured", ["shared", "featured-only"], true)];
    const selection = selectHomePhotos(collections);
    expect(selection.map(entry => entry.photo.id)).toEqual(["shared", "featured-only", "other"]);
    expect(selection[0].collection.id).toBe("featured");
    expect(collections[0].id).toBe("new");
  });
  it("limits the wall and handles an empty library", () => {
    expect(selectHomePhotos([album("a", ["1", "2", "3"])], 2)).toHaveLength(2);
    expect(selectHomePhotos([], 12)).toEqual([]);
    expect(selectHomePhotos([album("a", ["1"])], 0)).toEqual([]);
  });
  it("samples across albums reproducibly while keeping featured selection priority", () => {
    const collections = [album("a", Array.from({ length: 20 }, (_, i) => `a${i}`)), album("b", ["b1", "b2"], true)];
    const selected = selectHomePhotos(collections, 10, 42);
    expect(selected).toEqual(selectHomePhotos(collections, 10, 42));
    expect(selected).not.toEqual(selectHomePhotos(collections, 10, 43));
    expect(selected.filter(entry => entry.collection.featured)).toHaveLength(2);
    expect(new Set(selected.map(entry => entry.photo.id)).size).toBe(10);
  });
});
