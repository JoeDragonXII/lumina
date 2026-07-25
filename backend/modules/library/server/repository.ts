import "server-only";

import { randomUUID } from "crypto";
import { and, asc, desc, eq, isNull, type SQL } from "drizzle-orm";
import type { CollectionInput, MediaVariantName } from "@backend/modules/core/types";
import { getDatabase } from "@backend/modules/library/server/database";
import {
  collectionPhotos,
  collections,
  collectionTags,
  locations,
  photoAssets,
  photoVariants,
  tags,
} from "@backend/modules/library/server/schema";
import type {
  CollectionFilters,
  CollectionRecord,
  PhotoAssetRecord,
  PhotoVariantRecord,
} from "@backend/modules/library/types";

export interface NewPhotoAsset {
  id: string;
  sha256: string;
  originalName: string;
  mimeType: string;
  extension: string;
  originalPath: string;
  width: number;
  height: number;
  takenAt?: string | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  lens?: string | null;
  focalLength?: number | null;
  aperture?: number | null;
  shutterSpeed?: string | null;
  iso?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface NewPhotoVariant {
  variant: MediaVariantName;
  relativePath: string;
  width: number;
  height: number;
  mimeType: string;
  bytes: number;
}

type PhotoAssetMetadataUpdate = Partial<
  Pick<
    NewPhotoAsset,
    | "takenAt"
    | "cameraMake"
    | "cameraModel"
    | "lens"
    | "focalLength"
    | "aperture"
    | "shutterSpeed"
    | "iso"
    | "latitude"
    | "longitude"
  >
>;

function cleanSlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTags(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 20);
}

function validateCollection(input: CollectionInput) {
  const title = input.title.trim();
  const slug = cleanSlug(input.slug || title);
  const assetIds = [...new Set(input.assetIds)];

  if (!title) throw new Error("图集标题不能为空。");
  if (!slug) throw new Error("图集链接标识不能为空。");
  if (input.visibility === "public" && assetIds.length === 0) throw new Error("公开图集至少需要一张照片。");
  if (input.visibility === "public" && input.location && !input.location.confirmed) {
    throw new Error("公开前请确认地点信息。");
  }
  if (input.coverAssetId && !assetIds.includes(input.coverAssetId)) throw new Error("封面必须来自当前图集。");

  return {
    ...input,
    title,
    slug,
    story: input.story?.trim() || "",
    category: input.category.trim() || "摄影作品",
    tags: normalizeTags(input.tags),
    assetIds,
    coverAssetId: input.coverAssetId || assetIds[0] || null,
  };
}

function toAssetRecord(
  asset: typeof photoAssets.$inferSelect,
  variants: Array<typeof photoVariants.$inferSelect>,
  alt = "",
  position = 0,
): PhotoAssetRecord {
  return {
    id: asset.id,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    takenAt: asset.takenAt,
    cameraMake: asset.cameraMake,
    cameraModel: asset.cameraModel,
    lens: asset.lens,
    focalLength: asset.focalLength,
    aperture: asset.aperture,
    shutterSpeed: asset.shutterSpeed,
    iso: asset.iso,
    latitude: asset.latitude,
    longitude: asset.longitude,
    variants: variants.map(
      (item): PhotoVariantRecord => ({
        variant: item.variant,
        width: item.width,
        height: item.height,
        bytes: item.bytes,
      }),
    ),
    alt,
    position,
  };
}

function hydrateCollection(row: typeof collections.$inferSelect): CollectionRecord {
  const { db } = getDatabase();
  const locationRow = row.locationId
    ? db.select().from(locations).where(eq(locations.id, row.locationId)).get() || null
    : null;
  const photoLinks = db
    .select()
    .from(collectionPhotos)
    .where(eq(collectionPhotos.collectionId, row.id))
    .orderBy(asc(collectionPhotos.position))
    .all();
  const photos = photoLinks.flatMap((link) => {
    const asset = db.select().from(photoAssets).where(eq(photoAssets.id, link.assetId)).get();
    if (!asset) return [];
    const variants = db.select().from(photoVariants).where(eq(photoVariants.assetId, asset.id)).all();
    return [toAssetRecord(asset, variants, link.alt, link.position)];
  });
  const tagRows = db
    .select({ name: tags.name })
    .from(collectionTags)
    .innerJoin(tags, eq(collectionTags.tagId, tags.id))
    .where(eq(collectionTags.collectionId, row.id))
    .orderBy(asc(tags.name))
    .all();

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    story: row.story,
    category: row.category,
    tags: tagRows.map((item) => item.name),
    visibility: row.visibility,
    featured: row.featured,
    dateStart: row.dateStart,
    dateEnd: row.dateEnd,
    location: locationRow
      ? {
          id: locationRow.id,
          countryCode: locationRow.countryCode,
          countryName: locationRow.countryName,
          regionCode: locationRow.regionCode,
          regionName: locationRow.regionName,
          city: locationRow.city,
          displayName: locationRow.displayName,
          latitude: locationRow.latitude,
          longitude: locationRow.longitude,
          source: locationRow.source,
          confirmed: locationRow.confirmed,
        }
      : null,
    coverAssetId: row.coverAssetId,
    photos,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function collectionTime(collection: CollectionRecord) {
  return new Date(collection.dateStart || collection.createdAt).getTime();
}

function matchesFilters(collection: CollectionRecord, filters: CollectionFilters) {
  if (filters.year) {
    const startYear = (collection.dateStart || collection.createdAt).slice(0, 4);
    const endYear = (collection.dateEnd || collection.dateStart || collection.createdAt).slice(0, 4);
    if (filters.year < startYear || filters.year > endYear) return false;
  }
  if (filters.category && collection.category !== filters.category) return false;
  if (filters.tag && !collection.tags.includes(filters.tag)) return false;
  if (filters.country && collection.location?.countryCode.toUpperCase() !== filters.country.toUpperCase()) return false;
  if (filters.city && collection.location?.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (typeof filters.featured === "boolean" && collection.featured !== filters.featured) return false;
  return true;
}

export const libraryRepository = {
  createPhotoAsset(asset: NewPhotoAsset, variants: NewPhotoVariant[]) {
    const { db } = getDatabase();
    db.transaction((tx) => {
      tx.insert(photoAssets).values({ ...asset, status: "ready" }).run();
      if (variants.length > 0) {
        tx.insert(photoVariants)
          .values(variants.map((variant) => ({ assetId: asset.id, ...variant })))
          .run();
      }
    });
    return this.getPhotoAsset(asset.id);
  },

  getPhotoAsset(id: string) {
    const { db } = getDatabase();
    const asset = db.select().from(photoAssets).where(eq(photoAssets.id, id)).get();
    if (!asset) return null;
    const variants = db.select().from(photoVariants).where(eq(photoVariants.assetId, id)).all();
    return toAssetRecord(asset, variants);
  },

  getPhotoAssetInternal(id: string) {
    const { db } = getDatabase();
    return db.select().from(photoAssets).where(eq(photoAssets.id, id)).get() || null;
  },

  updatePhotoAssetMetadata(id: string, metadata: PhotoAssetMetadataUpdate) {
    const { db } = getDatabase();
    const current = db.select().from(photoAssets).where(eq(photoAssets.id, id)).get();
    if (!current) return null;
    db.update(photoAssets)
      .set({
        takenAt: metadata.takenAt ?? current.takenAt,
        cameraMake: metadata.cameraMake ?? current.cameraMake,
        cameraModel: metadata.cameraModel ?? current.cameraModel,
        lens: metadata.lens ?? current.lens,
        focalLength: metadata.focalLength ?? current.focalLength,
        aperture: metadata.aperture ?? current.aperture,
        shutterSpeed: metadata.shutterSpeed ?? current.shutterSpeed,
        iso: metadata.iso === null || metadata.iso === undefined ? current.iso : Math.round(metadata.iso),
        latitude: metadata.latitude ?? current.latitude,
        longitude: metadata.longitude ?? current.longitude,
      })
      .where(eq(photoAssets.id, id))
      .run();
    return this.getPhotoAsset(id);
  },

  getPhotoAssetByHash(sha256: string) {
    const { db } = getDatabase();
    const asset = db.select().from(photoAssets).where(eq(photoAssets.sha256, sha256)).get();
    return asset ? this.getPhotoAsset(asset.id) : null;
  },

  getVariant(assetId: string, variant: MediaVariantName) {
    const { db } = getDatabase();
    return (
      db
        .select()
        .from(photoVariants)
        .where(and(eq(photoVariants.assetId, assetId), eq(photoVariants.variant, variant)))
        .get() || null
    );
  },

  isAssetPublic(assetId: string) {
    const { db } = getDatabase();
    return Boolean(
      db
        .select({ id: collections.id })
        .from(collectionPhotos)
        .innerJoin(collections, eq(collectionPhotos.collectionId, collections.id))
        .where(
          and(
            eq(collectionPhotos.assetId, assetId),
            eq(collections.visibility, "public"),
            isNull(collections.deletedAt),
          ),
        )
        .get(),
    );
  },

  createCollection(input: CollectionInput) {
    const value = validateCollection(input);
    const { db } = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.transaction((tx) => {
      let locationId: string | null = null;
      if (value.location) {
        locationId = randomUUID();
        tx.insert(locations).values({ id: locationId, ...value.location }).run();
      }

      tx.insert(collections)
        .values({
          id,
          slug: value.slug,
          title: value.title,
          story: value.story,
          category: value.category,
          visibility: value.visibility,
          featured: value.featured || false,
          dateStart: value.dateStart || null,
          dateEnd: value.dateEnd || value.dateStart || null,
          locationId,
          coverAssetId: value.coverAssetId,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      if (value.assetIds.length > 0) {
        tx.insert(collectionPhotos)
          .values(value.assetIds.map((assetId, position) => ({ collectionId: id, assetId, position, alt: value.title })))
          .run();
      }

      for (const name of value.tags) {
        const existing = tx.select().from(tags).where(eq(tags.name, name)).get();
        const tagId = existing?.id || randomUUID();
        if (!existing) tx.insert(tags).values({ id: tagId, name }).run();
        tx.insert(collectionTags).values({ collectionId: id, tagId }).run();
      }
    });

    return this.getCollectionById(id, true);
  },

  updateCollection(id: string, input: CollectionInput) {
    const value = validateCollection(input);
    const { db } = getDatabase();
    const current = db.select().from(collections).where(eq(collections.id, id)).get();
    if (!current) throw new Error("图集不存在。");
    const oldLocationId = current.locationId;

    db.transaction((tx) => {
      let locationId: string | null = null;
      let deleteOldLocation = false;
      if (value.location) {
        const oldLoc = oldLocationId
          ? tx.select().from(locations).where(eq(locations.id, oldLocationId)).get()
          : null;
        const unchanged =
          oldLoc &&
          oldLoc.countryCode === value.location.countryCode &&
          oldLoc.countryName === value.location.countryName &&
          oldLoc.regionCode === (value.location.regionCode ?? null) &&
          oldLoc.regionName === (value.location.regionName ?? null) &&
          oldLoc.city === (value.location.city ?? null) &&
          oldLoc.displayName === value.location.displayName &&
          oldLoc.latitude === (value.location.latitude ?? null) &&
          oldLoc.longitude === (value.location.longitude ?? null) &&
          oldLoc.source === value.location.source &&
          oldLoc.confirmed === value.location.confirmed;
        if (unchanged) {
          locationId = oldLoc.id;
        } else {
          locationId = randomUUID();
          tx.insert(locations).values({ id: locationId, ...value.location }).run();
          if (oldLocationId) deleteOldLocation = true;
        }
      } else if (oldLocationId) {
        deleteOldLocation = true;
      }

      tx.update(collections)
        .set({
          slug: value.slug,
          title: value.title,
          story: value.story,
          category: value.category,
          visibility: value.visibility,
          featured: value.featured || false,
          dateStart: value.dateStart || null,
          dateEnd: value.dateEnd || value.dateStart || null,
          locationId,
          coverAssetId: value.coverAssetId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(collections.id, id))
        .run();

      tx.delete(collectionPhotos).where(eq(collectionPhotos.collectionId, id)).run();
      tx.delete(collectionTags).where(eq(collectionTags.collectionId, id)).run();

      if (value.assetIds.length > 0) {
        tx.insert(collectionPhotos)
          .values(value.assetIds.map((assetId, position) => ({ collectionId: id, assetId, position, alt: value.title })))
          .run();
      }

      for (const name of value.tags) {
        const existing = tx.select().from(tags).where(eq(tags.name, name)).get();
        const tagId = existing?.id || randomUUID();
        if (!existing) tx.insert(tags).values({ id: tagId, name }).run();
        tx.insert(collectionTags).values({ collectionId: id, tagId }).run();
      }

      if (deleteOldLocation && oldLocationId) {
        tx.delete(locations).where(eq(locations.id, oldLocationId)).run();
      }
    });

    return this.getCollectionById(id, true);
  },

  listCollections(filters: CollectionFilters = {}) {
    const { db } = getDatabase();
    const conditions: SQL[] = [];
    if (!filters.includeDeleted) conditions.push(isNull(collections.deletedAt));
    if (filters.visibility && filters.visibility !== "all") conditions.push(eq(collections.visibility, filters.visibility));
    if (!filters.visibility) conditions.push(eq(collections.visibility, "public"));

    const rows = db
      .select()
      .from(collections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(collections.dateStart), desc(collections.createdAt))
      .all();

    return rows
      .map(hydrateCollection)
      .filter((collection) => matchesFilters(collection, filters))
      .sort((left, right) => collectionTime(right) - collectionTime(left));
  },

  getCollectionById(id: string, includeDeleted = false) {
    const { db } = getDatabase();
    const row = db.select().from(collections).where(eq(collections.id, id)).get();
    if (!row || (!includeDeleted && row.deletedAt)) return null;
    return hydrateCollection(row);
  },

  getCollectionBySlug(slug: string, includePrivate = false) {
    const { db } = getDatabase();
    const conditions = [eq(collections.slug, slug), isNull(collections.deletedAt)];
    if (!includePrivate) conditions.push(eq(collections.visibility, "public"));
    const row = db.select().from(collections).where(and(...conditions)).get();
    return row ? hydrateCollection(row) : null;
  },

  softDeleteCollection(id: string) {
    const { db } = getDatabase();
    db.update(collections)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(collections.id, id))
      .run();
  },

  restoreCollection(id: string) {
    const { db } = getDatabase();
    db.update(collections)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(collections.id, id))
      .run();
  },

  /**
   * 地图页聚合数据：按国家统计公开图集数量 + 提取有坐标的 marker。
   * 设计参考 travel-shots：直接 join 查询，不加载照片变体，避免 N+1。
   */
  getMapSummary() {
    const { db } = getDatabase();

    const rows = db
      .select({
        id: collections.id,
        title: collections.title,
        slug: collections.slug,
        countryCode: locations.countryCode,
        countryName: locations.countryName,
        latitude: locations.latitude,
        longitude: locations.longitude,
      })
      .from(collections)
      .innerJoin(locations, eq(collections.locationId, locations.id))
      .where(
        and(
          eq(collections.visibility, "public"),
          isNull(collections.deletedAt),
        ),
      )
      .all();

    /* ── 获取每个图集的第一张缩略图 ── */
    const coverUrlMap = new Map<string, string>();
    const coverRows = db
      .select({
        collectionId: collectionPhotos.collectionId,
        relativePath: photoVariants.relativePath,
      })
      .from(collectionPhotos)
      .innerJoin(
        photoVariants,
        and(
          eq(collectionPhotos.assetId, photoVariants.assetId),
          eq(photoVariants.variant, "thumb"),
        ),
      )
      .where(eq(collectionPhotos.position, 0))
      .all();

    for (const row of coverRows) {
      coverUrlMap.set(row.collectionId, `/api/media/${row.relativePath}`);
    }

    const counts: Record<string, number> = {};
    const markers: Array<{
      id: string;
      title: string;
      countryCode: string;
      latitude: number;
      longitude: number;
      href: string;
      imageUrl?: string;
    }> = [];

    for (const row of rows) {
      const code = row.countryCode;
      if (!code) continue;
      counts[code] = (counts[code] || 0) + 1;

      if (row.latitude != null && row.longitude != null) {
        markers.push({
          id: row.id,
          title: row.title,
          countryCode: code,
          latitude: row.latitude,
          longitude: row.longitude,
          href: `/archive`,
          imageUrl: coverUrlMap.get(row.id),
        });
      }
    }

    return { counts, markers };
  },

  clearContent() {
    const { db } = getDatabase();
    db.transaction((tx) => {
      tx.delete(collectionTags).run();
      tx.delete(collectionPhotos).run();
      tx.delete(collections).run();
      tx.delete(tags).run();
      tx.delete(locations).run();
      tx.delete(photoVariants).run();
      tx.delete(photoAssets).run();
    });
  },
};
