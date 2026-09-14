import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { buildingGeometry, type Building } from './geometry/building-geometry';
export const PEAR_TOWNSEND_ID = 143294965;

export function buildPearTownsend(scene: T.Scene, building: Building) {
  const root = new T.Group();
  root.name = 'Pear — 600 Townsend';
  scene.add(root);
  const a = building.points[6],
    b = building.points[1];
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  root.position.set(a[0], 0, a[1]);
  root.rotation.y = -angle;
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.85 });
  const brick = mat('#b47962'),
    brickTrim = mat('#a66b55'),
    cream = mat('#eee9d7'),
    pale = mat('#d4d4ce');
  const glass = new T.MeshStandardMaterial({ color: '#738d96', roughness: 0.22, metalness: 0.2 });
  const dark = mat('#455253'),
    paving = mat('#bfb9a9'),
    soil = mat('#7b7463'),
    bark = mat('#8b8272');
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
    root.add(mesh);
    return mesh;
  };
  // Keep the mapped side walls and courtyard; replace only the Townsend-facing elevation.
  for (let i = 1; i < building.points.length; i++) {
    if (i >= 2 && i <= 6) continue;
    const geometry = buildingGeometry({
      ...building,
      height: 14,
      points: [building.points[i - 1], building.points[i]],
    });
    const wall = new T.Mesh(geometry.walls, brick);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    geometry.roof.dispose();
  }
  const roofGeometry = buildingGeometry({ ...building, height: 14 });
  roofGeometry.walls.dispose();
  scene.add(new T.Mesh(roofGeometry.roof, dark));
  const entrance = length * 0.65,
    opening = 13.8;
  const leftEnd = entrance - opening / 2,
    rightStart = entrance + opening / 2;
  box('Left brick wing', leftEnd / 2, 7, -0.35, leftEnd, 14, 0.7, brick);
  box('Right brick wing', (rightStart + length) / 2, 7, -0.35, length - rightStart, 14, 0.7, brick);
  box('Recessed pale entrance', entrance, 6.6, -2.1, opening, 13.2, 0.5, pale);
  // Fine mortar courses and alternating short joints supply brick texture at driving distance.
  for (const [start, end] of [
    [0, leftEnd],
    [rightStart, length],
  ]) {
    for (let y = 0.25; y < 14; y += 0.19) {
      box('Brick mortar course', (start + end) / 2, y, 0.009, end - start, 0.015, 0.014, cream);
    }
    for (const y of [5.2, 10.8, 13.45, 13.9])
      box('Brick cornice', (start + end) / 2, y, 0.15, end - start + 0.15, 0.14, 0.35, brickTrim);
    box('Pale parapet coping', (start + end) / 2, 14.12, 0, end - start + 0.25, 0.2, 0.9, cream);
    for (let x = start + 0.3; x < end; x += 0.52)
      box('Cornice dentil', x, 13.6, 0.25, 0.23, 0.18, 0.22, brickTrim);
  }
  const arch = (x: number, bottom: number, w: number, h: number, z = 0.11) => {
    const shape = new T.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h - w / 2);
    shape.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
    shape.lineTo(-w / 2, 0);
    const pane = new T.Mesh(new T.ShapeGeometry(shape), glass);
    pane.name = 'Arched window';
    pane.position.set(x, bottom, z);
    root.add(pane);
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i * Math.PI) / 24;
      points.push(
        new T.Vector3(
          x + Math.cos(t) * (w / 2 + 0.07),
          bottom + h - w / 2 + Math.sin(t) * (w / 2 + 0.07),
          z + 0.03,
        ),
      );
    }
    const rim = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 24, 0.07, 6, false),
      cream,
    );
    rim.name = 'Arch surround';
    root.add(rim);
    for (const side of [-1, 1])
      box(
        'Arch jamb',
        x + (side * w) / 2,
        bottom + (h - w / 2) / 2,
        z + 0.03,
        0.08,
        h - w / 2,
        0.08,
        cream,
      );
    box('Arch transom', x, bottom + h - w / 2, z + 0.04, w, 0.07, 0.08, cream);
    box('Arch center mullion', x, bottom + h / 2, z + 0.04, 0.065, h, 0.08, cream);
  };
  const window = (x: number, y: number, w: number, h: number) => {
    box('Window surround', x, y, 0.1, w + 0.24, h + 0.24, 0.18, brickTrim);
    box('Tall factory glazing', x, y, 0.22, w, h, 0.12, glass);
    for (let k = 0; k <= 4; k++)
      box('White window mullion', x - w / 2 + (k * w) / 4, y, 0.32, 0.055, h, 0.06, cream);
    for (let k = 0; k <= 4; k++)
      box('White window transom', x, y - h / 2 + (k * h) / 4, 0.32, w, 0.055, 0.06, cream);
  };
  const bays = Math.max(4, Math.round(leftEnd / 5.8)),
    step = leftEnd / bays;
  for (let i = 0; i < bays; i++) {
    const x = (i + 0.5) * step;
    arch(x, 0.65, 2.7, 4.6);
    window(x, 7.75, 2.35, 3.6);
    const circle = new T.Mesh(new T.CircleGeometry(1.05, 32), glass);
    circle.name = 'Round upper window';
    circle.position.set(x, 11.68, 0.12);
    root.add(circle);
    const rim = new T.Mesh(new T.TorusGeometry(1.13, 0.075, 8, 32), cream);
    rim.position.set(x, 11.68, 0.19);
    rim.name = 'Round window surround';
    root.add(rim);
    box('Round window mullion', x, 11.68, 0.21, 0.06, 2.05, 0.06, cream);
    box('Round window crossbar', x, 11.5, 0.21, 2, 0.06, 0.06, cream);
    box('Juliet balcony', x, 6.9, 0.52, 2.55, 0.075, 0.65, cream);
    box('Juliet railing', x, 7.75, 0.85, 2.55, 0.07, 0.07, cream);
    for (let k = -1.2; k <= 1.2; k += 0.4)
      box('Juliet baluster', x + k, 7.32, 0.85, 0.045, 0.85, 0.045, cream);
  }
  const rightBays = 4,
    rightStep = (length - rightStart) / rightBays;
  for (let i = 0; i < rightBays; i++) {
    const x = rightStart + (i + 0.5) * rightStep;
    arch(x, i === 2 ? 0.18 : 2.1, 2.7, i === 2 ? 5.05 : 3.1);
    window(x, 7.6, 2.8, 3.6);
    window(x, 11.7, 2.8, 2.3);
  }
  for (let x = entrance - opening / 2 + 0.2; x < entrance + opening / 2; x += 1.1)
    box('Entrance panel joint', x, 6.5, -1.82, 0.018, 12.8, 0.018, dark);
  for (let y = 0.4; y < 13; y += 1.1)
    box('Entrance horizontal panel joint', entrance, y, -1.82, opening, 0.018, 0.018, dark);
  arch(entrance, 0.2, 6.5, 10.5, -1.65);
  for (let i = -1; i <= 1; i++) {
    box('Glass entry door', entrance + i * 1.5, 1.7, -1.45, 1.4, 3, 0.1, glass);
    box('Entry door frame', entrance + i * 1.5 - 0.73, 1.7, -1.33, 0.07, 3.1, 0.12, cream);
  }
  box('Entrance canopy', entrance, 3.5, -0.9, 7.3, 0.2, 2.4, cream);
  const logo = new T.TextureLoader().load('/brands/pear-sign.svg');
  logo.colorSpace = T.SRGBColorSpace;
  // Unlit print keeps the dark green mark legible even on the shaded side of the street.
  const signMaterial = new T.MeshBasicMaterial({
    map: logo,
    transparent: true,
    side: T.DoubleSide,
    toneMapped: false,
  });
  const signWhite = new T.MeshBasicMaterial({ color: '#fffef5', toneMapped: false });
  box('Pear blade sign backing', leftEnd - 1.3, 12, 1.7, 0.18, 3, 3.8, signWhite);
  for (const side of [-1, 1]) {
    const sign = new T.Mesh(new T.PlaneGeometry(3.4, 2.64), signMaterial);
    sign.name = 'Pear projecting logo';
    sign.rotation.y = (side * Math.PI) / 2;
    sign.position.set(leftEnd - 1.3 + side * 0.11, 12, 1.7);
    root.add(sign);
  }
  box('Pear entrance logo backing', entrance - 4.8, 2.3, -1.58, 3, 2.5, 0.12, signWhite);
  const entrySign = new T.Mesh(new T.PlaneGeometry(2.7, 2.1), signMaterial);
  entrySign.name = 'Pear entrance logo';
  entrySign.position.set(entrance - 4.8, 2.3, -1.49);
  root.add(entrySign);
  box('Townsend sidewalk', length / 2, 0.14, 2.4, length + 1, 0.25, 4.8, paving);
  for (let x = 0; x < length; x += 2.1) box('Paving joint', x, 0.27, 2.4, 0.02, 0.01, 4.6, dark);
  box('Red curb', length / 2, 0.2, 4.85, length, 0.25, 0.18, mat('#ba5e53'));
  const branch = (a: T.Vector3, b: T.Vector3, r: number) => {
    const delta = b.clone().sub(a),
      mesh = new T.Mesh(new T.CylinderGeometry(r * 0.55, r, delta.length(), 7), bark);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    mesh.name = 'Townsend street tree';
    root.add(mesh);
  };
  for (let x = 5; x < length; x += 11) {
    box('Tree well', x, 0.275, 3.6, 1.6, 0.02, 1.6, soil);
    branch(new T.Vector3(x, 0.3, 3.6), new T.Vector3(x + 0.12, 5.7, 3.6), 0.18);
    for (let j = 0; j < 5; j++) {
      const t = j * 2.4,
        end = new T.Vector3(x + Math.cos(t) * 1.6, 6.2 + j * 0.25, 3.6 + Math.sin(t) * 1.3);
      branch(new T.Vector3(x, 3.5 + j * 0.3, 3.6), end, 0.075);
      branch(
        end,
        new T.Vector3(end.x + Math.cos(t + 0.7) * 0.7, end.y + 1, end.z + Math.sin(t + 0.7) * 0.7),
        0.027,
      );
    }
  }
  batchFacade(root);
  return () => logo.dispose();
}
