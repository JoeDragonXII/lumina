import {afterAll,expect,test,vi} from 'vitest';
import Database from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import {migrate} from 'drizzle-orm/better-sqlite3/migrator';
import * as database from './database';
import {schema} from './schema';
import {listPublicCollectionSummaries,publicCategoryCounts,getPublicMapAlbum} from './publicRead';
import {libraryRepository} from './repository';
const client=new Database(':memory:'); const db=drizzle(client,{schema}); migrate(db,{migrationsFolder:'backend/drizzle'});
vi.spyOn(database,'getDatabase').mockReturnValue({client,db});
afterAll(()=>{vi.restoreAllMocks();client.close()});
test('public summaries preserve covers, counts and GPS without leaking private or deleted albums',()=>{
  client.transaction(()=>{
    const asset=client.prepare('insert into photo_assets (id,sha256,original_name,mime_type,extension,original_path,width,height,created_at,latitude,longitude) values (?,?,?, ?,?,?,100,150,?,?,?)');
    const album=client.prepare('insert into collections (id,slug,title,category,visibility,created_at,updated_at,cover_asset_id) values (?,?,?,?,?,?,?,?)');
    const link=client.prepare('insert into collection_photos (collection_id,asset_id,position,alt) values (?,?,?,?)');
    for(let c=0;c<40;c++){
      for(let i=0;i<250;i++){const id=`p-${c}-${i}`;asset.run(id,id,id+'.jpg','image/jpeg','.jpg',id,'2026-01-01',i===4?34:null,i===4?113:null);}
      album.run(`c-${c}`,`c-${c}`,`album ${c}`,c%2?'travel':'portrait','public','2026-01-01','2026-01-01',`p-${c}-7`);
      for(let i=0;i<250;i++)link.run(`c-${c}`,`p-${c}-${i}`,i,`caption ${i}`);
    }
    album.run('private','private','private','private','private','2026-01-01','2026-01-01','p-0-0');link.run('private','p-0-0',0,'private');
    album.run('deleted','deleted','deleted','deleted','public','2026-01-01','2026-01-01','p-0-0');client.prepare("update collections set deleted_at='2026-02-01' where id='deleted'").run();
  })();
  const summaries=listPublicCollectionSummaries();expect(summaries).toHaveLength(40);
  expect(summaries.find(c=>c.id==='c-0')).toMatchObject({count:250,cover:{id:'p-0-7',alt:'caption 7'},position:{latitude:34,longitude:113}});
  expect(listPublicCollectionSummaries('travel',24,0)).toHaveLength(20);
  expect(listPublicCollectionSummaries(undefined,24,24)).toHaveLength(16);
  expect(publicCategoryCounts()).toEqual([{category:'portrait',count:20},{category:'travel',count:20}]);
  expect(getPublicMapAlbum('private')).toBeNull();expect(getPublicMapAlbum('deleted')).toBeNull();
  expect(getPublicMapAlbum('c-0')?.photos).toHaveLength(250);
  client.prepare("update photo_assets set latitude=35,longitude=114 where id='p-0-7'").run();
  expect(listPublicCollectionSummaries().find(c=>c.id==='c-0')?.position).toEqual({latitude:35,longitude:114});
  client.prepare("insert into locations (id,country_code,country_name,display_name,latitude,longitude) values ('loc','CN','China','China',40,116)").run();client.prepare("update collections set location_id='loc' where id='c-0'").run();
  expect(listPublicCollectionSummaries().find(c=>c.id==='c-0')?.position).toEqual({latitude:40,longitude:116});
  const oldStart=performance.now();const full=libraryRepository.listCollections();const fullMs=performance.now()-oldStart;
  const start=performance.now();const lightweight=listPublicCollectionSummaries();const summaryMs=performance.now()-start;
  console.log(JSON.stringify({photos:10000,fullMs,summaryMs,fullBytes:Buffer.byteLength(JSON.stringify(full)),summaryBytes:Buffer.byteLength(JSON.stringify(lightweight))}));
});
