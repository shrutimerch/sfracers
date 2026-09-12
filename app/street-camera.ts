import * as T from 'three';

const down=new T.Vector3(0,-1,0),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
/** Ignore walls, canopy jumps, and back faces when locating a drivable surface. */
export function streetSurface(hits:T.Intersection[],previous:number|null){
 const surfaces=hits.filter(hit=>{
  if(!hit.face||hit.point.y < -100||hit.point.y>70)return false;
  normalMatrix.getNormalMatrix(hit.object.matrixWorld);
  normal.copy(hit.face.normal).applyMatrix3(normalMatrix).normalize();
  return normal.y>.65&&(previous===null||Math.abs(hit.point.y-previous)<2.5);
 });
 return surfaces.length?Math.min(...surfaces.map(hit=>hit.point.y)):null;
}
export function createStreetCamera(world:T.Object3D){
 const ray=new T.Raycaster(),delta=new T.Vector3();
 return {
  ground(x:number,z:number,previous:number|null){
   const heights:number[]=[];
   for(const [dx,dz] of [[0,0],[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]]){
    ray.set(new T.Vector3(x+dx,previous===null?100:previous+3,z+dz),down);ray.near=0;ray.far=previous===null?200:6;
    const height=streetSurface(ray.intersectObject(world,true),previous);if(height!==null)heights.push(height);
   }
   heights.sort((a,b)=>a-b);
   // A low median excludes raised parked cars and tree crowns at the road edge.
   return heights.length>=2?heights[Math.floor((heights.length-1)/2)]:null;
  },
  keepClear(anchor:T.Vector3,desired:T.Vector3){
   delta.subVectors(desired,anchor);const length=delta.length();if(length<.001)return desired;
   ray.set(anchor,delta.divideScalar(length));ray.near=0;ray.far=length+.6;
   const hit=ray.intersectObject(world,true)[0];
   if(hit)desired.copy(anchor).addScaledVector(delta,Math.max(0,hit.distance-.65));
   return desired;
  }
 };
}
