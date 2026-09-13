import { cyclingStrips } from './cycling-layout.ts';
import type { MapData, Point } from '../types';

// Keep palm trunks in the median when the estimated road width overlaps a mapped tree.
export function waterfrontTreePosition(point: Point, roads: MapData['roads']): Point {
  let [x, z] = point;
  for (const road of roads) {
    if (road.name !== 'The Embarcadero') continue;
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
      const px = a[0] + dx * t,
        pz = a[1] + dz * t;
      const distance = Math.hypot(x - px, z - pz);
      const clearance = (road.width ?? 9.6) / 2 + 1;
      if (distance > 0 && distance < clearance) {
        x = px + ((x - px) * clearance) / distance;
        z = pz + ((z - pz) * clearance) / distance;
      }
    }
  }
  return [x, z];
}

/** Resolve trunks against the same road widths and bike-lane offsets used by the renderer. */
export function createTreePlacement(d: MapData) {
  const strips = [
    ...[...d.roads, ...(d.paths || [])].flatMap((r) =>
      r.points.slice(1).map((b, i) => ({
        a: r.points[i],
        b,
        halfWidth: (r.width ?? (r.name === 'South Park' ? 9.8 : 14)) / 2,
      })),
    ),
    ...cyclingStrips(d),
  ];
  const clear = (p: Point) =>
    strips.every(({ a, b, halfWidth }) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
      // Includes the thickest trunk, its slight lean, and clearance from painted edges.
      return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz) >= halfWidth + 1;
    });
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
  const place = (point: Point): Point | null => {
    if (clear(point)) return point;
    const nearby = d.buildings.filter((b) =>
      b.points.some((p) => Math.hypot(p[0] - point[0], p[1] - point[1]) < 80),
    );
    // Search all directions rather than repeatedly pushing between adjacent carriageways.
    for (let radius = 0.5; radius <= 12; radius += 0.5)
      for (let i = 0; i < 32; i++) {
        const angle = (i * Math.PI) / 16;
        const p = [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius];
        if (clear(p) && !nearby.some((b) => inside(p, b.points))) return p;
      }
    // Omit a conflicting decorative tree when no nearby planting space is available.
    return null;
  };
  return { clear, place };
}
