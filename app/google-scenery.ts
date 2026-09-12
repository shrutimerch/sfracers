import * as T from 'three';
import {TilesRenderer} from '3d-tiles-renderer/three';
import {GoogleCloudAuthPlugin} from '3d-tiles-renderer/core/plugins';
import {GLTFExtensionsPlugin} from '3d-tiles-renderer/three/plugins';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {earthToGame} from './google-coordinates';
export function createGoogleScenery(scene:T.Scene,camera:T.Camera,renderer:T.WebGLRenderer,key:string){
 const tiles=new TilesRenderer();
 tiles.registerPlugin(new GoogleCloudAuthPlugin({apiToken:key,autoRefreshToken:false}));
 const draco=new DRACOLoader();draco.setDecoderPath('/draco/');
 tiles.registerPlugin(new GLTFExtensionsPlugin({dracoLoader:draco,autoDispose:true}));
 tiles.errorTarget=3;tiles.downloadQueue.maxJobsPerOrigin=6;tiles.parseQueue.maxJobs=2;
 tiles.lruCache.maxSize=300;tiles.lruCache.minSize=220;
 tiles.group.matrixAutoUpdate=false;tiles.group.matrix.copy(earthToGame());tiles.group.updateMatrixWorld(true);
 tiles.setCamera(camera);scene.add(tiles.group);
 const started=performance.now();let error='',lastProbe=0,lastHeight:number|null=null,disposed=false;
 const ray=new T.Raycaster();ray.ray.direction.set(0,-1,0);ray.near=0;ray.far=600;
 tiles.addEventListener('load-error',event=>{if(!event.tile){error='Google scenery could not connect. Check the Maps key, billing, and Map Tiles API quota.';}});
 return {
  get error(){return error;},
  get ready(){return lastHeight!==null;},
  update(x:number,z:number,now:number){
   if(disposed||error)return lastHeight;
   // Do not create a fresh root session for laps, restarts, or camera changes.
   if(now-started>165*60*1000){error='This scenery session has ended. Reload when you want to start a new session.';return lastHeight;}
   tiles.setResolutionFromRenderer(camera,renderer);tiles.group.updateMatrixWorld(true);tiles.update();
   if(now-lastProbe>200){lastProbe=now;ray.ray.origin.set(x,300,z);
    const hits=ray.intersectObject(tiles.group,true);const ground=hits.find(hit=>hit.point.y<70&&hit.point.y>-100);
    if(ground)lastHeight=lastHeight===null?ground.point.y:T.MathUtils.lerp(lastHeight,ground.point.y,.5);
   }
   if(lastHeight===null&&now-started>60000)error='The street surface is taking too long to load. You can reload or use modeled scenery.';
   return lastHeight;
  },
  credits(){return tiles.getAttributions().filter(a=>a.type==='string').map(a=>String(a.value)).filter(Boolean).join('; ');},
  dispose(){if(disposed)return;disposed=true;scene.remove(tiles.group);tiles.dispose();}
 };
}
