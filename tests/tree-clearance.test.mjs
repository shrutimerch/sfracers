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
test('mapped trees clear roads, cycling strips and the full Muni corridor', () => {
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
    for (const track of survey.rails)
      for (let i = 1; i < track.points.length; i++)
        assert.ok(
          distance(p, track.points[i - 1], track.points[i]) >= 2.5 - 1e-8,
          'tree trunk intrudes into tram corridor',
        );
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

test('median palms form two outer rows with lamps clear of tracks and trunks', async () => {
  const { medianPalmRows } = await import('../game/scenery/median-layout.ts');
  const { medianLampPositions } = await import('../game/scenery/median-lamps.ts');
  const rows = medianPalmRows(d),
    palms = rows.flat();
  assert.ok(rows.every((row) => row.length > 10));
  const clear = createTreePlacement(d).clear;
  for (const p of palms) assert.ok(clear(p));
  // No trunk may sit in the strip joining nearby centerlines of the two tracks.
  for (const p of palms) {
    const feet = survey.rails.map((track) => {
      let best = Infinity,
        foot;
      for (let i = 1; i < track.points.length; i++) {
        const a = track.points[i - 1],
          b = track.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1];
        const t = Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)),
        );
        const q = [a[0] + t * dx, a[1] + t * dz],
          dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (dist < best) {
          best = dist;
          foot = q;
        }
      }
      return foot;
    });
    const [a, b] = feet,
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const projection = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz);
    assert.ok(projection < 0 || projection > 1, 'palm sits between the two tracks');
  }
  const lamps = medianLampPositions(d, palms);
  assert.ok(lamps.length > 10);
  for (const { point } of lamps) {
    assert.ok(clear(point));
    assert.ok(palms.every((p) => Math.hypot(p[0] - point[0], p[1] - point[1]) >= 4));
  }
});
