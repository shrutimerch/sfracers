"""Project public OSM geometry into the same metre grid as the existing city."""
import json, pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def point(g):return [round((g['lon']+122.395)*87900,2),round((37.786-g['lat'])*111200,2)]
data=json.loads((root/'public/streets.json').read_text())
raw=json.loads((root/'../work/osm-soma.json').read_text())
ring=next(w for w in raw['elements'] if w['id']==8916553)
data['route']=[point(g) for g in ring['geometry']]
# Keep the original start point while following the mapped one-way ring.
start=min(range(len(data['route'])-1),key=lambda i:sum((a-b)**2 for a,b in zip(data['route'][i],[62.88,541.74])))
r=data['route'][:-1];data['route']=r[start:]+r[:start]+[r[start]]
rawbuild=json.loads((root/'../work/buildings.json').read_text())
tags={w['id']:w.get('tags',{}) for w in rawbuild['elements']}
for b in data['buildings']:
 t=tags.get(b.get('id'),{});b['address']=t.get('addr:housenumber','');b['street']=t.get('addr:street','');b['name']=t.get('name','')
 if b['street']=='South Park' and 'height' not in t:b['height']=9
extra=json.loads((root/'public/south-park-osm.json').read_text())
data['parkDetails']={'trees':[point(w) for w in extra['elements'] if w['type']=='node'],'paths':[{'id':w['id'],'points':[point(g) for g in w['geometry']],'crossing':w.get('tags',{}).get('footway')=='crossing','sidewalk':w.get('tags',{}).get('footway')=='sidewalk'} for w in extra['elements'] if w['type']=='way' and w.get('tags',{}).get('highway')=='footway']}
(root/'public/streets.json').write_text(json.dumps(data,separators=(',',':')))
