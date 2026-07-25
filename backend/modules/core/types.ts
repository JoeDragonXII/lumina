export type CollectionVisibility = "draft" | "private" | "public";
export type LocationSource = "manual" | "exif";
export type MediaVariantName = "thumb" | "display" | "large";

export interface LocationInput {
  countryCode: string;
  countryName: string;
  regionCode?: string | null;
  regionName?: string | null;
  city?: string | null;
  displayName: string;
  latitude?: number | null;
  longitude?: number | null;
  source: LocationSource;
  confirmed: boolean;
}

export interface CollectionInput {
  title: string;
  slug: string;
  story?: string;
  category: string;
  tags?: string[];
  visibility: CollectionVisibility;
  featured?: boolean;
  dateStart?: string | null;
  dateEnd?: string | null;
  location?: LocationInput | null;
  assetIds: string[];
  coverAssetId?: string | null;
}
