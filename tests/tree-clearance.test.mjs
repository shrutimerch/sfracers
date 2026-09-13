import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createTreePlacement } from '../game/scenery/tree-clearance.ts';
import { cyclingStrips } from '../game/scenery/cycling-layout.ts';
import { prepareCourse } from '../game/simulation/course.ts';
import survey from '../game/scenery/data/waterfront-geometry.ts';

const d = prepareCourse(
  JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url))),
);
const distance = (p, a, b) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
};
test('mapped park trees and waterfront palms/broadleaf trunks clear roads and cycling strips', () => {
  const placement = createTreePlacement(d);
  const strips = cyclingStrips(d);
  let retained = 0;
  let moved = 0;
  for (const point of [...(d.parkDetails?.trees || []), ...survey.trees.map((t) => t.point)]) {
    const p = placement.place(point);
    if (!p) continue;
    retained++;
    if (p !== point) moved++;
    for (const road of [...d.roads, ...(d.paths || [])])
      for (let i = 1; i < road.points.length; i++)
        assert.ok(
          distance(p, road.points[i - 1], road.points[i]) >=
            (road.width ?? (road.name === 'South Park' ? 9.8 : 14)) / 2 + 1 - 1e-8,
        );
    for (const s of strips) assert.ok(distance(p, s.a, s.b) >= s.halfWidth + 1 - 1e-8);
    assert.ok(Math.hypot(p[0] - point[0], p[1] - point[1]) <= 12.001);
  }
  assert.ok(retained > 50);
  assert.ok(moved > 0, 'regression data includes intruding trunks');
});
test('centerline and intersection trees relocate safely; oversized junctions omit them', () => {
  const map = {
    roads: [
      {
        name: 'Test',
        width: 8,
        points: [
          [-40, 0],
          [40, 0],
        ],
      },
      {
        name: 'Cross',
        width: 8,
        points: [
          [0, -40],
          [0, 40],
        ],
      },
    ],
    buildings: [],
    route: [],
  };
  const placement = createTreePlacement(map);
  const p = placement.place([0, 0]);
  assert.ok(p && Math.abs(p[0]) >= 5 && Math.abs(p[1]) >= 5);
  const safe = [20, 20];
  assert.equal(placement.place(safe), safe);
  assert.equal(
    createTreePlacement({ ...map, roads: map.roads.map((r) => ({ ...r, width: 60 })) }).place([
      0, 0,
    ]),
    null,
  );
});
