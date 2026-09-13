"""Merge a citywide Overpass building export into streets.json.

Download with:
curl -L --fail --compressed -G https://overpass-api.de/api/interpreter \
  --data-urlencode 'data=[out:json][timeout:180];rel(111968);map_to_area->.sf;(way[building][building!=no](area.sf);rel[building][building!=no](area.sf););out geom;' \
  -o /tmp/sf-all-buildings-osm.json
Then: python3 scripts/import-sf-buildings.py /tmp/sf-all-buildings-osm.json

Existing records retain their curated geometry, heights and facade choices.
Relation IDs are negative to avoid collisions with positive OSM way IDs;
multiple outer rings carry a polygonIndex. Courtyard rings are kept in holes.
This expands the source dataset only; race-course.json remains a local course.
"""

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re


def project(point):
    return [round((point[0] + 122.395) * 87900, 2),
            round((37.786 - point[1]) * 111200, 2)]


def coordinates(geometry):
    return [(p['lon'], p['lat']) for p in geometry]


def rings(members):
    pending = [coordinates(m['geometry']) for m in members if m.get('geometry')]
    result = []
    while pending:
        ring = pending.pop(0)
        while ring[0] != ring[-1]:
            for i, part in enumerate(pending):
                if ring[-1] == part[0]:
                    ring.extend(part[1:])
                elif ring[-1] == part[-1]:
                    ring.extend(reversed(part[:-1]))
                else:
                    continue
                pending.pop(i)
                break
            else:
                raise ValueError('Unclosed multipolygon ring in source')
        if len(set(ring)) < 3:
            raise ValueError('Degenerate footprint in source')
        result.append(ring)
    return result


def contains(ring, point):
    x, y = point
    inside = False
    for (ax, ay), (bx, by) in zip(ring, ring[1:]):
        if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax:
            inside = not inside
    return inside


def measurement(value):
    value = str(value).strip().lower()
    match = re.fullmatch(r'([0-9]+(?:\.[0-9]+)?)\s*(m|metres?|meters?|ft|feet|\')?', value)
    if match:
        number = float(match[1])
        if match[2] in ('ft', 'feet', "'"):
            number *= 0.3048
        return number if number > 0 and math.isfinite(number) else None
    return None


def building_height(tags):
    height = measurement(tags.get('height', ''))
    if height is not None:
        return round(height, 2), 'osm:height'
    levels = measurement(tags.get('building:levels', ''))
    if levels is not None:
        return round(levels * 3.5, 2), 'estimated:levels*3.5m'
    return 10.5, 'estimated:default-3-storeys'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'public/streets.json')
    args = parser.parse_args()
    raw = json.loads(args.source.read_text())
    if raw.get('remark'):
        raise ValueError(f"Overpass returned an incomplete result: {raw['remark']}")
    elements = raw['elements']
    if len(elements) < 10000:
        raise ValueError('Expected a citywide export with at least 10,000 buildings')
    data = json.loads(args.output.read_text())
    original = data['buildings']
    known = {(b['id'], b.get('polygonIndex', 0)) for b in original}
    relations = [e for e in elements if e['type'] == 'relation']
    # Relation outer ways represent the same footprints, not extra buildings.
    member_ids = {m['ref'] for e in relations for m in e['members']
                  if m['type'] == 'way' and m.get('role', '') in ('', 'outer', 'outline')}
    added = []
    without_outline = []
    way_tags = {e['id']: e.get('tags', {}) for e in elements if e['type'] == 'way'}
    for element in elements:
        tags = element.get('tags', {})
        if not tags.get('building') or tags['building'] == 'no':
            continue
        osm_id = element['id']
        if element['type'] == 'way':
            if osm_id in member_ids or (osm_id, 0) in known:
                continue
            outer = rings([element])
            inner = []
            record_id = osm_id
        elif element['type'] == 'relation':
            members = element['members']
            # Keep curated outer-way records instead of overlapping replacements.
            outer_members = [m for m in members if m['type'] == 'way'
                             and m.get('role', '') in ('', 'outer', 'outline')]
            if any((m['ref'], 0) in known for m in outer_members):
                continue
            if not outer_members and tags.get('type') == 'building':
                without_outline.append(osm_id)
                continue
            if len(outer_members) == 1:
                tags = {**way_tags.get(outer_members[0]['ref'], {}), **tags}
            outer = rings(outer_members)
            inner = rings([m for m in members if m['type'] == 'way' and m.get('role') == 'inner'])
            record_id = -osm_id
        else:
            continue
        if not outer:
            raise ValueError(f"Missing footprint: {element['type']}/{osm_id}")
        height, height_source = building_height(tags)
        for index, ring in enumerate(outer):
            if (record_id, index) in known:
                continue
            b = {'id': record_id, 'points': [project(p) for p in ring],
                 'height': height, 'heightSource': height_source,
                 'facade': 'brick' if tags.get('building:material') == 'brick' else
                           'glass' if tags.get('building:material') == 'glass' else 'masonry',
                 'address': tags.get('addr:housenumber', ''),
                 'street': tags.get('addr:street', ''), 'name': tags.get('name', '')}
            if element['type'] == 'relation':
                b.update(osmType='relation', osmId=osm_id, polygonIndex=index)
            holes = [[project(p) for p in hole] for hole in inner if contains(ring, hole[0])]
            if holes:
                b['holes'] = holes
            added.append(b)
            known.add((record_id, index))
    data['buildings'] = original + added
    all_points = [p for b in data['buildings'] for p in b['points']]
    data['buildingBounds'] = [round(37.786 - max(p[1] for p in all_points) / 111200, 7),
                              round(min(p[0] for p in all_points) / 87900 - 122.395, 7),
                              round(37.786 - min(p[1] for p in all_points) / 111200, 7),
                              round(max(p[0] for p in all_points) / 87900 - 122.395, 7)]
    data['buildingSource'] = {
        'source': '© OpenStreetMap contributors, ODbL',
        'boundary': 'https://www.openstreetmap.org/relation/111968',
        'scope': 'All mapped building ways and relations within San Francisco',
        'osmTimestamp': raw.get('osm3s', {}).get('timestamp_osm_base'),
        'importedAt': datetime.now(timezone.utc).isoformat(),
        'footprintCount': len(data['buildings']),
        'relationsWithoutFootprint': without_outline,
        'heightSources': dict(Counter(b.get('heightSource', 'preserved-existing')
                                      for b in data['buildings'])),
        'notes': 'OSM coverage is not a census. Missing heights are estimates. Existing records are preserved. Roads, coast and parks retain their original local coverage. Courtyard holes are retained as data; the current game renderer uses outer rings only.',
    }
    # Serialize completely before replacing the source file.
    output = json.dumps(data, separators=(',', ':'), allow_nan=False)
    temporary = args.output.with_suffix('.json.tmp')
    temporary.write_text(output)
    temporary.replace(args.output)
    print(json.dumps({'added': len(added), **data['buildingSource']}, indent=2))


if __name__ == '__main__':
    main()
