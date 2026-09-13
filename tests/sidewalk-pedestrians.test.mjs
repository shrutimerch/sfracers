import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { prepareCourse } from '../game/simulation/course.ts';
import { buildSidewalks } from '../game/scenery/sidewalks.ts';
import { buildCityMotion } from '../game/scenery/city-motion.ts';

const distanceTo = (p, a, b) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
};
test('all route streets have walkers on real sidewalks, clear of road surfaces', () => {
  const data = prepareCourse(
    JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url))),
  );
  const scene = new T.Scene();
  const paths = buildSidewalks(scene, data);
  const city = buildCityMotion(scene, data, paths);
  const people = city.root.children.filter((o) => o.userData.sidewalkStreet);
  for (const street of [
    'South Park',
    '2nd Street',
    'Brannan Street',
    'King Street',
    '3rd Street',
  ]) {
    assert.ok(
      people.some((p) => p.userData.sidewalkStreet === street),
      `No walkers on ${street}`,
    );
  }
  assert.ok(people.length > 40);
  const segments = data.roads.flatMap((r) =>
    r.points
      .slice(1)
      .map((b, i) => ({
        a: r.points[i],
        b,
        half: (r.width ?? (r.name === 'South Park' ? 9.8 : 14)) / 2,
      })),
  );
  for (let frame = 0; frame < 120; frame++) {
    city.update(0.25);
    for (const person of people) {
      const p = [person.position.x, person.position.z];
      assert.equal(person.position.y, 0.28);
      // The person's body remains behind the curb, including at path endpoints.
      const clearance = Math.min(...segments.map((s) => distanceTo(p, s.a, s.b) - s.half));
      assert.ok(clearance > 0.4, `${person.userData.sidewalkStreet} walker in road: ${clearance}`);
    }
  }
  console.log(
    `Added ${people.length} sidewalk walkers; ${city.counts.pedestrians} pedestrians total.`,
  );
});
