import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { motionPath, buildCityMotion } from '../game/scenery/city-motion.ts';

test('path sampling follows distance through corners and ignores duplicate points', () => {
  const path = motionPath([
    [0, 0],
    [0, 0],
    [10, 0],
    [10, 20],
  ]);
  assert.equal(path.length, 30);
  assert.deepEqual(path.at(5, 2), { x: 5, z: 2, angle: 0 });
  assert.deepEqual(path.at(20, 2), { x: 8, z: 10, angle: Math.PI / 2 });
  assert.deepEqual(path.at(100), { x: 10, z: 20, angle: Math.PI / 2 });
  assert.deepEqual(motionPath([]).at(0), { x: 0, z: 0, angle: 0 });
});

test('city actors move at frame-independent speed and stay finite across route boundaries', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const a = buildCityMotion(new T.Scene(), data);
  const b = buildCityMotion(new T.Scene(), data);
  assert.equal(a.counts.streetcars, 2);
  assert.ok(a.counts.cars > 0);
  assert.ok(a.counts.pedestrians > 0);
  const initial = a.root.children[0].position.clone();
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  b.update(1);
  assert.ok(a.root.children[0].position.distanceTo(initial) > 7.9);
  assert.ok(a.root.children[0].position.distanceTo(b.root.children[0].position) < 1e-8);
  const paused = a.root.children.map((o) => o.position.clone());
  a.update(0);
  a.root.children.forEach((o, i) => assert.ok(o.position.equals(paused[i])));
  for (let i = 0; i < 1200; i++) a.update(1);
  for (const actor of a.root.children) {
    assert.ok(actor.position.toArray().every(Number.isFinite));
    assert.ok(Number.isFinite(actor.rotation.y));
  }
});

test('waterfront cars clear the promenade, bike lane, and road edges along their routes', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const roads = data.roads
    .filter((r) => /Embarcadero|King Street/.test(r.name))
    .filter((r) => motionPath(r.points).length > 100)
    .slice(0, 8);
  const city = buildCityMotion(new T.Scene(), data);
  const cars = city.root.children.filter((o) => o.name === 'Ambient car');
  const distanceToSegment = (x, z, a, b) => {
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
    );
    return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
  };
  // Check the full car footprint, including its wheels, throughout each route.
  for (let frame = 0; frame < 1200; frame++) {
    city.update(0.1);
    cars.forEach((car, i) => {
      const road = roads[i];
      const distance = Math.min(
        ...road.points
          .slice(1)
          .map((b, j) => distanceToSegment(car.position.x, car.position.z, road.points[j], b)),
      );
      assert.ok(distance + 1.01 < (road.width ?? (road.name === 'King Street' ? 9.6 : 14)) / 2);
      if (road.name === 'King Street')
        assert.ok(distance + 1.01 < 2.875, 'car overlaps curbside bike lane');
      car.updateMatrixWorld(true);
      for (const x of [-2.2, 0, 2.2])
        for (const z of [-1.01, 1.01]) {
          const point = car.localToWorld(new T.Vector3(x, 0, z));
          for (const path of data.paths ?? []) {
            const clearance = Math.min(
              ...path.points
                .slice(1)
                .map((b, j) => distanceToSegment(point.x, point.z, path.points[j], b)),
            );
            assert.ok(clearance > path.width / 2 + 0.5, 'car overlaps promenade paving');
          }
        }
    });
  }
});

test('dense human crowd uses rounded instanced parts and animates knees and elbows', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const city = buildCityMotion(new T.Scene(), data);
  assert.ok(city.counts.pedestrians >= 100);
  const pedestrians = city.root.children.filter((o) => o.name === 'Walking pedestrian');
  const batches = city.root.children.filter((o) => o instanceof T.InstancedMesh);
  assert.ok(batches.length > 0 && batches.length < 60);
  const pedestrian = pedestrians[0];
  assert.ok(pedestrian.getObjectByName('knee'));
  assert.ok(pedestrian.getObjectByName('elbow'));
  pedestrian.traverse((o) => {
    if (o instanceof T.Mesh) assert.notEqual(o.geometry.type, 'BoxGeometry');
  });
  const before = batches.map((b) => b.instanceMatrix.array.slice());
  const kneeAngle = pedestrian.getObjectByName('knee').rotation.z;
  city.update(0.25);
  assert.notEqual(pedestrian.getObjectByName('knee').rotation.z, kneeAngle);
  assert.ok(
    batches.some((b, i) => b.instanceMatrix.array.some((value, j) => value !== before[i][j])),
  );
  for (const batch of batches) assert.ok(batch.instanceMatrix.array.every(Number.isFinite));
});

test('cars stay opaque and solid at route ends near the driver', () => {
  const data = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const road = data.roads
    .filter((r) => /Embarcadero|King Street/.test(r.name))
    .find((r) => motionPath(r.points).length > 100);
  const path = motionPath(road.points);
  const end = path.at(path.length, 0.75);
  const city = buildCityMotion(new T.Scene(), data);
  city.update(1000, end);
  const obstacle = city.obstacles[0];
  assert.ok(Math.hypot(obstacle.x - end.x, obstacle.z - end.z) < 0.001);
  city.update(1, end);
  assert.ok(Math.hypot(obstacle.x - end.x, obstacle.z - end.z) < 0.001);
  for (const car of city.root.children.filter((o) => o.name === 'Ambient car'))
    car.traverse((part) => {
      if (part instanceof T.Mesh) {
        assert.equal(part.material.opacity, 1);
        assert.equal(part.material.transparent, false);
      }
    });
  city.update(1, { x: 100000, z: 100000 });
  assert.notEqual(obstacle.x, end.x);
  assert.equal(obstacle.previousX, obstacle.x);
  assert.equal(obstacle.previousZ, obstacle.z);
});
