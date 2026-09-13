import * as T from 'three';
import type { Building } from './geometry/building-geometry';
import { parkFacingFacade } from './cafe-centro.ts';
import { batchFacade } from './geometry/batch-facade.ts';

export const BLUE_BOTTLE_ID = 112926339;
export const BLUE_BOTTLE_HEIGHT = 13;

export function buildBlueBottle(scene: T.Scene, building: Building) {
  const front = parkFacingFacade(building),
    width = front.width;
  const group = new T.Group();
  group.name = 'Blue Bottle — Two South Park';
  group.userData.buildingId = BLUE_BOTTLE_ID;
  group.position.set(front.x, 0, front.z);
  group.rotation.y = front.angle;
  const textures: T.Texture[] = [];
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.85 });
  const brick = mat('#9b6043'),
    pale = mat('#c1bdac'),
    maroon = mat('#58352e'),
    dark = mat('#292e2f'),
    glass = mat('#aab6b5'),
    steel = mat('#494a43');
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  // Brick courses wrap around broad piers; alternating vertical joints avoid a tiled grid.
  box('red brick frontage', 0, 6.5, 0.035, width, 13, 0.09, brick);
  for (let y = 0.12, row = 0; y < 12.9; y += 0.17, row++) {
    box('mortar course', 0, y, 0.09, width, 0.012, 0.01, pale);
    for (let x = -width / 2 + (row % 2) * 0.32; x < width / 2; x += 0.64)
      box('brick joint', x, y + 0.08, 0.09, 0.012, 0.15, 0.01, pale);
  }
  const bays = 6,
    spacing = width / bays;
  for (let i = 0; i < bays; i++) {
    const x = -width / 2 + (i + 0.5) * spacing,
      w = spacing * 0.81;
    box('dark storefront plinth', x, 0.75, 0.17, w, 1.5, 0.22, dark);
    box('maroon storefront frame', x, 2.65, 0.18, w, 3.1, 0.23, maroon);
    box('frosted storefront glazing', x, 2.52, 0.32, w - 0.2, 2.35, 0.045, glass);
    box('storefront transom', x, 4.02, 0.31, w - 0.16, 0.65, 0.06, glass);
    for (let j = 1; j < 5; j++)
      box('transom mullion', x - w / 2 + (j * w) / 5, 4.02, 0.36, 0.045, 0.65, 0.05, maroon);
    for (const y of [6.65, 10.15]) {
      box('factory window frame', x, y, 0.16, w, 2.8, 0.18, maroon);
      box('factory window glass', x, y, 0.28, w - 0.14, 2.62, 0.04, glass);
      for (let j = 1; j < 6; j++)
        box(
          'factory vertical mullion',
          x - w / 2 + (j * w) / 6,
          y,
          0.32,
          0.035,
          2.65,
          0.06,
          maroon,
        );
      for (let j = 1; j < 5; j++)
        box(
          'factory horizontal mullion',
          x,
          y - 1.32 + (j * 2.64) / 5,
          0.32,
          w - 0.15,
          0.035,
          0.06,
          maroon,
        );
      box('concrete window lintel', x, y + 1.52, 0.15, w + 0.17, 0.25, 0.22, pale);
      box('window sill', x, y - 1.48, 0.19, w + 0.14, 0.14, 0.3, pale);
    }
  }
  // Recessed entrance at the left bay, with dark double doors and brass address lettering.
  const entry = -width / 2 + spacing * 0.5;
  box('double entrance doors', entry, 1.8, 0.35, spacing * 0.8, 3.55, 0.09, dark);
  for (const dx of [-spacing * 0.18, spacing * 0.18]) {
    box('door upper glazing', entry + dx, 2.5, 0.42, spacing * 0.29, 1.35, 0.04, glass);
    box('door handle', entry + dx * 0.25, 1.6, 0.47, 0.035, 0.4, 0.06, pale);
  }
  const text = (
    name: string,
    words: string,
    x: number,
    y: number,
    w: number,
    bg: string,
    fg: string,
  ) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = fg;
    ctx.font = 'bold 70px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words, 512, 66, 980);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    textures.push(t);
    const m = new T.Mesh(new T.PlaneGeometry(w, w / 8), new T.MeshStandardMaterial({ map: t }));
    m.name = name;
    m.position.set(x, y, 0.48);
    group.add(m);
  };
  text(
    'Two South Park entrance lettering',
    'TWO SOUTH PARK',
    entry,
    3.64,
    spacing * 0.77,
    '#292e2f',
    '#c5b78c',
  );
  text(
    'Blue Bottle storefront lettering',
    'BLUE BOTTLE COFFEE',
    entry,
    0.65,
    spacing * 0.7,
    '#292e2f',
    '#c8d7d4',
  );
  box('light parapet cap', 0, 12.9, 0.13, width + 0.15, 0.22, 0.36, pale);
  // The reference has a dark metal fire escape over the entrance bay.
  for (const y of [5.1, 8.5, 11.9]) {
    box('fire escape landing', entry, y, 0.8, spacing * 0.83, 0.07, 1.45, steel);
    box('fire escape rail', entry, y + 0.85, 1.49, spacing * 0.83, 0.045, 0.045, steel);
    for (let x = entry - spacing * 0.4; x <= entry + spacing * 0.4; x += 0.22)
      box('fire escape baluster', x, y + 0.45, 1.49, 0.025, 0.85, 0.025, steel);
    if (y < 11) {
      for (let step = 0; step < 13; step++)
        box(
          'fire escape stair',
          entry - spacing * 0.3 + (step * spacing * 0.6) / 12,
          y + (step * 3.4) / 13,
          0.9,
          0.35,
          0.045,
          0.7,
          steel,
        );
    }
  }
  const poleX = width * 0.35;
  const pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.05, 4.4, 8), steel);
  pole.name = 'roof flagpole';
  pole.position.set(poleX, 15.05, -0.2);
  group.add(pole);
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#aa303a' : '#eeeade';
    ctx.fillRect(0, (i * 400) / 13, 760, 400 / 13 + 1);
  }
  ctx.fillStyle = '#253f68';
  ctx.fillRect(0, 0, 304, (400 * 7) / 13);
  ctx.fillStyle = '#f5f1e7';
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < (row % 2 === 0 ? 6 : 5); col++) {
      const x = ((col + 1 + (row % 2) * 0.5) * 304) / 7,
        y = ((row + 1) * 400 * 7) / 13 / 10;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          r = k % 2 === 0 ? 7 : 3;
        const px = x + Math.cos(a) * r,
          py = y + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  const flagTexture = new T.CanvasTexture(canvas);
  flagTexture.colorSpace = T.SRGBColorSpace;
  textures.push(flagTexture);
  const flagGeometry = new T.PlaneGeometry(2.66, 1.4, 20, 10);
  const position = flagGeometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const u = (position.getX(i) + 1.33) / 2.66;
    position.setZ(i, Math.sin(u * Math.PI * 3 + position.getY(i) * 1.8) * 0.17 * u);
  }
  flagGeometry.computeVertexNormals();
  const flag = new T.Mesh(
    flagGeometry,
    new T.MeshStandardMaterial({ map: flagTexture, side: T.DoubleSide, roughness: 0.85 }),
  );
  flag.name = 'American flag — 13 stripes and 50 stars';
  flag.userData.stripes = 13;
  flag.userData.stars = 50;
  flag.position.set(poleX + 1.33, 16.32, -0.2);
  group.add(flag);
  batchFacade(group);
  scene.add(group);
  return () => textures.forEach((t) => t.dispose());
}
