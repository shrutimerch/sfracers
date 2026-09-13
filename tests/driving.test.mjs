import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advanceSpeed, drivingSurface, raceChecks } from '../game/simulation/driving.ts';
const d = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
test('throttle acceleration tapers with speed for normal driving and boost', () => {
  for (const boosting of [false, true]) {
    const gains = [0, 25, 50, 100, 200].map(
      (speed) => advanceSpeed(speed, true, false, boosting, 1 / 60) - speed,
    );
    assert.ok(gains.every((gain) => gain > 0));
    assert.ok(gains.every((gain, i) => i === 0 || gain < gains[i - 1]));
    assert.ok(Math.abs(gains[1] / gains[0] - 0.5) < 1e-10);
  }
});
test('high speed does not weaken braking or coasting and brake wins over throttle', () => {
  for (const speed of [25, 100]) {
    assert.ok(Math.abs(advanceSpeed(speed, true, true, true, 0.02) - (speed - 48 * 0.02)) < 1e-10);
    assert.ok(
      Math.abs(advanceSpeed(speed, false, false, false, 0.02) - (speed - 3.8 * 0.02)) < 1e-10,
    );
  }
});
test('forward acceleration has no cap, boost accelerates faster and braking still slows', () => {
  let normal = 0,
    boost = 0;
  for (let i = 0; i < 600; i++) {
    normal = advanceSpeed(normal, true, false, false, 1 / 60);
    boost = advanceSpeed(boost, true, false, true, 1 / 60);
  }
  assert.ok(normal * 2.237 > 80);
  assert.ok(boost > normal);
  assert.ok(advanceSpeed(normal, true, false, false, 1 / 60) > normal);
  assert.ok(advanceSpeed(boost, true, false, false, 1 / 60) >= boost);
  assert.ok(advanceSpeed(normal, false, true, false, 1 / 60) < normal);
  assert.ok(advanceSpeed(normal, false, false, false, 1 / 60) < normal);
});
test('all of South Park and the full road width are drivable, but distant off-road points are bounded', () => {
  const surface = drivingSurface(d.roads, d.paths);
  let alternate = 0;
  for (const r of d.roads.filter((r) => r.name === 'South Park'))
    for (const p of r.points) {
      assert.ok(surface(...p).outside <= 0);
      if (!d.route.some((q) => q[0] === p[0] && q[1] === p[1])) alternate++;
    }
  assert.ok(alternate > 0);
  const simple = drivingSurface([
    {
      name: 'Street',
      points: [
        [0, 0],
        [100, 0],
      ],
    },
  ]);
  assert.ok(simple(50, 5.8).outside <= 0);
  assert.equal(simple(50, 30).z, 6);
});
test('either park branch reaches the first checkpoint without missing checkpoints on the other side', () => {
  const checks = raceChecks(d.course.length, d.course.sections);
  assert.equal(checks[0], d.course.sections[0].length);
  assert.ok(checks.every((c, i) => i === 0 || c > checks[i - 1]));
  assert.equal(checks.at(-1), d.course.length);
});
