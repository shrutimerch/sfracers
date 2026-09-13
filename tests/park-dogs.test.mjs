import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { buildCityMotion } from '../game/scenery/city-motion.ts';
import { parkClearance } from '../game/scenery/park-dogs.ts';

test('six off-leash dogs run within the three named parks with an owner nearby', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const city = buildCityMotion(new T.Scene(), data);
  const { dogs, owners, areas, update } = city.parkDogs;
  assert.deepEqual(areas.map((a) => a.name).sort(), [
    'Brannan Street Wharf',
    'South Beach Park',
    'South Park',
  ]);
  assert.equal(dogs.length, 6);
  assert.equal(owners.length, 3);
  owners.forEach((owner) => assert.ok(owner.visible && owner.children.length > 0));
  const initial = dogs.map((d) => d.group.position.clone());
  for (let frame = 0; frame < 1800; frame++) {
    update(1 / 30);
    dogs.forEach((dog, i) => {
      assert.ok(
        parkClearance([dog.group.position.x, dog.group.position.z], dog.area.polygon) > 0.9,
      );
      assert.ok(dog.group.position.distanceTo(owners[Math.floor(i / 2)].position) < 9);
      assert.ok(dog.group.position.distanceTo(owners[Math.floor(i / 2)].position) > 1.4);
      assert.ok(dog.group.position.toArray().every(Number.isFinite));
    });
  }
  assert.ok(dogs.every((dog, i) => dog.group.position.distanceTo(initial[i]) > 0.1));
  const paused = dogs.map((d) => d.group.position.clone());
  update(0);
  dogs.forEach((dog, i) => assert.deepEqual(dog.group.position, paused[i]));
});
