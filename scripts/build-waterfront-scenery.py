"""Project retained OSM source coordinates; never synthesize fixture positions."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def source(name):return json.loads((root/'reference'/f'waterfront-{name}-osm.json').read_text())['elements']
def point(p):return [round((p['lon']+122.395)*87900,3),round((37.786-p['lat'])*111200,3)]
def points(e):return [point(p) for p in e.get('geometry',[])]
d={'parks':[{'id':e['id'],'name':e['tags']['name'],'points':points(e)} for e in source('parks')],
   'trees':[{'id':e['id'],'point':point(e),'palm':e.get('tags',{}).get('leaf_type')=='palm'} for e in source('trees')],
   'lamps':[{'id':e['id'],'point':point(e)} for e in source('lamps')],
   'rails':[{'id':e['id'],'points':points(e)} for e in source('rail')],
   'stadium':[]}
full=json.loads((root/'reference'/'oracle-park-full-osm.json').read_text())['elements']
nodes={e['id']:e for e in full if e['type']=='node'}
for e in full:
 if e['type']=='way':d['stadium'].append({'id':e['id'],'points':[point(nodes[n]) for n in e['nodes']]})
details=[]
for name in ['south-beach-details-osm.json','brannan-wharf-details-osm.json']:
 details+=json.loads((root/'reference'/name).read_text())['elements']
d['parkPaths']=[{'id':e['id'],'points':points(e)} for e in details if e.get('tags',{}).get('highway')=='footway' and e.get('tags',{}).get('footway')!='crossing' and not e.get('tags',{}).get('bridge')]
d['benches']=[{'id':e['id'],'point':point(e),'white':e.get('tags',{}).get('colour')=='white','seats':int(e.get('tags',{}).get('seats','3'))} for e in details if e.get('tags',{}).get('amenity')=='bench']
d['lawns']=[{'id':e['id'],'points':points(e)} for e in details if e.get('tags',{}).get('landuse')=='grass']
d['playgrounds']=[{'id':e['id'],'points':points(e)} for e in details if e.get('tags',{}).get('leisure')=='playground']
art=json.loads((root/'reference'/'south-beach-art-osm.json').read_text())['elements'][0]
b=art['bounds'];d['art']=[{'id':art['id'],'point':point({'lat':(b['minlat']+b['maxlat'])/2,'lon':(b['minlon']+b['maxlon'])/2})}]
(root/'app'/'waterfront-geometry.ts').write_text('// Generated from retained OpenStreetMap data by scripts/build-waterfront-scenery.py.\nconst data='+json.dumps(d,separators=(',',':'))+';\nexport default data;\n')
print({k:len(v) for k,v in d.items()})
