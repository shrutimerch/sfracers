import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
import { advanceSpeed } from '../game/simulation/driving.ts';

const track = {
  roads: [{ name: 'Straight', points: [[0, 0], [10000, 0]], width: 100 }],
  route: [[0, 0], [10000, 0], [0, 0]],
  buildings: [],
};
function drive(cc) {
  const sim = createRaceSimulation(track);
  if (cc !== undefined) assert.equal(sim.selectEngineClass(cc), true);
  sim.start();
  sim.step(3);
  sim.setKey('w', true);
  for (let frame = 0; frame < 300; frame++) sim.step(1 / 60);
  return sim;
}
test('100cc is the default and preserves the original acceleration exactly', () => {
  const sim = drive();
  const explicit = drive(100);
  assert.deepEqual(sim.state, explicit.state);
  let expected = 0;
  for (let frame = 0; frame < 300; frame++) {
    expected = advanceSpeed(expected, true, false, false, 1 / 60, 'chonkers');
  }
  assert.equal(sim.state.speed, expected);
});
test('all classes preserve player driving and change only rival pace', () => {
  const easy = drive(50), normal = drive(100), hard = drive(150);
  const drivingState = ({ engineClass, ...state }) => state;
  assert.deepEqual(drivingState(easy.state), drivingState(normal.state));
  assert.deepEqual(drivingState(hard.state), drivingState(normal.state));
  const relativePace = (sim) => sim.rivals[0].speed / sim.state.speed;
  assert.ok(relativePace(easy) < relativePace(normal));
  assert.ok(relativePace(hard) > relativePace(normal));
});
test('class selection is validated and remains locked through countdown, racing and pause', () => {
  const sim = createRaceSimulation(track);
  assert.equal(sim.selectEngineClass(200), false);
  assert.equal(sim.selectEngineClass(50), true);
  sim.start();
  assert.equal(sim.selectEngineClass(150), false);
  sim.step(3);
  assert.equal(sim.selectEngineClass(100), false);
  sim.pause();
  assert.equal(sim.selectEngineClass(150), false);
  sim.start();
  assert.equal(sim.state.engineClass, 50);
});
