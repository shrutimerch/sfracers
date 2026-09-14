import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildOracleOutfield } from '../game/scenery/oracle-outfield.ts';

test('outfield landmarks build behind the stadium with a readable elevated sign', () => {
  const original = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ fillRect() {}, fillText() {} }),
    }),
  };
  try {
    const root = new T.Group();
    const dispose = buildOracleOutfield(root);
    const bottle = root.getObjectByName('Giant green outfield bottle');
    const sign = root.getObjectByName('large orange GIANTS sign');
    const palms = root.getObjectByName('Outfield palm row');
    assert.ok(bottle && sign && palms);
    root.updateMatrixWorld(true);
    assert.ok(new T.Box3().setFromObject(bottle).max.y > 28);
    assert.equal(sign.getWorldPosition(new T.Vector3()).y, 32);
    assert.ok(sign.material.toneMapped === false);
    assert.ok(new T.Box3().setFromObject(palms).max.y > 18);
    root.traverse((object) => {
      if (!object.isMesh) return;
      const positions = object.geometry.getAttribute('position').array;
      assert.ok(positions.every(Number.isFinite));
    });
    dispose();
  } finally {
    globalThis.document = original;
  }
});
