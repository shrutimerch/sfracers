import json,math,heapq
from pathlib import Path
p=Path('public/streets.json');d=json.loads(p.read_text())
legs=[('South Park',(-7.71,588.26),(186.72,392.26)),('2nd Street',(186.72,392.26),(255.89,460.18)),('Brannan Street',(255.89,460.18),(597.85,139.16)),('The Embarcadero',(597.85,139.16),(577.35,467.0)),('Townsend Street',(577.35,467.0),(195.36,793.37)),('3rd Street',(195.36,793.37),(-7.71,588.26))]
route=[];sections=[];length=0
for name,start,end in legs:
 graph={}
 for r in d['roads']:
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
out={**d,'route':route,'course':{'name':'South Park Waterfront Circuit','length':round(length,2),'sections':sections,'targetSeconds':120,'description':'South Park → 2nd → Brannan → Embarcadero → Townsend → 3rd','source':'Existing OpenStreetMap street centerlines; closed-course game ignores normal traffic directions.'}}
Path('public/race-course.json').write_text(json.dumps(out,separators=(',',':')))
print(json.dumps(out['course'],indent=2))
