import * as T from 'three';
import type { MapData, Point } from '../types';
import { batchFacade } from './geometry/batch-facade.ts';

export function isEmbarcaderoLamp(point: Point) {
  return point[0] > 580 && point[1] > 40 && point[1] < 730;
}

// Preserve mapped lamps and fill gaps on the waterside sidewalk with photo-estimated spacing.
export function embarcaderoLampPositions(d: MapData, mapped: Point[]): Point[] {
  const positions = mapped.filter(isEmbarcaderoLamp).map((p) => [...p]);
  for (let z = 154; z < 550; z += 28) {
    const candidates: number[] = [];
    for (const road of d.roads.filter(
      (r) => r.name === 'The Embarcadero' || r.name === 'King Street',
    )) {
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1],
          b = road.points[i];
        if ((a[1] <= z && b[1] > z) || (b[1] <= z && a[1] > z)) {
          const x = a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]);
          if (x > 570 && x < 640) candidates.push(x + (road.width ?? 14) / 2 + 3);
        }
      }
    }
    if (!candidates.length) continue;
    const x = Math.max(...candidates);
    if (positions.some((p) => Math.hypot(p[0] - x, p[1] - z) < 15)) continue;
    if (
      d.buildings.some((b) => {
        let inside = false;
        for (let i = 0, j = b.points.length - 1; i < b.points.length; j = i++) {
          const a = b.points[i],
            q = b.points[j];
          if (a[1] > z !== q[1] > z && x < ((q[0] - a[0]) * (z - a[1])) / (q[1] - a[1]) + a[0])
            inside = !inside;
        }
        return inside;
      })
    )
      continue;
    positions.push([x, z]);
  }
  return positions;
}

export function buildEmbarcaderoLamps(scene: T.Scene, positions: Point[]) {
  const group = new T.Group();
  group.name = 'Embarcadero heritage green lampposts';
  scene.add(group);
  const green = new T.MeshStandardMaterial({ color: '#31594f', roughness: 0.72, metalness: 0.28 });
  const edge = new T.MeshStandardMaterial({ color: '#52766a', roughness: 0.78, metalness: 0.2 });
  const globe = new T.MeshStandardMaterial({
    color: '#e8e5c9',
    emissive: '#ddd5a8',
    emissiveIntensity: 0.12,
    roughness: 0.45,
  });
  const add = (g: T.BufferGeometry, m: T.Material, name: string) => {
    const mesh = new T.Mesh(g, m);
    mesh.name = name;
    group.add(mesh);
  };
  const cylinder = (
    x: number,
    y: number,
    z: number,
    top: number,
    bottom: number,
    height: number,
    m: T.Material,
    name: string,
    segments = 12,
  ) => {
    const g = new T.CylinderGeometry(top, bottom, height, segments);
    g.translate(x, y, z);
    add(g, m, name);
  };
  for (const [x, z] of positions) {
    cylinder(x, 0.16, z, 0.34, 0.4, 0.32, green, 'octagonal plinth', 8);
    cylinder(x, 0.61, z, 0.23, 0.32, 0.62, green, 'tapered pedestal');
    cylinder(x, 1.06, z, 0.2, 0.25, 0.26, edge, 'pedestal collar');
    cylinder(x, 3.55, z, 0.085, 0.16, 4.8, green, 'tall tapered green shaft');
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const flute = new T.CylinderGeometry(0.012, 0.018, 0.58, 4);
      flute.translate(x + Math.cos(a) * 0.25, 0.61, z + Math.sin(a) * 0.25);
      add(flute, edge, 'cast iron base flute');
    }
    for (const [y, r] of [
      [0.3, 0.33],
      [0.96, 0.25],
      [1.19, 0.18],
      [5.94, 0.16],
      [6.12, 0.2],
    ]) {
      const ring = new T.TorusGeometry(r, 0.035, 5, 12);
      ring.rotateX(Math.PI / 2);
      ring.translate(x, y, z);
      add(ring, edge, 'ornamental collar');
    }
    cylinder(x, 6.1, z, 0.23, 0.12, 0.3, green, 'lantern cup');
    cylinder(x, 6.57, z, 0.31, 0.21, 0.68, globe, 'warm faceted lantern glass', 6);
    cylinder(x, 6.96, z, 0.34, 0.34, 0.09, green, 'lantern rim', 6);
    cylinder(x, 7.1, z, 0.1, 0.38, 0.22, green, 'peaked lantern roof', 6);
    cylinder(x, 7.27, z, 0.045, 0.09, 0.19, edge, 'lantern finial', 8);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const bottom = new T.Vector3(x + Math.cos(a) * 0.215, 6.23, z + Math.sin(a) * 0.215);
      const top = new T.Vector3(x + Math.cos(a) * 0.31, 6.92, z + Math.sin(a) * 0.31);
      const delta = top.clone().sub(bottom),
        bar = new T.CylinderGeometry(0.018, 0.018, delta.length(), 4);
      bar.applyQuaternion(
        new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
      );
      bar.translate(...top.add(bottom).multiplyScalar(0.5).toArray());
      add(bar, green, 'lantern frame rib');
    }
  }
  batchFacade(group);
}
