import json,html
from pathlib import Path
d=json.loads(Path('public/race-course.json').read_text());r=d['route'];xs=[p[0] for p in r];ys=[p[1] for p in r];minx,miny=min(xs)-150,min(ys)-150;w=max(xs)-minx+150;h=max(ys)-miny+150
p=lambda ps:' '.join(f'{(x-minx)/w*900+50:.1f},{(y-miny)/h*750+50:.1f}' for x,y in ps)
s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 850"><rect width="1000" height="850" fill="#e8eeeb"/>']
for b in d['buildings']:s.append(f'<polygon points="{p(b["points"])}" fill="#bccbc9"/>')
for road in d['roads']:s.append(f'<polyline points="{p(road["points"])}" fill="none" stroke="#fcfffc" stroke-width="5"/>')
s.append(f'<polyline points="{p(r)}" fill="none" stroke="#183b43" stroke-width="12" stroke-linejoin="round"/>');s.append(f'<polyline points="{p(r)}" fill="none" stroke="#b0e743" stroke-width="6" stroke-linejoin="round"/>')
for i,section in enumerate(d['course']['sections']):
 accumulated=0;point=r[0]
 for a,b in zip(r,r[1:]):
  if accumulated>=section['start']-.02:point=a;break
  accumulated+=((b[0]-a[0])**2+(b[1]-a[1])**2)**.5
 m={'position':point,'name':str(i+1)+'. '+section['name']}
 x,y=map(float,p([m['position']]).split(','));label=html.escape(m['name']);s.append(f'<circle cx="{x}" cy="{y}" r="12" fill="#ff784f" stroke="#fff" stroke-width="3"/><text x="{x-18 if x>650 else x+18}" y="{y-22}" text-anchor="{'end' if x>650 else 'start'}" font-family="sans-serif" font-size="18" font-weight="bold" fill="#183b43" stroke="#e8eeeb" stroke-width="5" paint-order="stroke">{label}</text>')
s.append('<text x="40" y="35" font-family="sans-serif" font-size="18" fill="#183b43">A · WATERFRONT CIRCUIT — 2.11 KM</text><text x="940" y="40" font-family="sans-serif" font-size="20">N ↑</text><text x="40" y="825" font-family="sans-serif" font-size="14">Mapped street centerlines · © OpenStreetMap contributors</text></svg>')
Path('public/course-map.svg').write_text(''.join(s))
