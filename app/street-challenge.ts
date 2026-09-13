export type Position={lat:number;lng:number};
export const START={lat:37.78112824,lng:-122.39428464};
export const STOPS=[
 {lat:37.78153,lng:-122.39379,name:'Along the park',clue:'Follow South Park northeast, with the park on your left.'},
 {lat:37.78194,lng:-122.39329,name:'The far bend',clue:'Continue along the same side until the street begins to curve.'},
 {lat:37.78216,lng:-122.39347,name:'Around the corner',clue:'Follow the bend around the end of the park.'},
];
export function distance(a:Position,b:Position){const k=Math.PI/180,dy=(b.lat-a.lat)*k,dx=(b.lng-a.lng)*k;const h=Math.sin(dy/2)**2+Math.cos(a.lat*k)*Math.cos(b.lat*k)*Math.sin(dx/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function bearing(a:Position,b:Position){const k=Math.PI/180;return (Math.atan2(Math.sin((b.lng-a.lng)*k)*Math.cos(b.lat*k),Math.cos(a.lat*k)*Math.sin(b.lat*k)-Math.sin(a.lat*k)*Math.cos(b.lat*k)*Math.cos((b.lng-a.lng)*k))/k+360)%360;}
// Load one official viewer per page, including when React remounts in development.
let loading:Promise<any>|null=null;
export function loadStreetView(key:string){
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const w=window as any;if(w.google?.maps?.StreetViewPanorama){resolve(w.google.maps);return;}
  const timer=setTimeout(()=>reject(Error('Street View took too long to connect. Please reload.')),25000);
  w.initSouthParkStreetView=()=>{clearTimeout(timer);resolve(w.google.maps);};
  w.gm_authFailure=()=>{clearTimeout(timer);reject(Error('Street View could not connect with this website’s Maps key.'));};
  const script=document.createElement('script');script.async=true;script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=initSouthParkStreetView&v=quarterly`;
  script.onerror=()=>{clearTimeout(timer);reject(Error('Street View could not load. Check your connection and reload.'));};document.head.appendChild(script);
 });return loading;
}
