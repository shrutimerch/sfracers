import json,math,heapq
from pathlib import Path
p=Path('public/streets.json');d=json.loads(p.read_text())
street_signs=d.get('streetSigns', [])
city_buildings=d['buildings']
# Preserve curated race scenery while refreshing buildings from the citywide source.
existing=json.loads(Path('public/race-course.json').read_text())
d={**existing,'roads':d['roads']}
# Retain the mapped Herb Caen Way promenade as scenery, separate from the road route.
raw={w['id']:w for w in json.loads(Path('public/waterfront-paths-osm.json').read_text())['elements']}
def projected(wid):return [[round((g['lon']+122.395)*87900,2),round((37.786-g['lat'])*111200,2)] for g in raw[wid]['geometry']]
walk=list(reversed(projected(196662101)));walk=walk[walk.index([632.55,141.86]):]
# Sidewalk scenery only: no broad racing surface or paved connectors across the road.
d['paths']=[{'name':'Waterfront Promenade','points':walk,'width':3,'sourceWayIds':[196662101]}]
legs=[('South Park',(-7.71,588.26),(186.72,392.26)),('2nd Street',(186.72,392.26),(255.89,460.18)),('Brannan Street',(255.89,460.18),(624.42,141.02)),('The Embarcadero',(624.42,141.02),(603.67,470.49)),('King Street',(603.67,470.49),(290.8,892.27)),('3rd Street',(290.8,892.27),(-7.71,588.26))]
route=[];sections=[];length=0
for name,start,end in legs:
 graph={}
 for r in d['roads']+d.get('paths',[]):
  if r['name']!=name:continue
  for a,b in zip(r['points'],r['points'][1:]):
   a,b=tuple(a),tuple(b);w=math.dist(a,b);graph.setdefault(a,[]).append((b,w));graph.setdefault(b,[]).append((a,w))
 queue=[(0,start,[])];seen=set()
 while queue:
  cost,node,path=heapq.heappop(queue)
  if node in seen:continue
  seen.add(node)
  if node==end:break
  for nxt,w in graph.get(node,[]):heapq.heappush(queue,(cost+w,nxt,path+[node]))
 else:raise Exception('Disconnected '+name)
 points=path+[end];sections.append({'name':name,'start':round(length,2),'length':round(cost,2)})
 route.extend(points if not route else points[1:]);length+=cost
out={**d,'route':route,'course':{'name':'South Park Waterfront Circuit','length':round(length,2),'sections':sections,'targetSeconds':120,'description':'South Park → 2nd → Brannan → Embarcadero → King → 3rd','source':'OpenStreetMap street centerlines; closed-course game ignores normal traffic directions.'}}
# Bundle nearby signs so the game does not fetch the citywide building dataset.
xs=[p[0] for p in route]; zs=[p[1] for p in route]
# Cover every sightline through the renderer's 1,800 m fog distance. Loading all
# 160,000 city footprints would waste memory on buildings invisible from this course.
margin=1800
bounds=[min(xs)-margin,min(zs)-margin,max(xs)+margin,max(zs)+margin]
def visible(b):
 bx=[p[0] for p in b['points']]; bz=[p[1] for p in b['points']]
 return bool(bx) and max(bx)>=bounds[0] and min(bx)<=bounds[2] and max(bz)>=bounds[1] and min(bz)<=bounds[3]
def building_key(b):return (b['id'],b.get('polygonIndex',0))
buildings={building_key(b):b for b in city_buildings if visible(b)}
# Existing course records contain hand-tuned facades and heights.
buildings.update({building_key(b):b for b in existing['buildings']})
out['buildings']=list(buildings.values())
out['buildingCoverage']={'source':'streets.json','marginMetres':margin,'bounds':bounds,'footprintCount':len(buildings)}
out['streetSigns']=[s for s in street_signs if min(xs)-180 <= s['intersectionPosition'][0] <= max(xs)+180 and min(zs)-180 <= s['intersectionPosition'][1] <= max(zs)+180]
Path('public/race-course.json').write_text(json.dumps(out,separators=(',',':')))
print(json.dumps(out['course'],indent=2))
