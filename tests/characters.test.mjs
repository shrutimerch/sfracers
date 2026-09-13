import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  CHARACTERS,
  DEFAULT_CHARACTER,
  isCharacterId,
  raceRoster,
} from '../game/characters/roster.ts';
import { createRacer } from '../game/characters/racer.ts';

test('Chonkers starts by default and every selection leaves three distinct rivals', () => {
  assert.equal(DEFAULT_CHARACTER, 'chonkers');
  for (const character of CHARACTERS) {
    const roster = raceRoster(character.id);
    assert.equal(roster[0], character.id);
    assert.equal(new Set(roster).size, 4);
    assert.deepEqual([...roster].sort(), CHARACTERS.map((c) => c.id).sort());
    assert.ok(isCharacterId(character.id));
  }
  assert.equal(isCharacterId('mario'), false);
  assert.equal(isCharacterId(null), false);
});

for (const character of CHARACTERS) {
  test(`${character.name}: complete smooth model fits the racing footprint and animates without leaks`, () => {
    const racer = createRacer(character.id);
    const bounds = new T.Box3().setFromObject(racer.root);
    assert.ok(bounds.min.y >= -0.001, 'tires sit on the road');
    assert.ok(bounds.max.x - bounds.min.x < 2.5);
    assert.ok(bounds.max.z - bounds.min.z < 1.6);
    const geometries = new Set(),
      materials = new Set();
    let meshes = 0;
    racer.root.traverse((part) => {
      if (!part.isMesh) return;
      meshes++;
      geometries.add(part.geometry);
      materials.add(part.material);
      for (const attribute of ['position', 'normal']) {
        assert.ok(Array.from(part.geometry.attributes[attribute].array).every(Number.isFinite));
      }
    });
    assert.ok(meshes <= 40, 'static details are batched');
    const pivot = racer.root.getObjectByName('Front steering pivot');
    const wheel = pivot.getObjectByName('Spinning wheel');
    racer.update(0.1, 12, 1, true, 1);
    assert.notEqual(pivot.rotation.y, 0);
    assert.notEqual(wheel.rotation.z, 0);
    const rotation = wheel.rotation.z;
    racer.update(0, 12, 1, true, 1);
    assert.equal(wheel.rotation.z, rotation, 'paused wheels remain still');
    racer.update(0.1, 0, 0, false, 2);
    assert.ok(Math.abs(pivot.rotation.y) < 1e-9, 'steering returns to center');
    let disposedGeometries = 0,
      disposedMaterials = 0;
    geometries.forEach((g) => g.addEventListener('dispose', () => disposedGeometries++));
    materials.forEach((m) => m.addEventListener('dispose', () => disposedMaterials++));
    racer.dispose();
    assert.equal(disposedGeometries, geometries.size);
    assert.equal(disposedMaterials, materials.size);
  });
}

const { characterAcceleration, accelerationRating } =
  await import('../game/characters/performance.ts');
const { advanceSpeed } = await import('../game/simulation/driving.ts');
const { createRaceSimulation } = await import('../game/simulation/simulation.ts');

test('Karl launches fastest, Chonkers pulls hardest at speed, and middleweights stay between', () => {
  for (const boosting of [false, true]) {
    assert.ok(
      characterAcceleration('karl', 0, boosting) > characterAcceleration('daniel', 0, boosting),
    );
    assert.ok(
      characterAcceleration('daniel', 0, boosting) > characterAcceleration('waymo', 0, boosting),
    );
    assert.ok(
      characterAcceleration('waymo', 0, boosting) > characterAcceleration('chonkers', 0, boosting),
    );
    assert.ok(
      characterAcceleration('chonkers', 40, boosting) >
        characterAcceleration('waymo', 40, boosting),
    );
    assert.ok(
      characterAcceleration('waymo', 40, boosting) > characterAcceleration('daniel', 40, boosting),
    );
    assert.ok(
      characterAcceleration('daniel', 40, boosting) > characterAcceleration('karl', 40, boosting),
    );
    for (let speed = 0; speed <= 200; speed += 2) {
      const heavy = characterAcceleration('chonkers', speed, boosting);
      const light = characterAcceleration('karl', speed, boosting);
      for (const id of ['daniel', 'waymo']) {
        const pull = characterAcceleration(id, speed, boosting);
        assert.ok(pull >= Math.min(heavy, light) && pull <= Math.max(heavy, light));
      }
    }
  }
  const retention = (id) => characterAcceleration(id, 40) / characterAcceleration(id, 0);
  assert.ok(retention('chonkers') > retention('karl'));
});

test('every character keeps boost, braking, reverse and unlimited forward acceleration', () => {
  for (const { id } of CHARACTERS) {
    for (const speed of [0, 20, 40, 200]) {
      const normal = advanceSpeed(speed, true, false, false, 0.1, id);
      assert.ok(normal > speed);
      assert.ok(advanceSpeed(speed, true, false, true, 0.1, id) > normal);
      assert.ok(
        Math.abs(advanceSpeed(speed, true, true, true, 0.1, id) - Math.max(-8, speed - 4.8)) <
          1e-10,
      );
    }
    assert.equal(advanceSpeed(-8, false, true, false, 0.1, id), -8);
    for (const mph of [0, 40, 80])
      assert.ok(accelerationRating(id, mph) > 0 && accelerationRating(id, mph) <= 100);
  }
});

test('the selected model uses its physics, resets preserve selection and rivals follow the roster', () => {
  const track = {
    roads: [
      {
        name: 'Straight',
        points: [
          [0, 0],
          [10000, 0],
        ],
        width: 100,
      },
    ],
    route: [
      [0, 0],
      [10000, 0],
      [0, 0],
    ],
    buildings: [],
  };
  const launchSpeed = (id) => {
    const sim = createRaceSimulation(track);
    assert.equal(sim.state.character, 'chonkers');
    assert.ok(sim.selectCharacter(id));
    assert.deepEqual(
      sim.rivals.map((r) => r.character),
      raceRoster(id).slice(1),
    );
    sim.start();
    sim.step(3);
    assert.equal(sim.selectCharacter(id === 'karl' ? 'chonkers' : 'karl'), false);
    sim.setKey('w', true);
    for (let i = 0; i < 30; i++) sim.step(1 / 60);
    const speed = sim.state.speed;
    assert.ok(sim.rivals.every((r) => r.speed > 0));
    sim.start();
    assert.equal(sim.state.character, id);
    assert.equal(sim.state.speed, 0);
    assert.ok(sim.rivals.every((r) => r.speed === 0));
    return speed;
  };
  const speeds = ['chonkers', 'waymo', 'daniel', 'karl'].map(launchSpeed);
  assert.ok(speeds.every((speed, i) => i === 0 || speed > speeds[i - 1]));
});
