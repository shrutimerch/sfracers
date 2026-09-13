import { KART_SCALE } from './race-laps.ts';

export type TrafficObstacle = {
  x: number;
  z: number;
  previousX: number;
  previousZ: number;
  angle: number;
  halfLength: number;
  halfWidth: number;
};
type Position = { x: number; z: number };

// Swept separating-axis test for two oriented rectangles. Testing the entire
// relative movement prevents fast karts and moving cars passing through each other.
export function resolveTrafficCollision(
  start: Position,
  target: Position,
  angle: number,
  obstacles: TrafficObstacle[],
) {
  let { x, z } = target;
  let hit = false;
  const forward = { x: Math.cos(angle), z: Math.sin(angle) };
  const right = { x: -forward.z, z: forward.x };
  for (let pass = 0; pass < 3; pass++)
    for (const car of obstacles) {
      const along = { x: Math.cos(car.angle), z: Math.sin(car.angle) };
      const across = { x: -along.z, z: along.x };
      const dot = (a: Position, b: Position) => a.x * b.x + a.z * b.z;
      const from = { x: start.x - car.previousX, z: start.z - car.previousZ };
      const to = { x: x - car.x, z: z - car.z };
      let enter = 0,
        leave = 1,
        normal: Position | null = null;
      let inside = true,
        shallowest = Infinity,
        overlapNormal = along;
      let missed = false;
      for (const axis of [along, across, forward, right]) {
        const extent =
          car.halfLength * Math.abs(dot(along, axis)) +
          car.halfWidth * Math.abs(dot(across, axis)) +
          1.7 * KART_SCALE * Math.abs(dot(forward, axis)) +
          1.22 * KART_SCALE * Math.abs(dot(right, axis)) +
          0.035;
        const a = dot(from, axis),
          b = dot(to, axis),
          delta = b - a;
        const depth = extent - Math.abs(a);
        if (depth < 0) inside = false;
        if (depth < shallowest) {
          shallowest = depth;
          overlapNormal = { x: axis.x * (a < 0 ? -1 : 1), z: axis.z * (a < 0 ? -1 : 1) };
        }
        if (Math.abs(delta) < 1e-10) {
          if (Math.abs(a) > extent) {
            missed = true;
            break;
          }
          continue;
        }
        const near = Math.min((-extent - a) / delta, (extent - a) / delta);
        const far = Math.max((-extent - a) / delta, (extent - a) / delta);
        if (near >= enter) {
          enter = near;
          normal = { x: axis.x * (delta > 0 ? -1 : 1), z: axis.z * (delta > 0 ? -1 : 1) };
        }
        leave = Math.min(leave, far);
        if (enter > leave) {
          missed = true;
          break;
        }
      }
      if (missed || leave < 0 || enter > 1) continue;
      const n = inside ? overlapNormal : normal;
      if (!n) continue;
      const extent =
        car.halfLength * Math.abs(dot(along, n)) +
        car.halfWidth * Math.abs(dot(across, n)) +
        1.7 * KART_SCALE * Math.abs(dot(forward, n)) +
        1.22 * KART_SCALE * Math.abs(dot(right, n)) +
        0.04;
      const correction = extent - dot(to, n);
      if (correction <= 0) continue; // Already moving away from contact.
      x += n.x * correction;
      z += n.z * correction;
      hit = true;
    }
  return { x, z, hit };
}
