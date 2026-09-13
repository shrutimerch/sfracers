import * as T from 'three';
import type { Building } from './geometry/building-geometry';
import { batchFacade } from './geometry/batch-facade.ts';

export const DELANCEY_RESTAURANT_ID = 125401316;
export const DELANCEY_PATIO_ID = 125401311;

// Matched to the supplied May 2025 view at 160 Brannan: terracotta stucco,
// forest-green / cream awning, burgundy doors and brick-and-glass patio enclosure.
export function buildDelanceyStreet(scene: T.Scene, building: Building) {
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.88 });
  const green = material('#245f50'),
    cream = material('#dfd5b7');
  const iron = material('#273b37'),
    burgundy = material('#593133');
  const windowGlass = material('#455653'),
    shadow = material('#423a32');
  const brick = material('#9b5845'),
    mortar = material('#bd9d80');
  const patioGlass = new T.MeshStandardMaterial({
    color: '#b4d0c9',
    transparent: true,
    opacity: 0.22,
    roughness: 0.15,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const textures: T.Texture[] = [];
  const cx = building.points.reduce((n, p) => n + p[0], 0) / building.points.length;
  const cz = building.points.reduce((n, p) => n + p[1], 0) / building.points.length;
  const box = (
    group: T.Group,
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
  for (let i = 1; i < building.points.length; i++) {
    const a = building.points[i - 1],
      b = building.points[i];
    const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (width < 7) continue;
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]) / width,
      nz = (b[0] - a[0]) / width;
    if ((mx - cx) * nx + (mz - cz) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    const front = new T.Group();
    front.name = 'Delancey Street restaurant facade';
    front.position.set(mx, 0, mz);
    front.rotation.y = Math.atan2(nx, nz);
    scene.add(front);
    const bays = Math.max(1, Math.round(width / 4.5)),
      step = width / bays;
    for (let j = 0; j < bays; j++) {
      const x = -width / 2 + (j + 0.5) * step,
        w = step * 0.75;
      box(front, 'cream upper window surround', x, 6.8, 0.12, w + 0.18, 3.05, 0.18, cream);
      box(front, 'upper window', x, 6.8, 0.24, w, 2.85, 0.1, windowGlass);
      box(front, 'upper mullion', x, 6.8, 0.32, 0.07, 2.85, 0.06, cream);
      box(front, 'upper transom', x, 6.3, 0.32, w, 0.065, 0.06, cream);
      box(front, 'recessed top loggia', x, 10.25, 0.06, w + 0.1, 2.4, 0.13, shadow);
      for (const dx of [-w / 2, w / 2]) {
        const column = new T.Mesh(new T.CylinderGeometry(0.14, 0.16, 2.4, 10), cream);
        column.position.set(x + dx, 10.3, 0.36);
        column.name = 'cream loggia column';
        front.add(column);
      }
      box(front, 'balcony handrail', x, 9.8, 0.55, w, 0.075, 0.08, iron);
      for (let dx = -w / 2; dx <= w / 2; dx += 0.28) {
        const curve = new T.CatmullRomCurve3([
          new T.Vector3(x + dx, 9.05, 0.35),
          new T.Vector3(x + dx, 9.38, 0.65),
          new T.Vector3(x + dx, 9.8, 0.55),
        ]);
        const railing = new T.Mesh(new T.TubeGeometry(curve, 5, 0.025, 4, false), iron);
        railing.name = 'curved balcony baluster';
        front.add(railing);
      }
      const door = j === Math.floor(bays / 2);
      box(
        front,
        door ? 'burgundy entry' : 'ground window frame',
        x,
        1.75,
        0.2,
        w,
        door ? 3.1 : 2,
        0.18,
        door ? burgundy : cream,
      );
      box(
        front,
        'restaurant glazing',
        x,
        door ? 1.9 : 1.8,
        0.32,
        w - 0.3,
        door ? 2.2 : 1.7,
        0.1,
        windowGlass,
      );
      box(front, 'restaurant window transom', x, 2.2, 0.39, w - 0.3, 0.06, 0.06, cream);
      if (door) box(front, 'door divider', x, 1.75, 0.42, 0.12, 3.1, 0.08, burgundy);
    }
    box(front, 'cream roof cornice', 0, 11.8, 0.28, width + 0.2, 0.32, 0.8, cream);
    // The canopy only covers the short restaurant section at the waterfront end.
    // Other apartment and service frontages on this footprint remain uncovered.
    const cornerDistance = Math.min(
      Math.hypot(a[0] - 542.55, a[1] - 190.29),
      Math.hypot(b[0] - 542.55, b[1] - 190.29),
    );
    if (!(nx < -0.4 && nz < -0.4 && cornerDistance < 5)) {
      batchFacade(front);
      continue;
    }
    const canopyWidth = Math.min(11.5, width - 1);
    const cornerLocalX = (542.55 - mx) * nz - (190.29 - mz) * nx;
    const canopyCenter = Math.sign(cornerLocalX) * (width / 2 - canopyWidth / 2 - 0.5);
    const stripes = Math.ceil(canopyWidth / 0.85),
      stripeWidth = canopyWidth / stripes;
    for (let j = 0; j < stripes; j++) {
      const stripe = box(
        front,
        'green and cream awning stripe',
        canopyCenter - canopyWidth / 2 + (j + 0.5) * stripeWidth,
        4.05,
        1.2,
        stripeWidth + 0.01,
        0.07,
        2.55,
        j % 2 === 0 ? green : cream,
      );
      stripe.rotation.x = 0.32;
    }
    box(front, 'dark restaurant fascia', canopyCenter, 3.59, 2.43, canopyWidth, 0.36, 0.09, iron);
    if (width > 12) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#20312e';
        ctx.fillRect(0, 0, 2048, 128);
        ctx.fillStyle = '#ede3c9';
        ctx.font = '58px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DELANCEY STREET RESTAURANT', 1024, 67);
        const texture = new T.CanvasTexture(canvas);
        texture.colorSpace = T.SRGBColorSpace;
        textures.push(texture);
        const sign = new T.Mesh(
          new T.PlaneGeometry(canopyWidth - 0.4, 0.35),
          new T.MeshStandardMaterial({ map: texture, roughness: 0.85 }),
        );
        sign.position.set(canopyCenter, 3.59, 2.49);
        sign.name = 'Delancey Street Restaurant lettering';
        front.add(sign);
      }
    }
    batchFacade(front);
  }
  // Corner dining terrace occupies the mapped low patio footprint, not a tall block.
  const patio = new T.Group();
  patio.name = 'Delancey brick and glass dining patio';
  scene.add(patio);
  const patioOutline = [
    [547.29, 186.48],
    [549.12, 188.33],
    [555.39, 194.31],
    [555.26, 196.15],
    [581.02, 198.01],
    [583.09, 166.62],
    [582.39, 164.03],
    [580.81, 162.32],
    [578.79, 161.15],
    [576.5, 160.95],
    [574.36, 161.24],
    [573.02, 162.23],
    [572.66, 161.82],
    [572.32, 161.44],
  ];
  const pavingGeometry = new T.ShapeGeometry(
    new T.Shape(patioOutline.map(([x, z]) => new T.Vector2(x, -z))),
  );
  pavingGeometry.rotateX(-Math.PI / 2);
  pavingGeometry.translate(0, 0.19, 0);
  const pavingMesh = new T.Mesh(pavingGeometry, material('#b8ab94'));
  pavingMesh.name = 'mapped patio paving';
  patio.add(pavingMesh);
  const edges = [
    [547.8, 187.2, 573.1, 162.8],
    [573.1, 162.8, 580.5, 166.4],
    [580.5, 166.4, 579.1, 197.2],
  ];
  for (const [ax, az, bx, bz] of edges) {
    const length = Math.hypot(bx - ax, bz - az),
      angle = Math.atan2(bz - az, bx - ax);
    const wall = new T.Group();
    wall.position.set((ax + bx) / 2, 0, (az + bz) / 2);
    wall.rotation.y = -angle;
    patio.add(wall);
    box(wall, 'brick patio wall', 0, 0.6, 0, length, 1.2, 0.4, brick);
    box(wall, 'brick coping', 0, 1.22, 0, length, 0.13, 0.5, mortar);
    for (let y = 0.2; y < 1.2; y += 0.2)
      box(wall, 'horizontal mortar joint', 0, y, -0.207, length, 0.015, 0.015, mortar);
    const panels = Math.ceil(length / 1.8),
      step = length / panels;
    for (let j = 0; j <= panels; j++)
      box(wall, 'glass enclosure post', -length / 2 + j * step, 2, 0, 0.06, 1.55, 0.07, iron);
    for (let j = 0; j < panels; j++)
      box(
        wall,
        'clear patio glass',
        -length / 2 + (j + 0.5) * step,
        2,
        0,
        step - 0.08,
        1.43,
        0.025,
        patioGlass,
      );
    box(wall, 'glass enclosure top rail', 0, 2.76, 0, length, 0.055, 0.075, iron);
    batchFacade(wall);
  }
  for (const [x, z] of [
    [559, 185],
    [568, 183],
    [574, 188],
    [570, 173],
  ]) {
    box(patio, 'patio table', x, 0.95, z, 1.2, 0.08, 1.2, cream);
    box(patio, 'table pedestal', x, 0.6, z, 0.1, 0.7, 0.1, iron);
    for (const side of [-1, 1]) {
      box(patio, 'chair seat', x + side * 0.95, 0.65, z, 0.5, 0.08, 0.5, iron);
      box(patio, 'chair back', x + side * 1.18, 1, z, 0.06, 0.65, 0.5, iron);
    }
  }
  batchFacade(patio);
  return () => textures.forEach((t) => t.dispose());
}
