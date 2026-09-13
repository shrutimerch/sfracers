import { buildDelanceyGarden } from './delancey-garden';
import { buildPier38, PIER_38_ID } from './pier-38';
import { buildBrannanWaterfront } from './brannan-waterfront';
import { buildDelanceyStreet, DELANCEY_RESTAURANT_ID } from './delancey-street';
import { buildHarborBuildings } from './harbor-buildings';
import { buildBayBridge } from './bay-bridge';
import { buildSouthBeachMarina } from './south-beach-marina';
import { waterfrontTreePosition } from './tree-clearance';
import { buildOraclePark } from './oracle-park';
import { SCENERY_LOCATIONS, ROAD_APPEARANCE } from './config/scenery-locations';
import { courtyardPaths } from './data/brannan-courtyard-data';
import { palmGeometry } from './geometry/palm-geometry';
import { parkGrass } from './geometry/park-ground';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildingGeometry } from './geometry/building-geometry';
import { routeProfiles } from './config/route-profiles';
import survey from './data/waterfront-geometry';
import type { MapData, Facades, Point } from '../types';

// Mapped positions; modeled detail sizes are estimates from reference/waterfront-streetview.json.
export function buildRouteScenery(scene: T.Scene, d: MapData, facades: Facades) {
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  let disposeDelancey: (() => void) | undefined;
  let disposePier38: (() => void) | undefined;
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.88, side: T.DoubleSide });
  const pale = mat('#c3bfb2'),
    dark = mat('#314448'),
    blue = mat('#385b6c'),
    bark = mat('#77684e'),
    leaf = mat('#456038'),
    rail = mat('#7c807e');
  const groundGrass = parkGrass(),
    grass = groundGrass.material,
    palmLeaves = ['#3b542b', '#526b33', '#708345'].map(mat);
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    const pos = n.getAttribute('position');
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i) / 4;
      uv[i * 2 + 1] = pos.getZ(i) / 4;
    }
    n.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const a = groups.get(m) || [];
    a.push(n);
    groups.set(m, a);
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
  const rod = (a: T.Vector3, b: T.Vector3, r: number, m: T.Material) => {
    const delta = b.clone().sub(a);
    if (delta.length() < 0.01) return;
    const g = new T.CylinderGeometry(r, r, delta.length(), 6);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    add(g, m);
  };
  const slab = (pts: Point[], m: T.Material, y: number) => {
    const g = new T.ShapeGeometry(new T.Shape(pts.map((p) => new T.Vector2(p[0], -p[1]))));
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    add(g, m);
  };
  const line = (pts: Point[], width: number, m: T.Material, y = 0.11) => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      box(
        (a[0] + b[0]) / 2,
        y,
        (a[1] + b[1]) / 2,
        l,
        0.035,
        width,
        m,
        Math.atan2(b[1] - a[1], b[0] - a[0]),
      );
    }
  };
  const routeDistance = (x: number, z: number) => {
    let best = Infinity;
    for (let i = 1; i < d.route.length; i++) {
      const a = d.route[i - 1],
        b = d.route[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
        );
      best = Math.min(best, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz));
    }
    return best;
  };
  for (const b of d.buildings) {
    const p = routeProfiles[b.id ?? 0];
    if (!p) continue;
    if (b.id === PIER_38_ID) {
      disposePier38 = buildPier38(scene, b);
      continue;
    }
    const geom = buildingGeometry(b),
      wallMat = new T.MeshStandardMaterial({
        color: p.color,
        map: p.brick && b.id !== 112927451 ? facades.brick : null,
        roughness: 0.9,
        side: T.DoubleSide,
      });
    // Brick texture retains masonry grain; the large physical frames define the actual facade character.
    if (p.brick) {
      const wall = new T.Mesh(geom.walls, wallMat);
      wall.castShadow = true;
      scene.add(wall);
    } else add(geom.walls, wallMat);
    add(geom.roof, dark);
    if (b.id === DELANCEY_RESTAURANT_ID) {
      disposeDelancey = buildDelanceyStreet(scene, b);
      continue;
    }
    const trim = mat(p.trim),
      frame = mat(p.frames),
      glass = mat('#53686e');
    const cx = b.points.reduce((n, v) => n + v[0], 0) / b.points.length,
      cz = b.points.reduce((n, v) => n + v[1], 0) / b.points.length;
    for (let i = 1; i < b.points.length; i++) {
      const a = b.points[i - 1],
        q = b.points[i],
        l = Math.hypot(q[0] - a[0], q[1] - a[1]);
      if (l < 4) continue;
      const angle = Math.atan2(q[1] - a[1], q[0] - a[0]),
        mx = (a[0] + q[0]) / 2,
        mz = (a[1] + q[1]) / 2;
      if (routeDistance(mx, mz) > 95) continue;
      let nx = -Math.sin(angle),
        nz = Math.cos(angle);
      if ((mx - cx) * nx + (mz - cz) * nz < 0) {
        nx = -nx;
        nz = -nz;
      }
      const detail = (
        u: number,
        y: number,
        w: number,
        h: number,
        m: T.Material,
        depth = 0.16,
        offset = 0.15,
      ) =>
        box(
          a[0] + Math.cos(angle) * u + nx * offset,
          y,
          a[1] + Math.sin(angle) * u + nz * offset,
          w,
          h,
          depth,
          m,
          angle,
        );
      if ([124903637, 148547436].includes(b.id ?? 0)) {
        detail(l / 2, 3.2, l * 0.9, 0.18, dark, 1.35, 0.7);
      }
      if (b.id === 125401316) {
        detail(l / 2, b.height + 0.1, l + 0.5, 0.4, mat('#a57556'), 1.1);
      }
      detail(l / 2, b.height - 0.2, l, 0.4, trim, 0.5);
      detail(l / 2, 3.8, l, 0.35, trim, 0.35);
      const bays = Math.max(1, Math.round(l / (p.bay || 3.6))),
        step = l / bays,
        fh = b.height / p.floors;
      for (let f = 0; f < p.floors; f++)
        for (let j = 0; j < bays; j++) {
          const u = (j + 0.5) * step,
            y = (f + 0.5) * fh,
            w = step * (b.id === 112927451 ? 0.22 : p.grid ? 0.78 : 0.5),
            h = fh * 0.65;
          detail(u, y, w + 0.22, h + 0.22, trim);
          detail(u, y, w, h, glass, 0.12, 0.26);
          const divisions = p.grid ? 4 : 2;
          for (let k = 1; k < divisions; k++) {
            detail(u - w / 2 + (w * k) / divisions, y, 0.065, h, frame, 0.12, 0.35);
            detail(u, y - h / 2 + (h * k) / divisions, w, 0.055, frame, 0.12, 0.35);
          }
          if (p.grid) detail((j + 1) * step, b.height / 2, 0.23, b.height, trim, 0.3);
        }
    }
  }
  // Photo-referenced Brannan-facing warehouse frontage, on mapped footprint 112927451.
  const warehouse = d.buildings.find((b) => b.id === 112927451);
  if (warehouse) {
    const a = warehouse.points[0],
      b = warehouse.points[1],
      length = Math.hypot(b[0] - a[0], b[1] - a[1]),
      angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const redBase = mat('#873f35'),
      awning = mat('#657c6b'),
      fascia = mat('#a89370');
    const front = (
      u: number,
      y: number,
      w: number,
      h: number,
      m: T.Material,
      depth = 0.2,
      out = 0.18,
    ) =>
      box(
        a[0] + Math.cos(angle) * u + Math.sin(angle) * out,
        y,
        a[1] + Math.sin(angle) * u - Math.cos(angle) * out,
        w,
        h,
        depth,
        m,
        angle,
      );
    front(length / 2, 2.6, length, 5.2, redBase);
    front(length / 2, 5.35, length - 2, 0.18, awning, 2.1, 1.05);
    front(length / 2, 5.15, length - 2, 0.45, fascia, 0.18, 2.05);
    for (let u = 4; u < length - 2; u += 6) {
      front(u, 2.2, 1.6, 2.8, dark, 0.2, 0.32);
      front(u, 1.2, 3.6, 0.18, pale, 1.1, 0.8);
      front(u, 1.85, 3.6, 0.06, rail, 0.1, 1.35);
      for (let k = -1.7; k < 1.8; k += 0.22) front(u + k, 1.52, 0.035, 0.66, rail, 0.08, 1.35);
    }
    // Open steel landings and alternating stair flights, rather than flat facade texture.
    const u = length * 0.64;
    for (let floor = 1; floor < 5; floor++) {
      const y = 5 + floor * 3.5;
      front(u, y, 4, 0.14, dark, 1.25, 0.8);
      front(u, y + 0.75, 4, 0.07, dark, 0.08, 1.4);
      for (let k = -2; k <= 2; k += 0.5) front(u + k, y + 0.4, 0.04, 0.8, dark, 0.08, 1.4);
      if (floor < 4)
        for (let k = 0; k < 12; k++)
          front(u - 1.7 + k * 0.29, y + (k * 3.5) / 12, 0.34, 0.07, dark, 0.65, 1.05);
    }
  }
  // De Boom boarding island shelter seen in April 2022 Street View. Dimensions are modeled.
  const shelterRoof = mat('#9e403d'),
    shelterGlass = new T.MeshStandardMaterial({
      color: '#aec3c2',
      transparent: true,
      opacity: 0.35,
      roughness: 0.3,
      side: T.DoubleSide,
    });
  const { angle: sa, x: sx, z: sz } = SCENERY_LOCATIONS.deBoomShelter;
  box(sx, 0.22, sz, 5.8, 0.28, 2.3, pale, sa);
  box(sx, 2.8, sz, 4.4, 0.17, 1.65, shelterRoof, sa);
  for (const u of [-1.9, 1.9])
    for (const v of [-0.65, 0.65])
      box(
        sx + Math.cos(sa) * u - Math.sin(sa) * v,
        1.5,
        sz + Math.sin(sa) * u + Math.cos(sa) * v,
        0.09,
        2.6,
        0.09,
        rail,
      );
  box(sx - Math.sin(sa) * 0.65, 1.6, sz + Math.cos(sa) * 0.65, 3.7, 2, 0.045, shelterGlass, sa);
  box(sx, 0.65, sz, 2.7, 0.08, 0.45, dark, sa);
  // Paired blue waterfront lanterns flank Brannan's mapped Embarcadero junction.
  for (const [x, z] of SCENERY_LOCATIONS.brannanLamps) {
    rod(new T.Vector3(x, 0.1, z), new T.Vector3(x, 7.5, z), 0.12, blue);
    box(x, 0.35, z, 0.55, 0.65, 0.55, blue);
    for (const side of [-1, 1]) {
      rod(new T.Vector3(x, 7.3, z), new T.Vector3(x + side * 1.2, 7.5, z), 0.06, blue);
      const g = new T.SphereGeometry(0.25, 10, 8);
      g.scale(1, 1.35, 1);
      g.translate(x + side * 1.2, 7.15, z);
      add(g, pale);
    }
  }
  // The Brannan: opening and paths follow OSM; beds and elevations approximate the supplied May 2025 photo.
  const courtStone = mat('#d3cfc0'),
    courtPave = mat('#b6b5af'),
    hedge = mat('#405b29'),
    soil = mat('#655c44');
  const courtOutline = SCENERY_LOCATIONS.brannanCourtyard.outline;
  slab(courtOutline, courtPave, 0.18);
  for (const path of courtyardPaths) line(path.points, 2.2, pale, 0.205);
  // Local axes run northeast along Brannan and southeast into the planted courtyard.
  const cp = (u: number, v: number): Point => [
    SCENERY_LOCATIONS.brannanCourtyard.origin[0] + (u + v) * Math.SQRT1_2,
    SCENERY_LOCATIONS.brannanCourtyard.origin[1] + (-u + v) * Math.SQRT1_2,
  ];
  const cb = (
    u: number,
    v: number,
    y: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = cp(u, v);
    box(x, y, z, w, h, depth, m, -Math.PI / 4);
  };
  const bed = (u: number, v: number, w: number, depth: number) => {
    const pts = [
      cp(u - w / 2, v - depth / 2),
      cp(u + w / 2, v - depth / 2),
      cp(u + w / 2, v + depth / 2),
      cp(u - w / 2, v + depth / 2),
      cp(u - w / 2, v - depth / 2),
    ];
    slab(pts, soil, 0.64);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      box((a[0] + b[0]) / 2, 0.43, (a[1] + b[1]) / 2, len, 0.5, 0.35, courtStone, angle);
      box((a[0] + b[0]) / 2, 0.93, (a[1] + b[1]) / 2, len - 0.25, 0.52, 0.65, hedge, angle);
      for (let k = 1; k < len; k += 1.5)
        box(
          a[0] + ((b[0] - a[0]) * k) / len,
          0.43,
          a[1] + ((b[1] - a[1]) * k) / len,
          0.025,
          0.48,
          0.37,
          pale,
          angle,
        );
    }
    for (let k = 0; k < 7; k++) {
      const [x, z] = cp(u + Math.sin(k * 2.4) * w * 0.29, v + Math.cos(k * 3.1) * depth * 0.26),
        g = new T.SphereGeometry(1, 10, 7);
      g.scale(1.2, 0.7, 1.1);
      g.translate(x, 1, z);
      add(g, leaf);
    }
  };
  for (const { u, v, width, depth } of SCENERY_LOCATIONS.brannanCourtyard.beds)
    bed(u, v, width, depth);
  // Broad paved approach remains open between the front planters.
  for (let u = 0; u < 38; u += 2) line([cp(u, 0), cp(u, 2)], 0.025, pale, 0.22);
  for (const [u, v, h] of SCENERY_LOCATIONS.brannanCourtyard.trees) {
    const [x, z] = cp(u, v);
    rod(new T.Vector3(x, 0.6, z), new T.Vector3(x, h, z), 0.17, bark);
    for (let j = 0; j < 6; j++) {
      const a = j * 2.4,
        tx = x + Math.cos(a) * 1.7,
        tz = z + Math.sin(a) * 1.7;
      rod(new T.Vector3(x, h * 0.55, z), new T.Vector3(tx, h - 0.3, tz), 0.07, bark);
      const g = new T.SphereGeometry(1, 12, 9);
      g.scale(1.8, 2.1, 1.7);
      g.translate(tx, h + (j % 2) * 0.7, tz);
      add(g, leaf);
    }
  }
  cb(10, 3, 1.35, 3.3, 1.2, 0.38, courtStone);
  const disposeOraclePark = buildOraclePark(scene, survey.stadium, facades, routeDistance);
  buildBayBridge(scene);
  buildBrannanWaterfront(scene);
  buildDelanceyGarden(scene);
  const disposeHarborBuildings = buildHarborBuildings(scene);
  const inPolygon = (p: Point, pts: Point[]) => {
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
  buildSouthBeachMarina(
    d,
    southBeach.points,
    survey.trees.map((tree) => tree.point),
    add,
  );
  const beachHeight = (x: number, z: number) => {
    if (!inPolygon([x, z], southBeach.points)) return 0.15;
    const cx = 632,
      cz = 565;
    let edge = 100;
    for (let i = 1; i < southBeach.points.length; i++) {
      const a = southBeach.points[i - 1],
        b = southBeach.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
        );
      edge = Math.min(edge, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
    }
    return 0.15 + 0.85 * Math.min(1, edge / 7) * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 2500);
  };
  const lawnSurface = (pts: Point[], height: (x: number, z: number) => number) => {
    const g = new T.ShapeGeometry(
        new T.Shape(pts.map((p) => new T.Vector2(p[0], p[1]))),
      ).toNonIndexed(),
      v = g.getAttribute('position'),
      out: number[] = [];
    const split = (a: Point, b: Point, c: Point, depth = 0) => {
      const ab = Math.hypot(a[0] - b[0], a[1] - b[1]),
        bc = Math.hypot(b[0] - c[0], b[1] - c[1]),
        ca = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (Math.max(ab, bc, ca) > 5 && depth < 12) {
        if (ab >= bc && ab >= ca) {
          const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          split(a, m, c, depth + 1);
          split(m, b, c, depth + 1);
        } else if (bc >= ca) {
          const m = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
          split(a, b, m, depth + 1);
          split(a, m, c, depth + 1);
        } else {
          const m = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
          split(a, b, m, depth + 1);
          split(m, b, c, depth + 1);
        }
        return;
      }
      for (const p of [a, c, b]) out.push(p[0], height(p[0], p[1]), p[1]);
    };
    for (let i = 0; i < v.count; i += 3)
      split([v.getX(i), v.getY(i)], [v.getX(i + 1), v.getY(i + 1)], [v.getX(i + 2), v.getY(i + 2)]);
    g.dispose();
    const mesh = new T.BufferGeometry();
    mesh.setAttribute('position', new T.Float32BufferAttribute(out, 3));
    mesh.computeVertexNormals();
    add(mesh, grass);
  };
  for (const p of survey.parks) {
    slab(p.points, pale, 0.09);
    if (p.id === 23750468) lawnSurface(p.points, beachHeight);
  }
  // Brannan Wharf's lawn has its own mapped outline, not a shrunken copy of the park boundary.
  for (const lawn of survey.lawns) {
    lawnSurface(lawn.points, () => 0.48);
    for (let i = 1; i < lawn.points.length; i++) {
      const a = lawn.points[i - 1],
        b = lawn.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let u = 0; u < len; u += 1.65) {
        const l = Math.min(1.63, len - u),
          x = a[0] + Math.cos(angle) * (u + l / 2),
          z = a[1] + Math.sin(angle) * (u + l / 2);
        box(x, 0.26, z, l, 0.48, 0.48, pale, angle);
      }
    }
  }
  for (const path of survey.parkPaths) {
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1],
        b = path.points[i],
        mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!survey.parks.some((p) => inPolygon(mid, p.points))) continue;
      line([a, b], 2.1, pale, beachHeight(mid[0], mid[1]) + 0.04);
    }
  }
  for (const playground of survey.playgrounds) {
    slab(playground.points, mat('#a49476'), 0.2);
    line(playground.points, 0.25, pale, 0.24);
  }
  const seatWood = mat('#88745a');
  for (const bench of survey.benches) {
    const [x, z] = bench.point;
    let best = Infinity,
      angle = 0;
    for (const path of survey.parkPaths)
      for (let i = 1; i < path.points.length; i++) {
        const a = path.points[i - 1],
          b = path.points[i],
          distance = Math.hypot(x - (a[0] + b[0]) / 2, z - (a[1] + b[1]) / 2);
        if (distance < best) {
          best = distance;
          angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        }
      }
    const h = beachHeight(x, z),
      length = Math.max(1.3, Math.min(5.5, bench.seats * 0.48)),
      seat = bench.white ? pale : seatWood;
    for (let j = 0; j < 4; j++)
      box(
        x - Math.sin(angle) * (j * 0.12 - 0.18),
        h + 0.48,
        z + Math.cos(angle) * (j * 0.12 - 0.18),
        length,
        0.07,
        0.09,
        seat,
        angle,
      );
    box(
      x - Math.sin(angle) * 0.23,
      h + 0.85,
      z + Math.cos(angle) * 0.23,
      length,
      0.52,
      0.08,
      seat,
      angle,
    );
    for (const u of [-length * 0.35, length * 0.35])
      box(x + Math.cos(angle) * u, h + 0.25, z + Math.sin(angle) * u, 0.09, 0.5, 0.48, dark, angle);
  }
  // Mapped roof footprint 443021970 is an open shade canopy, not a ten-metre masonry building.
  const canopy = d.buildings.find((b) => b.id === 443021970);
  if (canopy) {
    slab(canopy.points, dark, 3.8);
    for (let i = 1; i < canopy.points.length; i++) {
      const a = canopy.points[i - 1],
        b = canopy.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 8) continue;
      for (let u = 0; u < len; u += 7) {
        const x = a[0] + ((b[0] - a[0]) * u) / len,
          z = a[1] + ((b[1] - a[1]) * u) / len;
        box(x, 1.9, z, 0.14, 3.8, 0.14, dark);
      }
    }
  }
  // Low red flowering beds along South Beach Park's King Street frontage (photo estimate).
  const flowering = ['#b92332', '#d6323e', '#a51f2d'].map(mat);
  for (let i = 1; i < 13; i++) {
    const a = southBeach.points[i - 1],
      b = southBeach.points[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / len,
      nz = (b[0] - a[0]) / len;
    for (let u = 0.3; u < len; u += 0.75) {
      for (let row = 0; row < 3; row++) {
        const x = a[0] + ((b[0] - a[0]) * u) / len + nx * (0.7 + row * 0.65);
        const z = a[1] + ((b[1] - a[1]) * u) / len + nz * (0.7 + row * 0.65);
        const h = beachHeight(x, z);
        const shrub = new T.IcosahedronGeometry(1, 1);
        shrub.scale(0.55, 0.32, 0.5);
        shrub.translate(x, h + 0.27, z);
        add(shrub, leaf);
        for (let j = 0; j < 5; j++) {
          const bloom = new T.IcosahedronGeometry(0.15, 0);
          bloom.scale(1.2, 0.6, 1);
          bloom.translate(
            x + Math.cos(j * 2.4) * 0.32,
            h + 0.5 + (j % 2) * 0.09,
            z + Math.sin(j * 2.4) * 0.3,
          );
          add(bloom, flowering[(i + j + row) % flowering.length]);
        }
      }
    }
  }
  // Each King centerline is one carriageway. The green railing borders the Muni median,
  // while the outside curb carries a continuously green bike lane.
  const barrierGreen = mat('#326c61'),
    laneWhite = mat('#e4e2d8'),
    bikeGreen = mat('#79ac48');
  const nearCrossStreet = (x: number, z: number) =>
    d.roads.some(
      (r) => r.name !== 'King Street' && r.points.some((p) => Math.hypot(p[0] - x, p[1] - z) < 12),
    );
  for (const road of d.roads.filter((r) => r.name === 'King Street')) {
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const at = (u: number, offset: number) => [
        a[0] + Math.cos(angle) * u - Math.sin(angle) * offset,
        a[1] + Math.sin(angle) * u + Math.cos(angle) * offset,
      ];
      for (let u = 0; u < length; u += 2.5) {
        const span = Math.min(2.5, length - u),
          p = at(u + span / 2, -5.05);
        if (nearCrossStreet(p[0], p[1])) continue;
        box(p[0], 0.16, p[1], span, 0.22, 0.35, pale, angle);
        for (const h of [0.4, 0.76, 1.1])
          box(p[0], h, p[1], span, 0.055, 0.055, barrierGreen, angle);
        const post = at(u, -5.05);
        box(post[0], 0.64, post[1], 0.09, 1.18, 0.09, barrierGreen, angle);
      }
      for (let u = 1; u < length; u += 8) {
        const p = at(u, -0.8);
        if (!nearCrossStreet(p[0], p[1]))
          box(p[0], 0.09, p[1], Math.min(3, length - u), 0.015, 0.13, laneWhite, angle);
      }
      // Continuous green paint, including through the crossing areas.
      const bikeCenter = at(length / 2, 3.7);
      box(bikeCenter[0], 0.11, bikeCenter[1], length + 0.2, 0.018, 1.65, bikeGreen, angle);
    }
  }
  for (const art of survey.art) {
    const [x, z] = art.point,
      redSteel = mat('#a84e42'),
      top = new T.Vector3(x, 15, z);
    for (let j = 0; j < 3; j++) {
      const a = (j * Math.PI * 2) / 3;
      const base = new T.Vector3(x + Math.cos(a) * 3.5, 0.3, z + Math.sin(a) * 3.5),
        delta = top.clone().sub(base),
        g = new T.BoxGeometry(0.62, delta.length(), 0.38);
      g.applyQuaternion(
        new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
      );
      g.translate(...base.clone().add(top).multiplyScalar(0.5).toArray());
      add(g, redSteel);
    }
    const ring = new T.TorusGeometry(2.2, 0.28, 8, 32, Math.PI * 1.5);
    ring.rotateY(0.5);
    ring.translate(x, 16, z);
    add(ring, redSteel);
  }
  for (const tree of survey.trees) {
    const [x, z] = tree.palm ? waterfrontTreePosition(tree.point, d.roads) : tree.point;
    if (Math.hypot(x - 90, z - 490) < 170 || routeDistance(x, z) > 90) continue;
    if (tree.palm) {
      palmGeometry(x, z, 10 + (tree.id % 4), add, { bark, leaves: palmLeaves });
    } else {
      rod(new T.Vector3(x, 0, z), new T.Vector3(x, 6, z), 0.2, bark);
      for (let j = 0; j < 3; j++) {
        const g = new T.SphereGeometry(1, 10, 7);
        g.scale(2.4, 2.7, 2.3);
        g.translate(x + Math.cos(j * 2.1) * 1.1, 6.5 + (j % 2), z + Math.sin(j * 2.1) * 1.1);
        add(g, leaf);
      }
    }
  }
  for (const lamp of survey.lamps) {
    const [x, z] = lamp.point;
    if (routeDistance(x, z) > 70) continue;
    rod(new T.Vector3(x, 0, z), new T.Vector3(x, 6.5, z), 0.075, blue);
    box(x, 0.2, z, 0.4, 0.4, 0.4, blue);
    const g = new T.SphereGeometry(0.24, 8, 6);
    g.scale(1, 1.7, 1);
    g.translate(x, 6.6, z);
    add(g, pale);
    box(x, 7.02, z, 0.43, 0.1, 0.43, blue);
  }
  for (const track of survey.rails) {
    line(track.points, 2.2, pale, 0.09);
    for (let i = 1; i < track.points.length; i++) {
      const a = track.points[i - 1],
        b = track.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const side of [-1, 1]) {
        const nx = -Math.sin(angle) * 0.718 * side,
          nz = Math.cos(angle) * 0.718 * side;
        line(
          [
            [a[0] + nx, a[1] + nz],
            [b[0] + nx, b[1] + nz],
          ],
          0.065,
          rail,
          0.12,
        );
      }
      for (let u = 0.6; u < len; u += 1.2)
        box(
          a[0] + Math.cos(angle) * u,
          0.115,
          a[1] + Math.sin(angle) * u,
          0.13,
          0.02,
          1.85,
          dark,
          angle,
        );
    }
  }
  // Observed lane types, fitted to the game's simplified road widths; not surveyed lane boundaries.
  let along = 0;
  const red = mat('#a6534f');
  for (let i = 1; i < d.route.length; i++) {
    const a = d.route[i - 1],
      b = d.route[i],
      l = Math.hypot(b[0] - a[0], b[1] - a[1]),
      section = d.course?.sections.findLast((s) => s.start <= along + 0.1)?.name;
    along += l;
    if (section !== '3rd Street' || (a[1] + b[1]) / 2 > ROAD_APPEARANCE.thirdTransitLaneMaxZ)
      continue;
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
      offset = 4.8,
      nx = -Math.sin(angle) * offset,
      nz = Math.cos(angle) * offset;
    line(
      [
        [a[0] + nx, a[1] + nz],
        [b[0] + nx, b[1] + nz],
      ],
      3,
      red,
      0.102,
    );
  }
  for (const [m, gs] of groups) {
    if (!gs.length) continue;
    const g = mergeGeometries(gs);
    if (!g) throw new Error('Route scenery geometry could not be merged');
    const mesh = new T.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    gs.forEach((g) => g.dispose());
  }
  return () => {
    groundGrass.texture.dispose();
    disposeDelancey?.();
    disposePier38?.();
    disposeOraclePark();
    disposeHarborBuildings();
  };
}
