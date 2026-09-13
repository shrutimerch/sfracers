import survey from './data/waterfront-geometry.ts';
import type { MapData, Point } from '../types';
export const BRANNAN_LAWN_HEIGHT = 0.48;
export const SOUTH_PARK_GRASS_HEIGHT = 0.16;
export const inPolygon = (p: Point, pts: Point[]) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i],
      b = pts[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
};

const southBeach = survey.parks.find((p) => p.id === 23750468)!;
export const beachHeight = (x: number, z: number) => {
  if (!inPolygon([x, z], southBeach.points)) return 0.15;
  const cx = 632,
    cz = 565;
  let edge = 100;
  for (let i = 1; i < southBeach.points.length; i++) {
    const a = southBeach.points[i - 1],
      b = southBeach.points[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    edge = Math.min(edge, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return 0.15 + 0.85 * Math.min(1, edge / 7) * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 2500);
};

const distanceTo = (x: number, z: number, a: Point, b: Point) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
};
const raisedPaths = survey.parkPaths.flatMap((path) =>
  path.points.slice(1).flatMap((b, i) => {
    const a = path.points[i],
      mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return survey.parks.some((p) => inPolygon(mid, p.points))
      ? [
          {
            a,
            b,
            height: beachHeight(mid[0], mid[1]) + 0.04,
            minX: Math.min(a[0], b[0]) - 1.05,
            maxX: Math.max(a[0], b[0]) + 1.05,
            minZ: Math.min(a[1], b[1]) - 1.05,
            maxZ: Math.max(a[1], b[1]) + 1.05,
          },
        ]
      : [];
  }),
);
// Share the rendered lawn heights with animated scenery, including raised park paths.
export function parkSurfaceHeight(data: MapData, x: number, z: number, base = 0.14) {
  let height = base;
  if (data.parks?.[0] && inPolygon([x, z], data.parks[0]))
    height = Math.max(height, SOUTH_PARK_GRASS_HEIGHT);
  if (inPolygon([x, z], southBeach.points)) height = Math.max(height, beachHeight(x, z));
  for (const lawn of survey.lawns)
    if (inPolygon([x, z], lawn.points)) height = Math.max(height, BRANNAN_LAWN_HEIGHT);
  for (const path of raisedPaths) {
    if (x < path.minX || x > path.maxX || z < path.minZ || z > path.maxZ) continue;
    if (distanceTo(x, z, path.a, path.b) < 1.05) height = Math.max(height, path.height);
  }
  return height;
}
