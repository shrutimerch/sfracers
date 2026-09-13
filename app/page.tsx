'use client';
import {useEffect,useRef,useState} from 'react';
import {START,STOPS,distance,bearing,loadStreetView,type Position} from './street-challenge';
type Mode='loading'|'ready'|'playing'|'paused'|'finished'|'error';
const clock=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
export default function Home(){
 const host=useRef<HTMLDivElement>(null),viewer=useRef<any>(null),targets=useRef<any[]>([]),startPano=useRef(''),current=useRef<Position>(START),active=useRef(0),modeRef=useRef<Mode>('loading');
 const [mode,setMode]=useState<Mode>('loading'),[step,setStep]=useState(0),[elapsed,setElapsed]=useState(0),[meters,setMeters]=useState<number|null>(null),[message,setMessage]=useState('Finding photographs of South Park…'),[dated,setDated]=useState('');
 function changeMode(next:Mode){modeRef.current=next;setMode(next);}
 function measure(){const p=viewer.current?.getPosition();if(!p)return;current.current={lat:p.lat(),lng:p.lng()};const target=targets.current[active.current];if(target)setMeters(Math.round(distance(current.current,target.position)));}
 useEffect(()=>{let disposed=false;let panorama:any;let watchdog:ReturnType<typeof setTimeout>;
  async function setup(){try{
   const response=await fetch('/api/scenery');if(!response.ok)throw Error('The scenery settings could not load. Please reload.');const config=await response.json() as {googleMapsKey:string};if(!config.googleMapsKey)throw Error('Street View is available on the published game. Open the live site to play.');
   const maps=await loadStreetView(config.googleMapsKey);if(disposed)return;
   const service=new maps.StreetViewService();
   const locate=async(position:Position)=>{const {data}=await service.getPanorama({location:position,radius:35,preference:maps.StreetViewPreference.NEAREST,sources:[maps.StreetViewSource.OUTDOOR]});const p=data.location?.latLng;if(!p||!data.location?.pano)throw Error('Street View coverage is unavailable for this stretch. Please try again later.');return {pano:data.location.pano,position:{lat:p.lat(),lng:p.lng()},date:data.imageDate};};
   const locations=await Promise.all([START,...STOPS].map(locate));if(disposed||!host.current)return;
   if(new Set(locations.map(p=>p.pano)).size!==locations.length)throw Error('Street View returned overlapping checkpoints. This route needs adjusting before play.');
   startPano.current=locations[0].pano;targets.current=locations.slice(1);setDated(locations[0].date||'');
   panorama=new maps.StreetViewPanorama(host.current,{pano:locations[0].pano,pov:{heading:bearing(locations[0].position,locations[1].position),pitch:0},zoom:0,linksControl:true,panControl:true,zoomControl:true,addressControl:true,fullscreenControl:false,enableCloseButton:false,showRoadLabels:true,motionTracking:false,motionTrackingControl:false,clickToGo:true});viewer.current=panorama;
   panorama.addListener('position_changed',measure);
   panorama.addListener('status_changed',()=>{if(panorama.getStatus()==='OK'){clearTimeout(watchdog);if(modeRef.current==='loading'){changeMode('ready');setMessage('');}measure();}else if(panorama.getStatus()==='ZERO_RESULTS'){changeMode('error');setMessage('This photograph is unavailable. Reload to return to South Park.');}});
   watchdog=setTimeout(()=>{if(modeRef.current==='loading'){changeMode('error');setMessage('Street View could not display the photographs. Reload to try again.');}},20000);
   // The initial status can already be ready before the event listener attaches.
   if(panorama.getStatus()==='OK'){clearTimeout(watchdog);changeMode('ready');setMessage('');measure();}
  }catch(e){if(!disposed){changeMode('error');setMessage(e instanceof Error?e.message:'Street View is unavailable.');}}}
  setup();return()=>{disposed=true;clearTimeout(watchdog);if(panorama){panorama.setVisible(false);(window as any).google?.maps?.event.clearInstanceListeners(panorama);}viewer.current=null;};
 },[]);
 useEffect(()=>{if(mode!=='playing')return;let last=performance.now();const timer=setInterval(()=>{const now=performance.now();setElapsed(s=>s+(now-last)/1000);last=now;},200);return()=>clearInterval(timer);},[mode]);
 useEffect(()=>{const pause=()=>{if(document.hidden&&modeRef.current==='playing')changeMode('paused');};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
 function start(){active.current=0;setStep(0);setElapsed(0);setMessage('');viewer.current.setPano(startPano.current);viewer.current.setPov({heading:bearing(START,targets.current[0].position),pitch:0});changeMode('playing');measure();}
 function claim(){measure();const target=targets.current[active.current];if(!target||modeRef.current!=='playing')return;
  if(distance(current.current,target.position)>18&&viewer.current.getPano()!==target.pano){setMessage('Keep following the street arrows. Get within 18 m to check in.');return;}
  const next=active.current+1;active.current=next;setStep(next);if(next===STOPS.length){changeMode('finished');setMessage('All three checkpoints found.');}else{setMessage('Checkpoint found! On to the next.');measure();}
 }
 function hint(){const target=targets.current[active.current];if(!target)return;viewer.current.setPov({heading:bearing(current.current,target.position),pitch:0});setMessage('You’re looking toward the next checkpoint. Follow the street to reach it.');}
 const blocked=mode!=='playing'&&mode!=='ready';
 return <main className="sv-game"><header className="sv-header"><a className="brand" href="/"><span className="brand-mark">SF</span> SOUTH PARK <em>QUEST</em></a><span className="sv-tag">STREET VIEW CHALLENGE</span><a href="/kart">Kart prototype</a></header>
 <div className="sv-body"><section className="sv-view" aria-label="Explore South Park in Google Street View"><div className="sv-panorama" ref={host}/>{(mode==='loading'||mode==='error')&&<div className="sv-loading" role="status"><span className="eyebrow">SOUTH PARK · SAN FRANCISCO</span><h1>{mode==='error'?'A little detour.':'Opening South Park.'}</h1><p>{message}</p>{mode==='error'&&<button className="sv-primary" onClick={()=>location.reload()}>Try again</button>}</div>}{(mode==='paused'||mode==='finished')&&<div className="sv-cover"><h2>{mode==='paused'?'Take your time.':'You found them all.'}</h2><p>{mode==='paused'?'Your timer is paused.':`Three checkpoints in ${clock(elapsed)}.`}</p><button className="sv-primary" onClick={()=>mode==='paused'?changeMode('playing'):start()}>{mode==='paused'?'Keep exploring':'Play again'}</button></div>}</section>
 <aside className="sv-panel"><div className="sv-heading"><span className="eyebrow">A SHORT WALK. A QUICK CHALLENGE.</span><h1>Find your way<br/>around South Park.</h1><p>Real street photographs. Three checkpoints. How quickly can you find them?</p></div><div className="sv-score"><div><span>YOUR TIME</span><b>{clock(elapsed)}</b></div><div><span>CHECKPOINTS</span><b>{Math.min(step,3)} <small>/ 3</small></b></div></div>
 <ol className="sv-stops">{STOPS.map((stop,i)=><li key={stop.name} className={i<step?'done':i===step?'active':''}><span className="sv-number">{i<step?'✓':`0${i+1}`}</span><div><h2>{stop.name}</h2>{i===step&&<p>{stop.clue}</p>}</div></li>)}</ol>
 {mode==='ready'?<button className="sv-primary" onClick={start}>Start the challenge →</button>:mode==='playing'?<><div className="sv-distance">{meters===null?'Locating…':meters<=18?'You’re close enough to check in':`${meters} m to the next checkpoint`}</div><button className="sv-primary" onClick={claim}>I’m here — check in</button><div className="sv-actions"><button onClick={hint}>Point me toward it</button><button onClick={()=>changeMode('paused')}>Pause</button></div></>:null}
 {mode==='playing'&&message&&<p className="sv-message" role="status">{message}</p>}<div className="sv-how"><b>How to explore</b><p>Drag the photograph to look around. Click the arrows on the street to move. Reach each checkpoint in order and check in.</p><p>On a keyboard, focus the photograph and use the arrow keys.</p></div><a className="sv-reset" aria-disabled={blocked} onClick={e=>{e.preventDefault();if(!blocked&&viewer.current){viewer.current.setPano(startPano.current);measure();}}} href="#">Return to the starting point</a></aside></div>
 <footer className="sv-footer"><span>South Park, SoMa · San Francisco{dated?` · Starting image: ${dated}`:''}</span><a href="/about">Scenery & privacy</a></footer></main>;
}
