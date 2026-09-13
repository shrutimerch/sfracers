type Road={name:string;points:number[][];width?:number};
// User's January 2025 Street View reference: the Second Street entrance has nose-in bays on both sides.
export const isEastParkEntrance=(r:Road)=>r.name==='South Park'&&r.points.length<5&&r.points.every(p=>p[0]>=149&&p[1]<431);
export const isWestParkEntrance=(r:Road)=>r.name==='South Park'&&r.points.length<5&&r.points.every(p=>p[0]<31&&p[1]>549);
export function parkParking(roads:Road[]){
 const cars:{x:number;z:number;angle:number;noseIn:boolean}[]=[];
 for(const road of roads.filter(r=>r.name==='South Park')){const west=isWestParkEntrance(road),noseIn=isEastParkEntrance(road)||west;let along=0;const total=road.points.slice(1).reduce((s,b,i)=>s+Math.hypot(b[0]-road.points[i][0],b[1]-road.points[i][1]),0);let next=8;
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
   while(next<along+len){const u=next-along;next+=west?8:noseIn?5:8.5;if(next>(total-(west?15:5))||len<.01)continue;const x=a[0]+Math.cos(angle)*u,z=a[1]+Math.sin(angle)*u;
    for(const side of noseIn?[-1,1]:[1]){if(west&&side===-1)continue;if(noseIn&&!west&&side===1&&next-5>=12&&next-5<=28)continue;let nx=-Math.sin(angle)*side,nz=Math.cos(angle)*side;if(!noseIn&&(x-90)*nx+(z-490)*nz<0){nx=-nx;nz=-nz;}const offset=noseIn?5.05:3.5;cars.push({x:x+nx*offset,z:z+nz*offset,angle:noseIn?Math.atan2(nz,nx):angle,noseIn});}
   }along+=len;
  }
 }
 return cars;
}

export function parkBikeDock(roads:Road[]){const bikes:{x:number;z:number;angle:number}[]=[];for(const road of roads.filter(r=>isEastParkEntrance(r)||isWestParkEntrance(r))){const side=isWestParkEntrance(road)?-1:1;for(let station=13;station<=27;station+=1.65){let along=0;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(station<=along+len){const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),u=station-along,nx=-Math.sin(angle)*side,nz=Math.cos(angle)*side;bikes.push({x:a[0]+Math.cos(angle)*u+nx*5.8,z:a[1]+Math.sin(angle)*u+nz*5.8,angle:Math.atan2(nz,nx)});break;}along+=len;}}}return bikes;}
