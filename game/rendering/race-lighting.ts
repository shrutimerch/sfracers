import * as T from 'three';

export const RACE_SKY = '#b9e3ef';

export function createRaceLighting(scene: T.Scene) {
  const ambient = new T.HemisphereLight('#d8efff', '#a0ae83', 1.85);
  const sun = new T.DirectionalLight('#ffe0a5', 2.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -95, right: 95, top: 95, bottom: -95, near: 1, far: 420,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 3;
  sun.shadow.intensity = 0.8;
  scene.add(ambient, sun, sun.target);

  // Keep the detailed shadow area near the racer throughout the circuit.
  // Snap in the light's ground-plane basis to avoid sub-texel shadow shimmer.
  const offset = new T.Vector3(-65, 140, -50);
  const right = new T.Vector3(50, 0, -65).normalize();
  const forward = new T.Vector3(65, 0, 50).normalize();
  const texel = 190 / 2048;
  function update(x: number, z: number, height = 0) {
    const u = Math.round((x * right.x + z * right.z) / texel) * texel;
    const v = Math.round((x * forward.x + z * forward.z) / texel) * texel;
    sun.target.position.set(right.x * u + forward.x * v, height, right.z * u + forward.z * v);
    sun.position.copy(sun.target.position).add(offset);
  }
  update(90, 490);
  return { sun, ambient, update };
}
