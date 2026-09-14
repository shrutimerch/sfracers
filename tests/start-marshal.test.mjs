import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createStartMarshal, startSignal } from '../game/rendering/start-marshal.ts';
test('starting signal turns green only once the race begins', () => {
  assert.equal(startSignal('countdown', 3, 0), 0);
  assert.equal(startSignal('countdown', 2, 0), 1);
  assert.equal(startSignal('countdown', 1, 0), 2);
  assert.equal(startSignal('countdown', 0.1, 0), 2);
  assert.equal(startSignal('racing', 0, 0), 3);
  assert.equal(startSignal('racing', 0, 3), -1);
});
test('cloud marshal freezes on pause, flies away, and returns on restart', () => {
  const marshal = createStartMarshal(new T.Scene(), { x: 9, z: 0, a: 0 });
  marshal.update('countdown', 3, 0, 0);
  assert.ok(marshal.root.visible);
  assert.ok(marshal.lights[0].emissiveIntensity > 0);
  const position = marshal.root.position.clone();
  marshal.update('paused', 3, 0, 50);
  assert.ok(marshal.root.position.equals(position));
  marshal.update('racing', 0, 2, 2);
  assert.ok(marshal.root.position.y > position.y + 2);
  assert.ok(marshal.lights[3].emissiveIntensity > 0);
  marshal.update('racing', 0, 3, 3);
  assert.equal(marshal.root.visible, false);
  marshal.update('countdown', 3, 0, 4);
  assert.equal(marshal.root.visible, true);
  assert.ok(marshal.lights[0].emissiveIntensity > 0);
});
test('four lamps follow the three countdown beeps and GO', () => {
  const marshal = createStartMarshal(new T.Scene(), { x: 0, z: 0, a: 0 });
  assert.equal(marshal.lights.length, 4);
  for (let stage = 0; stage < 4; stage++) {
    marshal.update(stage === 3 ? 'racing' : 'countdown', 3 - stage, 0, stage);
    assert.deepEqual(
      marshal.lights.map((light) => light.emissiveIntensity > 0),
      [0, 1, 2, 3].map((index) => index === stage),
    );
  }
});
