import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeCheckpoint,
  lapDistance,
  RACE_LAPS,
  KART_SCALE,
} from '../game/simulation/race-laps.ts';
test('all checkpoints are required and the first lap finishes', () => {
  let state = { cp: 0, lap: 0, finished: false };
  for (let i = 0; i < 3; i++) {
    state = completeCheckpoint(state.cp, state.lap, 4);
    assert.equal(state.finished, false);
  }
  assert.deepEqual(completeCheckpoint(state.cp, state.lap, 4), { cp: 3, lap: 0, finished: true });
});
test('rivals stop at the first finish', () => {
  assert.equal(lapDistance(500, 1000), 500);
  assert.equal(lapDistance(1000, 1000), 1000);
  assert.equal(lapDistance(1050, 1000), 1000);
  assert.equal(RACE_LAPS, 1);
  assert.equal(KART_SCALE, 0.65);
});
