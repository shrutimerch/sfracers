import survey from './data/waterfront-geometry.ts';
import { createTreePlacement } from './tree-clearance.ts';
import type { MapData, Point } from '../types';

function nearest(point: Point, points: Point[]) {
  let best = Infinity,
    foot: Point = point;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
    );
    const p = [a[0] + t * dx, a[1] + t * dz],
      distance = Math.hypot(p[0] - point[0], p[1] - point[1]);
    if (distance < best) {
      best = distance;
      foot = p;
    }
  }
  return { distance: best, point: foot };
}
export const isMedianPalm = (p: Point) =>
  survey.rails.some((track) => nearest(p, track.points).distance < 13);

// Two outer planting rows flank the complete pair of tracks; the space between tracks stays open.
export function medianPalmRows(d: MapData) {
  const clear = createTreePlacement(d).clear;
  const first = survey.rails[0].points,
    second = survey.rails[1].points;
  const rows: Point[][] = [[], []];
  let walked = 0,
    next = 0;
  for (let i = 1; i < first.length; i++) {
    const a = first[i - 1],
      b = first[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz);
    for (; next < walked + length; next += 28) {
      const t = (next - walked) / length,
        p = [a[0] + dx * t, a[1] + dz * t];
      if (p[1] < 140 || p[1] > 930) continue;
      const other = nearest(p, second);
      if (other.distance < 2 || other.distance > 15) continue;
      const across = [
        (other.point[0] - p[0]) / other.distance,
        (other.point[1] - p[1]) / other.distance,
      ];
      for (const side of [0, 1]) {
        const base = side ? other.point : p,
          sign = side ? 1 : -1;
        let found: Point | null = null;
        for (let shift = 0; shift <= 10 && !found; shift += 1)
          for (const alongSign of [-1, 1])
            for (let offset = 2.55; offset <= 4.5; offset += 0.35) {
              const candidate = [
                base[0] + sign * across[0] * offset + (dx / length) * shift * alongSign,
                base[1] + sign * across[1] * offset + (dz / length) * shift * alongSign,
              ];
              if (
                clear(candidate) &&
                rows[side].every((q) => Math.hypot(q[0] - candidate[0], q[1] - candidate[1]) > 14)
              ) {
                found = candidate;
                break;
              }
            }
        if (found) rows[side].push(found);
      }
    }
    walked += length;
  }
  return rows;
}
