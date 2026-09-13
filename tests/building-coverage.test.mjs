import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildingGeometry } from '../game/scenery/geometry/building-geometry.ts';

const course = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));

test('race scenery includes city buildings beyond King and through the fog distance', () => {
  const source = JSON.parse(readFileSync(new URL('../public/streets.json', import.meta.url)));
  const key = (b) => `${b.id}:${b.polygonIndex ?? 0}`;
  const loaded = new Set(course.buildings.map(key));
  assert.equal(loaded.size, course.buildings.length);
  assert.ok(course.buildingCoverage.marginMetres >= 1800);
  const [west, north, east, south] = course.buildingCoverage.bounds;
  for (const b of source.buildings) {
    if (b.points.some(([x, z]) => x >= west && x <= east && z >= north && z <= south))
      assert.ok(loaded.has(key(b)), `Missing visible building ${key(b)}`);
  }
  assert.ok(course.buildings.filter((b) => b.points.some(([, z]) => z > 1100)).length > 100);
});

test('expanded building footprints produce finite walls and roofs', () => {
  for (const b of course.buildings) {
    assert.ok(b.height > 0, `Invalid height for ${b.id}`);
    const { walls, roof } = buildingGeometry(b);
    for (const geometry of [walls, roof]) {
      assert.ok(geometry.attributes.position.count > 0, `Empty geometry for ${b.id}`);
      assert.ok(geometry.attributes.position.array.every(Number.isFinite));
      geometry.dispose();
    }
  }
});
