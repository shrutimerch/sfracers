import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { motionPath, buildCityMotion } from '../game/scenery/city-motion.ts';

test('path sampling follows distance through corners and ignores duplicate points', () => {
  const path = motionPath([
    [0, 0],
    [0, 0],
    [10, 0],
    [10, 20],
  ]);
  assert.equal(path.length, 30);
  assert.deepEqual(path.at(5, 2), { x: 5, z: 2, angle: 0 });
  assert.deepEqual(path.at(20, 2), { x: 8, z: 10, angle: Math.PI / 2 });
  assert.deepEqual(path.at(100), { x: 10, z: 20, angle: Math.PI / 2 });
  assert.deepEqual(motionPath([]).at(0), { x: 0, z: 0, angle: 0 });
});

test('city actors move at frame-independent speed and stay finite across route boundaries', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const a = buildCityMotion(new T.Scene(), data);
  const b = buildCityMotion(new T.Scene(), data);
  assert.equal(a.counts.streetcars, 2);
  assert.ok(a.counts.cars > 0);
  assert.ok(a.counts.pedestrians > 0);
  const initial = a.root.children[0].position.clone();
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  b.update(1);
  assert.ok(a.root.children[0].position.distanceTo(initial) > 7.9);
  assert.ok(a.root.children[0].position.distanceTo(b.root.children[0].position) < 1e-8);
  const paused = a.root.children.map((o) => o.position.clone());
  a.update(0);
  a.root.children.forEach((o, i) => assert.ok(o.position.equals(paused[i])));
  for (let i = 0; i < 1200; i++) a.update(1);
  for (const actor of a.root.children) {
    assert.ok(actor.position.toArray().every(Number.isFinite));
    assert.ok(Number.isFinite(actor.rotation.y));
  }
});
