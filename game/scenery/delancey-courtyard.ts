import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';

/** Photo-estimated entrance in the gap between footprints 125401320 and 125401313. */
export function buildDelanceyCourtyard(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Delancey Embarcadero gated courtyard';
  group.position.set(578, 0, 263.7);
  // Local +Z faces the waterfront; the courtyard recedes west into the block.
  group.rotation.y = Math.PI / 2 - 0.065;
  scene.add(group);
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.9 });
  const terra = mat('#ad7965'),
    sand = mat('#b5a386'),
    cream = mat('#e0d7bc');
  const iron = mat('#39443f'),
    glass = mat('#4f625e'),
    tile = mat('#9c5f44');
  const foliage = mat('#415b32'),
    soil = mat('#5e4a34');
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
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const sphere = (
    name: string,
    x: number,
    y: number,
    z: number,
    radius: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.SphereGeometry(radius, 12, 8), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  // Tall paired bays frame the opening, with warmer recessed wings behind them.
  for (const side of [-1, 1]) {
    box('sand stucco entrance bay', side * 7.1, 6, -0.6, 4.7, 12, 1.2, sand);
    box('terracotta courtyard side wall', side * 5.2, 5.8, -10, 0.65, 11.6, 18.8, terra);
    box('recessed terracotta entrance pier', side * 4.5, 5.8, -2, 0.7, 11.6, 3.5, terra);
    for (const y of [2, 5.4, 9.1]) {
      const height = y === 9.1 ? 3.6 : 2.3;
      box('cream entrance window surround', side * 7.1, y, 0.07, 3.3, height + 0.18, 0.14, cream);
      box('entrance window glazing', side * 7.1, y, 0.17, 3.08, height, 0.08, glass);
      for (const offset of [-0.8, 0, 0.8])
        box('entrance window mullion', side * 7.1 + offset, y, 0.24, 0.065, height, 0.06, cream);
      box('entrance window transom', side * 7.1, y + 0.5, 0.24, 3.08, 0.07, 0.06, cream);
      box(
        'projecting cream window sill',
        side * 7.1,
        y - height / 2 - 0.15,
        0.28,
        3.5,
        0.18,
        0.6,
        cream,
      );
      for (const dx of [-1.25, 1.25]) {
        const bracket = box(
          'window sill bracket',
          side * 7.1 + dx,
          y - height / 2 - 0.45,
          0.2,
          0.16,
          0.6,
          0.32,
          cream,
        );
        bracket.rotation.x = -0.2;
      }
    }
    box('entrance bay cornice', side * 7.1, 12, -0.25, 5, 0.22, 2, cream);
    box('entrance bay roof', side * 7.1, 12.2, -0.6, 5.1, 0.16, 2.3, iron);
    for (let x = 5.3; x < 9.4; x += 0.85)
      box('cream roof corbel', side * x, 11.6, 0.12, 0.18, 0.65, 0.65, cream);
    // Windows facing into the courtyard make its depth visible through the gate.
    for (const z of [-5, -10, -15])
      for (const y of [2.8, 6.2, 9.6]) {
        box('courtyard interior window trim', side * 4.83, y, z, 0.12, 2.2, 1.5, cream);
        box('courtyard interior window', side * 4.75, y, z, 0.08, 2, 1.3, glass);
      }
  }
  // Solid upper connector with a curved underside; the passage stays open beneath it.
  const archShape = new T.Shape();
  archShape.moveTo(-4.9, 7.4);
  archShape.quadraticCurveTo(0, 9.2, 4.9, 7.4);
  archShape.lineTo(4.9, 10.1);
  archShape.lineTo(-4.9, 10.1);
  archShape.closePath();
  const archGeometry = new T.ExtrudeGeometry(archShape, {
    depth: 2.5,
    bevelEnabled: false,
    curveSegments: 20,
  });
  // Match the standard box attributes used by batchFacade.
  const arch = new T.Mesh(archGeometry, terra);
  arch.name = 'arched overhead courtyard connector';
  arch.position.z = -7;
  group.add(arch);
  box('bridge coping', 0, 10.15, -5.75, 9.9, 0.14, 2.7, cream);
  for (let x = -1.5; x <= 1.5; x += 0.18)
    box('bridge parapet railing', x, 10.65, -4.42, 0.04, 0.9, 0.06, iron);
  box('bridge parapet handrail', 0, 11.1, -4.42, 3.1, 0.06, 0.09, iron);

  box('terracotta courtyard paving', 0, 0.18, -10, 9.5, 0.22, 20, tile);
  box('courtyard central path', 0, 0.31, -10, 2.4, 0.05, 19.6, cream);
  box('courtyard back wall', 0, 2.6, -20.2, 9.7, 5.2, 0.5, sand);
  box('courtyard rear cornice', 0, 5.2, -20.2, 10, 0.2, 0.8, cream);
  // A small tiered fountain is visible at the far end of the central path.
  for (const [radius, y, height] of [
    [1.15, 0.55, 0.3],
    [0.65, 1.35, 0.16],
    [0.38, 1.9, 0.13],
  ]) {
    const bowl = new T.Mesh(new T.CylinderGeometry(radius, radius * 0.7, height, 20), cream);
    bowl.position.set(0, y, -16.5);
    bowl.name = 'courtyard fountain bowl';
    group.add(bowl);
  }
  box('fountain stem', 0, 1.1, -16.5, 0.15, 1.7, 0.15, iron);
  sphere('fountain finial', 0, 2.1, -16.5, 0.12, iron);
  for (const side of [-1, 1]) {
    for (const z of [-4, -10, -17]) {
      box('raised courtyard planter', side * 3.5, 0.6, z, 2.1, 0.8, 2.6, terra);
      box('planter soil', side * 3.5, 1.02, z, 1.8, 0.06, 2.3, soil);
      box('courtyard tree trunk', side * 3.5, 1.9, z, 0.15, 1.8, 0.15, soil);
      sphere('courtyard tree canopy', side * 3.5, 3.05, z, 1.15, foliage).scale.set(0.8, 1.2, 0.8);
    }
    box('low entry boundary wall', side * 3, 0.58, 0.1, 3.3, 1.16, 0.5, terra);
    box('entry wall coping', side * 3, 1.19, 0.1, 3.4, 0.12, 0.62, tile);
    for (const x of [1.3, 4.8]) {
      box('terracotta gate pillar', side * x, 1.6, 0.1, 0.45, 3.2, 0.55, terra);
      box('gate pillar cap', side * x, 3.22, 0.1, 0.57, 0.14, 0.66, cream);
    }
    sphere('stone gate globe', side * 1.3, 3.48, 0.1, 0.25, cream);
    for (let x = 1.6; x < 4.6; x += 0.18)
      box('side fence iron picket', side * x, 2.05, 0.13, 0.045, 1.65, 0.055, iron);
    for (const y of [1.45, 2.5, 2.85])
      box('side fence horizontal rail', side * 3, y, 0.13, 3.2, 0.065, 0.07, iron);
  }
  for (let x = -1.14; x <= 1.14; x += 0.14)
    box('closed gate vertical bar', x, 1.5, 0.13, 0.045, 2.5, 0.06, iron);
  for (const y of [0.28, 0.55, 2.5, 2.76])
    box('closed gate horizontal rail', 0, y, 0.13, 2.4, 0.07, 0.07, iron);
  box('double gate center seam', 0, 1.5, 0.16, 0.07, 2.6, 0.08, iron);
  const medallion = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.08, 20), mat('#97896b'));
  medallion.rotation.x = Math.PI / 2;
  medallion.position.set(0, 1.55, 0.24);
  medallion.name = 'circular gate medallion';
  group.add(medallion);
  batchFacade(group);
}
