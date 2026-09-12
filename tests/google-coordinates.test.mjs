import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Vector3} from 'three';
import {earthToGame} from '../app/google-coordinates.ts';
const ecef=(lat,lon,height=0)=>{lat*=Math.PI/180;lon*=Math.PI/180;const a=6378137,e2=.00669437999014,n=a/Math.sqrt(1-e2*Math.sin(lat)**2);return new Vector3((n+height)*Math.cos(lat)*Math.cos(lon),(n+height)*Math.cos(lat)*Math.sin(lon),(n*(1-e2)+height)*Math.sin(lat));};
test('Google Earth coordinates align with the South Park street route',()=>{
 const matrix=earthToGame();assert.ok(ecef(37.786,-122.395).applyMatrix4(matrix).length()<.00001);
 const park=ecef(37.7816,-122.39395).applyMatrix4(matrix);
 assert.ok(Math.abs(park.x-92.295)<1);assert.ok(Math.abs(park.z-489.28)<2);
 const elevated=ecef(37.786,-122.395,10).applyMatrix4(matrix);assert.ok(Math.abs(elevated.y-10)<.00001);
});
