import { embarcaderoBikeCenter } from './config/embarcadero-layout';
import {
  hasBrannanDoubleYellow,
  hasObservedGreenLane,
  isOracleServiceAlley,
} from './config/scenery-locations';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import data from './data/road-marking-data';
import {
  crossingStyle,
  bicycleSides,
  bicycleAppearance,
  separateCyclewayAppearance,
  type Tags,
} from './road-marking-rules';
import type { MapData, Point } from '../types';
// Actual OSM geometry and tags. Paint widths/road-side offsets are fitted to the game's 14m road surface.
export function buildRoadMarkings(scene: T.Scene, d: MapData) {
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  const material = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.98, side: T.DoubleSide });
  const white = material('#e0dfcb'),
    postWhite = material('#fffdf5'),
    yellow = material('#e8b849'),
    green = material('#659955'),
    concrete = material('#b4b5ab');
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    const pos = n.getAttribute('position'),
      uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i) / 6;
      uv[i * 2 + 1] = pos.getZ(i) / 6;
    }
    n.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const a = groups.get(m) || [];
    a.push(n);
    groups.set(m, a);
  };
  const box = (
    x: number,
    z: number,
    len: number,
    width: number,
    angle: number,
    m: T.Material,
    y = 0.15,
  ) => {
    const g = new T.BoxGeometry(len, 0.012, width);
    g.rotateY(-angle);
    g.translate(x, y, z);
    add(g, m);
  };
  const distance = (p: Point, a: Point, b: Point) => {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      t = Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
  };
  const near = (p: Point) => d.route.slice(1).some((b, i) => distance(p, d.route[i], b) < 180);
  const lines = (
    pts: Point[],
    width: number,
    m: T.Material,
    offset = 0,
    y = 0.15,
    clipJunctions = false,
  ) => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        l = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
        p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!near(p)) continue;
      if (clipJunctions) {
        let start: number | null = null;
        const emit = (end: number) => {
          if (start === null) return;
          const middle = (start + end) / 2;
          box(
            a[0] + Math.cos(angle) * middle - Math.sin(angle) * offset,
            a[1] + Math.sin(angle) * middle + Math.cos(angle) * offset,
            end - start,
            width,
            angle,
            m,
            y,
          );
          start = null;
        };
        for (let u = 0; u < l; u += 0.4) {
          const part = Math.min(0.4, l - u),
            x = a[0] + Math.cos(angle) * (u + part / 2) - Math.sin(angle) * offset,
            z = a[1] + Math.sin(angle) * (u + part / 2) + Math.cos(angle) * offset;
          if (inJunction([x, z])) emit(u);
          else if (start === null) start = u;
        }
        emit(l);
      } else
        box(
          p[0] - Math.sin(angle) * offset,
          p[1] + Math.cos(angle) * offset,
          l,
          width,
          angle,
          m,
          y,
        );
    }
  };
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#717570';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 312;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 65000; i++) {
    const shade = Math.floor(55 + rand() * 110);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},.25)`;
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand(), 1 + rand());
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.anisotropy = 8;
  const asphalt = new T.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.025,
    roughness: 1,
  });
  for (const road of d.roads.filter((r) => r.name === '2nd Street'))
    lines(road.points, road.width ?? 14, asphalt, 0, 0.079);
  const paintSegments = data.crossings.filter((f) => crossingStyle(f.tags as Tags));
  const meeting = new Map<string, { point: Point; names: Set<string> }>();
  for (const road of d.roads) {
    if (!road.name) continue;
    for (const p of road.points) {
      const key = p.map((v) => v.toFixed(1)).join(',');
      const entry = meeting.get(key) || { point: p, names: new Set<string>() };
      entry.names.add(road.name);
      meeting.set(key, entry);
    }
  }
  const junctions = [...meeting.values()].filter((v) => v.names.size > 1).map((v) => v.point);
  const inJunction = (p: Point) =>
    junctions.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 11.5) ||
    paintSegments.some((f) => f.points.slice(1).some((b, i) => distance(p, f.points[i], b) < 3));
  // Retain crossing geometry and source styles; explicitly unmarked/unknown crossings receive no invented paint.
  for (const crossing of paintSegments) {
    const style = crossingStyle(crossing.tags as Tags);
    if (style === 'lines') {
      lines(crossing.points, 0.16, white, -1.35);
      lines(crossing.points, 0.16, white, 1.35);
      continue;
    }
    let carry = 0.25;
    for (let i = 1; i < crossing.points.length; i++) {
      const a = crossing.points[i - 1],
        b = crossing.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (; carry < len; carry += 1.15) {
        const x = a[0] + Math.cos(angle) * carry,
          z = a[1] + Math.sin(angle) * carry;
        if (near([x, z])) box(x, z, 0.52, 2.7, angle, white);
      }
      carry -= len;
    }
    if (style === 'ladder') {
      lines(crossing.points, 0.12, white, -1.4);
      lines(crossing.points, 0.12, white, 1.4);
    }
  }
  // Photo-supported double yellow on Second and Brannan's Second-to-courtyard stretch.
  for (const road of d.roads.filter(
    (r) => !isOracleServiceAlley(r) && (r.name === '2nd Street' || r.name === 'Brannan Street'),
  ))
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let u = 0; u < len; u += 0.7) {
        const l = Math.min(0.71, len - u),
          x = a[0] + Math.cos(angle) * (u + l / 2),
          z = a[1] + Math.sin(angle) * (u + l / 2);
        if (
          (road.name === 'Brannan Street' && !hasBrannanDoubleYellow(x)) ||
          !near([x, z]) ||
          inJunction([x, z])
        )
          continue;
        for (const side of [-1, 1])
          box(
            x - Math.sin(angle) * side * 0.16,
            z + Math.cos(angle) * side * 0.16,
            l,
            0.12,
            angle,
            yellow,
            0.12,
          );
      }
    }
  const bikeSymbol = (x: number, z: number, angle: number) => {
    const p = (u: number, v: number) => [
      x + Math.cos(angle) * u - Math.sin(angle) * v,
      z + Math.sin(angle) * u + Math.cos(angle) * v,
    ];
    for (const u of [-0.55, 0.55]) {
      const g = new T.TorusGeometry(0.27, 0.035, 3, 12);
      g.rotateX(Math.PI / 2);
      g.translate(...([p(u, 0)[0], 0.17, p(u, 0)[1]] as [number, number, number]));
      add(g, white);
    }
    for (const [a, b] of [
      [
        [-0.55, 0],
        [-0.15, 0.5],
      ],
      [
        [-0.15, 0.5],
        [0.15, 0],
      ],
      [
        [0.15, 0],
        [-0.55, 0],
      ],
      [
        [-0.15, 0.5],
        [0.4, 0.5],
      ],
      [
        [0.4, 0.5],
        [0.55, 0],
      ],
      [
        [0.4, 0.5],
        [0.15, 0],
      ],
    ] as number[][][]) {
      const aa = p(...(a as [number, number])),
        bb = p(...(b as [number, number]));
      lines([aa, bb], 0.045, white, 0, 0.17);
    }
  };
  const protection = (points: Point[], offset: number, separator: string | null) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const posts = ['bollard', 'flex_post', 'vertical_panel'].includes(separator || '');
      const planting = ['planter', 'greenery', 'hedge', 'tree_row'].includes(separator || '');
      if (separator === 'parking_lane') continue;
      const step = posts || planting ? 5 : 2;
      for (let u = 1; u < length - 1; u += step) {
        const x = a[0] + Math.cos(angle) * u - Math.sin(angle) * offset;
        const z = a[1] + Math.sin(angle) * u + Math.cos(angle) * offset;
        if (!near([x, z]) || inJunction([x, z])) continue;
        const height = posts ? 0.95 : planting ? 0.55 : 0.14;
        const geometry = posts
          ? new T.CylinderGeometry(0.055, 0.075, height, 8)
          : new T.BoxGeometry(planting ? 1.2 : 1.5, height, planting ? 0.6 : 0.22);
        geometry.rotateY(-angle);
        geometry.translate(x, 0.1 + height / 2, z);
        add(geometry, posts ? postWhite : concrete);
        if (posts) {
          const base = new T.CylinderGeometry(0.15, 0.17, 0.06, 8);
          base.translate(x, 0.13, z);
          add(base, postWhite);
        }
        if (planting) box(x, z, 1.1, 0.5, angle, green, height + 0.12);
      }
    }
  };
  for (const feature of data.bikeRoads) {
    const tags = feature.tags as Tags;
    for (const side of bicycleSides(tags)) {
      const appearance = bicycleAppearance(tags, side.side, side.kind);
      for (let i = 1; i < feature.points.length; i++) {
        const a = feature.points[i - 1],
          b = feature.points[i],
          len = Math.hypot(b[0] - a[0], b[1] - a[1]),
          angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
          offset =
            side.side *
            (tags.name === 'The Embarcadero'
              ? embarcaderoBikeCenter({ name: tags.name, points: feature.points })
              : tags.name === 'King Street'
                ? 3.7
                : side.kind === 'shared_lane'
                  ? 3.5
                  : 5.55),
          nx = -Math.sin(angle) * offset,
          nz = Math.cos(angle) * offset,
          p = [(a[0] + b[0]) / 2 + nx, (a[1] + b[1]) / 2 + nz];
        if (!near(p)) continue;
        // A separately mapped cycleway takes priority over an inferred road-side offset.
        if (
          data.cycleways.some((f) =>
            f.points.slice(1).some((q, j) => distance(p, f.points[j], q) < 2.5),
          )
        )
          continue;
        const points = [
            [a[0] + nx, a[1] + nz],
            [b[0] + nx, b[1] + nz],
          ],
          observedGreen = appearance.green ?? hasObservedGreenLane(tags.name, p);
        if (side.kind !== 'shared_lane') {
          if (observedGreen && (appearance.green === true || tags.name !== 'King Street'))
            lines(points, 1.65, green, 0, 0.105, true);
          lines(points, 0.1, white, -0.9 * side.side, 0.14, true);
          if (tags.name === 'The Embarcadero')
            lines(points, 0.1, white, 0.9 * side.side, 0.14, true);
          if (tags.name === 'The Embarcadero' && b[1] > a[1])
            lines(points, 0.1, white, 1.6 * side.side, 0.14, true);
          if (appearance.buffered || appearance.protected) {
            lines(points, 0.1, white, -1.45 * side.side, 0.14, true);
            for (let u = 2; u < len - 2; u += 4) {
              const x = a[0] + Math.cos(angle) * u + nx + Math.sin(angle) * side.side * 1.18;
              const z = a[1] + Math.sin(angle) * u + nz - Math.cos(angle) * side.side * 1.18;
              if (!inJunction([x, z])) box(x, z, 0.65, 0.1, angle + Math.PI / 4, white);
            }
          }
          if (appearance.protected)
            protection(
              points,
              -1.18 * side.side,
              // User-observed white flex posts on Second's protected bike lanes.
              tags.name === '2nd Street' ? 'flex_post' : appearance.separator,
            );
        }
        for (let u = 6; u < len; u += 24) {
          const x = a[0] + Math.cos(angle) * u + nx,
            z = a[1] + Math.sin(angle) * u + nz;
          if (!inJunction([x, z])) {
            bikeSymbol(x, z, angle);
            if (side.kind === 'shared_lane') {
              for (const ahead of [1.5, 2.25]) {
                const cx = x + Math.cos(angle) * ahead,
                  cz = z + Math.sin(angle) * ahead;
                for (const direction of [-1, 1]) {
                  box(
                    cx - Math.sin(angle) * direction * 0.23,
                    cz + Math.cos(angle) * direction * 0.23,
                    0.65,
                    0.1,
                    angle - (direction * Math.PI) / 4,
                    white,
                    0.17,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
  for (const track of data.cycleways) {
    const appearance = bicycleAppearance(track.tags as Tags);
    lines(track.points, 2.3, asphalt, 0, 0.095, true);
    if (appearance.green) lines(track.points, 1.9, green, 0, 0.105, true);
    for (const side of [-1, 1]) {
      const edge = separateCyclewayAppearance(track.tags as Tags, side);
      if (edge.protected && edge.separator) protection(track.points, side * 1.15, edge.separator);
    }
    lines(track.points, 0.1, white, -1, 0.15, true);
    lines(track.points, 0.1, white, 1, 0.15, true);
  }
  for (const [m, gs] of groups) {
    if (!gs.length) continue;
    const merged = mergeGeometries(gs);
    if (!merged) throw Error('Road marking geometry failed');
    const mesh = new T.Mesh(merged, m);
    mesh.receiveShadow = true;
    scene.add(mesh);
    gs.forEach((g) => g.dispose());
  }
  return () => texture.dispose();
}
