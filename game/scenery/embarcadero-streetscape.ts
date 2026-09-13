import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EMBARCADERO_LAYOUT as layout } from './config/embarcadero-layout.ts';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';
import survey from './data/waterfront-geometry.ts';
import markings from './data/road-marking-data.ts';
import type { MapData, Point } from '../types';
import type { TrafficObstacle } from '../simulation/traffic-collision';
const distance = (p: Point, a: Point, b: Point) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    t = Math.max(
      0,
      Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
    );
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
};
const inside = (p: Point, ring: Point[]) => {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
};
export function embarcaderoPlacements(d: MapData) {
  const cars: { position: Point; angle: number }[] = [],
    trees: Point[] = [];
  const frontage = d.roads.filter(
    (r) =>
      r.name === 'The Embarcadero' &&
      r.points.at(-1)![1] > r.points[0][1] &&
      r.points.some((p) => p[0] > 550 && p[1] > 145 && p[1] < 465),
  );
  const clear = (p: Point) =>
    !d.buildings.some((b) => inside(p, b.points)) &&
    !d.roads
      .filter((r) => r.name !== 'The Embarcadero')
      .some((r) => r.points.slice(1).some((b, i) => distance(p, r.points[i], b) < 12)) &&
    !markings.crossings.some((c) =>
      c.points.slice(1).some((b, i) => distance(p, c.points[i], b) < 8),
    ) &&
    !(d.bikeStations || []).some(
      (s) => Math.hypot(s.position[0] - p[0], s.position[1] - p[1]) < 16,
    );
  for (const road of frontage) {
    let along = 0,
      nextCar = 8,
      nextTree = 4;
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!len) continue;
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const at = (u: number, offset: number) => [
        a[0] + Math.cos(angle) * u - Math.sin(angle) * offset,
        a[1] + Math.sin(angle) * u + Math.cos(angle) * offset,
      ];
      while (nextCar < along + len) {
        const p = at(nextCar - along, layout.parkingCenter);
        nextCar += 17;
        const corners = [-2.3, 2.3].flatMap((x) =>
          [-1, 1].map((z) => [
            p[0] + Math.cos(angle) * x - Math.sin(angle) * z,
            p[1] + Math.sin(angle) * x + Math.cos(angle) * z,
          ]),
        );
        if (
          p[1] > 155 &&
          p[1] < 450 &&
          corners.every(clear) &&
          cars.every((c) => Math.hypot(c.position[0] - p[0], c.position[1] - p[1]) > 8)
        )
          cars.push({ position: p, angle });
      }
      while (nextTree < along + len) {
        const p = at(nextTree - along, layout.treeOffset);
        nextTree += 11;
        if (
          p[1] > 155 &&
          p[1] < 450 &&
          clear(p) &&
          survey.trees.every((t) => Math.hypot(t.point[0] - p[0], t.point[1] - p[1]) > 5) &&
          trees.every((t) => Math.hypot(t[0] - p[0], t[1] - p[1]) > 7)
        )
          trees.push(p);
      }
      along += len;
    }
  }
  return { cars, trees };
}
export function buildEmbarcaderoStreetscape(scene: T.Scene, d: MapData) {
  const { cars, trees } = embarcaderoPlacements(d),
    root = new T.Group();
  root.name = 'Embarcadero curbside parking and trees';
  const groups = new Map<T.Material, T.BufferGeometry[]>(),
    materials = new Map<string, T.Material>();
  const mat = (color: string) => {
    if (!materials.has(color))
      materials.set(color, new T.MeshStandardMaterial({ color, roughness: 0.85 }));
    return materials.get(color)!;
  };
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    n.deleteAttribute('uv');
    const bucket = groups.get(m) || [];
    bucket.push(n);
    groups.set(m, bucket);
  };
  cars.forEach((car, i) => {
    const box = (
      x: number,
      y: number,
      z: number,
      l: number,
      h: number,
      w: number,
      color: string,
    ) => {
      const g = new T.BoxGeometry(l, h, w);
      g.translate(x, y, z);
      g.rotateY(-car.angle);
      g.translate(car.position[0], 0, car.position[1]);
      add(g, mat(color));
    };
    const color = ['#353e46', '#e0ded5', '#869097', '#644649'][i % 4];
    box(0, 0.7, 0, 4.5, 0.8, 1.8, color);
    box(-0.1, 1.27, 0, 2.4, 0.65, 1.55, '#354953');
    box(-0.1, 1.63, 0, 2.3, 0.07, 1.6, color);
    for (const x of [-1.4, 1.4])
      for (const z of [-0.9, 0.9]) box(x, 0.43, z, 0.64, 0.64, 0.18, '#242728');
    for (const z of [-0.6, 0.6]) {
      box(2.26, 0.78, z, 0.04, 0.2, 0.36, '#f3eaca');
      box(-2.26, 0.78, z, 0.04, 0.2, 0.36, '#9c3734');
    }
  });
  trees.forEach((p, i) =>
    broadleafGeometry(
      p[0],
      p[1],
      10 + (i % 3) * 0.6,
      i + 7300,
      add,
      { bark: mat('#786952'), leaves: ['#537044', '#667e46', '#748750'].map(mat) },
      0.28,
    ),
  );
  for (const [m, gs] of groups) {
    const merged = mergeGeometries(gs);
    if (!merged) continue;
    const mesh = new T.Mesh(merged, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    gs.forEach((g) => g.dispose());
  }
  scene.add(root);
  const obstacles: TrafficObstacle[] = cars.map((c) => ({
    x: c.position[0],
    z: c.position[1],
    previousX: c.position[0],
    previousZ: c.position[1],
    angle: c.angle,
    halfLength: 2.3,
    halfWidth: 1,
  }));
  return { obstacles };
}
