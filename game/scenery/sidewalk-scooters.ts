import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type ScooterPlacement = { x: number; y: number; z: number; angle: number };

/** Small parked rental scooters, batched by material to keep scenery draw calls low. */
export function buildSidewalkScooters(scene: T.Scene, placements: ScooterPlacement[]) {
  const dark = new T.MeshStandardMaterial({ color: '#25292c', roughness: 0.85 });
  const silver = new T.MeshStandardMaterial({ color: '#bbc3c5', metalness: 0.45, roughness: 0.45 });
  const green = new T.MeshStandardMaterial({ color: '#9ddc32', roughness: 0.65 });
  const red = new T.MeshStandardMaterial({ color: '#e64e44', roughness: 0.65 });
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  placements.forEach((p, index) => {
    const scooter = new T.Group();
    const accent = index % 3 === 1 ? red : green;
    const add = (g: T.BufferGeometry, m: T.Material, x: number, y: number, z = 0) => {
      const mesh = new T.Mesh(g, m);
      mesh.position.set(x, y, z);
      scooter.add(mesh);
      return mesh;
    };
    const box = (x: number, y: number, z: number, l: number, h: number, w: number, m: T.Material) =>
      add(new T.BoxGeometry(l, h, w), m, x, y, z);
    const rod = (a: number[], b: number[], radius: number, m: T.Material) => {
      const start = new T.Vector3(...a),
        end = new T.Vector3(...b);
      const delta = end.clone().sub(start);
      const mesh = add(new T.CylinderGeometry(radius, radius, delta.length(), 8), m, 0, 0);
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      mesh.position.copy(start.add(end).multiplyScalar(0.5));
    };
    // Chunky small tires, low battery deck, tall stem and wide rubber grips.
    for (const x of [-0.46, 0.46]) {
      add(new T.TorusGeometry(0.12, 0.035, 6, 12), dark, x, 0.155);
      const hub = add(new T.CylinderGeometry(0.078, 0.078, 0.075, 10), silver, x, 0.155);
      hub.rotation.x = Math.PI / 2;
    }
    box(-0.05, 0.19, 0, 0.83, 0.105, 0.2, accent);
    box(-0.05, 0.25, 0, 0.66, 0.018, 0.17, dark);
    rod([0.46, 0.15, 0], [0.29, 1.24, 0], 0.037, silver);
    rod([0.42, 0.4, 0], [0.32, 1.02, 0], 0.045, accent);
    rod([0.29, 1.24, -0.28], [0.29, 1.24, 0.28], 0.025, dark);
    for (const side of [-1, 1]) {
      rod([0.29, 1.24, side * 0.17], [0.29, 1.24, side * 0.29], 0.036, dark);
      rod([0.47, 0.16, side * 0.06], [0.42, 0.43, side * 0.06], 0.023, dark);
    }
    box(0.28, 1.25, 0, 0.1, 0.055, 0.11, dark);
    box(-0.46, 0.31, 0, 0.22, 0.04, 0.13, dark);
    box(-0.55, 0.3, 0, 0.035, 0.035, 0.075, red);
    rod([-0.14, 0.2, 0], [-0.2, 0.015, 0.18], 0.016, dark);
    scooter.rotation.set(0.055, -p.angle, 0, 'YXZ');
    scooter.position.set(p.x, p.y, p.z);
    scooter.updateMatrixWorld(true);
    for (const object of scooter.children) {
      const mesh = object as T.Mesh<T.BufferGeometry, T.Material>;
      const geometry = mesh.geometry.toNonIndexed();
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.deleteAttribute('uv');
      const bucket = groups.get(mesh.material) || [];
      bucket.push(geometry);
      groups.set(mesh.material, bucket);
      mesh.geometry.dispose();
    }
  });
  for (const [material, geometries] of groups) {
    const mesh = new T.Mesh(mergeGeometries(geometries), material);
    mesh.name = 'Parked sidewalk rental scooters';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  if (!placements.length) [dark, silver, green, red].forEach((m) => m.dispose());
}
