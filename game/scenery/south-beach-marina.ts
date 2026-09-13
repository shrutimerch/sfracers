import * as T from 'three';
import { palmGeometry } from './geometry/palm-geometry.ts';
import type { MapData, Point } from '../types';

type AddGeometry = (geometry: T.BufferGeometry, material: T.Material) => void;

// Decorative moored boats and supplemental planting estimated from the supplied
// King Street approach photo. These are not additional surveyed OSM features.
export function buildSouthBeachMarina(
  d: MapData,
  park: Point[],
  existingTrees: Point[],
  add: AddGeometry,
) {
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.85, side: T.DoubleSide });
  const white = mat('#e5e4d7'),
    navy = mat('#244756'),
    wood = mat('#8d8471');
  const metal = mat('#bcc7c8'),
    bark = mat('#77684e');
  const leaves = ['#37502a', '#526b33', '#708345'].map(mat);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    material: T.Material,
  ) => {
    const g = new T.BoxGeometry(w, h, depth);
    g.translate(x, y, z);
    add(g, material);
  };
  const rod = (a: T.Vector3, b: T.Vector3, radius: number, material: T.Material) => {
    const delta = b.clone().sub(a);
    const g = new T.CylinderGeometry(radius, radius, delta.length(), 5);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    add(g, material);
  };
  // Find the modeled shoreline at each berth so boats stay on the water side.
  const shoreAt = (z: number) => {
    const hits: number[] = [];
    for (const coast of d.coast || [])
      for (let i = 1; i < coast.length; i++) {
        const a = coast[i - 1],
          b = coast[i];
        if ((a[1] <= z && b[1] > z) || (b[1] <= z && a[1] > z))
          hits.push(a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]));
      }
    return hits.length ? Math.max(...hits) : undefined;
  };
  const shoreSamples = [490, 510, 530, 550, 570, 590, 610]
    .map(shoreAt)
    .filter((x): x is number => x !== undefined);
  if (shoreSamples.length) {
    const dockX = Math.max(...shoreSamples) + 22;
    box(dockX, 0.18, 550, 2.2, 0.5, 128, wood);
    for (let row = 0; row < 7; row++) {
      const z = 490 + row * 20;
      box(dockX + 13, 0.2, z, 26, 0.4, 1.5, wood);
      for (const side of [-1, 1]) {
        const x = dockX + 12 + (row % 2) * 3,
          bz = z + side * 5;
        const length = 10 + (row % 3);
        const outline = new T.Shape();
        outline.moveTo(-length / 2, -1.65);
        outline.lineTo(length / 2 - 2, -1.65);
        outline.lineTo(length / 2, 0);
        outline.lineTo(length / 2 - 2, 1.65);
        outline.lineTo(-length / 2, 1.65);
        outline.closePath();
        const hull = new T.ExtrudeGeometry(outline, {
          depth: 0.9,
          bevelEnabled: true,
          bevelSize: 0.2,
          bevelThickness: 0.18,
          bevelSegments: 1,
          steps: 1,
        });
        hull.rotateX(-Math.PI / 2);
        hull.translate(x, -0.05, bz);
        add(hull, white);
        box(x - 0.5, 1.05, bz, 4.2, 0.9, 2.25, white);
        box(x - 0.5, 1.2, bz, 3.2, 0.3, 2.3, navy);
        box(x - 3, 0.97, bz, 1.8, 0.2, 2, navy);
        const height = 12 + (row % 3) * 2;
        rod(new T.Vector3(x + 1, 0.9, bz), new T.Vector3(x + 1, height, bz), 0.075, metal);
        rod(new T.Vector3(x + 1, 3.2, bz), new T.Vector3(x - 3.8, 3.2, bz), 0.07, white);
        for (const end of [-length / 2, length / 2 - 0.4])
          rod(
            new T.Vector3(x + 1, height - 0.4, bz),
            new T.Vector3(x + end, 0.9, bz),
            0.018,
            metal,
          );
      }
    }
  }
  const inside = (x: number, z: number) => {
    let result = false;
    for (let i = 0, j = park.length - 1; i < park.length; j = i++) {
      const a = park[i],
        b = park[j];
      if (a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0])
        result = !result;
    }
    return result;
  };
  const clear = (x: number, z: number) => {
    for (const road of [...d.roads, ...(d.paths || [])])
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1],
          b = road.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1];
        const t = Math.max(
          0,
          Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
        );
        if (Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < (road.width ?? 9.6) / 2 + 3)
          return false;
      }
    return !existingTrees.some((p) => Math.hypot(x - p[0], z - p[1]) < 6);
  };
  let count = 0;
  for (let z = 488; z <= 644; z += 17)
    for (let x = 606; x <= 685; x += 17) {
      if (count >= 20 || !inside(x, z) || !clear(x, z) || Math.hypot(x - 610.2, z - 562.1) < 15)
        continue;
      if (count % 4 === 0) palmGeometry(x, z, 10 + (count % 3), add, { bark, leaves });
      else {
        rod(new T.Vector3(x, 0, z), new T.Vector3(x, 6.5, z), 0.25, bark);
        for (let k = 0; k < 4; k++) {
          const g = new T.IcosahedronGeometry(1, 2);
          g.scale(3.4, 3.2, 3.1);
          g.translate(x + Math.cos(k * 2.4) * 1.5, 7 + (k % 2), z + Math.sin(k * 2.4) * 1.5);
          add(g, leaves[k % 3]);
        }
      }
      count++;
    }
}
