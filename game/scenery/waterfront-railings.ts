import * as T from 'three';
import type { MapData } from '../types';
import { batchFacade } from './geometry/batch-facade.ts';

// Pale concrete piers and horizontal metal rails follow the retained water's edge.
export function buildWaterfrontRailings(scene: T.Scene, d: MapData) {
  const group = new T.Group();
  group.name = 'Brannan Wharf waterfront railings';
  scene.add(group);
  const concrete = new T.MeshStandardMaterial({ color: '#c5c1ac', roughness: 0.94 });
  const rail = new T.MeshStandardMaterial({ color: '#a2b1aa', roughness: 0.5, metalness: 0.45 });
  const black = new T.MeshStandardMaterial({ color: '#252d2b', roughness: 0.85 });
  const ivory = new T.MeshStandardMaterial({ color: '#e0decb', roughness: 0.9 });
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
    angle = 0,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, depth), m);
    mesh.name = name;
    mesh.rotation.y = -angle;
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  const posts: T.Vector2[] = [];
  for (const coast of d.coast || [])
    for (let i = 1; i < coast.length; i++) {
      const a = coast[i - 1],
        b = coast[i];
      // The promenade around Brannan Wharf; the long industrial pier stays open below.
      if (![a, b].every((p) => p[0] >= 620 && p[0] <= 675 && p[1] >= 55 && p[1] <= 360)) continue;
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 1) continue;
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const bays = Math.ceil(length / 7),
        step = length / bays;
      box(
        'low concrete seawall',
        (a[0] + b[0]) / 2,
        0.23,
        (a[1] + b[1]) / 2,
        length,
        0.4,
        0.45,
        concrete,
        angle,
      );
      for (let j = 0; j <= bays; j++) {
        const x = a[0] + ((b[0] - a[0]) * j) / bays,
          z = a[1] + ((b[1] - a[1]) * j) / bays;
        if (posts.some((p) => p.distanceTo(new T.Vector2(x, z)) < 0.6)) continue;
        posts.push(new T.Vector2(x, z));
        box('square concrete railing pier', x, 0.82, z, 0.52, 1.45, 0.52, concrete, angle);
        box('concrete pier cap', x, 1.56, z, 0.61, 0.12, 0.61, ivory, angle);
      }
      for (let j = 0; j < bays; j++) {
        const x = a[0] + ((b[0] - a[0]) * (j + 0.5)) / bays,
          z = a[1] + ((b[1] - a[1]) * (j + 0.5)) / bays;
        for (const y of [0.55, 0.76, 0.97, 1.18, 1.39])
          box('horizontal waterfront rail', x, y, z, step - 0.38, 0.045, 0.055, rail, angle);
        box('intermediate railing upright', x, 0.95, z, 0.045, 1, 0.055, rail, angle);
      }
    }
  // Alternating bands on the slim square promenade marker in the Pier 38 view.
  const x = 632.5,
    z = 314;
  box('striped marker concrete foot', x, 0.15, z, 0.8, 0.3, 0.8, concrete);
  for (let i = 0; i < 14; i++)
    box(
      'black and ivory marker band',
      x,
      0.3 + (i + 0.5) * 0.4,
      z,
      0.36,
      0.4,
      0.36,
      i % 2 === 0 ? ivory : black,
    );
  box('striped marker cap', x, 5.92, z, 0.38, 0.05, 0.38, black);
  batchFacade(group);
}
