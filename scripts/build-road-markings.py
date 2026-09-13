"""Keep OSM crossing and cycleway tags with their projected geometry."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def features(name):
 data=json.loads((root/'reference'/name).read_text())
 return [dict(id=e['id'],tags=e['tags'],points=[[round((p['lon']+122.395)*87900,3),round((37.786-p['lat'])*111200,3)] for p in e['geometry']]) for e in data['elements'] if e.get('geometry')]
payload={'crossings':features('route-crosswalks-osm.json'),'bikeRoads':features('route-bike-lanes-osm.json'),'cycleways':features('route-cycleways-osm.json')}
(root/'game'/'scenery'/'data'/'road-marking-data.ts').write_text('// Generated from retained OSM source files by scripts/build-road-markings.py.\nconst data='+json.dumps(payload,separators=(',',':'))+';\nexport default data;\n')
print({k:len(v) for k,v in payload.items()})
