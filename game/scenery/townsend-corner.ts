import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';

// South Beach Marina Apartments entrance: estimated from the supplied January 2025 photo.
export function buildTownsendCorner(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Townsend and Embarcadero — apartment entrance';
  scene.add(group);
  const textures: T.Texture[] = [];
  const material = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.94, side: T.DoubleSide });
  const stone = material('#b6b7a9'),
    cream = material('#deddd2'),
    pavement = material('#aaa69b');
  const grass = material('#667b43'),
    hedge = material('#405331'),
    dark = material('#34423f'),
    bark = material('#746e62');
  const rust = material('#94634a'),
    roof = material('#b9bdb1');
  const add = (g: T.BufferGeometry, m: T.Material, name: string) => {
    const mesh = new T.Mesh(g, m);
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
    name: string,
    angle = 0,
  ) => {
    const mesh = add(new T.BoxGeometry(w, h, depth), m, name);
    mesh.position.set(x, y, z);
    mesh.rotation.y = angle;
    return mesh;
  };
  const slab = (points: number[][], y: number, m: T.Material, name: string) => {
    const g = new T.ShapeGeometry(new T.Shape(points.map(([x, z]) => new T.Vector2(x, -z))));
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    return add(g, m, name);
  };
  const cylinder = (
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    m: T.Material,
    name: string,
  ) => {
    const mesh = add(new T.CylinderGeometry(radius, radius, height, 48), m, name);
    mesh.position.set(x, y, z);
    return mesh;
  };
  // Curved plaza edge follows the setback inside both sidewalks.
  const outline = [
    [523, 453],
    [562.5, 413],
    [565.5, 425],
    [567, 442],
    [566.8, 448],
    [565.5, 451.4],
    [562.8, 454],
    [559, 455.6],
    [551, 456],
    [537, 455.5],
  ];
  slab(outline, 0.21, pavement, 'Curved corner plaza');
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    box(
      (a[0] + b[0]) / 2,
      0.18,
      (a[1] + b[1]) / 2,
      Math.hypot(b[0] - a[0], b[1] - a[1]),
      0.26,
      0.24,
      stone,
      'Corner curb',
      -angle,
    );
  }
  slab(
    [
      [532, 444],
      [549, 427],
      [556, 430],
      [545, 445],
    ],
    0.24,
    grass,
    'West lawn',
  );
  slab(
    [
      [554, 424],
      [561.5, 416.5],
      [563, 434],
      [560, 440],
      [552, 435],
    ],
    0.24,
    grass,
    'Embarcadero lawn',
  );
  // Low circular concrete planter, rather than a freestanding sign on bare asphalt.
  cylinder(554, 0.5, 447, 4.3, 0.58, stone, 'Circular concrete planter');
  cylinder(554, 0.81, 447, 4.38, 0.13, cream, 'Planter rim');
  cylinder(554, 1.03, 447, 3.93, 0.45, hedge, 'Circular clipped hedge');
  for (const x of [-2.35, 2.35]) {
    const pos = new T.Vector3(x, 1.85, 0).applyAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 4);
    box(554 + pos.x, pos.y, 447 + pos.z, 0.16, 1.65, 0.16, cream, 'White signpost');
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#eeeee6';
  ctx.fillRect(0, 0, 1200, 240);
  ctx.fillStyle = '#52697a';
  ctx.textAlign = 'center';
  ctx.font = '600 47px sans-serif';
  ctx.fillText('SOUTH BEACH MARINA APARTMENTS', 600, 102, 1120);
  ctx.strokeStyle = '#6c8a9b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 410; x <= 790; x += 5) {
    const y = 154 + Math.sin((x - 410) / 25) * 8;
    if (x === 410) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  textures.push(texture);
  const sign = add(
    new T.PlaneGeometry(4.5, 0.9),
    new T.MeshStandardMaterial({ map: texture, side: T.DoubleSide }),
    'South Beach Marina Apartments sign',
  );
  sign.position.set(554, 2, 447);
  sign.rotation.y = Math.PI / 4;
  // Covered ground-floor arcade along the mapped diagonal apartment frontage.
  const a = [520.65, 450.89],
    b = [563.54, 407.61];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(angle),
    nz = Math.cos(angle);
  for (let u = 2; u < length - 2; u += 4.5) {
    const x = a[0] + Math.cos(angle) * u,
      z = a[1] + Math.sin(angle) * u;
    box(x + nx * 0.3, 1.8, z + nz * 0.3, 4.1, 3.2, 0.12, dark, 'Recessed arcade glazing', -angle);
    cylinder(x + nx * 1.6, 1.95, z + nz * 1.6, 0.22, 3.5, cream, 'Arcade column');
    box(x + nx, 3.85, z + nz, 4.6, 0.3, 2.8, stone, 'Arcade canopy', -angle);
  }
  for (const [x, z] of [
    [535, 434],
    [554, 415],
  ]) {
    const cap = add(new T.ConeGeometry(7.8, 2, 4), roof, 'Pale hipped roof');
    cap.position.set(x, 14, z);
    cap.rotation.y = Math.PI / 4 - angle;
  }
  // Bare, finely branching winter trees, with a few rust-colored leaves remaining.
  let seed = 2391;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const branch = (start: T.Vector3, end: T.Vector3, radius: number, depth: number) => {
    const delta = end.clone().sub(start);
    const g = new T.CylinderGeometry(radius * 0.58, radius, delta.length(), 5);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.clone().normalize()),
    );
    g.translate(...start.clone().add(end).multiplyScalar(0.5).toArray());
    add(g, bark, 'Winter tree branch');
    if (!depth) {
      if (random() < 0.32) {
        const leaf = add(new T.IcosahedronGeometry(0.11, 0), rust, 'Remaining winter leaf');
        leaf.position.copy(end);
        leaf.scale.y = 0.45;
      }
      return;
    }
    for (let i = 0; i < 3; i++) {
      const az = random() * Math.PI * 2;
      const reach = delta.length() * (0.38 + random() * 0.3);
      const tip = end
        .clone()
        .add(
          new T.Vector3(
            Math.cos(az) * reach,
            delta.length() * (0.4 + random() * 0.22),
            Math.sin(az) * reach,
          ),
        );
      branch(end, tip, radius * 0.5, depth - 1);
    }
  };
  for (const [x, z] of [
    [538, 447],
    [561, 449],
    [564, 436],
    [559, 425],
    [550, 432],
    [532, 450],
  ]) {
    const start = new T.Vector3(x, 0.23, z);
    branch(start, new T.Vector3(x + 0.2, 3.5 + random(), z - 0.1), 0.26, 4);
  }
  for (const [x, z] of [
    [545, 454],
    [548, 455],
    [565, 446],
  ])
    cylinder(x, 0.8, z, 0.24, 1.15, cream, 'Concrete bollard');
  box(565.2, 0.85, 449, 0.9, 1.25, 0.8, stone, 'Corner litter bin');
  box(565.2, 1.48, 449, 0.5, 0.15, 0.45, dark, 'Litter bin opening');
  batchFacade(group);
  return () => textures.forEach((t) => t.dispose());
}
