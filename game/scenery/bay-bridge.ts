import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Approximate western suspension spans in local map meters. The bridge is a
// distant skyline model, not a surveyed road or a drivable part of the circuit.
export function buildBayBridge(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'San Francisco–Oakland Bay Bridge';
  scene.add(group);
  // Atmospheric colors keep the distant silhouette legible without changing city fog.
  const steel = new T.MeshStandardMaterial({ color: '#88999e', roughness: 0.92, fog: false });
  const concrete = new T.MeshStandardMaterial({ color: '#a6afac', roughness: 1, fog: false });
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const start = new T.Vector3(445, 0, -255);
  const direction = new T.Vector3(0.882, 0, -0.471).normalize();
  const sideways = new T.Vector3(-direction.z, 0, direction.x);
  const point = (s: number, y: number, across = 0) =>
    start.clone().addScaledVector(direction, s).addScaledVector(sideways, across).setY(y);
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const geometries = batches.get(m) || [];
    geometries.push(g);
    batches.set(m, geometries);
  };
  const beam = (a: T.Vector3, b: T.Vector3, width: number, depth = width, material = steel) => {
    const delta = b.clone().sub(a);
    const g = new T.BoxGeometry(width, delta.length(), depth);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    add(g, material);
  };
  const towers = [500, 1120, 1900, 2520];
  for (const s of towers) {
    for (const side of [-1, 1]) {
      beam(point(s, -2, side * 13), point(s, 26, side * 13), 13, 13, concrete);
      beam(point(s, 24, side * 13), point(s, 151, side * 13), 5, 5);
    }
    for (const y of [62, 90, 118, 147]) beam(point(s, y, -13), point(s, y, 13), 3.2);
    for (const y of [66, 94, 122]) {
      beam(point(s, y, -13), point(s, y + 23, 13), 1.6);
      beam(point(s, y, 13), point(s, y + 23, -13), 1.6);
    }
  }
  const length = 3000;
  for (let s = 0; s < length; s += 25) {
    beam(point(s, 58), point(s + 25, 58), 27, 2.2);
    beam(point(s, 50), point(s + 25, 50), 27, 1.8);
    for (const side of [-1, 1]) {
      beam(point(s, 49, side * 13), point(s + 25, 60, side * 13), 0.7);
      beam(point(s, 60, side * 13), point(s + 25, 49, side * 13), 0.7);
    }
  }
  const anchors = [0, ...towers, length];
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1],
      b = anchors[i];
    const ya = towers.includes(a) ? 150 : 62,
      yb = towers.includes(b) ? 150 : 62;
    const sag = ya === 150 && yb === 150 ? 69 : 20;
    const cableHeight = (t: number) => ya * (1 - t) + yb * t - 4 * sag * t * (1 - t);
    const steps = Math.ceil((b - a) / 18);
    for (const side of [-1, 1])
      for (let j = 0; j < steps; j++) {
        const t = j / steps,
          next = (j + 1) / steps;
        const s = a + (b - a) * t;
        beam(
          point(s, cableHeight(t), side * 13),
          point(a + (b - a) * next, cableHeight(next), side * 13),
          1.1,
        );
        beam(point(s, 61, side * 13), point(s, cableHeight(t), side * 13), 0.28);
      }
  }
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error('Bay Bridge geometry could not be merged');
    group.add(new T.Mesh(geometry, material));
    geometries.forEach((g) => g.dispose());
  }
}
