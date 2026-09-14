import * as T from 'three';
import survey from './data/waterfront-geometry.ts';
import { createTreePlacement } from './tree-clearance.ts';
import { batchFacade } from './geometry/batch-facade.ts';
import type { MapData, Point } from '../types';

export function medianLampPositions(d: MapData, palms: Point[]) {
  const rows = new Map<string, { point: Point; along: number; angle: number }[]>();
  for (const point of palms) {
    let best = Infinity,
      row = '',
      along = 0,
      angle = 0;
    survey.rails.forEach((track, index) => {
      let walked = 0;
      for (let i = 1; i < track.points.length; i++) {
        const a = track.points[i - 1],
          b = track.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz);
        const t = Math.max(
          0,
          Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / (length * length || 1)),
        );
        const distance = Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dz);
        if (distance < best) {
          best = distance;
          row = `${index}:${Math.sign(dx * (point[1] - a[1]) - dz * (point[0] - a[0]))}`;
          along = walked + t * length;
          angle = Math.atan2(dz, dx);
        }
        walked += length;
      }
    });
    if (best > 7) continue;
    const entries = rows.get(row) || [];
    entries.push({ point, along, angle });
    rows.set(row, entries);
  }
  const placement = createTreePlacement(d),
    result: { point: Point; angle: number; simple?: boolean }[] = [];
  for (const row of rows.values()) {
    row.sort((a, b) => a.along - b.along);
    for (let i = 1; i < row.length; i++) {
      const a = row[i - 1],
        b = row[i],
        gap = b.along - a.along;
      if (gap < 12 || gap > 55) continue;
      const middle = [(a.point[0] + b.point[0]) / 2, (a.point[1] + b.point[1]) / 2];
      const point = placement.place(middle);
      if (
        !point ||
        Math.hypot(point[0] - middle[0], point[1] - middle[1]) > 3 ||
        palms.some((p) => Math.hypot(p[0] - point[0], p[1] - point[1]) < 4) ||
        result.some((p) => Math.hypot(p.point[0] - point[0], p.point[1] - point[1]) < 9)
      )
        continue;
      result.push({ point, angle: a.angle });
    }
  }
  // Fill the waterfront sidewalks as well as the gaps between median palms.
  for (const road of d.roads.filter(
    (r) => r.name === 'The Embarcadero' || r.name === 'King Street',
  )) {
    let walked = 0,
      next = 12;
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      if (!length) continue;
      for (; next < walked + length; next += 24) {
        const t = (next - walked) / length;
        for (const side of [-1, 1]) {
          const offset = side * ((road.width ?? 14) / 2 + 2);
          const point = [
            a[0] + dx * t - (dz / length) * offset,
            a[1] + dz * t + (dx / length) * offset,
          ];
          if (point[1] < 80 || point[1] > 930 || !placement.clear(point)) continue;
          if (
            palms.some((p) => Math.hypot(p[0] - point[0], p[1] - point[1]) < 4.5) ||
            result.some((p) => Math.hypot(p.point[0] - point[0], p.point[1] - point[1]) < 12)
          )
            continue;
          const insideBuilding = d.buildings.some((building) => {
            let inside = false;
            for (let j = 0, k = building.points.length - 1; j < building.points.length; k = j++) {
              const p = building.points[j],
                q = building.points[k];
              if (
                p[1] > point[1] !== q[1] > point[1] &&
                point[0] < ((q[0] - p[0]) * (point[1] - p[1])) / (q[1] - p[1]) + p[0]
              )
                inside = !inside;
            }
            return inside;
          });
          if (!insideBuilding) result.push({ point, angle: Math.atan2(dz, dx), simple: true });
        }
      }
      walked += length;
    }
  }
  return result;
}

export function buildMedianLamps(
  scene: T.Scene,
  positions: ReturnType<typeof medianLampPositions>,
) {
  const group = new T.Group();
  group.name = 'Blue waterfront lamps — single sidewalk and twin median';
  scene.add(group);
  const blue = new T.MeshStandardMaterial({ color: '#567e91', roughness: 0.67, metalness: 0.25 });
  const rim = new T.MeshStandardMaterial({ color: '#7596a5', roughness: 0.7, metalness: 0.25 });
  const glass = new T.MeshStandardMaterial({
    color: '#e0e4d9',
    roughness: 0.35,
    emissive: '#cdd6c0',
    emissiveIntensity: 0.12,
  });
  const add = (g: T.BufferGeometry, m: T.Material, name: string) => {
    const mesh = new T.Mesh(g, m);
    mesh.name = name;
    group.add(mesh);
  };
  for (const {
    point: [x, z],
    angle,
    simple,
  } of positions) {
    const cylinder = (
      y: number,
      top: number,
      bottom: number,
      height: number,
      m: T.Material,
      name: string,
    ) => {
      const g = new T.CylinderGeometry(top, bottom, height, 8);
      g.translate(x, y, z);
      add(g, m, name);
    };
    if (simple) {
      cylinder(0.2, 0.25, 0.32, 0.4, blue, 'Single lamp base');
      cylinder(3.35, 0.085, 0.14, 6.3, blue, 'Simple blue sidewalk pole');
      cylinder(6.42, 0.2, 0.13, 0.16, rim, 'Single lamp collar');
      const globe = new T.SphereGeometry(0.24, 10, 8);
      globe.scale(1, 1.6, 1);
      globe.translate(x, 6.77, z);
      add(globe, glass, 'Single opal globe');
      cylinder(7.12, 0.25, 0.25, 0.1, blue, 'Single lamp cap');
      continue;
    }
    cylinder(0.25, 0.32, 0.43, 0.5, blue, 'Flared blue plinth');
    cylinder(0.78, 0.21, 0.32, 0.56, blue, 'Tapered pedestal');
    cylinder(4.4, 0.095, 0.18, 6.75, blue, 'Blue median lamp shaft');
    for (const y of [0.52, 1.05, 7.6]) cylinder(y, 0.24, 0.24, 0.1, rim, 'Cast collar');
    cylinder(7.85, 0.17, 0.28, 0.38, blue, 'Central crown');
    const direction = new T.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    for (const side of [-1, 1]) {
      const at = (r: number, y: number) =>
        new T.Vector3(x + direction.x * r * side, y, z + direction.z * r * side);
      const curve = new T.CatmullRomCurve3([
        at(0, 7.78),
        at(0.55, 7.8),
        at(1.1, 8.03),
        at(1.5, 7.98),
        at(1.6, 7.67),
      ]);
      add(new T.TubeGeometry(curve, 16, 0.055, 6, false), blue, 'Curved twin arm');
      const p = at(1.6, 7.46);
      const cap = new T.CylinderGeometry(0.12, 0.24, 0.25, 8);
      cap.translate(p.x, p.y, p.z);
      add(cap, blue, 'Pendant blue cap');
      const globe = new T.SphereGeometry(0.22, 10, 8);
      globe.scale(1, 1.6, 1);
      globe.translate(p.x, 7.12, p.z);
      add(globe, glass, 'Hanging opal globe');
      const tip = new T.ConeGeometry(0.08, 0.15, 8);
      tip.rotateZ(Math.PI);
      tip.translate(p.x, 6.76, p.z);
      add(tip, blue, 'Pendant finial');
    }
  }
  batchFacade(group);
}
