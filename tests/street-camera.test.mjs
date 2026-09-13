import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as T from 'three';
import { streetSurface, createStreetCamera } from '../app/street-camera.ts';
const object = new T.Object3D();
const hit = (height, normal) => ({
  object,
  face: { normal: new T.Vector3(...normal) },
  point: new T.Vector3(0, height, 0),
});
test('street grounding rejects walls and elevated canopy while retaining pavement', () => {
  assert.equal(
    streetSurface([hit(10, [0, 1, 0]), hit(0.1, [0, 1, 0]), hit(-2, [1, 0, 0])], 0),
    0.1,
  );
  assert.equal(streetSurface([hit(10, [0, 1, 0])], 0), null);
  assert.equal(streetSurface([hit(-1, [0, -1, 0])], 0), null);
});
test('chase camera stops before scenery instead of moving inside it', () => {
  const scene = new T.Scene();
  const wall = new T.Mesh(new T.BoxGeometry(10, 10, 1), new T.MeshBasicMaterial());
  wall.position.z = 4;
  scene.add(wall);
  scene.updateMatrixWorld(true);
  const camera = createStreetCamera(scene),
    desired = new T.Vector3(0, 0, 8);
  camera.keepClear(new T.Vector3(), desired);
  assert.ok(desired.z < 3.5 && desired.z > 2);
  wall.geometry.dispose();
  wall.material.dispose();
});
