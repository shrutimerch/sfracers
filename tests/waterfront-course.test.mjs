import assert from 'node:assert/strict';import {test} from 'node:test';import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../public/race-course.json',import.meta.url),'utf8'));
test('waterfront circuit is a continuous closed route on source street segments',()=>{
 assert.deepEqual(d.route[0],d.route.at(-1));
 const edges=new Set();for(const r of [...d.roads,...d.paths])for(let i=1;i<r.points.length;i++){edges.add(JSON.stringify([r.points[i-1],r.points[i]]));edges.add(JSON.stringify([r.points[i],r.points[i-1]]));}
 let length=0;for(let i=1;i<d.route.length;i++){assert.ok(edges.has(JSON.stringify([d.route[i-1],d.route[i]])));length+=Math.hypot(d.route[i][0]-d.route[i-1][0],d.route[i][1]-d.route[i-1][1]);}
 assert.ok(Math.abs(length-d.course.length)<.02);assert.ok(length>2100&&length<2250);
 assert.ok(d.route.some(p=>p[0]===268.55&&p[1]===869.84),'passes King and 3rd before returning');
 assert.deepEqual(d.course.sections.map(s=>s.name),['South Park','2nd Street','Brannan Street','Waterfront Promenade','King Street','3rd Street']);
});

test('promenade follows downloaded pedestrian geometry, separate from traffic lanes',()=>{
 const raw=JSON.parse(readFileSync(new URL('../public/waterfront-paths-osm.json',import.meta.url),'utf8'));
 const path=d.paths[0];const edges=new Set();
 for(const w of raw.elements.filter(w=>path.sourceWayIds.includes(w.id))){const ps=w.geometry.map(g=>[Math.round((g.lon+122.395)*87900*100)/100,Math.round((37.786-g.lat)*111200*100)/100]);for(let i=1;i<ps.length;i++){edges.add(JSON.stringify([ps[i-1],ps[i]]));edges.add(JSON.stringify([ps[i],ps[i-1]]));}}
 for(let i=1;i<path.points.length;i++)assert.ok(edges.has(JSON.stringify([path.points[i-1],path.points[i]])));
 assert.ok(path.points.some(p=>p[0]===617.92&&p[1]===343.81));
 assert.ok(!d.course.sections.some(s=>s.name==='The Embarcadero'));
});
