import * as T from 'three';
export type FacadeKind='brick'|'masonry'|'glass';
export type Building={points:number[][];height:number;facade?:FacadeKind;id?:number;address?:string;street?:string;name?:string};
/** Each facade image represents two window bays and two floors, about 8 × 7 metres. */
export function buildingGeometry(building:Building){
 const position:number[]=[],uv:number[]=[];
 for(let i=1;i<building.points.length;i++){
  const [ax,az]=building.points[i-1],[bx,bz]=building.points[i];
  const length=Math.hypot(bx-ax,bz-az);if(length<.05)continue;
  const u=Math.max(.5,Math.round(length/4)/2),v=Math.max(1,Math.round(building.height/3.5))/2;
  position.push(ax,0,az,bx,0,bz,ax,building.height,az,bx,0,bz,bx,building.height,bz,ax,building.height,az);
  uv.push(0,0,u,0,0,v,u,0,u,v,0,v);
 }
 const walls=new T.BufferGeometry();walls.setAttribute('position',new T.Float32BufferAttribute(position,3));walls.setAttribute('uv',new T.Float32BufferAttribute(uv,2));walls.computeVertexNormals();
 const shape=new T.Shape(building.points.map(([x,z])=>new T.Vector2(x,-z)));
 const roof=new T.ShapeGeometry(shape);roof.rotateX(-Math.PI/2);roof.translate(0,building.height,0);
 return {walls,roof};
}
