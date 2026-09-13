import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { buildSidewalks } from '../game/scenery/sidewalks.ts';
import { prepareCourse } from '../game/simulation/course.ts';
import {
  EMBARCADERO_LAYOUT as layout,
  hasEmbarcaderoParking,
} from '../game/scenery/config/embarcadero-layout.ts';
import {
  embarcaderoPlacements,
  buildEmbarcaderoStreetscape,
} from '../game/scenery/embarcadero-streetscape.ts';
const d = prepareCourse(
  JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url))),
);
test('additional frontage trees sit on rendered sidewalk slabs', () => {
  const scene = new T.Scene();
  buildSidewalks(scene, d);
  scene.updateMatrixWorld(true);
  for (const car of embarcaderoPlacements(d).cars) {
    for (const x of [-2.3, 0, 2.3])
      for (const z of [-1, 0, 1]) {
        const p = [
          car.position[0] + Math.cos(car.angle) * x - Math.sin(car.angle) * z,
          car.position[1] + Math.sin(car.angle) * x + Math.cos(car.angle) * z,
        ];
        const ray = new T.Raycaster(new T.Vector3(p[0], 0.8, p[1]), new T.Vector3(0, -1, 0));
        assert.ok(
          !ray
            .intersectObjects(scene.children, true)
            .some((hit) => hit.point.y > 0.2 && hit.point.y < 0.35),
          `parked car overlaps sidewalk at ${p}`,
        );
      }
  }
  for (const p of embarcaderoPlacements(d).trees) {
    const ray = new T.Raycaster(new T.Vector3(p[0], 0.8, p[1]), new T.Vector3(0, -1, 0));
    assert.ok(
      ray
        .intersectObjects(scene.children, true)
        .some((hit) => hit.point.y > 0.2 && hit.point.y < 0.35),
      `tree has no sidewalk at ${p}`,
    );
  }
});
test('two motor lanes, a bike lane and curbside parking occupy separate parts of the loaded road surface', () => {
  assert.ok(d.roads.filter(hasEmbarcaderoParking).every((r) => r.width === layout.roadWidth));
  const [left, right] = layout.trafficCenters;
  assert.ok(left - 1 > -7 && left + 1 < layout.divider);
  assert.ok(right - 1 > layout.divider && right + 1 < layout.bikeCenter - layout.bikeHalfWidth);
  assert.ok(
    layout.parkingCenter - layout.parkingHalfWidth > layout.bikeCenter + layout.bikeHalfWidth + 0.5,
  );
  assert.ok(layout.parkingCenter + layout.parkingHalfWidth < 7);
  assert.ok(layout.treeOffset > 8);
});
test('parking is parallel and exclusively right of the southbound building-side bike lane', () => {
  const { cars, trees } = embarcaderoPlacements(d);
  assert.ok(cars.length >= 10 && trees.length >= 10);
  for (const car of cars) {
    assert.ok(Math.sin(car.angle) > 0.9);
    const roads = d.roads.filter(
      (r) => r.name === 'The Embarcadero' && r.points.at(-1)[1] > r.points[0][1],
    );
    let nearest = Infinity,
      lateral = 0;
    for (const road of roads)
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1],
          b = road.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          l = Math.hypot(dx, dz);
        if (!l) continue;
        const t = ((car.position[0] - a[0]) * dx + (car.position[1] - a[1]) * dz) / (l * l);
        if (t < 0 || t > 1) continue;
        const signed = (-(car.position[0] - a[0]) * dz + (car.position[1] - a[1]) * dx) / l;
        if (Math.abs(signed) < nearest) {
          nearest = Math.abs(signed);
          lateral = signed;
        }
      }
    assert.ok(Math.abs(lateral - layout.parkingCenter) < 0.001);
  }
  const scene = new T.Scene(),
    result = buildEmbarcaderoStreetscape(scene, d);
  assert.equal(result.obstacles.length, cars.length);
  result.obstacles.forEach((body, i) => assert.deepEqual([body.x, body.z], cars[i].position));
  assert.ok(scene.children[0].children.length < 20, 'geometry stays batched');
});
