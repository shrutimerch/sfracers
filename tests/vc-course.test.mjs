import assert from 'node:assert/strict';import {test} from 'node:test';import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../public/vc-course.json',import.meta.url),'utf8'));
test('VC course closes on mapped streets and passes all three actual building frontages',()=>{
 assert.deepEqual(d.route[0],d.route.at(-1));
 const edges=new Set();for(const r of d.roads)for(let i=1;i<r.points.length;i++){edges.add(JSON.stringify([r.points[i-1],r.points[i]]));edges.add(JSON.stringify([r.points[i],r.points[i-1]]));}
 let length=0;for(let i=1;i<d.route.length;i++){assert.ok(edges.has(JSON.stringify([d.route[i-1],d.route[i]])));length+=Math.hypot(d.route[i][0]-d.route[i-1][0],d.route[i][1]-d.route[i-1][1]);}
 assert.ok(Math.abs(length-d.course.length)<.02);
 for(const [id,address,street] of [[1171034242,'380','Brannan Street'],[129176903,'180','Townsend Street'],[143294965,'600','Townsend Street']]){
 const b=d.buildings.find(b=>b.id===id);assert.equal(b.address,address);assert.equal(b.street,street);
 const m=d.course.landmarks.find(m=>m.buildingId===id);assert.ok(m);
 const [px,pz]=m.position;let nearest=Infinity;
 for(let i=1;i<d.route.length;i++){const [ax,az]=d.route[i-1],[bx,bz]=d.route[i];const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1)));nearest=Math.min(nearest,Math.hypot(px-ax-t*dx,pz-az-t*dz));}
 assert.ok(nearest<20,`${m.name} frontage must be within 20m of the course`);
 }
});
