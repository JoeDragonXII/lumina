import "server-only";
import { eq, inArray } from "drizzle-orm";
import { getDatabase } from "@backend/modules/library/server/database";
import { photoAssets } from "@backend/modules/library/server/schema";
import { libraryRepository } from "@backend/modules/library/server/repository";

type Patch = Partial<Pick<typeof photoAssets.$inferInsert, "takenAt" | "cameraMake" | "cameraModel" | "lens" | "focalLength" | "aperture" | "shutterSpeed" | "iso" | "latitude" | "longitude">>;
const textFields = new Set(['takenAt', 'cameraMake', 'cameraModel', 'lens', 'shutterSpeed']);
const ranges: Record<string, [number, number]> = { latitude: [-90, 90], longitude: [-180, 180], focalLength: [0.01, 100000], aperture: [0.01, 1000], iso: [1, 10000000] };
export function parsePhotoPatch(value: unknown): { ids: string[]; patch: Patch } {
  if (!value || typeof value !== 'object') throw new Error('照片数据无效。');
  const { ids, patch } = value as { ids?: unknown; patch?: unknown };
  if (!Array.isArray(ids) || !ids.length || ids.length > 500 || ids.some(id => typeof id !== 'string' || !id.trim())) throw new Error('请选择 1–500 张照片。');
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('修改内容无效。');
  const output: Record<string, string | number | null> = {};
  for (const [key, v] of Object.entries(patch)) {
    if (!textFields.has(key) && !ranges[key]) throw new Error('不支持修改此字段。');
    if (v === null) { output[key] = null; continue; }
    if (textFields.has(key)) {
      if (typeof v !== 'string' || v.length > 500) throw new Error('文字字段格式无效。');
      const text = v.trim();
      if (key === 'takenAt' && text && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) || !Number.isFinite(Date.parse(text)))) throw new Error('拍摄时间格式无效。');
      output[key] = text || null;
    } else {
      const [min, max] = ranges[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (key === 'iso' && !Number.isInteger(v))) throw new Error(`${key} 超出有效范围。`);
      output[key] = v;
    }
  }
  if (!Object.keys(output).length) throw new Error('请先修改至少一个字段。');
  return { ids: [...new Set(ids as string[])], patch: output as Patch };
}
export function editPhotoMetadata(value: unknown) {
  const { ids, patch } = parsePhotoPatch(value);
  const { db } = getDatabase();
  db.transaction(tx => {
    const current = tx.select().from(photoAssets).where(inArray(photoAssets.id, ids)).all();
    if (current.length !== ids.length) throw new Error('部分照片已不存在，请刷新后重试。');
    for (const asset of current) {
      const latitude = patch.latitude === undefined ? asset.latitude : patch.latitude;
      const longitude = patch.longitude === undefined ? asset.longitude : patch.longitude;
      if ((latitude === null) !== (longitude === null)) throw new Error('纬度和经度必须同时填写或清空。');
    }
    for (const id of ids) tx.update(photoAssets).set(patch).where(eq(photoAssets.id, id)).run();
  });
  return ids.map(id => libraryRepository.getPhotoAsset(id)!);
}
