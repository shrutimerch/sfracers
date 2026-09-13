import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url), 'utf8'));
test('waterfront circuit is a continuous closed route on source street segments', () => {
  assert.deepEqual(d.route[0], d.route.at(-1));
  const edges = new Set();
  for (const r of d.roads)
    for (let i = 1; i < r.points.length; i++) {
      edges.add(JSON.stringify([r.points[i - 1], r.points[i]]));
      edges.add(JSON.stringify([r.points[i], r.points[i - 1]]));
    }
  let length = 0;
  for (let i = 1; i < d.route.length; i++) {
    assert.ok(edges.has(JSON.stringify([d.route[i - 1], d.route[i]])));
    length += Math.hypot(d.route[i][0] - d.route[i - 1][0], d.route[i][1] - d.route[i - 1][1]);
  }
  assert.ok(Math.abs(length - d.course.length) < 0.02);
  assert.ok(length > 2100 && length < 2250);
  assert.ok(
    d.route.some((p) => p[0] === 268.55 && p[1] === 869.84),
    'passes King and 3rd before returning',
  );
  assert.deepEqual(
    d.course.sections.map((s) => s.name),
    ['South Park', '2nd Street', 'Brannan Street', 'The Embarcadero', 'King Street', '3rd Street'],
  );
});

test('promenade follows downloaded pedestrian geometry, separate from traffic lanes', () => {
  const raw = JSON.parse(
    readFileSync(new URL('../public/waterfront-paths-osm.json', import.meta.url), 'utf8'),
  );
  const path = d.paths[0];
  const edges = new Set();
  for (const w of raw.elements.filter((w) => path.sourceWayIds.includes(w.id))) {
    const ps = w.geometry.map((g) => [
      Math.round((g.lon + 122.395) * 87900 * 100) / 100,
      Math.round((37.786 - g.lat) * 111200 * 100) / 100,
    ]);
    for (let i = 1; i < ps.length; i++) {
      edges.add(JSON.stringify([ps[i - 1], ps[i]]));
      edges.add(JSON.stringify([ps[i], ps[i - 1]]));
    }
  }
  for (let i = 1; i < path.points.length; i++)
    assert.ok(edges.has(JSON.stringify([path.points[i - 1], path.points[i]])));
  assert.ok(path.points.some((p) => p[0] === 617.92 && p[1] === 343.81));
  assert.ok(!d.course.sections.some((s) => s.name === 'Waterfront Promenade'));
});

test('King follows the park-side carriageway directly from the Embarcadero', () => {
  const start = d.route.findIndex((p) => p[0] === 603.67 && p[1] === 470.49);
  const end = d.route.findIndex((p) => p[0] === 290.8 && p[1] === 892.27);
  assert.ok(start > 0 && end > start);
  const king = d.route.slice(start, end + 1);
  assert.ok(king.some((p) => p[0] === 596.76 && p[1] === 529.33));
  assert.ok(king.some((p) => p[0] === 484.9 && p[1] === 693.43));
  assert.ok(!king.some((p) => p[0] === 576.77 && p[1] === 478.56));
});

test('waterfront leg stays on Embarcadero road segments from Brannan to King', () => {
  const start = d.route.findIndex((p) => p[0] === 624.42 && p[1] === 141.02);
  const end = d.route.findIndex((p) => p[0] === 603.67 && p[1] === 470.49);
  assert.ok(start > 0 && end > start);
  const edges = new Set();
  for (const road of d.roads.filter((r) => r.name === 'The Embarcadero')) {
    for (let i = 1; i < road.points.length; i++) {
      edges.add(JSON.stringify([road.points[i - 1], road.points[i]]));
      edges.add(JSON.stringify([road.points[i], road.points[i - 1]]));
    }
  }
  for (let i = start + 1; i <= end; i++)
    assert.ok(edges.has(JSON.stringify([d.route[i - 1], d.route[i]])));
  assert.ok(!d.route.some((p) => p[0] === 617.92 && p[1] === 343.81));
});

test('promenade pavement and median palms stay outside the Embarcadero roadway', async () => {
  const { waterfrontTreePosition } = await import('../game/scenery/tree-clearance.ts');
  const { prepareCourse } = await import('../game/simulation/course.ts');
  const { default: survey } = await import('../game/scenery/data/waterfront-geometry.ts');
  const prepared = prepareCourse(d);
  const roads = prepared.roads.filter((r) => r.name === 'The Embarcadero');
  const distanceToRoad = (p) =>
    Math.min(
      ...roads.flatMap((r) =>
        r.points.slice(1).map((b, i) => {
          const a = r.points[i],
            dx = b[0] - a[0],
            dz = b[1] - a[1];
          const t = Math.max(
            0,
            Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)),
          );
          return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz) - r.width / 2;
        }),
      ),
    );
  const path = d.paths[0];
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1],
      b = path.points[i];
    for (let t = 0; t <= 1; t += 0.1) {
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      if (p[1] < 180 || p[1] > 450) continue;
      assert.ok(
        distanceToRoad(p) >= path.width / 2,
        `sidewalk overlaps roadway at ${p.join(', ')}`,
      );
    }
  }
  for (const tree of survey.trees.filter(
    (t) => t.palm && t.point[0] > 580 && t.point[0] < 635 && t.point[1] > 180 && t.point[1] < 450,
  ))
    assert.ok(
      distanceToRoad(waterfrontTreePosition(tree.point, prepared.roads)) > 0.5,
      `palm ${tree.id} intrudes into roadway`,
    );
});
