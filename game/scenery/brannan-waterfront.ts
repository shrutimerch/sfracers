import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';

// Photo-based estimates from the supplied May 2025 view at 2 Brannan Street.
// Keep the central bay view open: the low pier building sits to its south/right.
export function buildBrannanWaterfront(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Brannan waterfront pillars and white pier building';
  scene.add(group);
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.9 });
  const red = material('#ad493b'),
    gold = material('#c6b270'),
    dark = material('#384a46');
  const concrete = material('#b5b3a4');
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
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    m: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, h, 12), m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  for (const z of [115, 139, 163]) {
    const x = 646 + (z - 139) * 0.075;
    box('pillar concrete foot', x, 0.15, z, 1.15, 0.3, 1.15, concrete);
    cylinder('red waterfront pillar', x, 2.85, z, 0.37, 5.4, red);
    cylinder('dark pillar crown', x, 5.08, z, 0.385, 0.94, dark);
    for (const y of [4.7, 4.96, 5.22, 5.48])
      cylinder('gold pillar band', x, y, z, 0.4, 0.075, gold);
    cylinder('pillar cap', x, 5.58, z, 0.4, 0.1, gold);
  }
  batchFacade(group);
}
