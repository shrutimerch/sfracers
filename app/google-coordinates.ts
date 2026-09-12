import {Matrix4,Vector3} from 'three';
/** WGS84 Earth coordinates to the game's east/up/south metre frame. */
export function earthToGame(latDegrees=37.786,lonDegrees=-122.395){
 const lat=latDegrees*Math.PI/180,lon=lonDegrees*Math.PI/180;
 const a=6378137,e2=6.69437999014e-3,n=a/Math.sqrt(1-e2*Math.sin(lat)**2);
 const origin=new Vector3(n*Math.cos(lat)*Math.cos(lon),n*Math.cos(lat)*Math.sin(lon),n*(1-e2)*Math.sin(lat));
 const east=new Vector3(-Math.sin(lon),Math.cos(lon),0);
 const up=new Vector3(Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat));
 const south=new Vector3(Math.sin(lat)*Math.cos(lon),Math.sin(lat)*Math.sin(lon),-Math.cos(lat));
 return new Matrix4().makeBasis(east,up,south).setPosition(origin).invert();
}
