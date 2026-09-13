import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTrafficCollision } from '../game/simulation/traffic-collision.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
const car = (x = 0, z = 0, angle = 0) => ({
  x,
  z,
  previousX: x,
  previousZ: z,
  angle,
  halfLength: 2.2,
  halfWidth: 1.01,
});

test('solid car stops head-on travel and high-speed tunneling', () => {
  for (const end of [0, 10, 1000]) {
    const result = resolveTrafficCollision({ x: -10, z: 0 }, { x: end, z: 0 }, 0, [car()]);
    assert.ok(result.hit);
    assert.ok(result.x < -3.3);
  }
});
test('driver can pass beside a car and reverse away from contact', () => {
  const beside = resolveTrafficCollision({ x: -10, z: 3 }, { x: 10, z: 3 }, 0, [car()]);
  assert.equal(beside.hit, false);
  const away = resolveTrafficCollision({ x: -3.3, z: 0 }, { x: -5, z: 0 }, 0, [car()]);
  assert.equal(away.hit, false);
  assert.equal(away.x, -5);
});
test('rotated cars and traffic moving into a stationary kart stay solid', () => {
  const rotated = resolveTrafficCollision({ x: 0, z: -10 }, { x: 0, z: 10 }, Math.PI / 2, [
    car(0, 0, Math.PI / 2),
  ]);
  assert.ok(rotated.hit && rotated.z < -3.3);
  const moving = { ...car(3, 0), previousX: -5 };
  const contact = resolveTrafficCollision({ x: 0, z: 0 }, { x: 0, z: 0 }, 0, [moving]);
  assert.ok(contact.hit && contact.x > 6.3);
});
test('simulation stops on impact, preserves pause, and allows backing away', () => {
  const data = {
    roads: [
      {
        name: 'Test road',
        points: [
          [0, 0],
          [200, 0],
        ],
        width: 30,
      },
    ],
    route: [
      [0, 0],
      [200, 0],
      [200, 100],
      [0, 100],
      [0, 0],
    ],
    buildings: [],
  };
  const sim = createRaceSimulation(data, 1, false, true);
  sim.setKey('w', true);
  for (let i = 0; i < 180; i++) sim.step(1 / 60, true, [car(12)]);
  assert.ok(sim.state.x < 8.7 && sim.state.x > 8);
  assert.equal(sim.state.speed, 0);
  sim.pause();
  const paused = sim.state;
  sim.step(1, true, [car(5)]);
  assert.deepEqual(sim.state, paused);
  sim.pause();
  sim.setKey('w', false);
  sim.setKey('s', true);
  for (let i = 0; i < 120; i++) sim.step(1 / 60, true, [car(12)]);
  assert.ok(sim.state.x < paused.x - 1);
});

test('escaping an initial overlap preserves movement away from contact', () => {
  const escaping = resolveTrafficCollision({ x: -3.2, z: 0 }, { x: -3.22, z: 0 }, 0, [car()]);
  assert.ok(escaping.hit);
  assert.equal(escaping.blocked, false);
  const into = resolveTrafficCollision({ x: -3.2, z: 0 }, { x: -3.18, z: 0 }, 0, [car()]);
  assert.equal(into.blocked, true);
});
