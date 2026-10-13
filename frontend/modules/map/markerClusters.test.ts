import {expect,test} from 'vitest';
import type {Map as MapLibreMap} from 'maplibre-gl';
import {projectAndCluster,type MarkerSubject} from './markerClusters';
const map={project:([x,y]:number[])=>({x,y}),getContainer:()=>({clientWidth:1000,clientHeight:800})} as unknown as MapLibreMap;
const point=(id:string,x:number,y=100):MarkerSubject=>({id,longitude:x,latitude:y,count:1,imageUrl:'/image',kind:'photo',label:id,note:''});
test('10000 overlapping points form one cluster without recursion overflow',()=>{
  const clusters=projectAndCluster(map,Array.from({length:10000},(_,i)=>point(String(i),100)),'photo');
  expect(clusters).toHaveLength(1);expect(clusters[0].memberIds).toHaveLength(10000);expect(clusters[0].count).toBe(10000);
});
test('grid clustering preserves transitive connections across cell borders',()=>{
  const clusters=projectAndCluster(map,[point('a',0),point('b',99),point('c',101),point('d',400)],'photo');
  expect(clusters.map(c=>c.memberIds)).toEqual([['a','b','c'],['d']]);
});
test('offscreen markers are excluded while edge padding preserves nearby cards',()=>{
  const clusters=projectAndCluster(map,[point('edge',-100),point('far',-1000),point('right',1200)],'photo');
  expect(clusters).toHaveLength(1);expect(clusters[0].memberIds).toEqual(['edge']);
});
