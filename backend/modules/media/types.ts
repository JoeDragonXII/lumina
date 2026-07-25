import type { PhotoAssetRecord } from "@backend/modules/library/types";

export interface ImportedPhoto {
  asset: PhotoAssetRecord;
  duplicate: boolean;
}

export interface PhotoImportSource {
  id: string;
  label: string;
  import(files: Array<{ name: string; type: string; buffer: Buffer }>): Promise<ImportedPhoto[]>;
}
