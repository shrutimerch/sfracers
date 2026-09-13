import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { buildCityMotion } from '../game/scenery/city-motion.ts';
import {
  parkSurfaceHeight,
  beachHeight,
  BRANNAN_LAWN_HEIGHT,
} from '../game/scenery/park-surface.ts';
const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));

test('surface sampler includes raised wharf lawn and South Beach mound', () => {
  assert.equal(parkSurfaceHeight(data, 642, 215), BRANNAN_LAWN_HEIGHT);
  assert.ok(beachHeight(620, 560) > 0.8);
  assert.ok(parkSurfaceHeight(data, 620, 560) >= beachHeight(620, 560));
  assert.equal(parkSurfaceHeight(data, 0, 0, 0.28), 0.28);
});
test('park dogs, owners and walkers stay above the grass throughout animation', () => {
  const city = buildCityMotion(new T.Scene(), data);
  for (let frame = 0; frame < 240; frame++) {
    city.update(0.25);
    for (const person of city.root.children.filter((p) => p.name === 'Walking pedestrian')) {
      const { x, y, z } = person.position;
      assert.ok(y >= parkSurfaceHeight(data, x, z) - 1e-8);
    }
    for (const dog of city.parkDogs.dogs) {
      const { x, y, z } = dog.group.position;
      assert.ok(y >= parkSurfaceHeight(data, x, z));
      assert.ok(y < parkSurfaceHeight(data, x, z) + 0.08);
    }
    for (const owner of city.parkDogs.owners) {
      const { x, y, z } = owner.position;
      assert.ok(y >= parkSurfaceHeight(data, x, z));
    }
  }
});
