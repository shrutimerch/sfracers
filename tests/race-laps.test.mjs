import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeCheckpoint,
  lapDistance,
  RACE_LAPS,
  KART_SCALE,
} from '../game/simulation/race-laps.ts';
test('all checkpoints are required again after the first lap; only the second finishes', () => {
  let state = { cp: 0, lap: 0, finished: false };
  for (let i = 0; i < 4; i++) state = completeCheckpoint(state.cp, state.lap, 4);
  assert.deepEqual(state, { cp: 0, lap: 1, finished: false });
  for (let i = 0; i < 3; i++) {
    state = completeCheckpoint(state.cp, state.lap, 4);
    assert.equal(state.finished, false);
  }
  state = completeCheckpoint(state.cp, state.lap, 4);
  assert.deepEqual(state, { cp: 3, lap: 1, finished: true });
});
test('rivals wrap onto lap two and stop at the final finish', () => {
  assert.equal(lapDistance(1050, 1000), 50);
  assert.equal(lapDistance(1000, 1000), 0);
  assert.equal(lapDistance(2000, 1000), 1000);
  assert.equal(RACE_LAPS, 2);
  assert.equal(KART_SCALE, 0.65);
});
