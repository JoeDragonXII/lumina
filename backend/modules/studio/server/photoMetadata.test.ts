import { describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { editPhotoMetadata, parsePhotoPatch } from './photoMetadata';
import { libraryRepository } from '@backend/modules/library/server/repository';
function asset(iso: number) {
  const id = randomUUID();
  return libraryRepository.createPhotoAsset({ id, sha256: id, originalName: id + '.jpg', mimeType: 'image/jpeg', extension: '.jpg', originalPath: 'unused.jpg', width: 100, height: 200, createdAt: new Date().toISOString(), iso, cameraModel: 'Camera', latitude: null, longitude: null }, [])!;
}
describe('photo metadata editing', () => {
  it('updates selected assets only and preserves untouched fields', () => {
    const a = asset(100), b = asset(200), c = asset(400);
    const result = editPhotoMetadata({ ids: [a.id, b.id], patch: { latitude: 30, longitude: 120 } });
    expect(result.map(p => p.iso)).toEqual([100, 200]);
    expect(result.every(p => p.latitude === 30 && p.longitude === 120)).toBe(true);
    expect(libraryRepository.getPhotoAsset(c.id)?.latitude).toBeNull();
    expect(libraryRepository.getPhotoAsset(a.id)?.cameraModel).toBe('Camera');
  });
  it('supports explicit clearing', () => {
    const a = asset(100);
    editPhotoMetadata({ ids: [a.id], patch: { lens: 'Lens', latitude: 30, longitude: 120 } });
    const [updated] = editPhotoMetadata({ ids: [a.id], patch: { lens: null, latitude: null, longitude: null } });
    expect(updated.lens).toBeNull(); expect(updated.latitude).toBeNull(); expect(updated.longitude).toBeNull();
  });
  it('rejects invalid coordinates, unsupported fields and wrong numeric types', () => {
    for (const patch of [{ latitude: 91 }, { iso: true }, { originalPath: 'bad' }, { iso: 1.5 }, { takenAt: 'invalid' }, {}]) expect(() => parsePhotoPatch({ ids: ['a'], patch })).toThrow();
  });
  it('rolls back a batch if a photo is missing or coordinates are incomplete', () => {
    const a = asset(100);
    expect(() => editPhotoMetadata({ ids: [a.id, 'missing'], patch: { iso: 999 } })).toThrow();
    expect(libraryRepository.getPhotoAsset(a.id)?.iso).toBe(100);
    expect(() => editPhotoMetadata({ ids: [a.id], patch: { latitude: 30 } })).toThrow();
    expect(libraryRepository.getPhotoAsset(a.id)?.latitude).toBeNull();
  });
});
