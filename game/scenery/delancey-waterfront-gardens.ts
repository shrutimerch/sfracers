import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';

/** Photo-estimated private garden and neighboring public green at 654–684 Embarcadero. */
export function buildDelanceyWaterfrontGardens(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Delancey waterfront gardens — 654 and 684';
  scene.add(group);
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.95, side: T.DoubleSide });
  const terra = mat('#ac7963'),
    cream = mat('#c4bba3'),
    iron = mat('#303d36');
  const grass = mat('#597340'),
    paving = mat('#b7afa0'),
    wood = mat('#78694e');
  const bark = mat('#756b59'),
    leaves = ['#385532', '#4d6837', '#718346'].map(mat);
  const add = (geometry: T.BufferGeometry, material: T.Material, name: string) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const mesh = add(new T.BoxGeometry(w, h, d), material, name);
    mesh.position.set(x, y, z);
    return mesh;
  };
  const polygon = (name: string, points: number[][], y: number, material: T.Material) => {
    const geometry = new T.ShapeGeometry(new T.Shape(points.map(([x, z]) => new T.Vector2(x, -z))));
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, y, 0);
    add(geometry, material, name);
  };
  const edge = (
    name: string,
    a: number[],
    b: number[],
    y: number,
    height: number,
    depth: number,
    material: T.Material,
  ) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mesh = box(
      name,
      (a[0] + b[0]) / 2,
      y,
      (a[1] + b[1]) / 2,
      length,
      height,
      depth,
      material,
    );
    mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  };
  const garden = [
    [551.5, 324.5],
    [573, 325.8],
    [571, 354.7],
    [542, 352.8],
    [540, 338],
  ];
  polygon('private garden lawn', garden, 0.22, grass);
  const boundary = [...garden, garden[0]];
  for (let i = 1; i < boundary.length; i++) {
    const a = boundary[i - 1],
      b = boundary[i],
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    edge('terracotta garden boundary', a, b, 0.65, 1.3, 0.45, terra);
    edge('garden wall coping', a, b, 1.33, 0.14, 0.55, cream);
    for (const y of [1.6, 2.6, 2.9])
      edge('garden iron horizontal rail', a, b, y, 0.065, 0.06, iron);
    const bars = Math.ceil(length / 0.22);
    for (let k = 0; k <= bars; k++) {
      const t = k / bars;
      box(
        'garden iron picket',
        a[0] + (b[0] - a[0]) * t,
        2.1,
        a[1] + (b[1] - a[1]) * t,
        0.045,
        1.6,
        0.045,
        iron,
      );
    }
    const piers = Math.ceil(length / 6);
    for (let k = 0; k <= piers; k++) {
      const t = k / piers,
        x = a[0] + (b[0] - a[0]) * t,
        z = a[1] + (b[1] - a[1]) * t;
      box('garden stucco pier', x, 1.6, z, 0.55, 3.2, 0.55, terra);
      box('garden pier cap', x, 3.23, z, 0.67, 0.12, 0.67, cream);
    }
  }
  polygon(
    'public green paved walkway',
    [
      [542, 355],
      [571.5, 357],
      [569, 397],
      [551, 380],
      [536, 364],
    ],
    0.2,
    paving,
  );
  const lawns = [
    [
      [543, 359],
      [563, 360.3],
      [562.4, 369],
      [550, 368],
    ],
    [
      [552, 372],
      [563, 373],
      [564, 385],
      [558, 379],
    ],
  ];
  for (const points of lawns) {
    polygon('public park lawn bed', points, 0.3, grass);
    for (let i = 0; i < points.length; i++)
      edge('pale lawn edging', points[i], points[(i + 1) % points.length], 0.3, 0.25, 0.25, cream);
  }
  for (const [x, z, angle] of [
    [550, 370, 0.07],
    [560, 370.7, 0.07],
    [565.5, 380, Math.PI / 2],
  ]) {
    const bench = new T.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = angle;
    group.add(bench);
    const part = (
      name: string,
      px: number,
      y: number,
      pz: number,
      w: number,
      h: number,
      d: number,
      material: T.Material,
    ) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
      mesh.name = name;
      mesh.position.set(px, y, pz);
      bench.add(mesh);
    };
    for (let j = 0; j < 4; j++)
      part('wooden bench seat slat', 0, 0.8, -0.24 + j * 0.16, 3.2, 0.075, 0.13, wood);
    for (let j = 0; j < 3; j++)
      part('wooden bench back slat', 0, 1.05 + j * 0.19, -0.35, 3.2, 0.14, 0.08, wood);
    for (const side of [-1, 1]) {
      part('iron bench leg', side * 1.2, 0.5, 0, 0.1, 0.6, 0.5, iron);
      part('iron bench arm', side * 1.4, 1.1, 0, 0.09, 0.08, 0.6, iron);
    }
    batchFacade(bench);
  }
  for (const [x, z] of [
    [568.5, 361],
    [568, 372],
    [567.3, 389],
    [540, 358],
  ]) {
    const bollard = add(new T.CylinderGeometry(0.22, 0.24, 0.95, 10), cream, 'public park bollard');
    bollard.position.set(x, 0.68, z);
  }
  // Trees are separate material batches because their leaf geometry has no UVs.
  for (const [i, [x, z, h]] of [
    [550, 332, 9],
    [565, 331, 10],
    [547, 345, 10],
    [562, 345, 11],
    [568, 340, 8],
    [550, 363, 10],
    [560, 365, 9],
    [561, 378, 10],
  ].entries()) {
    const tree = new T.Group();
    tree.name = 'waterfront garden broadleaf tree';
    group.add(tree);
    broadleafGeometry(
      x,
      z,
      h,
      654 + i * 31,
      (g, m) => {
        const mesh = new T.Mesh(g, m);
        mesh.name = 'garden tree geometry';
        tree.add(mesh);
      },
      { bark, leaves },
    );
    batchFacade(tree);
  }
  batchFacade(group);
}
