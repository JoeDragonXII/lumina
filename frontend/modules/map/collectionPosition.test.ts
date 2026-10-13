import { expect, it } from 'vitest';
import type { CollectionRecord } from '@backend/modules/library/types';
import { collectionPosition } from './collectionPosition';
const album = (photos: unknown[], location: unknown = null, coverAssetId = 'cover') => ({ photos, location, coverAssetId }) as CollectionRecord;
it('uses photo coordinates even when album location is absent', () => {
 expect(collectionPosition(album([{id:'p',latitude:34.755023,longitude:113.657352}]))).toEqual({latitude:34.755023,longitude:113.657352});
});
it('prefers album position, then positioned cover, then another positioned photo', () => {
 const photos=[{id:'a',latitude:20,longitude:30},{id:'cover',latitude:40,longitude:50}];
 expect(collectionPosition(album(photos,{latitude:10,longitude:15}))).toEqual({latitude:10,longitude:15});
 expect(collectionPosition(album(photos))).toEqual({latitude:40,longitude:50});
 expect(collectionPosition(album([{id:'cover',latitude:null,longitude:null},photos[0]]))).toEqual({latitude:20,longitude:30});
});
it('ignores missing, cleared and invalid coordinates without inventing a location', () => {
 expect(collectionPosition(album([]))).toBeNull();
 expect(collectionPosition(album([{id:'p',latitude:null,longitude:null}]))).toBeNull();
 expect(collectionPosition(album([{id:'p',latitude:NaN,longitude:20},{id:'q',latitude:86,longitude:20}]))).toBeNull();
 expect(collectionPosition(album([{id:'p',latitude:0,longitude:0}]))).toEqual({latitude:0,longitude:0});
});
