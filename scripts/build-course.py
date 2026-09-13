import json,math,heapq
from pathlib import Path
p=Path('public/streets.json');d=json.loads(p.read_text())
# Use the mapped Herb Caen Way promenade and its existing connecting crossings.
raw={w['id']:w for w in json.loads(Path('public/waterfront-paths-osm.json').read_text())['elements']}
def projected(wid):return [[round((g['lon']+122.395)*87900,2),round((37.786-g['lat'])*111200,2)] for g in raw[wid]['geometry']]
entry=list(reversed(projected(162324920)))
walk=list(reversed(projected(196662101)));walk=walk[walk.index([632.55,141.86]):]
exit=projected(740061019);exit=exit[:exit.index([576.77,478.56])+1]
promenade=entry+walk[1:]+exit[1:]
d['paths']=[{'name':'Waterfront Promenade','points':promenade,'width':10,'sourceWayIds':[162324920,196662101,740061019]}]
legs=[('South Park',(-7.71,588.26),(186.72,392.26)),('2nd Street',(186.72,392.26),(255.89,460.18)),('Brannan Street',(255.89,460.18),(624.42,141.02)),('Waterfront Promenade',(624.42,141.02),(576.77,478.56)),('King Street',(576.77,478.56),(268.55,869.84)),('3rd Street',(268.55,869.84),(-7.71,588.26))]
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
out={**d,'route':route,'course':{'name':'South Park Waterfront Circuit','length':round(length,2),'sections':sections,'targetSeconds':120,'description':'South Park → 2nd → Brannan → Waterfront Promenade → King → 3rd','source':'OpenStreetMap street centerlines and Herb Caen Way pedestrian path; closed-course game ignores normal traffic directions.'}}
Path('public/race-course.json').write_text(json.dumps(out,separators=(',',':')))
print(json.dumps(out['course'],indent=2))
