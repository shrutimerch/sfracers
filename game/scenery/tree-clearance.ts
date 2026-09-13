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
