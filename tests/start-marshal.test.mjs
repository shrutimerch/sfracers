import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createStartMarshal, startSignal } from '../game/rendering/start-marshal.ts';
test('starting signal turns green only once the race begins', () => {
  assert.equal(startSignal('countdown', 3, 0), 0);
  assert.equal(startSignal('countdown', 2, 0), 1);
  assert.equal(startSignal('countdown', 0.1, 0), 1);
  assert.equal(startSignal('racing', 0, 0), 2);
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
  assert.ok(marshal.lights[2].emissiveIntensity > 0);
  marshal.update('racing', 0, 3, 3);
  assert.equal(marshal.root.visible, false);
  marshal.update('countdown', 3, 0, 4);
  assert.equal(marshal.root.visible, true);
  assert.ok(marshal.lights[0].emissiveIntensity > 0);
});
