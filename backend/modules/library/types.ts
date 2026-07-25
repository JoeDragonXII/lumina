import type { CollectionVisibility, LocationInput, MediaVariantName } from "@backend/modules/core/types";

export interface PhotoVariantRecord {
  variant: MediaVariantName;
  width: number;
  height: number;
  bytes: number;
}

export interface PhotoAssetRecord {
  id: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  takenAt: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  latitude: number | null;
  longitude: number | null;
  variants: PhotoVariantRecord[];
  alt: string;
  position: number;
}

export interface CollectionRecord {
  id: string;
  slug: string;
  title: string;
  story: string;
  category: string;
  tags: string[];
  visibility: CollectionVisibility;
  featured: boolean;
  dateStart: string | null;
  dateEnd: string | null;
  location: (LocationInput & { id: string }) | null;
  coverAssetId: string | null;
  photos: PhotoAssetRecord[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CollectionFilters {
  visibility?: CollectionVisibility | "all";
  includeDeleted?: boolean;
  year?: string;
  category?: string;
  tag?: string;
  country?: string;
  city?: string;
  featured?: boolean;
}
