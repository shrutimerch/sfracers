import assert from 'node:assert/strict';import {test} from 'node:test';import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../public/race-course.json',import.meta.url),'utf8'));
test('waterfront circuit is a continuous closed route on source street segments',()=>{
 assert.deepEqual(d.route[0],d.route.at(-1));
 const edges=new Set();for(const r of d.roads)for(let i=1;i<r.points.length;i++){edges.add(JSON.stringify([r.points[i-1],r.points[i]]));edges.add(JSON.stringify([r.points[i],r.points[i-1]]));}
 let length=0;for(let i=1;i<d.route.length;i++){assert.ok(edges.has(JSON.stringify([d.route[i-1],d.route[i]])));length+=Math.hypot(d.route[i][0]-d.route[i-1][0],d.route[i][1]-d.route[i-1][1]);}
 assert.ok(Math.abs(length-d.course.length)<.02);assert.ok(length>1900&&length<2100);assert.ok(length/27>60,'even sustained top speed takes over a minute');assert.ok(length/19>100&&length/19<110);
 assert.deepEqual(d.course.sections.map(s=>s.name),['South Park','2nd Street','Brannan Street','The Embarcadero','Townsend Street','3rd Street']);
});
