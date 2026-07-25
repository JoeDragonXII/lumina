import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDatabase } from "@backend/modules/library/server/database";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { locations } from "@backend/modules/library/server/schema";

function addAsset(id: string, sha256: string) {
  return libraryRepository.createPhotoAsset(
    {
      id,
      sha256,
      originalName: `${id}.jpg`,
      mimeType: "image/jpeg",
      extension: ".jpg",
      originalPath: `media/originals/${id}.jpg`,
      width: 1600,
      height: 1067,
      createdAt: new Date().toISOString(),
    },
    [
      {
        variant: "display",
        relativePath: `media/derived/${id}/display.webp`,
        width: 1600,
        height: 1067,
        mimeType: "image/webp",
        bytes: 100,
      },
    ],
  );
}

describe("libraryRepository", () => {
  it("persists assets and resolves them by hash", () => {
    addAsset("asset-one", "hash-one");
    expect(libraryRepository.getPhotoAssetByHash("hash-one")?.id).toBe("asset-one");
  });

  it("keeps drafts out of public queries", () => {
    addAsset("asset-draft", "hash-draft");
    libraryRepository.createCollection({
      title: "尚未发布",
      slug: "draft-album",
      category: "旅行",
      visibility: "draft",
      tags: ["夜景"],
      assetIds: ["asset-draft"],
      coverAssetId: "asset-draft",
    });

    expect(libraryRepository.listCollections()).toHaveLength(0);
    expect(libraryRepository.listCollections({ visibility: "all" })).toHaveLength(1);
  });

  it("filters public collections by date, tag and country", () => {
    addAsset("asset-public", "hash-public");
    libraryRepository.createCollection({
      title: "东京夜色",
      slug: "tokyo-night",
      category: "旅行",
      visibility: "public",
      dateStart: "2026-04-10",
      tags: ["夜景", "城市"],
      location: {
        countryCode: "JP",
        countryName: "日本",
        city: "东京",
        displayName: "日本 · 东京",
        latitude: 35.6762,
        longitude: 139.6503,
        source: "manual",
        confirmed: true,
      },
      assetIds: ["asset-public"],
      coverAssetId: "asset-public",
    });

    expect(libraryRepository.listCollections({ year: "2026" })).toHaveLength(1);
    expect(libraryRepository.listCollections({ tag: "夜景", country: "JP" })).toHaveLength(1);
    expect(libraryRepository.listCollections({ country: "CN" })).toHaveLength(0);
  });

  it("rejects duplicate slugs and supports soft delete recovery", () => {
    addAsset("asset-soft", "hash-soft");
    const collection = libraryRepository.createCollection({
      title: "河南记忆",
      slug: "henan-memory",
      category: "日常",
      visibility: "public",
      assetIds: ["asset-soft"],
    });

    expect(() =>
      libraryRepository.createCollection({
        title: "重复链接",
        slug: "henan-memory",
        category: "日常",
        visibility: "draft",
        assetIds: [],
      }),
    ).toThrow();

    libraryRepository.softDeleteCollection(collection!.id);
    expect(libraryRepository.getCollectionById(collection!.id)).toBeNull();
    libraryRepository.restoreCollection(collection!.id);
    expect(libraryRepository.getCollectionById(collection!.id)?.title).toBe("河南记忆");
  });

  it("persists photo order, cover changes and publish validation", () => {
    addAsset("asset-order-a", "hash-order-a");
    addAsset("asset-order-b", "hash-order-b");
    const collection = libraryRepository.createCollection({
      title: "排序测试",
      slug: "ordered-album",
      category: "摄影作品",
      visibility: "draft",
      assetIds: ["asset-order-a", "asset-order-b"],
      coverAssetId: "asset-order-a",
    })!;
    const updated = libraryRepository.updateCollection(collection.id, {
      title: "排序测试",
      slug: "ordered-album",
      category: "摄影作品",
      visibility: "public",
      assetIds: ["asset-order-b", "asset-order-a"],
      coverAssetId: "asset-order-b",
    })!;

    expect(updated.photos.map((photo) => photo.id)).toEqual(["asset-order-b", "asset-order-a"]);
    expect(updated.coverAssetId).toBe("asset-order-b");
    expect(() =>
      libraryRepository.updateCollection(collection.id, {
        title: "排序测试",
        slug: "ordered-album",
        category: "摄影作品",
        visibility: "public",
        location: {
          countryCode: "CN",
          countryName: "中国",
          displayName: "GPS 建议",
          source: "exif",
          confirmed: false,
        },
        assetIds: ["asset-order-b"],
      }),
    ).toThrow("公开前请确认地点信息");
  });

  it("reuses unchanged locations and removes replaced location rows", () => {
    addAsset("asset-location", "hash-location");
    const initialLocation = {
      countryCode: "CN",
      countryName: "中国",
      regionCode: "GD",
      regionName: "广东",
      city: "广州",
      displayName: "中国 · 广东 · 广州",
      latitude: 23.1291,
      longitude: 113.2644,
      source: "manual" as const,
      confirmed: true,
    };
    const collection = libraryRepository.createCollection({
      title: "地点更新测试",
      slug: "location-update",
      category: "旅行",
      visibility: "public",
      location: initialLocation,
      assetIds: ["asset-location"],
    })!;
    const originalLocationId = collection.location!.id;

    const unchanged = libraryRepository.updateCollection(collection.id, {
      title: collection.title,
      slug: collection.slug,
      category: collection.category,
      visibility: collection.visibility,
      location: initialLocation,
      assetIds: ["asset-location"],
    })!;
    expect(unchanged.location?.id).toBe(originalLocationId);

    const changed = libraryRepository.updateCollection(collection.id, {
      title: collection.title,
      slug: collection.slug,
      category: collection.category,
      visibility: collection.visibility,
      location: {
        ...initialLocation,
        city: "深圳",
        displayName: "中国 · 广东 · 深圳",
        latitude: 22.5431,
        longitude: 114.0579,
      },
      assetIds: ["asset-location"],
    })!;

    expect(changed.location?.id).not.toBe(originalLocationId);
    const { db } = getDatabase();
    expect(db.select().from(locations).where(eq(locations.id, originalLocationId)).get()).toBeUndefined();
  });
});
