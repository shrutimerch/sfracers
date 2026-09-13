import {courtyardPaths} from './brannan-courtyard-data';
import {palmGeometry} from './palm-geometry';
import {parkGrass} from './park-ground';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildingGeometry} from './building-geometry';
import {routeProfiles} from './route-profiles';
import survey from './waterfront-geometry';
import type {MapData,Facades,Point} from './engine';

// Mapped positions; modeled detail sizes are estimates from reference/waterfront-streetview.json.
export function buildRouteScenery(scene:T.Scene,d:MapData,facades:Facades){
 const groups=new Map<T.Material,T.BufferGeometry[]>();
 const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:.88,side:T.DoubleSide});
 const pale=mat('#c3bfb2'),dark=mat('#314448'),blue=mat('#385b6c'),bark=mat('#77684e'),leaf=mat('#456038'),rail=mat('#7c807e');
 const groundGrass=parkGrass(),grass=groundGrass.material,palmLeaves=['#3b542b','#526b33','#708345'].map(mat);
 const add=(g:T.BufferGeometry,m:T.Material)=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();const pos=n.getAttribute('position');const uv=new Float32Array(pos.count*2);for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)/4;uv[i*2+1]=pos.getZ(i)/4;}n.setAttribute('uv',new T.BufferAttribute(uv,2));const a=groups.get(m)||[];a.push(n);groups.set(m,a);};
 const box=(x:number,y:number,z:number,l:number,h:number,w:number,m:T.Material,a=0)=>{const g=new T.BoxGeometry(l,h,w);g.rotateY(-a);g.translate(x,y,z);add(g,m);};
 const rod=(a:T.Vector3,b:T.Vector3,r:number,m:T.Material)=>{const delta=b.clone().sub(a);if(delta.length()<.01)return;const g=new T.CylinderGeometry(r,r,delta.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,m);};
 const slab=(pts:Point[],m:T.Material,y:number)=>{const g=new T.ShapeGeometry(new T.Shape(pts.map(p=>new T.Vector2(p[0],-p[1]))));g.rotateX(-Math.PI/2);g.translate(0,y,0);add(g,m);};
 const line=(pts:Point[],width:number,m:T.Material,y=.11)=>{for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);box((a[0]+b[0])/2,y,(a[1]+b[1])/2,l,.035,width,m,Math.atan2(b[1]-a[1],b[0]-a[0]));}};
 const routeDistance=(x:number,z:number)=>{let best=Infinity;for(let i=1;i<d.route.length;i++){const a=d.route[i-1],b=d.route[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;};
 for(const b of d.buildings){const p=routeProfiles[b.id??0];if(!p)continue;
  const geom=buildingGeometry(b),wallMat=new T.MeshStandardMaterial({color:p.color,map:p.brick?facades.brick:null,roughness:.9,side:T.DoubleSide});
  // Brick texture retains masonry grain; the large physical frames define the actual facade character.
  if(p.brick){const wall=new T.Mesh(geom.walls,wallMat);wall.castShadow=true;scene.add(wall);}else add(geom.walls,wallMat);add(geom.roof,dark);
  const trim=mat(p.trim),frame=mat(p.frames),glass=mat('#53686e');
  const cx=b.points.reduce((n,v)=>n+v[0],0)/b.points.length,cz=b.points.reduce((n,v)=>n+v[1],0)/b.points.length;
  for(let i=1;i<b.points.length;i++){const a=b.points[i-1],q=b.points[i],l=Math.hypot(q[0]-a[0],q[1]-a[1]);if(l<4)continue;const angle=Math.atan2(q[1]-a[1],q[0]-a[0]),mx=(a[0]+q[0])/2,mz=(a[1]+q[1])/2;if(routeDistance(mx,mz)>95)continue;let nx=-Math.sin(angle),nz=Math.cos(angle);if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
   const detail=(u:number,y:number,w:number,h:number,m:T.Material,depth=.16,offset=.15)=>box(a[0]+Math.cos(angle)*u+nx*offset,y,a[1]+Math.sin(angle)*u+nz*offset,w,h,depth,m,angle);
   detail(l/2,b.height-.2,l,.4,trim,.5);detail(l/2,3.8,l,.35,trim,.35);
   const bays=Math.max(1,Math.round(l/(p.bay||3.6))),step=l/bays,fh=b.height/p.floors;
   for(let f=0;f<p.floors;f++)for(let j=0;j<bays;j++){const u=(j+.5)*step,y=(f+.5)*fh,w=step*(p.grid?.78:.5),h=fh*.65;detail(u,y,w+.22,h+.22,trim);detail(u,y,w,h,glass,.12,.26);const divisions=p.grid?4:2;for(let k=1;k<divisions;k++){detail(u-w/2+w*k/divisions,y,.065,h,frame,.12,.35);detail(u,y-h/2+h*k/divisions,w,.055,frame,.12,.35);}if(p.grid)detail((j+1)*step,b.height/2,.23,b.height,trim,.3);}
  }
 }
 // The Brannan: opening and paths follow OSM; beds and elevations approximate the supplied May 2025 photo.
 const courtStone=mat('#d3cfc0'),courtPave=mat('#b6b5af'),hedge=mat('#405b29'),soil=mat('#655c44');
 const courtOutline:Point[]=[[365.17,366.68],[392.07,339.69],[409.64,357.59],[417.47,358.36],[407.66,368.01],[386.72,388.59]];
 slab(courtOutline,courtPave,.18);
 for(const path of courtyardPaths)line(path.points,2.2,pale,.205);
 // Local axes run northeast along Brannan and southeast into the planted courtyard.
 const cp=(u:number,v:number):Point=>[365.17+(u+v)*Math.SQRT1_2,366.68+(-u+v)*Math.SQRT1_2];
 const cb=(u:number,v:number,y:number,w:number,h:number,depth:number,m:T.Material)=>{const [x,z]=cp(u,v);box(x,y,z,w,h,depth,m,-Math.PI/4);};
 const bed=(u:number,v:number,w:number,depth:number)=>{
  const pts=[cp(u-w/2,v-depth/2),cp(u+w/2,v-depth/2),cp(u+w/2,v+depth/2),cp(u-w/2,v+depth/2),cp(u-w/2,v-depth/2)];
  slab(pts,soil,.64);
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);box((a[0]+b[0])/2,.43,(a[1]+b[1])/2,len,.5,.35,courtStone,angle);box((a[0]+b[0])/2,.93,(a[1]+b[1])/2,len-.25,.52,.65,hedge,angle);for(let k=1;k<len;k+=1.5)box(a[0]+(b[0]-a[0])*k/len,.43,a[1]+(b[1]-a[1])*k/len,.025,.48,.37,pale,angle);}
  for(let k=0;k<7;k++){const [x,z]=cp(u+Math.sin(k*2.4)*w*.29,v+Math.cos(k*3.1)*depth*.26),g=new T.SphereGeometry(1,10,7);g.scale(1.2,.7,1.1);g.translate(x,1,z);add(g,leaf);}
 };
 bed(9,7,12,9);bed(27,7,13,9);bed(5,23,6,7);bed(28,19,10,7);
 // Broad paved approach remains open between the front planters.
 for(let u=0;u<38;u+=2)line([cp(u,0),cp(u,2)],.025,pale,.22);
 for(const [u,v,h] of [[8,7,8],[27,8,9],[5,23,7],[27,20,8]]){const [x,z]=cp(u,v);rod(new T.Vector3(x,.6,z),new T.Vector3(x,h,z),.17,bark);for(let j=0;j<6;j++){const a=j*2.4,tx=x+Math.cos(a)*1.7,tz=z+Math.sin(a)*1.7;rod(new T.Vector3(x,h*.55,z),new T.Vector3(tx,h-.3,tz),.07,bark);const g=new T.SphereGeometry(1,12,9);g.scale(1.8,2.1,1.7);g.translate(tx,h+(j%2)*.7,tz);add(g,leaf);}}
 cb(10,3,1.35,3.3,1.2,.38,courtStone);
 // Oracle Park's mapped perimeter locates its facade; elevations and bay spacing are visual estimates.
 const stadiumBrick=mat('#985b49'),stadiumGlass=mat('#40575b');
 for(const stadium of survey.stadium){for(let i=1;i<stadium.points.length;i++){const a=stadium.points[i-1],b=stadium.points[i],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(routeDistance(mx,mz)>90)continue;const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<3)continue;const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);box(mx,10,mz,len,20,2,stadiumBrick,angle);box(mx,15,mz,len,.65,2.3,pale,angle);box(mx,20,mz,len,.7,2.5,pale,angle);
  const bays=Math.max(1,Math.round(len/7)),step=len/bays;for(let j=0;j<bays;j++){const u=(j+.5)*step,x=a[0]+Math.cos(angle)*u,z=a[1]+Math.sin(angle)*u;box(x,9,z,step*.57,12,2.12,stadiumGlass,angle);for(let k=0;k<6;k++)box(x,3+k*2,z,step*.58,.09,2.2,dark,angle);box(x,9,z,.12,12,2.25,dark,angle);box(a[0]+Math.cos(angle)*j*step,10,a[1]+Math.sin(angle)*j*step,.5,20,2.4,pale,angle);}
  // Open steel upper tier, kept open rather than filling the whole stadium with a solid block.
  box(mx,25,mz,len,.25,2,dark,angle);for(let u=0;u<len;u+=8){const x=a[0]+Math.cos(angle)*u,z=a[1]+Math.sin(angle)*u;rod(new T.Vector3(x,20,z),new T.Vector3(x,30,z),.15,dark);rod(new T.Vector3(x,20,z),new T.Vector3(x+Math.cos(angle)*Math.min(8,len-u),30,z+Math.sin(angle)*Math.min(8,len-u)),.09,dark);}
 }}
 const inPolygon=(p:Point,pts:Point[])=>{let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 const southBeach=survey.parks.find(p=>p.id===23750468)!;
 const beachHeight=(x:number,z:number)=>{if(!inPolygon([x,z],southBeach.points))return .15;const cx=632,cz=565;let edge=100;for(let i=1;i<southBeach.points.length;i++){const a=southBeach.points[i-1],b=southBeach.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));edge=Math.min(edge,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return .15+.85*Math.min(1,edge/7)*Math.exp(-((x-cx)**2+(z-cz)**2)/2500);};
 const lawnSurface=(pts:Point[],height:(x:number,z:number)=>number)=>{const g=new T.ShapeGeometry(new T.Shape(pts.map(p=>new T.Vector2(p[0],p[1])))).toNonIndexed(),v=g.getAttribute('position'),out:number[]=[];const split=(a:Point,b:Point,c:Point,depth=0)=>{const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);if(Math.max(ab,bc,ca)>5&&depth<12){if(ab>=bc&&ab>=ca){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];split(a,m,c,depth+1);split(m,b,c,depth+1);}else if(bc>=ca){const m=[(b[0]+c[0])/2,(b[1]+c[1])/2];split(a,b,m,depth+1);split(a,m,c,depth+1);}else{const m=[(c[0]+a[0])/2,(c[1]+a[1])/2];split(a,b,m,depth+1);split(m,b,c,depth+1);}return;}for(const p of [a,c,b])out.push(p[0],height(p[0],p[1]),p[1]);};for(let i=0;i<v.count;i+=3)split([v.getX(i),v.getY(i)],[v.getX(i+1),v.getY(i+1)],[v.getX(i+2),v.getY(i+2)]);g.dispose();const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(out,3));mesh.computeVertexNormals();add(mesh,grass);};
 for(const p of survey.parks){slab(p.points,pale,.09);if(p.id===23750468)lawnSurface(p.points,beachHeight);}
 // Brannan Wharf's lawn has its own mapped outline, not a shrunken copy of the park boundary.
 for(const lawn of survey.lawns){lawnSurface(lawn.points,()=>.48);for(let i=1;i<lawn.points.length;i++){const a=lawn.points[i-1],b=lawn.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);for(let u=0;u<len;u+=1.65){const l=Math.min(1.63,len-u),x=a[0]+Math.cos(angle)*(u+l/2),z=a[1]+Math.sin(angle)*(u+l/2);box(x,.26,z,l,.48,.48,pale,angle);}}}
 for(const path of survey.parkPaths){for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(!survey.parks.some(p=>inPolygon(mid,p.points)))continue;line([a,b],2.1,pale,beachHeight(mid[0],mid[1])+.04);}}
 for(const playground of survey.playgrounds){slab(playground.points,mat('#a49476'),.2);line(playground.points,.25,pale,.24);}
 const seatWood=mat('#88745a');
 for(const bench of survey.benches){const [x,z]=bench.point;let best=Infinity,angle=0;for(const path of survey.parkPaths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],distance=Math.hypot(x-(a[0]+b[0])/2,z-(a[1]+b[1])/2);if(distance<best){best=distance;angle=Math.atan2(b[1]-a[1],b[0]-a[0]);}}const h=beachHeight(x,z),length=Math.max(1.3,Math.min(5.5,bench.seats*.48)),seat=bench.white?pale:seatWood;for(let j=0;j<4;j++)box(x-Math.sin(angle)*(j*.12-.18),h+.48,z+Math.cos(angle)*(j*.12-.18),length,.07,.09,seat,angle);box(x-Math.sin(angle)*.23,h+.85,z+Math.cos(angle)*.23,length,.52,.08,seat,angle);for(const u of [-length*.35,length*.35])box(x+Math.cos(angle)*u,h+.25,z+Math.sin(angle)*u,.09,.5,.48,dark,angle);}
 // Mapped roof footprint 443021970 is an open shade canopy, not a ten-metre masonry building.
 const canopy=d.buildings.find(b=>b.id===443021970);if(canopy){slab(canopy.points,dark,3.8);for(let i=1;i<canopy.points.length;i++){const a=canopy.points[i-1],b=canopy.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<8)continue;for(let u=0;u<len;u+=7){const x=a[0]+(b[0]-a[0])*u/len,z=a[1]+(b[1]-a[1])*u/len;box(x,1.9,z,.14,3.8,.14,dark);}}}
 const flowering=mat('#75644f');for(let i=1;i<southBeach.points.length;i++){const a=southBeach.points[i-1],b=southBeach.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(routeDistance((a[0]+b[0])/2,(a[1]+b[1])/2)>35)continue;for(let u=.6;u<len;u+=1.1){const x=a[0]+(b[0]-a[0])*u/len,z=a[1]+(b[1]-a[1])*u/len,g=new T.SphereGeometry(1,10,7);g.scale(.72,.45,.7);g.translate(x,beachHeight(x,z)+.4,z);add(g,flowering);}}
 for(const art of survey.art){const [x,z]=art.point,redSteel=mat('#a84e42'),top=new T.Vector3(x,15,z);for(let j=0;j<3;j++){const a=j*Math.PI*2/3;const base=new T.Vector3(x+Math.cos(a)*3.5,.3,z+Math.sin(a)*3.5),delta=top.clone().sub(base),g=new T.BoxGeometry(.62,delta.length(),.38);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...base.clone().add(top).multiplyScalar(.5).toArray());add(g,redSteel);}const ring=new T.TorusGeometry(2.2,.28,8,32,Math.PI*1.5);ring.rotateY(.5);ring.translate(x,16,z);add(ring,redSteel);}
 for(const tree of survey.trees){const [x,z]=tree.point;if(Math.hypot(x-90,z-490)<170||routeDistance(x,z)>90)continue;
  if(tree.palm){palmGeometry(x,z,10+(tree.id%4),add,{bark,leaves:palmLeaves});
  }else{rod(new T.Vector3(x,0,z),new T.Vector3(x,6,z),.2,bark);for(let j=0;j<3;j++){const g=new T.SphereGeometry(1,10,7);g.scale(2.4,2.7,2.3);g.translate(x+Math.cos(j*2.1)*1.1,6.5+(j%2),z+Math.sin(j*2.1)*1.1);add(g,leaf);}}
 }
 for(const lamp of survey.lamps){const [x,z]=lamp.point;if(routeDistance(x,z)>70)continue;rod(new T.Vector3(x,0,z),new T.Vector3(x,6.5,z),.075,blue);box(x,.2,z,.4,.4,.4,blue);const g=new T.SphereGeometry(.24,8,6);g.scale(1,1.7,1);g.translate(x,6.6,z);add(g,pale);box(x,7.02,z,.43,.1,.43,blue);}
 for(const track of survey.rails){line(track.points,2.2,pale,.09);for(let i=1;i<track.points.length;i++){const a=track.points[i-1],b=track.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);for(const side of [-1,1]){const nx=-Math.sin(angle)*.718*side,nz=Math.cos(angle)*.718*side;line([[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz]],.065,rail,.12);}for(let u=.6;u<len;u+=1.2)box(a[0]+Math.cos(angle)*u,.115,a[1]+Math.sin(angle)*u,.13,.02,1.85,dark,angle);}}
 // Observed lane types, fitted to the game's simplified road widths; not surveyed lane boundaries.
 let along=0;const green=mat('#628c62'),red=mat('#a6534f');
 for(let i=1;i<d.route.length;i++){const a=d.route[i-1],b=d.route[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]),section=d.course?.sections.findLast(s=>s.start<=along+.1)?.name;along+=l;if(section!=='3rd Street')continue;const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),offset=4.8,nx=-Math.sin(angle)*offset,nz=Math.cos(angle)*offset;line([[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz]],3,red,.102);}
 for(const [m,gs] of groups){if(!gs.length)continue;const g=mergeGeometries(gs);if(!g)throw new Error('Route scenery geometry could not be merged');const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);gs.forEach(g=>g.dispose());}
 return ()=>groundGrass.texture.dispose();
}
