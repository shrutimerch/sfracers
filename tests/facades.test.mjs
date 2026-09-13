import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import { buildingGeometry } from '../game/scenery/geometry/building-geometry.ts';
const data = JSON.parse(readFileSync(new URL('../public/streets.json', import.meta.url), 'utf8'));
test('all facade types have a shipped PNG texture', () => {
  const kinds = new Set(data.buildings.map((b) => b.facade));
  assert.deepEqual(
    [...kinds].sort((a, b) => String(a).localeCompare(String(b))),
    ['brick', 'glass', 'masonry'],
  );
  for (const kind of kinds) {
    const url = new URL(`../public/textures/${kind}-facade.png`, import.meta.url);
    assert.ok(statSync(url).size > 10000);
    assert.equal(readFileSync(url).subarray(1, 4).toString(), 'PNG');
  }
});
test('facade UVs repeat at floor scale and roofs remain separate', () => {
  for (const facade of ['brick', 'masonry', 'glass']) {
    const building = data.buildings.find((b) => b.facade === facade && b.height > 10);
    const { walls, roof } = buildingGeometry(building);
    walls.computeBoundingBox();
    roof.computeBoundingBox();
    assert.ok(walls.attributes.uv.count === walls.attributes.position.count);
    assert.ok([...walls.attributes.uv.array].every(Number.isFinite));
    assert.ok(
      Math.max(...walls.attributes.uv.array) > 1,
      'facade image must repeat instead of stretching',
    );
    assert.ok(Math.abs(walls.boundingBox.min.y) < 0.01);
    assert.ok(Math.abs(walls.boundingBox.max.y - building.height) < 0.01);
    assert.ok(Math.abs(roof.boundingBox.min.y - building.height) < 0.01);
    walls.dispose();
    roof.dispose();
  }
});
test('skyline height retains Salesforce Tower source measurement', () => {
  assert.equal(data.buildings.find((b) => b.id === 431972186).height, 326);
});
