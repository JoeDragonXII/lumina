import { afterAll, expect, test, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as database from './database';
import { schema } from './schema';
import { libraryRepository } from './repository';

const client = new Database(':memory:');
const db = drizzle(client, { schema });
migrate(db, { migrationsFolder: 'backend/drizzle' });
vi.spyOn(database, 'getDatabase').mockReturnValue({ client, db });
afterAll(() => { vi.restoreAllMocks(); client.close(); });

test('large collections preserve photo order, alt text, missing variants and visibility', () => {
  client.transaction(() => {
    const asset = client.prepare('INSERT INTO photo_assets (id,sha256,original_name,mime_type,extension,original_path,width,height,created_at) VALUES (?,?,?, ?,?,?,100,150,?)');
    const link = client.prepare('INSERT INTO collection_photos (collection_id,asset_id,position,alt) VALUES (?,?,?,?)');
    const variant = client.prepare('INSERT INTO photo_variants (asset_id,variant,relative_path,width,height,bytes) VALUES (?,?,?,100,150,123)');
    client.prepare("INSERT INTO collections (id,slug,title,category,visibility,created_at,updated_at) VALUES ('public','public','Public','test','public','2026-01-01','2026-01-01'),('private','private','Private','other','private','2026-01-01','2026-01-01')").run();
    for (let i=0;i<3000;i++) {
      const id=`photo-${i}`;
      asset.run(id,id,id+'.jpg','image/jpeg','.jpg',id,'2026-01-01');
      link.run('public',id,2999-i,`caption-${i}`);
      if(i!==0) for(const v of ['thumb','display','large']) variant.run(id,v,`${id}/${v}.webp`);
    }
    link.run('private','photo-0',0,'private caption');
  })();
  const result=libraryRepository.listCollections();
  expect(result.map(c=>c.id)).toEqual(['public']);
  expect(result[0].photos).toHaveLength(3000);
  expect(result[0].photos[0]).toMatchObject({id:'photo-2999',position:0,alt:'caption-2999'});
  expect(result[0].photos[0].variants.map(v=>v.variant)).toEqual(['display','large','thumb']);
  expect(result[0].photos.at(-1)?.variants).toEqual([]);
  expect(libraryRepository.getCollectionById('private')?.photos[0].alt).toBe('private caption');
  expect(libraryRepository.listCollections({category:'other'})).toEqual([]);
  expect(libraryRepository.getCollectionBySlug('private')).toBeNull();
  expect(libraryRepository.listCollections({visibility:'all'})).toHaveLength(2);
});
