import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecretCode, SECRET_CODES } from '../game/characters/secret-code.ts';
import { SECRET_CHARACTERS, raceRoster } from '../game/characters/roster.ts';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
import { createCharacterSelection } from '../game/characters/selection.ts';

test('classic and requested secret sequences unlock exactly on the final key', () => {
  for (const code of SECRET_CODES) {
    const matcher = createSecretCode();
    code.forEach((key, i) =>
      assert.equal(matcher.press(key.toUpperCase(), false, 1000 + i * 100), i === code.length - 1),
    );
    assert.equal(matcher.press('a', false, 2200), false);
  }
});
test('wrong keys, held keys, old sequences and lost focus cannot accidentally unlock', () => {
  const matcher = createSecretCode();
  const code = SECRET_CODES[0];
  assert.equal(matcher.press('arrowup', true, 100), false);
  code.slice(1).forEach((key, i) => assert.equal(matcher.press(key, false, 200 + i * 100), false));
  matcher.reset();
  code.slice(0, -1).forEach((key, i) => matcher.press(key, false, 1000 + i * 100));
  assert.equal(matcher.press('a', false, 10000), false);
  matcher.reset();
  code.slice(0, -1).forEach((key, i) => matcher.press(key, false, 11000 + i * 100));
  matcher.reset();
  assert.equal(matcher.press('a', false, 13000), false);
  code.forEach((key, i) =>
    assert.equal(matcher.press(key, false, 14000 + i * 100), i === code.length - 1),
  );
});
test('all eight secret drivers race exclusively with their CEO or VC group, including after restart', () => {
  assert.equal(SECRET_CHARACTERS.length, 8);
  const track = {
    roads: [
      {
        name: 'Test',
        points: [
          [0, 0],
          [1000, 0],
        ],
      },
    ],
    route: [
      [0, 0],
      [1000, 0],
      [0, 0],
    ],
    buildings: [],
  };
  for (const character of SECRET_CHARACTERS) {
    const sim = createRaceSimulation(track);
    let visible;
    const selection = createCharacterSelection(
      sim,
      (id) => {
        visible = id;
      },
      character.id,
    );
    assert.equal(visible, character.id);
    selection.start(character.id);
    const expected = SECRET_CHARACTERS.filter((c) => c.group === character.group)
      .map((c) => c.id)
      .sort();
    assert.deepEqual(raceRoster(character.id).sort(), expected);
    assert.deepEqual([sim.state.character, ...sim.rivals.map((r) => r.character)].sort(), expected);
    selection.start();
    assert.equal(sim.state.character, character.id);
    assert.equal(visible, character.id);
  }
});

test('secret racers carry a rear-facing company badge and Elon drives the Tesla', async () => {
  const { createRacer } = await import('../game/characters/racer.ts');
  const { REAR_BRANDS } = await import('../game/characters/brand-badge.ts');
  const { readFileSync } = await import('node:fs');
  const { Vector3 } = await import('three');
  for (const character of SECRET_CHARACTERS) {
    const racer = createRacer(character.id);
    const badge = racer.root.getObjectByName(`${REAR_BRANDS[character.id]} rear badge`);
    assert.ok(badge);
    assert.ok(new Vector3(0, 0, 1).applyEuler(badge.rotation).x < -0.99);
    assert.ok(badge.position.x < -1.4);
    const svg = readFileSync(
      new URL(`../public/brands/badge-${character.id}.svg`, import.meta.url),
      'utf8',
    );
    assert.ok(svg.includes('<path') && svg.includes('viewBox'));
    assert.ok(!svg.includes('<script'));
    if (character.id === 'elon') assert.equal(racer.root.userData.vehicle, 'Tesla Cybertruck');
    racer.dispose();
  }
});
