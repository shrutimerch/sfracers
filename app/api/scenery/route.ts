import {env} from 'cloudflare:workers';
export async function GET(){
 // Browser Maps keys are public by design; restrict this one by HTTPS referrer and API in Google Cloud.
 const key=(env as unknown as Record<string,string>).GOOGLE_MAPS_BROWSER_KEY||'';
 return Response.json({googleMapsKey:key},{headers:{'Cache-Control':'no-store'}});
}
