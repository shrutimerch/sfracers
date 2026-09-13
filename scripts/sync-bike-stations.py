"""Project the retained public Lyft station feed onto the current race corridor.

Refresh reference/bay-wheels-station-information.json from
https://gbfs.lyft.com/gbfs/2.3/bay/en/station_information.json before running.
Station positions/capacities are published by Lyft. Dock-row direction follows
the nearest street and is an estimate; bike occupancy is static modeled scenery.
"""
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw = json.loads((root/'reference/bay-wheels-station-information.json').read_text())
path = root/'public/race-course.json'
course = json.loads(path.read_text())

def nearest(point, roads):
    best = (float('inf'), 0)
    for road in roads:
        for a,b in zip(road,road[1:]):
            dx,dz = b[0]-a[0],b[1]-a[1]
            t = max(0,min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dz)/(dx*dx+dz*dz or 1)))
            dist = math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dz)
            if dist < best[0]: best = (dist,math.atan2(dz,dx))
    return best

stations = []
for station in raw['data']['stations']:
    point = [(station['lon']+122.395)*87900,(37.786-station['lat'])*111200]
    distance,_ = nearest(point,[course['route']])
    if distance > 50 or station.get('is_virtual_station',False) or not station.get('capacity',0): continue
    _,angle = nearest(point,[r['points'] for r in course['roads']])
    stations.append({'id':station['station_id'],'name':station['name'],'position':[round(v,3) for v in point],
                     'latitude':station['lat'],'longitude':station['lon'],'angle':round(angle,7),
                     'capacity':station['capacity'],'routeDistance':round(distance,3)})
if not stations: raise ValueError('No physical bike stations found near course')
course['bikeStations'] = sorted(stations,key=lambda s:s['name'])
course['bikeStationSource'] = {'url':'https://gbfs.lyft.com/gbfs/2.3/bay/en/station_information.json',
                             'lastUpdated':raw['last_updated'],'routeBufferMeters':50,
                             'notes':'Published station anchor positions and capacities; dock-row orientation and static bike occupancy are modeled estimates. Nearby off-route stations beyond 50m are excluded.'}
path.write_text(json.dumps(course,separators=(',',':')))
print(json.dumps(course['bikeStations'],indent=2))
