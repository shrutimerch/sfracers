// Footprint IDs from OSM; visible materials and window character from the route Street View survey.
// Window spacing and vertical proportions are modeled approximations, not measured elevations.
export type RouteProfile={color:string;trim:string;frames:string;floors:number;grid?:boolean;brick?:boolean;bay?:number};
export const routeProfiles:Record<number,RouteProfile>={
 148551351:{color:'#bdb7a4',trim:'#d3cfc0',frames:'#829b9c',floors:16,bay:4.5}, // The Brannan courtyard west tower
 148551352:{color:'#c3bdab',trim:'#d8d3c4',frames:'#829b9c',floors:16,bay:4.5}, // The Brannan courtyard east tower
 112927451:{color:'#956e5b',trim:'#805d4f',frames:'#414b43',floors:5,brick:true,bay:7}, // Warehouse at Second and Brannan, supplied May 2025 view
 112927456:{color:'#717c77',trim:'#8f9890',frames:'#34423e',floors:3,bay:4.3}, // Adjacent gray warehouse
 112758589:{color:'#976b55',trim:'#c3bcb0',frames:'#333d3d',floors:6,brick:true}, // 300 Brannan
 112775864:{color:'#d0d0c7',trim:'#dfded3',frames:'#626e6c',floors:6,grid:true,bay:5}, // 274 Brannan
 104599982:{color:'#dfded1',trim:'#eeeee1',frames:'#46585c',floors:2,grid:true,bay:6}, // Pier 38
 148547440:{color:'#9d6850',trim:'#625d52',frames:'#34514e',floors:5,brick:true}, // 128 King
 149167949:{color:'#b9b6a8',trim:'#dedbd0',frames:'#425766',floors:9,grid:true,bay:5}, // 188–190 King
 129176918:{color:'#9d7057',trim:'#b9a58b',frames:'#384846',floors:4,brick:true}, // 625 Third
};
export const hasRouteProfile=(b:{id?:number})=>!!routeProfiles[b.id??0];
