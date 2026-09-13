import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { buildCafeCentro, CAFE_CENTRO_ID, parkFacingFacade } from '../game/scenery/cafe-centro.ts';
import { buildBlueBottle, BLUE_BOTTLE_ID } from '../game/scenery/blue-bottle.ts';
const course = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));

test('reference facades preserve the correct footprint and characteristic windows and flag', () => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => {} }) }),
  };
  const scene = new T.Scene();
  try {
    const cafe = course.buildings.find((b) => b.id === CAFE_CENTRO_ID);
    const blue = course.buildings.find((b) => b.id === BLUE_BOTTLE_ID);
    assert.equal(cafe.address, '102');
    assert.equal(blue.address, '2');
    const disposeCafe = buildCafeCentro(scene, cafe),
      disposeBlue = buildBlueBottle(scene, blue);
    const a = scene.children[0],
      b = scene.children[1];
    assert.equal(a.userData.featureCounts['arched sash glass'], 6);
    assert.equal(a.userData.featureCounts['attic sash glass'], 3);
    assert.equal(a.userData.featureCounts['CENTRO hanging cafe sign'], 1);
    assert.equal(b.userData.featureCounts['factory window glass'], 12);
    assert.equal(b.userData.featureCounts['fire escape landing'], 3);
    const flag = b.children.find((m) => m.name.startsWith('American flag'));
    assert.equal(flag.userData.stars, 50);
    assert.equal(flag.userData.stripes, 13);
    assert.ok(flag.position.y > 13);
    for (const [group, building] of [
      [a, cafe],
      [b, blue],
    ]) {
      const front = parkFacingFacade(building);
      assert.deepEqual(group.position.toArray(), [front.x, 0, front.z]);
      assert.ok(group.children.length < 20, 'detailed facade must be batched');
      group.traverse((mesh) => {
        if (!mesh.geometry) return;
        const p = mesh.geometry.getAttribute('position');
        assert.ok([...p.array].every(Number.isFinite));
      });
    }
    disposeCafe();
    disposeBlue();
  } finally {
    scene.traverse((m) => {
      m.geometry?.dispose();
      if (m.material) m.material.dispose();
    });
    globalThis.document = previous;
  }
});
