import * as T from 'three';
import type { MapData } from '../types';
import { batchFacade } from './geometry/batch-facade.ts';

export function buildPromenadePaving(scene: T.Scene, paths: NonNullable<MapData['paths']>) {
  const group = new T.Group();
  group.name = 'Paneled waterfront promenade';
  scene.add(group);
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.98 });
  const panels = ['#bbb6a8', '#c2bdaf', '#b8b3a5', '#c7c1b2'].map(mat);
  const joint = mat('#827f73'),
    curb = mat('#ada99a'),
    band = mat('#d5cebc');
  const box = (
    name: string,
    x: number,
    z: number,
    y: number,
    length: number,
    width: number,
    height: number,
    angle: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(length, height, width), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = -angle;
    group.add(mesh);
  };
  for (const path of paths)
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1],
        b = path.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      if (len < 0.1) continue;
      const angle = Math.atan2(dz, dx),
        nx = -dz / len,
        nz = dx / len;
      const rows = Math.ceil(len / 2),
        columns = Math.max(2, Math.ceil(path.width / 1.8));
      const length = len / rows,
        width = path.width / columns;
      box(
        'promenade joint bed',
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
        0.015,
        len,
        path.width + 0.35,
        0.1,
        angle,
        joint,
      );
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < columns; col++) {
          const t = (row + 0.5) / rows,
            offset = -path.width / 2 + (col + 0.5) * width;
          box(
            'individual concrete paving panel',
            a[0] + dx * t + nx * offset,
            a[1] + dz * t + nz * offset,
            0.05,
            length - 0.025,
            width - 0.025,
            0.12,
            angle,
            panels[(row * 7 + col * 3) % panels.length],
          );
        }
      for (const side of [-1, 1]) {
        const offset = side * (path.width / 2 + 0.14);
        box(
          'raised promenade curb edge',
          (a[0] + b[0]) / 2 + nx * offset,
          (a[1] + b[1]) / 2 + nz * offset,
          0.025,
          len,
          0.28,
          0.17,
          angle,
          curb,
        );
        const inner = side * (path.width / 2 - 0.45);
        box(
          'pale promenade paving band',
          (a[0] + b[0]) / 2 + nx * inner,
          (a[1] + b[1]) / 2 + nz * inner,
          0.115,
          len,
          0.3,
          0.012,
          angle,
          band,
        );
      }
    }
  batchFacade(group);
}
