// Visual observations from ten Jan 2025 Street View views, inspected Sep 12 2026.
// Footprints retain OSM geometry. Heights and window proportions are visual estimates.
export type FacadeProfile={color:string;trim:string;frames:string;floors:number;height:number;bays?:number;style?:'industrial'|'brick'|'siding'|'wood'|'split';arches?:boolean;ground?:string;awning?:boolean};
export const southParkProfiles:Record<string,FacadeProfile>={
 '102':{color:'#aaa99c',trim:'#bec1b5',frames:'#617779',floors:3,height:10,bays:3,arches:true,ground:'#d6d0ab',awning:true},
 '1':{color:'#cbd0c9',trim:'#d8dbd0',frames:'#35494a',floors:3,height:18,bays:6,style:'industrial',arches:true},
 '2':{color:'#bc9470',trim:'#b3a18b',frames:'#465354',floors:3,height:12,style:'industrial'},
 '21':{color:'#d3cfb9',trim:'#b7b6a7',frames:'#25483e',floors:2,height:9,arches:true,style:'brick'},
 '54;56;58':{color:'#bfc3b9',trim:'#d0d1c8',frames:'#4f5a55',floors:3,height:12,style:'industrial',bays:4},
 '70':{color:'#747e72',trim:'#a4aa99',frames:'#354d43',floors:3,height:12,style:'industrial'},
 '84':{color:'#959c98',trim:'#c0c2b7',frames:'#53605a',floors:3,height:11,style:'industrial'},
 '106':{color:'#b5b9b1',trim:'#d0cec1',frames:'#626e68',floors:3,height:10.5,style:'siding'},
 '108;110':{color:'#29473a',trim:'#3c5743',frames:'#1f382f',floors:2,height:8,style:'siding',bays:3},
 '150':{color:'#303939',trim:'#414948',frames:'#393a34',floors:2,height:7.4,bays:3,style:'split',ground:'#d4d1c2',awning:true},
 '156':{color:'#788280',trim:'#646f6c',frames:'#334344',floors:2,height:7.5,bays:2,style:'industrial'},
 '158':{color:'#6e756e',trim:'#9a9b87',frames:'#344441',floors:2,height:9,bays:2,style:'industrial',arches:true},
 '181':{color:'#acb5b0',trim:'#dedfd3',frames:'#717e76',floors:4,height:13,style:'siding',bays:3},
 '135':{color:'#986a4e',trim:'#796452',frames:'#453e35',floors:2,height:8,style:'brick',bays:4},
 '101':{color:'#545e57',trim:'#60665b',frames:'#a37b45',floors:2,height:6.7,style:'wood',bays:5},
};
