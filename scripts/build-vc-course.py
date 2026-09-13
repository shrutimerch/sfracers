import json,math,heapq
from pathlib import Path
p=Path('public/streets.json');d=json.loads(p.read_text())
legs=[('Brannan Street',(59.99,656.64),(255.89,460.18)),('2nd Street',(255.89,460.18),(391.72,598.46)),('Townsend Street',(391.72,598.46),(-785.67,1772.83)),('8th Street',(-785.67,1772.83),(-918.2,1634.26)),('Brannan Street',(-918.2,1634.26),(59.99,656.64))]
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
out={**d,'route':route,'course':{'name':'VC Circuit','length':round(length,2),'sections':sections,'targetSeconds':180,'description':'Brannan → 2nd → Townsend → 8th → Brannan','source':'Existing OpenStreetMap street centerlines; closed-course game ignores normal traffic directions.'}}
# Extend mapped buildings west to Pear's block, retaining existing geometry.
known={b['id'] for b in d['buildings']}
for w in json.loads(Path('public/vc-buildings-osm.json').read_text())['elements']:
 if w['id'] in known:continue
 t=w.get('tags',{});points=[[round((g['lon']+122.395)*87900,2),round((37.786-g['lat'])*111200,2)] for g in w['geometry']]
 try:height=float(t.get('height',float(t.get('building:levels',3))*3.5))
 except ValueError:height=10.5
 d['buildings'].append({'id':w['id'],'points':points,'height':height,'facade':'brick' if t.get('building') in ['industrial','warehouse'] or w['id']==143294965 else 'masonry','address':t.get('addr:housenumber',''),'street':t.get('addr:street',''),'name':t.get('name','')})
landmarks=[]
for name,bid,address,url in [('South Park Commons',1171034242,'380 Brannan St','https://www.southparkcommons.com/'),('a16z',129176903,'180 Townsend St','https://a16z.com/offices/'),('Pear VC',143294965,'600 Townsend St','https://pear.vc/contact-us/')]:
 b=next(b for b in d['buildings'] if b['id']==bid)
 # Marker at the closest facade edge to the driving line, on the mapped footprint.
 best=(float('inf'),None)
 for a,c in zip(b['points'],b['points'][1:]):
  m=[(a[0]+c[0])/2,(a[1]+c[1])/2]
  for u,v in zip(route,route[1:]):
   dx,dz=v[0]-u[0],v[1]-u[1];t=max(0,min(1,((m[0]-u[0])*dx+(m[1]-u[1])*dz)/(dx*dx+dz*dz or 1)))
   dist=math.dist(m,[u[0]+t*dx,u[1]+t*dz])
   if dist<best[0]:best=(dist,m)
 landmarks.append({'name':name,'buildingId':bid,'address':address,'source':url,'position':best[1],'height':b['height']+4,'frontageDistance':round(best[0],2)})
out['course']['landmarks']=landmarks
Path('public/vc-course.json').write_text(json.dumps(out,separators=(',',':')))
print(json.dumps(out['course'],indent=2))
