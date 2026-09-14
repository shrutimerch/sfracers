import {
  DEFAULT_CHARACTER,
  isCharacterId,
  raceRoster,
  type CharacterId,
} from '../characters/roster.ts';
import { resolveTrafficCollision, type TrafficObstacle } from './traffic-collision.ts';
import { RACE_LAPS, completeCheckpoint, lapDistance } from './race-laps.ts';
import { advanceSpeed, drivingSurface, raceChecks } from './driving.ts';
import { createRoute } from './route-math.ts';
import type { MapData } from '../types';
// Pure racing state: no DOM, Three.js objects, network access, or animation scheduling.
export function createRaceSimulation(
  d: MapData,
  inspection = 0,
  photographic = false,
  freeDrive = false,
) {
  const route = createRoute(d),
    { total, at, nearest } = route;
  inspection = Math.max(0, Math.min(total - 1, inspection));
  const checks = raceChecks(total, d.course?.sections),
    surfaceAt = drivingSurface(d.roads, d.paths);
  let character: CharacterId = DEFAULT_CHARACTER;
  const rivals = raceRoster(character)
    .slice(1)
    .map((id, i) => ({
      character: id,
      s: 12 + i * 8,
      speed: 0,
      cruiseSpeed: 28 + i * 1.5,
    }));
  const pads: ReturnType<typeof at>[] = [];
  for (let s = 160; s < total; s += 290) pads.push(at(s));
  let mode = inspection > 0 ? 'inspection' : 'ready',
    x = at(inspection).x,
    z = at(inspection).z,
    angle = at(inspection).a,
    speed = 0,
    time = 0,
    boost = 100,
    cp = 0,
    lap = 0,
    count = 3,
    driftCharge = 0,
    drifting = false,
    boostTimer = 0,
    progress = 0,
    street = route.nearest(x, z).name || 'South Park',
    padCooldown = 0;
  const keys: Record<string, boolean> = {};
  const setKey = (key: string, value: boolean) => {
    keys[key] = value;
  };
  const reset = () => {
    mode = 'countdown';
    x = d.route[0][0];
    z = d.route[0][1];
    angle = at(0).a;
    speed = 0;
    time = 0;
    boost = 100;
    cp = 0;
    lap = 0;
    count = 3;
    progress = 0;
    boostTimer = 0;
    driftCharge = 0;
    Object.keys(keys).forEach((k) => delete keys[k]);
    rivals.forEach((r, i) => {
      r.s = 12 + i * 8;
      r.speed = 0;
    });
  };
  let pausedFrom = mode;
  const pause = () => {
    if (mode === 'racing' || mode === 'countdown' || mode === 'inspection') {
      pausedFrom = mode;
      mode = 'paused';
    } else if (mode === 'paused') mode = pausedFrom;
  };
  const recover = () => {
    const p = at(freeDrive ? inspection : cp === 0 ? 0 : Math.max(0, checks[cp - 1] - 10));
    x = p.x;
    z = p.z;
    angle = p.a;
    speed = 0;
  };

  function step(dt: number, canRace = true, traffic: TrafficObstacle[] = []) {
    if (mode === 'countdown') {
      count -= dt;
      if (count <= 0) {
        count = 0;
        mode = 'racing';
      }
    }
    if ((mode === 'racing' || (mode === 'inspection' && freeDrive)) && canRace) {
      time += dt;
      const gas = keys.w || keys.arrowup,
        brake = keys.s || keys.arrowdown,
        turn = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
      const wasDrifting = drifting;
      drifting = !!(keys[' '] && turn && speed > 8);
      if (drifting) driftCharge = Math.min(2, driftCharge + dt);
      else if (wasDrifting) {
        if (driftCharge > 0.6) boostTimer = 1.1 + driftCharge * 0.4;
        driftCharge = 0;
      }
      const boosting = (keys.shift && boost > 0 && speed > 2) || boostTimer > 0;
      boostTimer = Math.max(0, boostTimer - dt);
      boost = Math.max(0, Math.min(100, boost + (keys.shift && speed > 2 ? -24 : 8) * dt));
      speed = advanceSpeed(speed, !!gas, !!brake, boosting, dt, character);
      angle +=
        turn *
        dt *
        (drifting ? 1.7 : 1.22) *
        Math.min(1, Math.abs(speed) / 7) *
        (speed < 0 ? -1 : 1);
      const previousPosition = { x, z };
      const travelAngle = angle - (drifting ? turn * 0.22 : 0);
      x += Math.cos(travelAngle) * speed * dt;
      z += Math.sin(travelAngle) * speed * dt;
      const n = nearest(x, z);
      if (photographic) {
        street = n.name || street;
        if (n.best > 1.2 && Number.isFinite(n.best)) {
          x = n.x + ((x - n.x) * 1.2) / n.best;
          z = n.z + ((z - n.z) * 1.2) / n.best;
          speed *= 0.95;
        }
      } else {
        const surface = surfaceAt(x, z);
        street = surface.name || street;
        if (surface.outside > 0) {
          x = surface.x;
          z = surface.z;
          speed *= Math.exp(-3 * dt);
        }
      }
      if (!photographic && traffic.length) {
        const contact = resolveTrafficCollision(previousPosition, { x, z }, angle, traffic);
        x = contact.x;
        z = contact.z;
        if (contact.hit) {
          if (contact.blocked) speed = 0;
          boostTimer = 0;
          drifting = false;
          driftCharge = 0;
        }
      }
      if (mode === 'inspection') return;
      const previousLap = lap;
      const next = at(checks[cp]);
      if (Math.hypot(x - next.x, z - next.z) < (cp === checks.length - 1 ? 6 : 24)) {
        const advanced = completeCheckpoint(cp, lap, checks.length);
        cp = advanced.cp;
        lap = advanced.lap;
        if (advanced.finished) {
          mode = 'finished';
          speed = 0;
        }
      }
      progress =
        lap * total +
        Math.max(
          cp === 0 ? 0 : checks[cp - 1],
          Math.min(checks[cp], lap !== previousLap ? 0 : n.along),
        );
      for (const r of rivals) {
        r.speed = Math.min(
          r.cruiseSpeed,
          advanceSpeed(r.speed, true, false, false, dt, r.character),
        );
        r.s = Math.min(total * RACE_LAPS, r.s + r.speed * dt);
        const p = at(lapDistance(r.s, total));
        if (Math.hypot(p.x - x, p.z - z) < 1.65 && Math.abs(speed) > 5) {
          speed *= 0.8;
          x -= Math.sin(angle) * 0.72;
          z += Math.cos(angle) * 0.72;
        }
      }
      padCooldown = Math.max(0, padCooldown - dt);
      if (padCooldown === 0 && pads.some((p) => Math.hypot(p.x - x, p.z - z) < 5)) {
        boostTimer = 1.8;
        padCooldown = 2;
      }
    }
  }
  return {
    route,
    checks,
    rivals,
    pads,
    keys,
    step,
    setKey,
    start: reset,
    garage() {
      if (mode !== 'finished') return;
      reset();
      mode = 'ready';
    },
    pause,
    recover,
    blur() {
      Object.keys(keys).forEach((k) => delete keys[k]);
      if (mode === 'racing' || mode === 'countdown' || mode === 'inspection') pause();
    },
    selectCharacter(id: CharacterId) {
      if (!isCharacterId(id) || !['ready', 'finished'].includes(mode)) return false;
      character = id;
      raceRoster(id)
        .slice(1)
        .forEach((rival, i) => {
          rivals[i].character = rival;
        });
      return true;
    },
    setPhotographic(value: boolean) {
      photographic = value;
    },
    get state() {
      return {
        character,
        mode,
        x,
        z,
        angle,
        speed,
        time,
        boost,
        cp,
        lap,
        count,
        driftCharge,
        drifting,
        boostTimer,
        progress,
        street,
        padCooldown,
      };
    },
  };
}
export type RaceSimulation = ReturnType<typeof createRaceSimulation>;
