"""Add inferred intersection street-name signs to public/streets.json.

Usage: python3 scripts/import-sf-street-signs.py NAMED_OVERPASS.json UNNAMED_OVERPASS.json
Download both exports with relation 111968 mapped to area.sf, followed by
way[highway][name](area.sf) or way[highway][!name](area.sf), then out geom.

This is generated signage data, not a survey of physical signs or sign poles.
Shared OSM node IDs identify junctions; geometric overpasses do not intersect.
Each qualifying junction has one inferred corner post with one blade per
distinct mapped street name. Sign orientation follows the street centerline.
"""

import argparse
from collections import defaultdict
from datetime import datetime, timezone
import json
import math
from pathlib import Path

ROAD_TYPES = {
    'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary',
    'tertiary_link', 'residential', 'residential_link', 'unclassified',
    'living_street', 'pedestrian', 'service', 'busway',
}


def project(point):
    return [round((point['lon'] + 122.395) * 87900, 2),
            round((37.786 - point['lat']) * 111200, 2)]


def build_signs(elements):
    positions = {}
    geographic = {}
    adjacency = defaultdict(set)
    streets = defaultdict(lambda: defaultdict(lambda: {'ways': set(), 'neighbors': set()}))
    for way in sorted(elements, key=lambda e: e['id']):
        tags = way.get('tags', {})
        if way['type'] != 'way' or tags.get('highway') not in ROAD_TYPES:
            continue
        nodes, geometry = way['nodes'], way['geometry']
        if len(nodes) != len(geometry):
            raise ValueError(f"Incomplete geometry for way {way['id']}")
        for node, point in zip(nodes, geometry):
            positions[node] = project(point)
            geographic[node] = point
        name = tags.get('name', '').strip()
        for a, b in zip(nodes, nodes[1:]):
            if a == b or positions[a] == positions[b]:
                continue
            adjacency[a].add(b)
            adjacency[b].add(a)
            if name:
                for node, neighbor in ((a, b), (b, a)):
                    streets[node][name]['ways'].add(way['id'])
                    streets[node][name]['neighbors'].add(neighbor)

    signs = []
    for node in sorted(adjacency):
        names = streets[node]
        # A way split or name transition alone is not a street intersection.
        if len(adjacency[node]) < 3 or len(names) < 2:
            continue
        x, z = positions[node]

        def direction(neighbor):
            px, pz = positions[neighbor]
            return math.atan2(pz - z, px - x) % math.tau

        approaches = sorted(direction(n) for n in adjacency[node])
        gaps = [(approaches[(i + 1) % len(approaches)] + (math.tau if i == len(approaches) - 1 else 0) - angle, angle)
                for i, angle in enumerate(approaches)]
        gap, angle = max(gaps)
        corner_angle = angle + gap / 2
        # Use an estimated seven-metre half-width plus clearance. The existing
        # South Park loop is narrower. This is explicitly not a surveyed curb.
        half_width = 4.9 if 'South Park' in names else 7
        offset = min(22, (half_width + 0.8) / max(0.35, abs(math.sin(gap / 2))))
        blades = []
        for name, source in sorted(names.items()):
            # Both directions of a straight street share the same blade axis.
            heading = direction(min(source['neighbors'])) % math.pi
            blades.append({'name': name, 'angle': round(heading, 6),
                           'sourceWayIds': sorted(source['ways'])})
        signs.append({
            'id': f'osm-intersection:{node}', 'intersectionNodeId': node,
            'intersectionPosition': positions[node],
            'latitude': geographic[node]['lat'], 'longitude': geographic[node]['lon'],
            'position': [round(x + math.cos(corner_angle) * offset, 2),
                         round(z + math.sin(corner_angle) * offset, 2)],
            'placementSource': 'inferred-corner',
            'streetNames': sorted(names), 'blades': blades,
        })
    return signs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources', type=Path, nargs='+')
    parser.add_argument('--output', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'public/streets.json')
    args = parser.parse_args()
    elements = []
    timestamps = []
    for source in args.sources:
        raw = json.loads(source.read_text())
        if raw.get('remark'):
            raise ValueError(f"Incomplete Overpass export: {raw['remark']}")
        elements.extend(raw['elements'])
        timestamps.append(raw.get('osm3s', {}).get('timestamp_osm_base'))
    signs = build_signs(elements)
    if len(signs) < 1000:
        raise ValueError('Expected a citywide street network')
    data = json.loads(args.output.read_text())
    data['streetSigns'] = signs
    data['streetSignSource'] = {
        'source': '© OpenStreetMap contributors, ODbL',
        'boundary': 'https://www.openstreetmap.org/relation/111968',
        'osmTimestamps': timestamps,
        'importedAt': datetime.now(timezone.utc).isoformat(),
        'intersectionCount': len(signs),
        'bladeCount': sum(len(s['blades']) for s in signs),
        'streetNameCount': len({name for s in signs for name in s['streetNames']}),
        'definition': 'One inferred corner signpost per shared-node intersection with at least three road approaches and two distinct mapped street names.',
        'coordinates': 'Existing metre grid: x=(longitude+122.395)*87900, z=(37.786-latitude)*111200. Blade angle is radians from positive x toward positive z, modulo pi.',
        'notes': 'Generated sign placements, not an inventory of existing physical signs. Positions and street widths are estimates. Names come from OSM. Unnamed streets contribute to junction detection but receive no invented names. Motorways, trails, sidewalks, steps and cycleways are excluded. Divided-road junction nodes may produce multiple posts at one larger junction. Boundary-crossing ways may extend outside the city.',
    }
    output = json.dumps(data, separators=(',', ':'), allow_nan=False)
    temporary = args.output.with_suffix('.json.tmp')
    temporary.write_text(output)
    temporary.replace(args.output)
    print(json.dumps(data['streetSignSource'], indent=2))


if __name__ == '__main__':
    main()
