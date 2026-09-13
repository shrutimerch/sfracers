import { characterAcceleration } from '../characters/performance.ts';
import type { CharacterId } from '../characters/roster.ts';
export function advanceSpeed(
  speed: number,
  gas: boolean,
  brake: boolean,
  boosting: boolean,
  dt: number,
  character?: CharacterId,
) {
  // Speeds are metres/second. Throttle pull halves near 56 mph, but never hits a speed cap.
  const throttlePull = character
    ? characterAcceleration(character, speed, boosting)
    : (boosting ? 20 : 11) / (1 + (Math.max(0, speed) / 25) ** 2);
  const acceleration = brake ? -48 : gas ? throttlePull : -3.8;
  return Math.max(brake ? -8 : 0, speed + acceleration * dt);
}
type Line = { name: string; points: number[][]; width?: number };
export function drivingSurface(roads: Line[], paths: Line[] = []) {
  const segments = [...roads, ...paths].flatMap((r) =>
    r.points.slice(1).map((b, i) => ({
      a: r.points[i],
      b,
      name: r.name,
      lane: (r.width ?? (r.name === 'South Park' ? 9.8 : 14)) / 2 - 1,
    })),
  );
  return (x: number, z: number) => {
    let best = Infinity,
      result = { x, z, name: '', outside: Infinity };
    for (const s of segments) {
      const dx = s.b[0] - s.a[0],
        dz = s.b[1] - s.a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - s.a[0]) * dx + (z - s.a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
      const px = s.a[0] + t * dx,
        pz = s.a[1] + t * dz,
        dist = Math.hypot(x - px, z - pz),
        outside = dist - s.lane;
      if (outside < best) {
        best = outside;
        result = {
          x: outside > 0 ? px + ((x - px) * s.lane) / dist : x,
          z: outside > 0 ? pz + ((z - pz) * s.lane) / dist : z,
          name: s.name,
          outside,
        };
      }
    }
    return result;
  };
}
export function raceChecks(
  total: number,
  sections: { name: string; start: number; length: number }[] = [],
) {
  const park = sections[0]?.name === 'South Park' ? sections[0] : null;
  const first = park ? park.start + park.length : 60;
  const checks = [];
  for (let s = first; s < total - 25; s += 60) checks.push(s);
  checks.push(total);
  return checks;
}
