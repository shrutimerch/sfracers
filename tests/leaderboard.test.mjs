import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSubmission, parseXHandle, formatRaceTime } from '../game/leaderboard/model.ts';
const result = {
  id: '11a1ac20-12d2-4210-8bd7-8b3eb1927326',
  name: ' Shruti ',
  timeMs: 95432,
  character: 'waymo',
  position: 2,
};
test('names trim, optional profiles normalize, and race data stays attached', () => {
  assert.deepEqual(parseSubmission(result), { ...result, name: 'Shruti', xHandle: null });
  assert.equal(parseSubmission({ ...result, xHandle: 'https://x.com/racer_1' }).xHandle, 'racer_1');
  assert.equal(formatRaceTime(result.timeMs), '01:35.43');
  assert.equal(formatRaceTime(60000), '01:00.00');
});
test('only valid X profiles become clickable links', () => {
  for (const value of [
    '@racer',
    'https://x.com/racer',
    'https://twitter.com/racer/',
    'x.com/racer',
  ])
    assert.equal(parseXHandle(value), 'racer');
  for (const value of [
    'javascript:alert(1)',
    'https://evil.com/racer',
    'https://x.com/racer/status/123',
    '@bad-name',
    'https://x.com.evil.com/racer',
  ])
    assert.throws(() => parseXHandle(value));
  assert.equal(parseXHandle(''), null);
});
test('invalid names, times, places and racers cannot be submitted', () => {
  for (const change of [
    { name: '<b>' },
    { name: '' },
    { name: 'x'.repeat(21) },
    { timeMs: 0 },
    { timeMs: Infinity },
    { timeMs: 90000.5 },
    { position: 0 },
    { character: 'unknown' },
    { id: 'invalid' },
  ])
    assert.throws(() => parseSubmission({ ...result, ...change }));
});
