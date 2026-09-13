import type { MapData, Point } from './types';
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function createRoute(d: MapData) {
  const lengths = [0];
  for (let i = 1; i < d.route.length; i++)
    lengths.push(lengths[i - 1] + distance(d.route[i - 1], d.route[i]));
  const total = lengths[lengths.length - 1];
  function at(s: number) {
    s = Math.max(0, Math.min(total - 0.01, s));
    let i = 1;
    while (lengths[i] < s) i++;
    const a = d.route[i - 1],
      b = d.route[i],
      t = (s - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return {
      x: a[0] + (b[0] - a[0]) * t,
      z: a[1] + (b[1] - a[1]) * t,
      a: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  }
  function nearest(px: number, pz: number) {
    let best = Infinity,
      nx = px,
      nz = pz,
      name = '',
      along = 0;
    for (const r of [{ points: d.route, name: 'South Park' }])
      for (let i = 1; i < r.points.length; i++) {
        const a = r.points[i - 1],
          b = r.points[i];
        if (
          Math.min(a[0], b[0]) - 20 > px ||
          Math.max(a[0], b[0]) + 20 < px ||
          Math.min(a[1], b[1]) - 20 > pz ||
          Math.max(a[1], b[1]) + 20 < pz
        )
          continue;
        const dx = b[0] - a[0],
          dz = b[1] - a[1],
          t = Math.max(
            0,
            Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1)),
          ),
          qx = a[0] + dx * t,
          qz = a[1] + dz * t,
          dd = Math.hypot(px - qx, pz - qz);
        if (dd < best) {
          best = dd;
          nx = qx;
          nz = qz;
          along = lengths[i - 1] + distance(a, b) * t;
          name = d.course?.sections.findLast((section) => section.start <= along)?.name || r.name;
        }
      }
    return { best, x: nx, z: nz, name, along };
  }

  return { total, lengths, at, nearest };
}
export type RaceRoute = ReturnType<typeof createRoute>;
