import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  regionCode: text("region_code"),
  regionName: text("region_name"),
  city: text("city"),
  displayName: text("display_name").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  source: text("source", { enum: ["manual", "exif"] }).notNull().default("manual"),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
});

export const photoAssets = sqliteTable(
  "photo_assets",
  {
    id: text("id").primaryKey(),
    sha256: text("sha256").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    extension: text("extension").notNull(),
    originalPath: text("original_path").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    takenAt: text("taken_at"),
    cameraMake: text("camera_make"),
    cameraModel: text("camera_model"),
    lens: text("lens"),
    focalLength: real("focal_length"),
    aperture: real("aperture"),
    shutterSpeed: text("shutter_speed"),
    iso: integer("iso"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    status: text("status", { enum: ["ready", "failed"] }).notNull().default("ready"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("photo_assets_sha256_unique").on(table.sha256)],
);

export const photoVariants = sqliteTable(
  "photo_variants",
  {
    assetId: text("asset_id")
      .notNull()
      .references(() => photoAssets.id, { onDelete: "cascade" }),
    variant: text("variant", { enum: ["thumb", "display", "large"] }).notNull(),
    relativePath: text("relative_path").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    mimeType: text("mime_type").notNull().default("image/webp"),
    bytes: integer("bytes").notNull(),
  },
  (table) => [primaryKey({ columns: [table.assetId, table.variant] })],
);

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    story: text("story").notNull().default(""),
    category: text("category").notNull().default("摄影作品"),
    visibility: text("visibility", { enum: ["draft", "private", "public"] }).notNull().default("draft"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    dateStart: text("date_start"),
    dateEnd: text("date_end"),
    locationId: text("location_id").references(() => locations.id, { onDelete: "set null" }),
    coverAssetId: text("cover_asset_id").references(() => photoAssets.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("collections_slug_unique").on(table.slug),
    index("collections_visibility_index").on(table.visibility),
    index("collections_date_index").on(table.dateStart),
  ],
);

export const collectionPhotos = sqliteTable(
  "collection_photos",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => photoAssets.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    alt: text("alt").notNull().default(""),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.assetId] }),
    index("collection_photos_position_index").on(table.collectionId, table.position),
  ],
);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const collectionTags = sqliteTable(
  "collection_tags",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.tagId] })],
);

export const schema = {
  locations,
  photoAssets,
  photoVariants,
  collections,
  collectionPhotos,
  tags,
  collectionTags,
};
