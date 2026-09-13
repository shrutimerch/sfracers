import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { createStreetSignGroup, visibleStreetSigns } from '../game/scenery/street-signs.ts';
const course = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));

test('the game course includes named signs at the major circuit intersections', () => {
  const signs = visibleStreetSigns(course);
  assert.ok(signs.length > 10 && signs.length < 150);
  for (const names of [
    ['2nd Street', 'Brannan Street'],
    ['King Street', '3rd Street'],
    ['South Park', '2nd Street'],
  ]) {
    assert.ok(
      signs.some((s) => names.every((name) => s.streetNames.includes(name))),
      names.join(' / '),
    );
  }
  assert.deepEqual(visibleStreetSigns({ ...course, streetSigns: undefined }), []);
  assert.deepEqual(
    visibleStreetSigns({ ...course, streetSigns: [{ intersectionPosition: [50000, 50000] }] }),
    [],
  );
});

test('each mapped street name has separately oriented front and back text above the road', () => {
  const sign = course.streetSigns.find(
    (s) => s.streetNames.includes('Brannan Street') && s.streetNames.includes('2nd Street'),
  );
  const labels = [];
  const material = new T.MeshBasicMaterial();
  const group = createStreetSignGroup(
    sign,
    (name) => {
      labels.push(name);
      return material;
    },
    material,
  );
  assert.deepEqual(
    labels,
    sign.blades.map((b) => b.name),
  );
  assert.deepEqual(group.position.toArray(), [sign.position[0], 0, sign.position[1]]);
  group.updateMatrixWorld(true);
  for (const [i, blade] of sign.blades.entries()) {
    const board = group.children[i + 1];
    assert.equal(board.name, blade.name);
    assert.equal(board.rotation.y, -blade.angle);
    assert.ok(board.position.y >= 2.8);
    const [front, back] = board.children;
    assert.ok(front.position.z > 0 && back.position.z < 0);
    assert.equal(front.rotation.y, 0);
    assert.equal(back.rotation.y, Math.PI);
    const a = new T.Vector3(0, 0, 1).transformDirection(front.matrixWorld);
    const b = new T.Vector3(0, 0, 1).transformDirection(back.matrixWorld);
    assert.ok(a.dot(b) < -0.999);
  }
  const geometries = new Set();
  group.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry);
  });
  geometries.forEach((g) => g.dispose());
  material.dispose();
});
