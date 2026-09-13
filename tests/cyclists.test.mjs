import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { buildCityMotion } from '../game/scenery/city-motion.ts';
import { cyclingStrips } from '../game/scenery/cycling-layout.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
import { resolveTrafficCollision } from '../game/simulation/traffic-collision.ts';

test('cyclists follow painted paths and update solid collision footprints', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const city = buildCityMotion(new T.Scene(), data);
  const cyclists = city.root.children.filter((o) => o.name === 'Cyclist');
  assert.ok(cyclists.length > 0);
  const strips = cyclingStrips(data).filter(
    (s) => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) > 35,
  );
  const initial = cyclists.map((c) => c.position.clone());
  city.update(1);
  cyclists.forEach((c, i) => {
    assert.ok(c.position.distanceTo(initial[i]) > 3);
    const s = strips[i],
      dx = s.b[0] - s.a[0],
      dz = s.b[1] - s.a[1];
    assert.ok(Math.abs((c.position.x - s.a[0]) * dz - (c.position.z - s.a[1]) * dx) < 1e-6);
    const obstacle = city.obstacles.find((o) => o.x === c.position.x && o.z === c.position.z);
    assert.ok(obstacle);
    assert.equal(obstacle.previousX, initial[i].x);
    assert.equal(obstacle.halfWidth, 0.36);
  });
});

test('hitting a cyclist stops the car, prevents tunneling, and permits reversing', () => {
  const bike = {
    x: 12,
    z: 0,
    previousX: 12,
    previousZ: 0,
    angle: 0,
    halfLength: 1.08,
    halfWidth: 0.36,
  };
  assert.ok(resolveTrafficCollision({ x: 0, z: 0 }, { x: 100, z: 0 }, 0, [bike]).blocked);
  const data = {
    roads: [
      {
        name: 'Bike path',
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
  for (let i = 0; i < 180; i++) sim.step(1 / 60, true, [bike]);
  assert.equal(sim.state.speed, 0);
  assert.ok(sim.state.x < 10);
  const stopped = sim.state.x;
  sim.setKey('w', false);
  sim.setKey('s', true);
  for (let i = 0; i < 120; i++) sim.step(1 / 60, true, [bike]);
  assert.ok(sim.state.x < stopped - 1);
});
