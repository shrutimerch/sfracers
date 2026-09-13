import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareCourse } from '../game/simulation/course.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';

const loadCourse = (name) =>
  JSON.parse(readFileSync(new URL(`../public/${name}.json`, import.meta.url)));

for (const name of ['race-course']) {
  test(`${name}: drive both complete laps with real steering, pause, recover, finish, and restart`, () => {
    const sim = createRaceSimulation(prepareCourse(loadCourse(name)));
    sim.start();
    const visited = new Set();
    let paused = false;
    let recovered = false;
    let firstLapTime = 0;
    // A conservative test driver uses the same throttle, brake and steering API as a player.
    // It never teleports the kart, advances checkpoints directly, or edits race state.
    for (let frame = 0; frame < 45000 && sim.state.mode !== 'finished'; frame++) {
      const state = sim.state;
      visited.add(`${state.lap}:${state.cp}`);
      if (state.lap === 1 && !firstLapTime) firstLapTime = state.time;
      if (!paused && state.time > 10) {
        sim.pause();
        const snapshot = sim.state;
        const rivalDistances = sim.rivals.map((r) => r.s);
        sim.step(1 / 30);
        assert.deepEqual(sim.state, snapshot);
        assert.deepEqual(
          sim.rivals.map((r) => r.s),
          rivalDistances,
        );
        sim.pause();
        paused = true;
      }
      if (!recovered && state.lap === 1 && state.cp > 1) {
        sim.recover();
        assert.equal(sim.state.lap, 1);
        assert.equal(sim.state.cp, state.cp);
        assert.equal(sim.state.speed, 0);
        recovered = true;
      }
      const current = sim.state;
      const nearest = sim.route.nearest(current.x, current.z);
      const target = sim.route.at((nearest.along + 6) % sim.route.total);
      const desired = Math.atan2(target.z - current.z, target.x - current.x);
      const error = Math.atan2(
        Math.sin(desired - current.angle),
        Math.cos(desired - current.angle),
      );
      sim.setKey('d', error > 0.025);
      sim.setKey('a', error < -0.025);
      sim.setKey('w', current.speed < 7);
      sim.setKey('s', current.speed > 9);
      sim.step(1 / 30);
    }
    assert.equal(sim.state.mode, 'finished');
    assert.equal(sim.state.lap, 1);
    assert.ok(firstLapTime > 0 && sim.state.time > firstLapTime);
    for (let lap = 0; lap < 2; lap++) {
      for (let cp = 0; cp < sim.checks.length; cp++) assert.ok(visited.has(`${lap}:${cp}`));
    }
    assert.ok(paused && recovered);
    assert.ok(sim.rivals.every((r) => r.s === sim.route.total * 2));
    assert.equal(sim.state.speed, 0);
    const finishTime = sim.state.time;
    sim.step(1 / 30);
    assert.equal(sim.state.time, finishTime);
    sim.start();
    assert.equal(sim.state.mode, 'countdown');
    assert.equal(sim.state.time, 0);
    assert.equal(sim.state.lap, 0);
    assert.equal(sim.state.cp, 0);
    assert.equal(sim.state.progress, 0);
    assert.deepEqual(sim.keys, {});
    assert.deepEqual(
      sim.rivals.map((r) => r.s),
      [12, 20, 28],
    );
  });
}

test('countdown and blur pause do not advance the race or leave sticky throttle', () => {
  const sim = createRaceSimulation(loadCourse('race-course'));
  sim.start();
  sim.step(1);
  assert.equal(sim.state.mode, 'countdown');
  assert.equal(sim.state.time, 0);
  sim.setKey('w', true);
  sim.blur();
  assert.equal(sim.state.mode, 'paused');
  assert.deepEqual(sim.keys, {});
  sim.pause();
  sim.step(1);
  assert.equal(sim.state.count, 1);
});
