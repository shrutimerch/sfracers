import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parkParking, parkParkingObstacles } from '../game/scenery/south-park-parking.ts';
import { resolveTrafficCollision } from '../game/simulation/traffic-collision.ts';
const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
test('each visible South Park parked car blocks driving through it', () => {
  const cars = parkParking(data.roads),
    obstacles = parkParkingObstacles(data.roads);
  assert.ok(cars.length > 10);
  assert.equal(cars.length, obstacles.length);
  for (const c of obstacles) {
    const p = (distance) => ({
      x: c.x + Math.cos(c.angle) * distance,
      z: c.z + Math.sin(c.angle) * distance,
    });
    assert.ok(resolveTrafficCollision(p(-10), p(10), c.angle, [c]).blocked);
  }
});
test('west entrance junction has no parked car in its middle', () => {
  assert.ok(parkParking(data.roads).every((c) => Math.hypot(c.x - 29.52, c.z - 554.02) > 3));
});
