import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
const data=JSON.parse(readFileSync(new URL('../public/streets.json',import.meta.url),'utf8'));
const unproject=([x,z])=>[37.786-z/111200,x/87900-122.395];
const meters=([lat,lon],[a,b])=>Math.hypot((lat-a)*111200,(lon-b)*87900);
test('course starts at South Park and reaches the Embarcadero',()=>{
 const latlon=data.route.map(unproject);
 assert.ok(meters(latlon[0],[37.7810517,-122.3946605])<1,'start must be South Park');
 for(const landmark of [[37.782144,-122.3932921],[37.7842355,-122.3879418],[37.7946218,-122.3933097]]){
  assert.ok(Math.min(...latlon.map(p=>meters(p,landmark)))<5,'course must reach the named street anchor');
 }
 assert.deepEqual(data.route[0],data.route.at(-1));
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
  assert.ok(geometry.boundingBox.max.y>=5,'building must extend above the road');
  assert.ok(Math.abs(geometry.boundingBox.min.y)<.001);
  geometry.dispose();
 }
 assert.ok(nearby>=10,`Expected streetside buildings near South Park; found ${nearby}`);
});
