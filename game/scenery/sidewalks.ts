import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MapData, Point } from '../types';

// A first detailed streetscape pass: real centerlines, representative SF concrete and fixtures.
export function buildSidewalks(scene: T.Scene, d: MapData) {
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.95, side: T.DoubleSide });
  const concrete = ['#c3bfb3', '#bcb9af', '#cac6ba', '#c0bdb4'].map(mat),
    curb = mat('#aaa79e'),
    joint = mat('#696c67');
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const normalized = g.index ? g.toNonIndexed() : g;
    if (normalized !== g) g.dispose();
    normalized.deleteAttribute('uv');
    const bucket = groups.get(m) || [];
    bucket.push(normalized);
    groups.set(m, bucket);
  };
  const box = (
    x: number,
    y: number,
    z: number,
    l: number,
    h: number,
    w: number,
    m: T.Material,
    a = 0,
  ) => {
    const g = new T.BoxGeometry(l, h, w);
    g.rotateY(-a);
    g.translate(x, y, z);
    add(g, m);
  };
  const quad = (a: Point, b: Point, c: Point, e: Point, ya: number, yb: number, m: T.Material) => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute(
        [
          a[0],
          ya,
          a[1],
          b[0],
          yb,
          b[1],
          c[0],
          ya,
          c[1],
          b[0],
          yb,
          b[1],
          e[0],
          yb,
          e[1],
          c[0],
          ya,
          c[1],
        ],
        3,
      ),
    );
    g.computeVertexNormals();
    add(g, m);
  };
  const distanceTo = (p: Point, a: Point, b: Point) => {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      t = Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
    return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
  };
  const all = d.roads.flatMap((r) =>
    r.points.slice(1).map((b, i) => ({
      name: r.name,
      a: r.points[i],
      b,
      half: (r.width ?? (r.name === 'South Park' ? 9.8 : 14)) / 2,
    })),
  );
  const park = d.parks?.[0] || [];
  const inPark = (p: Point) => {
    let inside = false;
    for (let i = 0, j = park.length - 1; i < park.length; j = i++) {
      const a = park[i],
        b = park[j];
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
    return inside;
  };
  let count = 0;
  for (const road of d.roads) {
    if (
      !['South Park', '2nd Street', 'Brannan Street', 'King Street', '3rd Street'].includes(
        road.name,
      )
    )
      continue;
    const pts = road.points,
      half = (road.width ?? (road.name === 'South Park' ? 9.8 : 14)) / 2,
      width = road.name === 'South Park' ? 1.9 : 3;
    const others = all.filter((s) => s.name !== road.name);
    const clearance = (p: Point) => {
      let value = 100;
      for (const s of others) {
        if (
          Math.min(s.a[0], s.b[0]) - 15 > p[0] ||
          Math.max(s.a[0], s.b[0]) + 15 < p[0] ||
          Math.min(s.a[1], s.b[1]) - 15 > p[1] ||
          Math.max(s.a[1], s.b[1]) + 15 < p[1]
        )
          continue;
        value = Math.min(value, distanceTo(p, s.a, s.b) - s.half);
      }
      return value;
    };
    const normal = (i: number) => {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(pts.length - 1, i + 1)],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.02) continue;
      const n0 = normal(i - 1),
        n1 = normal(i),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const at = (t: number, offset: number) => {
        const nx = n0[0] * (1 - t) + n1[0] * t,
          nz = n0[1] * (1 - t) + n1[1] * t,
          mag = Math.hypot(nx, nz) || 1;
        return [
          a[0] + (b[0] - a[0]) * t + (nx / mag) * offset,
          a[1] + (b[1] - a[1]) * t + (nz / mag) * offset,
        ];
      };
      const steps = Math.ceil(len / 1.8);
      for (let j = 0; j < steps; j++)
        for (const side of [-1, 1]) {
          const t0 = j / steps,
            t1 = (j + 1) / steps,
            tm = (t0 + t1) / 2,
            center = at(tm, side * (half + width / 2));
          if (
            !d.route.slice(1).some((p, i) => distanceTo(center, d.route[i], p) < 28) &&
            Math.hypot(center[0] - 90, center[1] - 490) > 155
          )
            continue;
          const inner0 = at(t0, side * half),
            inner1 = at(t1, side * half),
            outer0 = at(t0, side * (half + width)),
            outer1 = at(t1, side * (half + width));
          const clear = Math.min(...[inner0, inner1, outer0, outer1].map(clearance));
          if (clear < 0.25 || inPark(center)) continue;
          const height = (p: Point) =>
            0.075 + 0.205 * Math.min(1, Math.max(0, (clearance(p) - 0.25) / 2.2));
          const y0 = height(inner0),
            y1 = height(inner1);
          const m = concrete[count++ % 4];
          quad(inner0, inner1, outer0, outer1, y0, y1, m);
          // Visible vertical curb face and thin cap; slab joints stay at believable metre scale.
          const v = new T.BufferGeometry();
          v.setAttribute(
            'position',
            new T.Float32BufferAttribute(
              [
                inner0[0],
                0.06,
                inner0[1],
                inner1[0],
                0.06,
                inner1[1],
                inner0[0],
                y0,
                inner0[1],
                inner1[0],
                0.06,
                inner1[1],
                inner1[0],
                y1,
                inner1[1],
                inner0[0],
                y0,
                inner0[1],
              ],
              3,
            ),
          );
          v.computeVertexNormals();
          add(v, curb);
          const mid = at(tm, side * (half + 0.1));
          if (clear > 3) box(mid[0], 0.287, mid[1], len / steps - 0.025, 0.014, 0.2, curb, angle);
          const seam = at(t0, side * (half + width / 2));
          box(seam[0], y0 + 0.006, seam[1], 0.022, 0.009, width, joint, angle);
        }
    }
  }
  for (const [m, geometries] of groups) {
    const merged = mergeGeometries(geometries, false);
    if (!merged) continue;
    const mesh = new T.Mesh(merged, m);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
}
