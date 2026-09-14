import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChallengeTime, challengePath, isLocalHost } from '../game/leaderboard/challenge.ts';
test('challenge links preserve the exact lap time', () => {
  const url = new URL(challengePath(72550), 'https://example.com');
  assert.equal(url.pathname, '/challenge');
  assert.equal(parseChallengeTime(url.searchParams.get('time')), 72550);
  assert.equal(challengePath(), '/');
});
test('invalid challenge times are rejected', () => {
  for (const value of [undefined, ['72550'], 'NaN', '-5', '3.14', '999999999', '19999', '<script>']) {
    assert.equal(parseChallengeTime(value), null);
  }
});
test('local game addresses cannot become friend share links', () => {
  for (const host of ['localhost', 'foo.localhost', '127.0.0.1', '[::1]', '192.168.1.5', '10.0.0.1', '172.16.0.1']) assert.equal(isLocalHost(host), true);
  assert.equal(isLocalHost('racer.example.com'), false);
});

test('challenge links preserve names, racers, cc and finishing place', async () => {
  const { parseChallengeDetails } = await import('../game/leaderboard/challenge.ts');
  const url = new URL(challengePath(72550, { name: 'Jo & Sam', character: 'waymo', cc: 150, position: 2 }), 'https://example.com');
  const details = parseChallengeDetails(Object.fromEntries(url.searchParams));
  assert.equal(details.name, 'Jo & Sam');
  assert.equal(details.character.name, 'Waymo');
  assert.equal(details.cc, 150);
  assert.equal(details.position, 2);
  const invalid = parseChallengeDetails({ name: '<script>', character: 'fake', cc: '999', position: '0' });
  assert.equal(invalid.name, '');
  assert.equal(invalid.character, undefined);
  assert.equal(invalid.cc, undefined);
  assert.equal(invalid.position, undefined);
});
