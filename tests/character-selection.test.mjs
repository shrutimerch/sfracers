import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
import { createCharacterSelection } from '../game/characters/selection.ts';
import { raceRoster } from '../game/characters/roster.ts';
const track = {
  roads: [
    {
      name: 'Straight',
      points: [
        [0, 0],
        [1000, 0],
      ],
      width: 100,
    },
  ],
  route: [
    [0, 0],
    [1000, 0],
    [0, 0],
  ],
  buildings: [],
};
function engine(choice) {
  const sim = createRaceSimulation(track);
  let visibleCharacter = 'chonkers';
  const selection = createCharacterSelection(
    sim,
    (id) => {
      visibleCharacter = id;
    },
    choice,
  );
  return {
    sim,
    ...selection,
    get visibleCharacter() {
      return visibleCharacter;
    },
  };
}
test('Waymo selection survives an engine rebuild with the retained garage choice', () => {
  const first = engine('chonkers');
  assert.ok(first.selectCharacter('waymo'));
  const rebuilt = engine('waymo');
  assert.equal(rebuilt.sim.state.character, 'waymo');
  assert.equal(rebuilt.visibleCharacter, 'waymo');
  assert.ok(rebuilt.start('waymo'));
  assert.equal(rebuilt.sim.state.mode, 'countdown');
  assert.equal(rebuilt.visibleCharacter, 'waymo');
  assert.deepEqual(
    rebuilt.sim.rivals.map((r) => r.character),
    raceRoster('waymo').slice(1),
  );
});
test('Race as Waymo applies the garage choice even to a newly defaulted engine', () => {
  const game = engine('chonkers');
  assert.ok(game.start('waymo'));
  assert.equal(game.sim.state.character, 'waymo');
  assert.equal(game.visibleCharacter, 'waymo');
  assert.ok(game.start());
  assert.equal(game.sim.state.character, 'waymo');
});
test('mid-race selection cannot split the rendered character from its physics', () => {
  const game = engine('waymo');
  game.start();
  assert.equal(game.selectCharacter('chonkers'), false);
  assert.equal(game.start('chonkers'), false);
  assert.equal(game.visibleCharacter, 'waymo');
  assert.equal(game.sim.state.character, 'waymo');
});
