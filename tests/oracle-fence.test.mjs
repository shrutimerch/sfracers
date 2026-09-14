import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  buildOracleApproachGarden,
  oracleGroundGeometry,
} from '../game/scenery/oracle-approach-garden.ts';

test('Oracle fence extends toward Second Street and leaves the northern park open', () => {
  const scene = new T.Scene();
  buildOracleApproachGarden(scene);
  const garden = scene.children[0];
  assert.equal(garden.userData.featureCounts['mulched flower border'], 3);
  const meshes = garden.children.filter((c) => c.isMesh);
  const fence = meshes.find((m) => m.material.color.getHexString() === '283630');
  assert.ok(fence);
  const bounds = new T.Box3().setFromObject(fence);
  assert.ok(bounds.min.z > 620, 'no fence may extend north across the open park');
  assert.ok(bounds.max.z > 681, 'fence must reach the Second Street corner');
  assert.ok(bounds.max.z < 685, 'fence must stop before the cross street');
  const flowers = meshes.filter((m) =>
    ['b84855', 'cc5c69', '9b394a'].includes(m.material.color.getHexString()),
  );
  const flowerBounds = new T.Box3();
  flowers.forEach((m) => flowerBounds.union(new T.Box3().setFromObject(m)));
  assert.ok(flowerBounds.min.z > 619);
  assert.ok(flowerBounds.max.z > 677);
});

test('service cars sit on the alley surface with trees behind the fence', () => {
  const scene = new T.Scene();
  buildOracleApproachGarden(scene);
  const garden = scene.children[0];
  const cars = garden.children.filter((c) => c.name === 'Oracle service parked car');
  assert.equal(cars.length, 6);
  for (const car of cars) {
    const bounds = new T.Box3().setFromObject(car);
    assert.ok(Math.abs(bounds.min.y + 0.85) < 0.001, 'tires rest on the recessed parking surface');
    const front = new T.Vector3(1, 0, 0).applyQuaternion(car.quaternion);
    const [tx, tz] = car.userData.frontageTangent;
    assert.ok(Math.abs(front.x * tx + front.z * tz) < 1e-6, 'cars face perpendicular to the fence');
    assert.ok(front.x > 0 && front.z > 0, 'cars face toward the Embarcadero');
    const base = new T.Mesh(
      oracleGroundGeometry(),
      new T.MeshBasicMaterial({ side: T.DoubleSide }),
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = -0.2;
    base.updateMatrixWorld();
    const ray = new T.Raycaster(
      new T.Vector3(car.position.x, 5, car.position.z),
      new T.Vector3(0, -1, 0),
    );
    assert.equal(
      ray.intersectObject(base).length,
      0,
      'city ground must not cover the recessed cars',
    );
    assert.ok(bounds.min.z > 620, 'parking stays out of the open park');
  }
  assert.equal(garden.children.filter((c) => c.name === 'Oracle approach tree').length, 6);
  assert.equal(garden.userData.featureCounts['narrow service alley'], 3);
});

test('the ballpark access street is one lane while city blocks keep their width', async () => {
  const { prepareCourse } = await import('../game/simulation/course.ts');
  const { isOracleServiceAlley } = await import('../game/scenery/config/scenery-locations.ts');
  const { readFileSync } = await import('node:fs');
  const source = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
  const prepared = prepareCourse(source);
  const alleys = prepared.roads.filter(isOracleServiceAlley);
  assert.equal(alleys.length, 2);
  assert.ok(alleys.every((r) => r.width === 3.4));
  source.roads.forEach((road, i) => {
    if (road.name === '2nd Street' && !isOracleServiceAlley(road)) {
      assert.equal(prepared.roads[i].width, road.width);
    }
  });
});
