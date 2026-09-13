import {parkGrass} from './park-ground';
import {hasRouteProfile} from './route-profiles';
import playgroundSource from './playground-geometry';
import {southParkProfiles} from './south-park-profiles';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {MapData,Point} from './engine';
import type {Building} from './building-geometry';
import {buildingGeometry} from './building-geometry';

// Surveyed OSM geometry; architectural and planting details are reference-based approximations.
export const parkCenter=new T.Vector2(90,490);
export const isLocal=(b:Building)=>b.points.some(([x,z])=>Math.hypot(x-90,z-490)<155);
export function buildSouthPark(scene:T.Scene,d:MapData){
 const textures:T.Texture[]=[];
 let seed=8241;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const groups=new Map<T.Material,T.BufferGeometry[]>();
 const mat=(color:string,roughness=.9)=>new T.MeshStandardMaterial({color,roughness,side:T.DoubleSide});
 const concrete=mat('#b7b8ad'),edge=mat('#90968b'),steel=mat('#7c8583',.48),bark=mat('#777164'),wood=mat('#847354'),dark=mat('#343a39'),glass=mat('#40535a',.25);
 const leaves=['#34492d','#435334','#4b5c39','#536344'].map(c=>mat(c));
 const add=(g:T.BufferGeometry,m:T.Material)=>{if(!groups.has(m))groups.set(m,[]);groups.get(m)!.push(g);};
 const box=(x:number,y:number,z:number,w:number,h:number,l:number,m:T.Material,a=0)=>{const g=new T.BoxGeometry(w,h,l);g.rotateY(-a);g.translate(x,y,z);add(g,m);};
 const ellipsoid=(x:number,y:number,z:number,rx:number,ry:number,rz:number,m:T.Material)=>{const g=new T.SphereGeometry(1,12,8);g.scale(rx,ry,rz);g.translate(x,y,z);add(g,m);};
 const rod=(a:T.Vector3,b:T.Vector3,r:number,m:T.Material,r2=r)=>{const delta=b.clone().sub(a),g=new T.CylinderGeometry(r2,r,delta.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,m);};
 const slab=(pts:Point[],m:T.Material,y=.15)=>{const shape=new T.Shape(pts.map(([x,z])=>new T.Vector2(x,-z)));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,y,0);add(g,m);};
 const strip=(pts:Point[],width:number,m:T.Material,y=.18)=>{for(let i=1;i<pts.length;i++){const [x,z]=pts[i-1],[xx,zz]=pts[i],len=Math.hypot(xx-x,zz-z);box((x+xx)/2,y,(z+zz)/2,len,.12,width,m,Math.atan2(zz-z,xx-x));}};
 const surface=(base:string,amount:number,repeat:number)=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,256,256);for(let i=0;i<14000;i++){const k=random();ctx.fillStyle=`rgba(${k>.5?'255,255,240':'25,30,22'},${random()*amount})`;ctx.fillRect(random()*256,random()*256,1+random()*2,1+random()*2);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);textures.push(t);return new T.MeshStandardMaterial({map:t,roughness:1});};
 const parkTurf=parkGrass();textures.push(parkTurf.texture);const grass=parkTurf.material,gravel=surface('#b7ab91',.35,1),asphalt=surface('#646965',.14,18);
 bark.map=surface('#807a6c',.5,2).map;
 // Ground UVs are in metres, preserving grain scale at driving height.
 const texturedSlab=(pts:Point[],m:T.Material,y:number)=>{const shape=new T.Shape(pts.map(([x,z])=>new T.Vector2(x,-z)));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,y,0);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/9,uv.getY(i)/9);add(g,m);};
 const park=d.parks![0];texturedSlab(park,grass,.13);strip(park,.34,edge,.22);
 // South Park's residential carriageway is much narrower than the surrounding arterials.
 for(const road of d.roads.filter(r=>r.name==='South Park'))strip(road.points,9.8,asphalt,.065);
 // Pale staggered unit paving is visible at both entrance necks in survey views 1 and 6.
 const pavers=['#a8a38f','#b1ab97','#b8b29f','#a9a690'].map(mat);
 for(const road of d.roads.filter(r=>r.name==='South Park'&&r.points.length<8)){
  const pts=road.points;let travelled=0;const total=pts.slice(1).reduce((n,b,i)=>n+Math.hypot(b[0]-pts[i][0],b[1]-pts[i][1]),0);
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
   for(let u=.25;u<len;u+=.5){const along=travelled+u,nearPark=road.points[0][0]>100?total-along:along;if(nearPark>20)continue;for(let v=-4.65;v<4.7;v+=.26){const stagger=Math.round(v/.26)%2?.25:0;box(a[0]+Math.cos(angle)*(u+stagger)-Math.sin(angle)*v,.146,a[1]+Math.sin(angle)*(u+stagger)+Math.cos(angle)*v,.477,.025,.237,pavers[Math.abs(Math.round(u*2+v*4))%4],angle);}}
   travelled+=len;
  }
 }
 // The park boundary and paths sit over the road's inner edge, following actual survey points.
 texturedSlab(park,grass,.16);strip(park,.32,edge,.25);
 for(const path of d.parkDetails?.paths||[]){
  if(path.crossing){const a=path.points[0],b=path.points.at(-1)!,len=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);for(let s=.5;s<len;s+=1.35)box(a[0]+Math.cos(ang)*s,.25,a[1]+Math.sin(ang)*s,.65,.025,2.7,concrete,ang);continue;}
  if(path.id===549848273){
   // Rounded transverse concrete fingers are the renovation's distinctive path language.
   const curve=new T.CatmullRomCurve3(path.points.map(([x,z])=>new T.Vector3(x,0,z)));const len=curve.getLength();
   for(let s=0;s<len;s+=1.45){const p=curve.getPointAt(s/len),v=curve.getTangentAt(s/len),angle=Math.atan2(v.z,v.x),w=5.3+Math.sin(s*.09)*1.2;
    const sh=new T.Shape();const r=.68,h=w/2;sh.moveTo(-r,-h+r);sh.lineTo(-r,h-r);sh.absarc(0,h-r,r,Math.PI,0,true);sh.lineTo(r,-h+r);sh.absarc(0,-h+r,r,0,-Math.PI,true);const g=new T.ShapeGeometry(sh,8);g.rotateX(-Math.PI/2);g.rotateY(-angle);g.translate(p.x,.26,p.z);add(g,concrete);
   }
  }else strip(path.points,path.sidewalk?2.1:3.3,concrete,.2);
 }
 // Park-local frame: long axis runs northeast, perpendicular axis across the green.
 const local=(u:number,v:number)=>new T.Vector3(90+u*.704+v*.710,0,490-u*.710+v*.704);
 for(const [u,v,rx,rz] of [[-58,0,11,7],[0,2,12,7],[54,-1,10,6]]){
  const p=local(u,v);const pts:Point[]=[];for(let a=0;a<=Math.PI*2+.01;a+=Math.PI/32){const q=local(u+Math.cos(a)*rx,v+Math.sin(a)*rz);pts.push([q.x,q.z]);}texturedSlab(pts,gravel,.275);
  // Picnic tables with galvanized frames and adjacent round stools.
  for(const offset of [-3,3]){const q=p.clone().add(new T.Vector3(offset*.63,0,-offset*.776));box(q.x,.86,q.z,2.1,.1,.85,wood,-.89);for(const s of [-1,1]){const seat=q.clone().add(new T.Vector3(s*.776*.78,0,s*.63*.78));box(seat.x,.48,seat.z,2.1,.1,.3,wood,-.89);for(const end of [-.75,.75]){const leg=q.clone().add(new T.Vector3(end*.63,0,-end*.776));rod(leg.clone().setY(.2),leg.clone().setY(.83),.045,steel);}}}
  for(let j=0;j<4;j++){const q=local(u-5+j*1.2,v+4);rod(q.clone().setY(.2),q.clone().setY(.65),.055,steel);const g=new T.CylinderGeometry(.25,.25,.045,12);g.translate(q.x,.67,q.z);add(g,steel);}
 }
 // Low curved retaining walls and timber seat slats, never a tall fence.
 for(const [u,v,sign] of [[-32,-6,1],[27,6,-1]]){const pts:Point[]=[];for(let i=0;i<=24;i++){const q=local(u-12+i,v+sign*Math.sin(i/24*Math.PI)*2);pts.push([q.x,q.z]);}strip(pts,.55,concrete,.49);for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];box((a[0]+b[0])/2,.6,(a[1]+b[1])/2,.9,.07,.57,wood,Math.atan2(b[1]-a[1],b[0]-a[0]));}}
 // Mature, branched plane trees and evergreen crowns at mapped tree locations.
 for(const [index,[x,z]] of (d.parkDetails?.trees||[]).entries()){
  const h=12+random()*5,base=new T.Vector3(x,.2,z),top=new T.Vector3(x+.3,h*.45,z-.3);rod(base,top,.44+random()*.17,bark,.23);
  const evergreen=index%4===0||index%7===0;
  for(let j=0;j<6;j++){const a=j*Math.PI/3+random(),reach=1.6+random()*1.9,end=new T.Vector3(x+Math.cos(a)*reach,h*(.7+random()*.2),z+Math.sin(a)*reach);rod(top,end,.19,bark,.055);
   for(let k=0;k<3;k++){const tip=end.clone().add(new T.Vector3((random()-.5)*3,1+random()*1.8,(random()-.5)*3));rod(end,tip,.045,bark,.009);if(evergreen)for(let n=0;n<180;n++){
     const az=random()*Math.PI*2,cy=random()*2-1,rr=Math.cbrt(random()),rad=Math.sqrt(1-cy*cy)*rr;
     const g=new T.PlaneGeometry(.24+random()*.24,.11+random()*.16);
     g.rotateX(random()*Math.PI);g.rotateY(random()*Math.PI*2);g.rotateZ(random()*Math.PI);
     g.translate(tip.x+Math.cos(az)*rad*1.65,tip.y+cy*rr*(evergreen?2:1.1),tip.z+Math.sin(az)*rad*1.65);add(g,leaves[(j+k+n)%4]);
    }
    else for(let n=0;n<3;n++){const twig=tip.clone().add(new T.Vector3((random()-.5)*1.6,.5+random(),(random()-.5)*1.6));rod(tip,twig,.015,bark,.004);}
   }
  }
 }
 // Shrubby planting pockets along the curb, with gaps at every mapped entrance.
 const entrances=(d.parkDetails?.paths||[]).filter(p=>!p.sidewalk).flatMap(p=>[p.points[0],p.points.at(-1)!]);
 for(let i=1;i<park.length;i++){const a=park[i-1],b=park[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let s=0;s<len;s+=1.2){const x=a[0]+(b[0]-a[0])*s/len,z=a[1]+(b[1]-a[1])*s/len;if(entrances.some(p=>Math.hypot(p[0]-x,p[1]-z)<3.4))continue;if(random()<.65)ellipsoid(x+(90-x)*.012,.43,z+(490-z)*.012,.7,.35,.65,leaves[i%4]);}}
 // White looping play sculpture with a suspended rope lattice.
 const feature=playgroundSource.elements.find(w=>w.tags.playground==='structure')!;
 const footprint=feature.geometry.slice(0,-1).map(g=>new T.Vector2((g.lon+122.395)*87900,(37.786-g.lat)*111200));
 const play=footprint.reduce((sum,p)=>sum.add(p),new T.Vector2()).divideScalar(footprint.length);
 let xx=0,zz=0,xz=0;for(const p of footprint){const x=p.x-play.x,z=p.y-play.y;xx+=x*x;zz+=z*z;xz+=x*z;}
 const playAngle=.5*Math.atan2(2*xz,xx-zz),ca=Math.cos(playAngle),sa=Math.sin(playAngle);
 const us=footprint.map(p=>(p.x-play.x)*ca+(p.y-play.y)*sa),vs=footprint.map(p=>-(p.x-play.x)*sa+(p.y-play.y)*ca);
 const playLength=Math.max(...us)-Math.min(...us),playWidth=Math.max(...vs)-Math.min(...vs),net=mat('#666966');
 const playPoint=(u:number,y:number,v:number)=>new T.Vector3(play.x+ca*u-sa*v,y,play.y+sa*u+ca*v);
 // Position, orientation and plan dimensions follow OSM structure way 549848249.
 // Vertical rail profiles and rope detail remain a representative model.
 for(const side of [-1,1]){const ps:T.Vector3[]=[];for(let i=0;i<=40;i++){const t=i/40;ps.push(playPoint((t-.5)*playLength,.5+Math.sin(t*Math.PI)*3.4,side*playWidth*.4));}add(new T.TubeGeometry(new T.CatmullRomCurve3(ps),48,.09,8,false),concrete);}
 for(let i=0;i<=15;i++){const t=i/15;rod(playPoint((t-.5)*playLength*.95,.6+Math.sin(t*Math.PI)*2.7,-playWidth*.35),playPoint((t-.5)*playLength*.95,.6+Math.sin(t*Math.PI)*2.7,playWidth*.35),.024,net);}
 for(let i=0;i<7;i++){const ps=[];for(let j=0;j<=20;j++){const t=j/20;ps.push(playPoint((t-.5)*playLength*.95,.6+Math.sin(t*Math.PI)*2.7,(-.35+i*.7/6)*playWidth));}add(new T.TubeGeometry(new T.CatmullRomCurve3(ps),24,.022,4,false),net);}
 const label=(text:string,x:number,y:number,z:number,width:number,angle:number,bg='#244437',fg='#f6f2df')=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 45px Arial';ctx.fillText(text,256,66,490);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshStandardMaterial({map:t,roughness:.8,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=-angle;scene.add(m);};
 for(const u of [-75,75]){const p=local(u,0);rod(p.clone().setY(.15),p.clone().setY(3.1),.055,steel);label('SOUTH PARK',p.x,2.8,p.z,2.8,-.68);const q=local(u+4,1);box(q.x,.65,q.z,.5,1,.5,steel);}
 // Address-specific building footprints with actual depth: frames, mullions, lintels and storefronts.
 const palette=['#a79e8b','#bdbbae','#596366','#b5ad94','#866451','#c3c2b9','#727878'];
 for(const original of d.buildings.filter(b=>isLocal(b)&&!hasRouteProfile(b))){
  const profile=original.street==='South Park'?southParkProfiles[original.address||'']:undefined;const b=profile?{...original,height:profile.height}:original;
  const id=b.id||0,paint=mat(profile?.color||palette[id%palette.length]);const geom=buildingGeometry(b);add(geom.walls,paint);add(geom.roof,dark);
  const center=b.points.reduce((p,v)=>p.add(new T.Vector2(v[0],v[1])),new T.Vector2()).divideScalar(b.points.length);
  const facing=b.points.slice(1).map((p,i)=>{const a=b.points[i],mid=new T.Vector2((a[0]+p[0])/2,(a[1]+p[1])/2);return {a,b:p,mid,len:Math.hypot(p[0]-a[0],p[1]-a[1]),score:mid.distanceTo(parkCenter)};}).filter(e=>e.len>4).sort((a,b)=>a.score-b.score).slice(0,2);
  for(const wall of facing){const {a,b:bb,len,mid}=wall;const angle=Math.atan2(bb[1]-a[1],bb[0]-a[0]);let nx=-Math.sin(angle),nz=Math.cos(angle);if((mid.x-center.x)*nx+(mid.y-center.y)*nz<0){nx=-nx;nz=-nz;}
   const detail=(u:number,y:number,w:number,h:number,depth:number,m:T.Material,offset=.08)=>box(a[0]+Math.cos(angle)*u+nx*offset,y,a[1]+Math.sin(angle)*u+nz*offset,w,h,depth,m,angle);
   const trim=mat(profile?.trim||(id%3===0?'#d1cbbc':'#8c8e85'));const frameMat=profile?mat(profile.frames):dark;detail(len/2,b.height-.12,len+.25,.3,.38,trim);detail(len/2,3.5,len,.18,.23,trim);
   const bays=profile?.bays||Math.max(1,Math.floor(len/(profile?.style==='industrial'?4.2:3.1))),spacing=len/bays,floors=profile?.floors||Math.max(1,Math.round(b.height/3.3));
   if(profile?.ground)detail(len/2,1.8,len,3.6,.065,mat(profile.ground),.055);
   for(let floor=0;floor<floors;floor++)for(let j=0;j<bays;j++){const u=(j+.5)*spacing,y=floor===0?1.8:(profile?.arches?6.2:4.9)+(floor-1)*(b.height-(profile?.arches?7.8:5.5))/Math.max(1,floors-1);if(y+1>b.height-.4)continue;const w=spacing*(profile?.style==='industrial'?.84:floor===0?.8:.57),h=floor===0?2.6:profile?.style==='industrial'?2.3:1.85;
    detail(u,y,w+.2,h+.22,.17,trim);detail(u,y,w,h,.08,glass,.2);detail(u,y,.065,h,.11,frameMat,.26);detail(u,y+.12,w,.065,.12,frameMat,.26);detail(u,y-h/2-.13,w+.32,.15,.38,trim,.25);
    if(profile?.style==='industrial'){for(let k=1;k<4;k++)detail(u-w/2+w*k/4,y,.035,h,.12,frameMat,.29);for(let k=1;k<4;k++)detail(u,y-h/2+h*k/4,w,.035,.12,frameMat,.29);}
    if(profile?.arches&&floor===0){const arcY=y+h/2;const pts:T.Vector3[]=[];for(let k=0;k<=20;k++){const t=Math.PI*k/20,uu=u+Math.cos(t)*w/2;pts.push(new T.Vector3(a[0]+Math.cos(angle)*uu+nx*.28,arcY+Math.sin(t)*w/2,a[1]+Math.sin(angle)*uu+nz*.28));}add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,.07,5,false),frameMat);const shape=new T.Shape();shape.absarc(0,0,w/2,0,Math.PI,false);shape.lineTo(w/2,0);const g=new T.ShapeGeometry(shape,16);g.rotateY(Math.atan2(nx,nz));g.translate(a[0]+Math.cos(angle)*u+nx*.2,arcY,a[1]+Math.sin(angle)*u+nz*.2);add(g,glass);}
   
   }
   if(b.street==='South Park'&&wall===facing[0]){label(b.address||'SOUTH PARK',mid.x+nx*.35,3.12,mid.y+nz*.35,Math.min(2.4,len*.4),Math.atan2(nx,nz)*-1,'#393f3e');}
   // Brick coursing on brick warehouses: shallow mortar lines remain sharp close up.
   if(profile?.style==='brick'||(!profile&&(id%4===0||b.address==='164')))for(let y=.25;y<b.height-.4;y+=.26)detail(len/2,y,len,.018,.012,trim,.025);
   if(profile?.style==='siding'){for(let y=.3;y<b.height-.5;y+=.23)detail(len/2,y,len,.018,.01,trim,.02);detail(len/2,b.height-.45,len+.35,.18,.55,trim,.18);}
   if(profile?.awning){detail(len/2,3.05,len*.54,.12,1,frameMat,.5);}
   if(b.address==='135'&&wall===facing[0]){detail(len*.26,1.6,len*.30,2.8,.11,frameMat,.31);for(let k=1;k<6;k++)detail(len*.26,.2+k*.46,len*.29,.04,.12,trim,.4);}
   if(b.address==='164'){const fins=mat('#784536');for(let u=.15;u<len;u+=.42)detail(u,b.height/2,.12,b.height,.5,fins,.4);}
  }
 }
 // Parked cars occupy the outside curb; the clear racing line stays on the road.
 const route=d.route;let travelled=0;
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);for(let s=4;s<len-3;s+=9){travelled++;if(travelled%3===0||Math.hypot(a[0]-90,a[1]-490)>125)continue;const mid=new T.Vector2(a[0]+Math.cos(ang)*s,a[1]+Math.sin(ang)*s);let nx=-Math.sin(ang),nz=Math.cos(ang);if((mid.x-90)*nx+(mid.y-490)*nz<0){nx=-nx;nz=-nz;}const x=mid.x+nx*3.5,z=mid.y+nz*3.5,body=mat(['#dadbd5','#343b42','#afb3b1','#243c4a','#6e3431'][travelled%5]);box(x,.65,z,4.2,.75,1.75,body,ang);box(x,1.18,z,2.2,.62,1.5,glass,ang);box(x,1.53,z,2.2,.06,1.53,body,ang);for(const dx of [-1.25,1.25])for(const dz of [-.84,.84]){const q=new T.Vector3(x+Math.cos(ang)*dx-Math.sin(ang)*dz,.42,z+Math.sin(ang)*dx+Math.cos(ang)*dz);ellipsoid(q.x,q.y,q.z,.32,.32,.26,dark);}}
 }
 for(const [m,geoms] of groups){if(!geoms.length)continue;const g=mergeGeometries(geoms,false);const mesh=new T.Mesh(g,m);mesh.castShadow=m!==grass&&m!==asphalt&&m!==gravel;mesh.receiveShadow=true;scene.add(mesh);geoms.forEach(g=>g.dispose());}
 return ()=>textures.forEach(t=>t.dispose());
}
