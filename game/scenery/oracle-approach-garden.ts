import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';

// Only the stadium-side frontage is fenced. The sculpture park to the north stays open.
const intersection = [501.43, 676.94]; // King / 2nd Street
const cornerApproach = [532.65, 646.13];
const cornerDistance = Math.hypot(
  cornerApproach[0] - intersection[0],
  cornerApproach[1] - intersection[1],
);
const cornerSetback = 9.5; // stop at the cross-street sidewalk rather than crossing 2nd Street
const line = [
  [559.82, 613.13],
  [545.95, 631.16],
  cornerApproach,
  [
    intersection[0] + ((cornerApproach[0] - intersection[0]) * cornerSetback) / cornerDistance,
    intersection[1] + ((cornerApproach[1] - intersection[1]) * cornerSetback) / cornerDistance,
  ],
];
// Shared mitered corners keep the iron rails and flower beds continuous along the curve.
const offsetPoint = (index: number, offset: number) => {
  const point = line[index];
  const normal = (a: number[], b: number[]) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
  };
  const before = normal(line[Math.max(0, index - 1)], line[Math.max(1, index)]);
  const after = normal(
    line[Math.min(index, line.length - 2)],
    line[Math.min(index + 1, line.length - 1)],
  );
  const denominator = 1 + before[0] * after[0] + before[1] * after[1];
  return [
    point[0] + (offset * (before[0] + after[0])) / denominator,
    point[1] + (offset * (before[1] + after[1])) / denominator,
  ];
};

// Cut the parking depression out of the city base plane, rather than burying the cars.
export function oracleGroundGeometry() {
  const shape = new T.Shape([
    new T.Vector2(-3250, -3250),
    new T.Vector2(3250, -3250),
    new T.Vector2(3250, 3250),
    new T.Vector2(-3250, 3250),
  ]);
  const outline = [
    ...line.map((_, i) => offsetPoint(i, 18)),
    ...line.map((_, i) => offsetPoint(i, 32.7)).reverse(),
  ];
  shape.holes.push(new T.Path(outline.map(([x, z]) => new T.Vector2(x, -z))));
  return new T.ShapeGeometry(shape);
}

export function buildOracleApproachGarden(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Oracle Park King Street flower border';
  scene.add(group);
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.95, side: T.DoubleSide });
  const soil = mat('#75654d'),
    iron = mat('#283630'),
    foliage = mat('#546839');
  const flowers = ['#b84855', '#cc5c69', '#9b394a'].map(mat),
    bark = mat('#796c58');
  const asphalt = mat('#575954'),
    curb = mat('#b6b3a5');
  const tires = mat('#222628'),
    glass = mat('#344b55');
  const paint = ['#e1e2dc', '#343d49', '#82949d', '#8b413b'].map(mat);
  const leaves = ['#3f5835', '#627541', '#7b884c'].map(mat);
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    angle: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = -angle;
    group.add(mesh);
  };
  // Continue toward King / 2nd, never back across the open sculpture park.
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      angle = Math.atan2(dz, dx);
    const at = (t: number, offset: number) => {
      const start = offsetPoint(i - 1, offset),
        end = offsetPoint(i, offset);
      return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
    };
    const span = (offset: number) => {
      const start = at(0, offset),
        end = at(1, offset);
      return Math.hypot(end[0] - start[0], end[1] - start[1]);
    };
    const bed = at(0.5, 14.5),
      fence = at(0.5, 18);
    // Recessed perpendicular parking: sidewalk at +0.12, lot at -0.85.
    // The bank slopes down behind the fence; the far end ramps back to 2nd Street.
    const grade = (t: number) =>
      -0.85 + 0.97 * (i === line.length - 1 ? Math.max(0, 1 - ((1 - t) * len) / 4) : 0);
    const surface = (
      name: string,
      near: number,
      far: number,
      nearRaised: boolean,
      farRaised: boolean,
      material: T.Material,
    ) => {
      const cuts = i === line.length - 1 ? [0, 1 - 4 / len, 1] : [0, 1];
      const vertices: number[] = [];
      for (let j = 1; j < cuts.length; j++) {
        const point = (t: number, offset: number, raised: boolean) => {
          const p = at(t, offset);
          return [p[0], raised ? 0.12 : grade(t), p[1]];
        };
        const a = point(cuts[j - 1], near, nearRaised),
          b = point(cuts[j], near, nearRaised);
        const c = point(cuts[j], far, farRaised),
          d = point(cuts[j - 1], far, farRaised);
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute(
        'uv',
        new T.Float32BufferAttribute(new Float32Array((vertices.length / 3) * 2), 2),
      );
      geometry.computeVertexNormals();
      const mesh = new T.Mesh(geometry, material);
      mesh.name = name;
      group.add(mesh);
    };
    surface('sloped bank behind fence', 18, 19.5, true, false, soil);
    surface('service parking strip', 19.5, 24.5, false, false, asphalt);
    // Three metres of clear pavement: one service vehicle wide.
    surface('narrow service alley', 24.5, 27.5, false, false, asphalt);
    surface('alley tree planting bed', 27.5, 32.7, false, true, soil);
    // Close the short northern retaining edge without extending across the open park.
    if (i === 1) {
      const edge = at(0, 25.35);
      box('parking retaining edge', edge[0], -0.365, edge[1], 0.18, 0.97, 14.7, angle, curb);
    }
    for (const fraction of [0.25, 0.72]) {
      const position = at(fraction, 22);
      const car = new T.Group();
      car.name = 'Oracle service parked car';
      car.position.set(position[0], grade(fraction), position[1]);
      car.rotation.y = Math.PI / 2 - angle; // front (+X) points toward the Embarcadero
      car.userData.frontageTangent = [dx / len, dz / len];
      const bodyMaterial = paint[(i + (fraction > 0.5 ? 1 : 0)) % paint.length];
      const part = (
        name: string,
        x: number,
        y: number,
        w: number,
        h: number,
        d: number,
        material: T.Material,
      ) => {
        const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
        mesh.name = name;
        mesh.position.set(x, y, 0);
        car.add(mesh);
      };
      part('parked car body', 0, 0.64, 4.3, 0.65, 1.8, bodyMaterial);
      part('parked car windows', -0.15, 1.18, 2.35, 0.6, 1.55, glass);
      part('parked car roof', -0.15, 1.51, 2.4, 0.1, 1.6, bodyMaterial);
      for (const x of [-1.35, 1.35])
        for (const z of [-0.87, 0.87]) {
          const wheel = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.2, 12), tires);
          wheel.name = 'parked car tire';
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(x, 0.34, z);
          car.add(wheel);
        }
      batchFacade(car);
      group.add(car);
    }
    box('mulched flower border', bed[0], 0.2, bed[1], span(14.5) + 0.15, 0.25, 5, angle, soil);
    for (const y of [0.55, 2.35, 2.9])
      box('black fence horizontal rail', fence[0], y, fence[1], span(18), 0.06, 0.06, angle, iron);
    for (let u = 0; u <= span(18); u += 0.23) {
      const p = at(u / span(18), 18);
      box('black iron fence picket', p[0], 1.55, p[1], 0.045, 3, 0.045, angle, iron);
    }
    const post = at(0, 18);
    box('black iron fence corner post', post[0], 1.6, post[1], 0.1, 3.1, 0.1, angle, iron);
    if (i === line.length - 1) {
      const end = at(1, 18);
      box('black iron fence end post', end[0], 1.6, end[1], 0.1, 3.1, 0.1, angle, iron);
    }
    for (let u = 0.3; u < len; u += 1.1)
      for (let row = 0; row < 3; row++) {
        const p = at(u / len, 12.6 + row * 1.2);
        const shrub = new T.Mesh(new T.IcosahedronGeometry(0.65, 1), foliage);
        shrub.name = 'flowering border foliage';
        shrub.position.set(p[0], 0.55, p[1]);
        shrub.scale.set(1, 0.65, 1);
        group.add(shrub);
        for (let k = 0; k < 4; k++) {
          const f = new T.Mesh(new T.IcosahedronGeometry(0.13, 0), flowers[(i + row + k) % 3]);
          f.name = 'red and pink border flowers';
          f.position.set(
            p[0] + Math.cos(k * 2.4) * 0.45,
            0.83 + (k % 2) * 0.13,
            p[1] + Math.sin(k * 2.4) * 0.45,
          );
          group.add(f);
        }
      }
    const p = at(0.5, 16.4);
    const shrub = new T.Mesh(new T.SphereGeometry(1.35, 12, 8), foliage);
    shrub.name = 'clipped rounded shrub';
    shrub.position.set(p[0], 0.9, p[1]);
    shrub.scale.y = 0.65;
    group.add(shrub);
    for (const fraction of [0.18, 0.82]) {
      const t = at(fraction, 30.1),
        tree = new T.Group();
      tree.name = 'Oracle approach tree';
      tree.position.y = (grade(fraction) + 0.12) / 2;
      group.add(tree);
      broadleafGeometry(t[0], t[1], 10, 310 + i, (g, m) => tree.add(new T.Mesh(g, m)), {
        bark,
        leaves,
      });
      batchFacade(tree);
    }
  }
  batchFacade(group);
}
