import * as T from 'three';
// Dense feather-palm crown: outer fronds droop, inner spears rise. Shape is illustrative; locations are mapped.
export function palmGeometry(x:number,z:number,height:number,add:(g:T.BufferGeometry,m:T.Material)=>void,materials:{bark:T.Material;leaves:T.Material[]}){
 const trunk=new T.CylinderGeometry(.48,.67,height,16,30);const p=trunk.getAttribute('position');for(let i=0;i<p.count;i++){const y=p.getY(i),r=1+.035*Math.sin(y*28);p.setXYZ(i,p.getX(i)*r,y,p.getZ(i)*r);}trunk.computeVertexNormals();trunk.translate(x,height/2,z);add(trunk,materials.bark);
 for(let y=.3;y<height-.3;y+=.32){const g=new T.TorusGeometry(.67-(y/height)*.19,.027,3,16);g.rotateX(Math.PI/2);g.translate(x,y,z);add(g,materials.bark);}
 const verts:number[][]=[[],[],[]];
 for(let f=0;f<48;f++){const layer=f<20?0:f<37?1:2,n=layer===0?20:layer===1?17:11,k=layer===0?f:layer===1?f-20:f-37,a=k*Math.PI*2/n+layer*.21,reach=[5.2,4.6,3.3][layer]+Math.sin(f*2.37)*.65,lift=[1.6,2.0,2.6][layer]+Math.sin(f*1.1)*.7,drop=[3.8,1.8,-.6][layer]+Math.sin(f*.79)*.7;
  const at=(t:number)=>new T.Vector3(x+Math.cos(a)*reach*t,height+lift*Math.sin(t*Math.PI*.7)-drop*t*t,z+Math.sin(a)*reach*t);
  const curve=new T.CatmullRomCurve3(Array.from({length:10},(_,j)=>at(j/9)));add(new T.TubeGeometry(curve,16,.04,4,false),materials.leaves[layer]);
  const out=verts[layer];for(let j=2;j<32;j++){const t=j/33,c=at(t),length=1.5*Math.pow(Math.sin(t*Math.PI),.7),width=.13*Math.sin(t*Math.PI)+.035;for(const side of [-1,1]){
   const mid=new T.Vector3(c.x-Math.sin(a)*length*.58*side+Math.cos(a)*.25,c.y-.12,c.z+Math.cos(a)*length*.58*side+Math.sin(a)*.25),tip=new T.Vector3(c.x-Math.sin(a)*length*side+Math.cos(a)*.65,c.y-.55,c.z+Math.cos(a)*length*side+Math.sin(a)*.65);
   const l=mid.clone().add(new T.Vector3(Math.cos(a)*width,.045,Math.sin(a)*width)),r=mid.clone().add(new T.Vector3(-Math.cos(a)*width,-.045,-Math.sin(a)*width));
   out.push(...c.toArray(),...l.toArray(),...r.toArray(),...l.toArray(),...tip.toArray(),...r.toArray());
  }}
 }
 verts.forEach((v,i)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();add(g,materials.leaves[i]);});
 const crown=new T.SphereGeometry(1,12,8);crown.scale(1.2,1.6,1.2);crown.translate(x,height+.15,z);add(crown,materials.leaves[0]);
}
