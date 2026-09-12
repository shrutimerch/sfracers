import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
const data=JSON.parse(readFileSync(new URL('../public/streets.json',import.meta.url),'utf8'));
const unproject=([x,z])=>[37.786-z/111200,x/87900-122.395];
const meters=([lat,lon],[a,b])=>Math.hypot((lat-a)*111200,(lon-b)*87900);
test('course follows the closed South Park street ring',()=>{
 assert.deepEqual(data.route[0],data.route.at(-1));
 const length=data.route.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-data.route[i][0],p[1]-data.route[i][1]),0);
 assert.ok(length>350&&length<390);
 for(const p of data.route)assert.ok(meters(unproject(p),[37.7816,-122.39395])<110);
 assert.ok(data.parkDetails.trees.length>=20);
 assert.ok(data.parkDetails.paths.find(p=>p.id===549848273).points.length>20);
});
test('real buildings surround the starting street and extend above ground',()=>{
 const start=data.route[0];let nearby=0;
 for(const building of data.buildings){
  const distance=Math.min(...building.points.map(p=>Math.hypot(p[0]-start[0],p[1]-start[1])));
  if(distance>100)continue;
  nearby++;
  const shape=new T.Shape(building.points.map(([x,z])=>new T.Vector2(x,-z)));
  const geometry=new T.ExtrudeGeometry(shape,{depth:building.height,bevelEnabled:false});
  geometry.rotateX(-Math.PI/2);geometry.computeBoundingBox();
  assert.ok(building.height>=2.5,'small mapped structures still need positive height');
  assert.ok(Math.abs(geometry.boundingBox.max.y-building.height)<.01,'building must retain its mapped height above the road');
  assert.ok(Math.abs(geometry.boundingBox.min.y)<.001);
  geometry.dispose();
 }
 assert.ok(nearby>=10,`Expected streetside buildings near South Park; found ${nearby}`);
});
