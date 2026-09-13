import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildCityMotion } from '../game/scenery/city-motion.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
const data = {
  roads: [
    {
      name: 'King Street',
      points: [
        [0, 0],
        [300, 0],
      ],
      width: 30,
    },
  ],
  route: [
    [0, 0],
    [300, 0],
    [300, 100],
    [0, 100],
    [0, 0],
  ],
  buildings: [],
};

test('moving traffic waits before pushing an idle kart, then resumes once clear', () => {
  const city = buildCityMotion(new T.Scene(), data);
  const sim = createRaceSimulation(data, 80, false, true);
  for (let i = 0; i < 300; i++) {
    city.update(1 / 60, sim.state);
    sim.step(1 / 60, true, city.obstacles);
  }
  assert.equal(sim.state.x, 80);
  assert.equal(sim.state.speed, 0);
  const stopped = city.obstacles[0].x;
  assert.ok(stopped > 60 && stopped < 76);
  city.update(1 / 60, sim.state);
  assert.equal(city.obstacles[0].x, stopped);
  city.update(1 / 60, { x: 80, z: 20 });
  assert.ok(city.obstacles[0].x > stopped);
});

test('driver can reverse after hitting real animated traffic without being pinned', () => {
  const city = buildCityMotion(new T.Scene(), data);
  const sim = createRaceSimulation(data, 1, false, true);
  const step = () => {
    city.update(1 / 60, sim.state);
    sim.step(1 / 60, true, city.obstacles);
  };
  sim.setKey('w', true);
  let collided = false;
  for (let i = 0; i < 1200; i++) {
    step();
    if (sim.state.x > 50 && sim.state.speed === 0) {
      collided = true;
      break;
    }
  }
  assert.ok(collided, 'test driver must actually collide');
  const impactX = sim.state.x;
  sim.setKey('w', false);
  for (let i = 0; i < 60; i++) step();
  assert.ok(Math.abs(sim.state.x - impactX) < 0.01, 'waiting car must not push kart');
  sim.setKey('s', true);
  for (let i = 0; i < 90; i++) step();
  assert.ok(sim.state.x < impactX - 8, 'reverse must gain distance');
  assert.ok(sim.state.speed < -7);
});
