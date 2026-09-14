import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { palmGeometry } from './geometry/palm-geometry.ts';

// Modeled from the supplied King Street view: outfield landmarks rise behind
// the low service buildings, separate from the street-facing entrance signs.
export function buildOracleOutfield(parent: T.Group) {
  const root = new T.Group();
  root.name = 'Oracle Park outfield landmarks';
  parent.add(root);
  const textures: T.Texture[] = [];
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.8, side: T.DoubleSide });
  const steel = mat('#283f39'),
    bottleGreen = mat('#249a72'),
    cap = mat('#cf4630');
  const mesh = (group: T.Group, name: string, geometry: T.BufferGeometry, material: T.Material) => {
    const object = new T.Mesh(geometry, material);
    object.name = name;
    group.add(object);
    return object;
  };
  const beam = (
    group: T.Group,
    a: T.Vector3,
    b: T.Vector3,
    width: number,
    material: T.Material,
  ) => {
    const geometry = new T.CylinderGeometry(width, width, a.distanceTo(b), 6);
    geometry.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
    );
    geometry.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    mesh(group, 'outfield steel frame', geometry, material);
  };
  const label = (
    group: T.Group,
    name: string,
    text: string,
    w: number,
    h: number,
    y: number,
    z: number,
    background: string,
    foreground: string,
    font = 'bold 140px Georgia',
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = foreground;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(text, 512, 137, 960);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const object = mesh(
      group,
      name,
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide, toneMapped: false }),
    );
    object.position.set(0, y, z);
  };

  const bottle = new T.Group();
  bottle.name = 'Giant green outfield bottle';
  bottle.position.set(594, 5, 786);
  bottle.rotation.set(0, -Math.PI * 0.75, -0.28);
  root.add(bottle);
  // Contoured bottle ribs and hoops keep the recognizable open steel silhouette.
  const profile = [
    [0, 3.2],
    [1.5, 3.8],
    [5, 4.1],
    [10, 3.5],
    [14, 3.8],
    [17, 3.1],
    [20, 1.65],
    [24, 1.55],
  ];
  for (const [y, radius] of profile) {
    const hoop = new T.TorusGeometry(radius, 0.14, 6, 32);
    hoop.rotateX(Math.PI / 2);
    hoop.translate(0, y, 0);
    mesh(bottle, 'green bottle hoop', hoop, bottleGreen);
  }
  for (let rib = 0; rib < 16; rib++) {
    const angle = (rib * Math.PI) / 8;
    for (let i = 1; i < profile.length; i++) {
      const [ay, ar] = profile[i - 1],
        [by, br] = profile[i];
      beam(
        bottle,
        new T.Vector3(Math.cos(angle) * ar, ay, Math.sin(angle) * ar),
        new T.Vector3(Math.cos(angle) * br, by, Math.sin(angle) * br),
        0.12,
        bottleGreen,
      );
    }
  }
  const bottleCap = mesh(
    bottle,
    'red bottle cap',
    new T.CylinderGeometry(1.85, 1.85, 0.7, 24),
    cap,
  );
  bottleCap.position.y = 24.3;
  // Two green slide tubes visible inside the open frame.
  for (const offset of [-0.85, 0.85]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(offset, 19, 0),
      new T.Vector3(offset + 1, 14, 1),
      new T.Vector3(offset - 1, 9, -1),
      new T.Vector3(offset, 3, 0),
      new T.Vector3(offset, 0, 4),
    ]);
    mesh(bottle, 'bottle slide tube', new T.TubeGeometry(curve, 32, 0.5, 8, false), bottleGreen);
  }
  batchFacade(bottle);
  label(
    bottle,
    'bottle red label',
    'Coca-Cola',
    7.3,
    2.4,
    12.5,
    3.9,
    '#c73728',
    '#fff5df',
    'italic bold 150px Georgia',
  );

  const scoreboard = new T.Group();
  scoreboard.name = 'Giants outfield scoreboard';
  scoreboard.position.set(611, 0, 809);
  scoreboard.rotation.y = -Math.PI * 0.75;
  root.add(scoreboard);
  for (const x of [-12, 12]) {
    beam(scoreboard, new T.Vector3(x, 0, 0), new T.Vector3(x, 37, 0), 0.34, steel);
    for (let y = 5; y < 35; y += 5) {
      beam(scoreboard, new T.Vector3(x - 1.4, y, 0), new T.Vector3(x + 1.4, y + 5, 0), 0.12, steel);
    }
    const lights = mesh(
      scoreboard,
      'scoreboard floodlight rack',
      new T.BoxGeometry(3.6, 5, 0.6),
      steel,
    );
    lights.position.set(x, 36, 0);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 3; col++) {
        const lamp = mesh(
          scoreboard,
          'scoreboard lamp',
          new T.BoxGeometry(0.6, 0.65, 0.15),
          mat('#dfddbc'),
        );
        lamp.position.set(x - 1 + col, 34.2 + row * 1.1, 0.4);
      }
  }
  const board = mesh(scoreboard, 'dark scoreboard backing', new T.BoxGeometry(20, 16, 1), steel);
  board.position.y = 23;
  batchFacade(scoreboard);
  label(scoreboard, 'large orange GIANTS sign', 'GIANTS', 21, 5, 32, 0.6, '#203b32', '#f57932');
  label(
    scoreboard,
    'scoreboard city name',
    'SAN FRANCISCO',
    18,
    2,
    27.5,
    0.6,
    '#203b32',
    '#f4e6bd',
    'bold 86px Georgia',
  );
  label(
    scoreboard,
    'scoreboard innings',
    '1  2  3  4  5  6  7  8  9',
    18,
    2,
    23.5,
    0.6,
    '#142b27',
    '#e6d7aa',
    'bold 76px monospace',
  );
  label(
    scoreboard,
    'scoreboard team display',
    'SF   0  0  0  0  0  0',
    18,
    2,
    20,
    0.6,
    '#142b27',
    '#f3bc67',
    'bold 76px monospace',
  );

  const palms = new T.Group();
  palms.name = 'Outfield palm row';
  root.add(palms);
  const bark = mat('#8a8064'),
    leaves = ['#385a32', '#51733b', '#718747'].map(mat);
  for (let i = 0; i < 9; i++) {
    palmGeometry(
      597 + i * 4.1,
      702 + i * 8.2,
      17 + (i % 3) * 0.8,
      (geometry, material) => {
        geometry.deleteAttribute('uv');
        mesh(palms, 'outfield palm', geometry, material);
      },
      { bark, leaves },
    );
  }
  batchFacade(palms);
  return () => textures.forEach((texture) => texture.dispose());
}
