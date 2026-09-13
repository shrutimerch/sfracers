"""Import citywide OSM crossing/cycleway ways and retain a bounded game subset.

Usage: python3 scripts/import-road-markings.py /tmp/sf-road-markings-osm.json
Query: rel(111968);map_to_area->.sf;(way[footway=crossing](area.sf);
way[cycleway](area.sf);way["cycleway:left"](area.sf);
way["cycleway:right"](area.sf);way["cycleway:both"](area.sf);
way[highway=cycleway](area.sf););out geom;
Unknown paint colours and unmarked crossings are retained as source data,
not converted into asserted green lanes or marked crosswalks.
"""
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
raw = json.loads(Path(sys.argv[1]).read_text())
if raw.get('remark') or len(raw['elements']) < 1000:
    raise ValueError('Incomplete citywide Overpass export')
elements = [e for e in raw['elements'] if e.get('geometry') and len(e['geometry']) >= 2]
groups = {
    'crossings': [e for e in elements if e['tags'].get('footway') == 'crossing'],
    'bikeRoads': [e for e in elements if e['tags'].get('highway') != 'cycleway' and any(k in e['tags'] for k in ['cycleway','cycleway:left','cycleway:right','cycleway:both'])],
    'cycleways': [e for e in elements if e['tags'].get('highway') == 'cycleway'],
}
def project(e):
    return {'id':e['id'],'tags':e['tags'],'points':[[round((p['lon']+122.395)*87900,3),round((37.786-p['lat'])*111200,3)] for p in e['geometry']]}
city = {key:[project(e) for e in values] for key,values in groups.items()}
path = root/'public/streets.json'
world = json.loads(path.read_text())
world['roadMarkings'] = city
world['roadMarkingSource'] = {'source':'© OpenStreetMap contributors, ODbL','osmTimestamp':raw['osm3s']['timestamp_osm_base'],'counts':{k:len(v) for k,v in city.items()},'notes':'Mapped crossing ways and cycleways. Coverage is incomplete. Explicit paint, side, buffer and separation tags are preserved; untagged styles and protection dimensions require estimates or a visual survey.'}
temp = path.with_suffix('.json.tmp')
temp.write_text(json.dumps(world,separators=(',',':')))
temp.replace(path)
course = json.loads((root/'public/race-course.json').read_text())
xs = [p[0] for p in course['route']]; zs = [p[1] for p in course['route']]
def nearby(e):
    pts = project(e)['points']
    return max(p[0] for p in pts)>=min(xs)-180 and min(p[0] for p in pts)<=max(xs)+180 and max(p[1] for p in pts)>=min(zs)-180 and min(p[1] for p in pts)<=max(zs)+180
for key,name in [('crossings','route-crosswalks-osm'),('bikeRoads','route-bike-lanes-osm'),('cycleways','route-cycleways-osm')]:
    subset = {**raw,'elements':[e for e in groups[key] if nearby(e)]}
    (root/'reference'/f'{name}.json').write_text(json.dumps(subset,separators=(',',':')))
subprocess.run([sys.executable,str(root/'scripts/build-road-markings.py')],check=True)
print(json.dumps(world['roadMarkingSource'],indent=2))
