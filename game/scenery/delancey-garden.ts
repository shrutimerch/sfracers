import * as T from 'three';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';
import { batchFacade } from './geometry/batch-facade.ts';

// Photo-based private garden at the southeast corner of Brannan and Delancey.
// Local U follows Brannan toward the bay; V follows Delancey into the block.
export function buildDelanceyGarden(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Private garden — Brannan and Delancey';
  group.position.set(466.5, 0, 265);
  group.rotation.y = Math.PI / 4;
  scene.add(group);
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.93, side: T.DoubleSide });
  const wall = mat('#9e6551'),
    cap = mat('#b68165'),
    iron = mat('#26332d');
  const lawn = mat('#5a713f'),
    path = mat('#c1b49a'),
    stone = mat('#cac6b3');
  const wood = mat('#867059'),
    bark = mat('#74694f');
  const leaves = ['#42603a', '#5f753b', '#748848', '#394e31'].map(mat);
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const outline = [
    [2, 0],
    [20, 0],
    [20, 20],
    [0, 20],
    [0, 2],
    [2, 0],
  ];
  const ground = new T.ShapeGeometry(new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z))));
  ground.rotateX(-Math.PI / 2);
  ground.translate(0, 0.22, 0);
  const groundMesh = new T.Mesh(ground, lawn);
  groundMesh.name = 'enclosed garden lawn';
  group.add(groundMesh);
  box('garden walking path', 10, 0.245, 9.5, 16, 0.05, 1.6, path);
  box('garden walking path', 10, 0.245, 10, 1.6, 0.05, 17, path);
  for (let i = 1; i < outline.length; i++) {
    const [ax, az] = outline[i - 1],
      [bx, bz] = outline[i];
    const length = Math.hypot(bx - ax, bz - az),
      angle = -Math.atan2(bz - az, bx - ax);
    const fence = new T.Group();
    fence.name = 'brick base and iron fence';
    fence.position.set((ax + bx) / 2, 0, (az + bz) / 2);
    fence.rotation.y = angle;
    group.add(fence);
    const part = (
      name: string,
      x: number,
      y: number,
      w: number,
      h: number,
      d: number,
      m: T.Material,
    ) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      mesh.name = name;
      mesh.position.set(x, y, 0);
      fence.add(mesh);
    };
    part('terracotta garden boundary wall', 0, 0.55, length, 1.1, 0.4, wall);
    part('wall coping', 0, 1.12, length, 0.14, 0.48, cap);
    for (const y of [1.3, 2.35, 2.55]) part('black fence rail', 0, y, length, 0.065, 0.06, iron);
    const panels = Math.ceil(length / 2.4),
      step = length / panels;
    for (let j = 0; j <= panels; j++)
      part('square iron fence post', -length / 2 + j * step, 1.88, 0.11, 1.55, 0.11, iron);
    for (let x = -length / 2 + 0.18; x < length / 2; x += 0.23)
      part('slender vertical iron picket', x, 1.91, 0.032, 1.43, 0.035, iron);
    for (let j = 0; j <= panels; j++)
      part('terracotta base pier', -length / 2 + j * step, 0.63, 0.36, 1.26, 0.52, cap);
    batchFacade(fence);
  }
  // Canopies stay inside the enclosure; varied branching avoids uniform tree blobs.
  const add = (g: T.BufferGeometry, m: T.Material) => {
    const mesh = new T.Mesh(g, m);
    mesh.name = 'garden tree';
    group.add(mesh);
  };
  for (const [u, v, h, seed] of [
    [4, 4, 11, 19],
    [13, 4, 10, 32],
    [17, 12, 12, 43],
    [5, 15, 11, 58],
    [12, 16, 9, 71],
    [7, 7, 13, 89],
  ])
    broadleafGeometry(u, v, h, seed, add, { bark, leaves }, 0.23);
  for (const [u, v] of [
    [4, 12],
    [15, 8],
  ]) {
    box('wooden garden bench seat', u, 0.7, v, 2.4, 0.12, 0.65, wood);
    box('wooden garden bench back', u, 1.15, v + 0.27, 2.4, 0.75, 0.09, wood);
    for (const x of [-0.9, 0.9]) box('bench iron leg', u + x, 0.45, v, 0.1, 0.5, 0.5, iron);
  }
  for (const [u, v] of [
    [3, -1.5],
    [8, -1.5],
    [14, -1.5],
    [-1.5, 5],
    [-1.5, 12],
    [-1.5, 18],
  ]) {
    const bollard = new T.Mesh(new T.CylinderGeometry(0.24, 0.28, 1, 10), stone);
    bollard.name = 'pale concrete sidewalk bollard';
    bollard.position.set(u, 0.5, v);
    group.add(bollard);
    const ring = new T.Mesh(new T.TorusGeometry(0.25, 0.035, 4, 10), cap);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(u, 0.77, v);
    ring.name = 'bollard inset band';
    group.add(ring);
  }
  batchFacade(group);
}
