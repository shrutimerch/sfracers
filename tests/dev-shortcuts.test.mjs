import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { devShortcutDistance } from '../game/simulation/dev-shortcuts.ts';
import { createRoute } from '../game/simulation/route-math.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));

test('numbered shortcuts resolve on course and /5 lands in front of the ballpark', () => {
  const route = createRoute(data);
  for (let i = 1; i <= 7; i++) {
    const distance = devShortcutDistance(`/${i}`, data);
    assert.ok(distance > 0 && distance < route.total);
    assert.equal(distance, devShortcutDistance(`/${i}/`, data));
  }
  const ballpark = route.at(devShortcutDistance('/5', data));
  assert.ok(Math.hypot(ballpark.x - 484.9, ballpark.z - 693.43) < 0.1);
  for (const path of ['/', '/0', '/8', '/55', '/5/extra', '/about', '/kart'])
    assert.equal(devShortcutDistance(path, data), null);
});

test('shortcut allows immediate driving, pause/resume and recovery to its landmark', () => {
  const sim = createRaceSimulation(data, devShortcutDistance('/5', data), false, true);
  const start = sim.state;
  assert.equal(start.mode, 'inspection');
  assert.equal(start.street, 'King Street');
  sim.setKey('w', true);
  for (let i = 0; i < 30; i++) sim.step(1 / 60);
  assert.ok(Math.hypot(sim.state.x - start.x, sim.state.z - start.z) > 0.5);
  sim.blur();
  assert.equal(sim.state.mode, 'paused');
  sim.pause();
  assert.equal(sim.state.mode, 'inspection');
  assert.equal(sim.keys.w, undefined);
  sim.recover();
  assert.equal(sim.state.x, start.x);
  assert.equal(sim.state.z, start.z);
  assert.equal(sim.state.speed, 0);
  assert.equal(sim.state.cp, 0);
});

test('existing inspection query remains stationary and ordinary races still start normally', () => {
  const stationary = createRaceSimulation(data, 395);
  const start = stationary.state;
  stationary.setKey('w', true);
  stationary.step(1);
  assert.equal(stationary.state.x, start.x);
  const normal = createRaceSimulation(data);
  assert.equal(normal.state.mode, 'ready');
  normal.start();
  normal.pause();
  normal.pause();
  assert.equal(normal.state.mode, 'countdown');
});
