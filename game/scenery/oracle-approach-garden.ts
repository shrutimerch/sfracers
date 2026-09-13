import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';

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
  const leaves = ['#3f5835', '#627541', '#7b884c'].map(mat);
  const line = [
    [596.76, 529.33],
    [590.99, 549.94],
    [585.2, 566.06],
    [578.21, 581.42],
    [570.67, 595.67],
    [559.82, 613.13],
    [545.95, 631.16],
    [532.65, 646.13],
  ];
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
  // Keep the sculpture lawn open; the fenced planting starts at the stadium end.
  for (let i = 1; i < line.length; i++) {
    if (line[i - 1][1] < 610) continue;
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      nx = dz / len,
      nz = -dx / len,
      angle = Math.atan2(dz, dx);
    const at = (t: number, offset: number) => [
      a[0] + dx * t + nx * offset,
      a[1] + dz * t + nz * offset,
    ];
    const bed = at(0.5, 14.5),
      fence = at(0.5, 18);
    box('mulched flower border', bed[0], 0.2, bed[1], len, 0.25, 5, angle, soil);
    for (const y of [0.55, 2.35, 2.9])
      box('black fence horizontal rail', fence[0], y, fence[1], len, 0.06, 0.06, angle, iron);
    for (let u = 0; u < len; u += 0.23) {
      const p = at(u / len, 18);
      box('black iron fence picket', p[0], 1.55, p[1], 0.045, 3, 0.045, angle, iron);
    }
    for (let u = 1; u < len; u += 1.1)
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
    if (i % 2 === 1) {
      const t = at(0.45, 20.5),
        tree = new T.Group();
      tree.name = 'Oracle approach tree';
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
