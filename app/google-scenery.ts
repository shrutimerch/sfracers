import * as T from 'three';
import {TilesRenderer} from '3d-tiles-renderer/three';
import {GoogleCloudAuthPlugin} from '3d-tiles-renderer/core/plugins';
import {GLTFExtensionsPlugin} from '3d-tiles-renderer/three/plugins';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {earthToGame} from './google-coordinates';
import {createStreetCamera} from './street-camera';
export function createGoogleScenery(scene:T.Scene,camera:T.Camera,renderer:T.WebGLRenderer,key:string){
 const tiles=new TilesRenderer();
 tiles.registerPlugin(new GoogleCloudAuthPlugin({apiToken:key,autoRefreshToken:false}));
 const draco=new DRACOLoader();draco.setDecoderPath('/draco/');
 tiles.registerPlugin(new GLTFExtensionsPlugin({dracoLoader:draco,autoDispose:true}));
 tiles.errorTarget=1;tiles.downloadQueue.maxJobsPerOrigin=6;tiles.parseQueue.maxJobs=2;
 tiles.lruCache.maxSize=500;tiles.lruCache.minSize=350;
 tiles.group.matrixAutoUpdate=false;tiles.group.matrix.copy(earthToGame());tiles.group.updateMatrixWorld(true);
 tiles.setCamera(camera);scene.add(tiles.group);
 const started=performance.now();let error='',lastProbe=0,lastHeight:number|null=null,disposed=false;
 const streets=createStreetCamera(tiles.group);let stableSince=0,ready=false;
 const groundCamera=new T.PerspectiveCamera(70,1,.1,250);groundCamera.up.set(0,0,-1);tiles.setCamera(groundCamera);tiles.setResolution(groundCamera,512,512);
 tiles.addEventListener('load-error',event=>{if(!event.tile){error='Google scenery could not connect. Check the Maps key, billing, and Map Tiles API quota.';}});
 return {
  get error(){return error;},
  get ready(){return ready;},
  keepCameraClear(anchor:T.Vector3,desired:T.Vector3){return streets.keepClear(anchor,desired);},
  update(x:number,z:number,now:number){
   if(disposed||error)return lastHeight;
   // Do not create a fresh root session for laps, restarts, or camera changes.
   if(now-started>165*60*1000){error='This scenery session has ended. Reload when you want to start a new session.';return lastHeight;}
   groundCamera.position.set(x,(lastHeight??-20)+35,z);groundCamera.lookAt(x,lastHeight??-20,z);groundCamera.updateMatrixWorld(true);
   tiles.setResolutionFromRenderer(camera,renderer);tiles.group.updateMatrixWorld(true);tiles.update();
   if(now-lastProbe>150){lastProbe=now;
    const height=streets.ground(x,z,lastHeight);
    if(height!==null){
     if(lastHeight===null||Math.abs(height-lastHeight)>.25)stableSince=now;
     lastHeight=lastHeight===null?height:T.MathUtils.lerp(lastHeight,height,.35);
    }
   }
   if(lastHeight!==null&&stableSince>0&&now-stableSince>1800)ready=true;
   if(lastHeight===null&&now-started>60000)error='The street surface is taking too long to load. You can reload or use modeled scenery.';
   return lastHeight;
  },
  credits(){return tiles.getAttributions().filter(a=>a.type==='string').map(a=>String(a.value)).filter(Boolean).join('; ');},
  dispose(){if(disposed)return;disposed=true;scene.remove(tiles.group);tiles.dispose();}
 };
}
