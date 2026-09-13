import * as T from 'three';
import type { Building } from './geometry/building-geometry';
import { batchFacade } from './geometry/batch-facade.ts';

export const CAFE_CENTRO_ID = 124884353;
export const CAFE_CENTRO_HEIGHT = 14.4;

// OSM footprint; facade proportions estimated from the user's Jan 2025 Street View image.
export function parkFacingFacade(building: Building) {
  const edges = building.points
    .slice(1)
    .map((b, i) => {
      const a = building.points[i];
      const x = (a[0] + b[0]) / 2,
        z = (a[1] + b[1]) / 2;
      return {
        x,
        z,
        width: Math.hypot(b[0] - a[0], b[1] - a[1]),
        score: Math.hypot(x - 90, z - 490),
        dx: b[0] - a[0],
        dz: b[1] - a[1],
      };
    })
    .filter((e) => e.width > 4)
    .sort((a, b) => a.score - b.score);
  const front = edges[0];
  let nx = -front.dz / front.width,
    nz = front.dx / front.width;
  if (nx * (90 - front.x) + nz * (490 - front.z) < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { ...front, angle: Math.atan2(nx, nz) };
}

export function buildCafeCentro(scene: T.Scene, building: Building) {
  const front = parkFacingFacade(building);
  const group = new T.Group();
  group.name = 'Cafe Centro — 102 South Park';
  group.position.set(front.x, 0, front.z);
  group.rotation.y = front.angle;
  group.userData.buildingId = CAFE_CENTRO_ID;
  const textures: T.Texture[] = [];
  const material = (color: string, roughness = 0.85) =>
    new T.MeshStandardMaterial({ color, roughness });
  const cream = material('#e2ddbc'),
    stucco = material('#b3b1a6'),
    trim = material('#637e8a'),
    cornice = material('#d0cfc2'),
    dark = material('#282e2b'),
    wood = material('#673d2d'),
    glass = material('#84989e', 0.28),
    olive = material('#99967a'),
    awning = material('#777c75');
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, depth), m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const label = (
    name: string,
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    background: string,
    foreground: string,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = foreground;
    ctx.font = 'bold 150px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 143, 950);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const mesh = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  const width = front.width;
  // Continuous stucco frontage, with deeper cream piers framing the recessed entry.
  box('upper stucco', 0, 8.85, 0.025, width, 10.3, 0.08, stucco);
  const doorWidth = 1.65,
    doorX = 0.3;
  const leftWidth = width / 2 + doorX - doorWidth / 2;
  const rightWidth = width / 2 - doorX - doorWidth / 2;
  box('left cream storefront', -width / 2 + leftWidth / 2, 1.75, 0.16, leftWidth, 3.5, 0.32, cream);
  box(
    'right cream storefront',
    width / 2 - rightWidth / 2,
    1.75,
    0.16,
    rightWidth,
    3.5,
    0.32,
    cream,
  );
  box('recessed entrance shadow', doorX, 1.48, 0.075, doorWidth, 2.96, 0.06, dark);
  box('stone entrance threshold', doorX, 0.12, 0.3, doorWidth, 0.15, 0.55, cornice);
  box('open timber door', doorX + 0.56, 1.4, 0.14, 0.12, 2.65, 0.16, wood);
  for (const x of [-width * 0.325, width * 0.34]) {
    box('olive storefront surround', x, 1.72, 0.35, 1.35, 2.1, 0.12, olive);
    box('timber storefront frame', x, 1.72, 0.43, 1.14, 1.85, 0.1, wood);
    box('storefront glass', x, 1.76, 0.49, 0.96, 1.6, 0.035, glass);
    box('storefront mullion', x, 1.75, 0.53, 0.06, 1.7, 0.045, wood);
  }
  label('CAFE wall lettering', 'CAFÉ', -1.35, 2.32, 0.34, 0.64, 0.2, '#e2ddbc', '#252a24');
  label('menu board', 'MENU', 1.48, 1.95, 0.35, 0.4, 0.6, '#e8e4d7', '#52544e');
  // Two tall arched tiers, three bays each; the fourth storey has rectangular sashes.
  for (const base of [4.12, 7.62])
    for (const x of [-width * 0.3, 0, width * 0.3]) {
      const radius = 0.66,
        straight = 1.65;
      const shape = new T.Shape();
      shape.moveTo(-radius, 0);
      shape.lineTo(radius, 0);
      shape.lineTo(radius, straight);
      shape.absarc(0, straight, radius, 0, Math.PI, false);
      shape.lineTo(-radius, 0);
      const pane = new T.Mesh(new T.ShapeGeometry(shape, 24), glass);
      pane.name = 'arched sash glass';
      pane.position.set(x, base, 0.12);
      group.add(pane);
      box(
        'sash left jamb',
        x - radius - 0.035,
        base + straight / 2,
        0.2,
        0.12,
        straight,
        0.12,
        trim,
      );
      box(
        'sash right jamb',
        x + radius + 0.035,
        base + straight / 2,
        0.2,
        0.12,
        straight,
        0.12,
        trim,
      );
      box('projecting sill', x, base - 0.07, 0.22, 1.63, 0.15, 0.34, trim);
      box('sash center mullion', x, base + straight / 2, 0.21, 0.05, straight, 0.07, trim);
      box('fanlight transom', x, base + straight, 0.22, 1.54, 0.11, 0.15, trim);
      box('sash meeting rail', x, base + straight * 0.57, 0.22, 1.25, 0.045, 0.07, trim);
      for (const r of [0.7, 0.82]) {
        const curve = new T.EllipseCurve(0, 0, r, r, 0, Math.PI, false, 0);
        const path = new T.CatmullRomCurve3(
          curve.getPoints(32).map((p) => new T.Vector3(x + p.x, base + straight + p.y, 0.22)),
        );
        const arch = new T.Mesh(
          new T.TubeGeometry(path, 32, r === 0.82 ? 0.065 : 0.03, 6, false),
          trim,
        );
        arch.name = 'blue-gray arch molding';
        group.add(arch);
      }
      for (const t of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) {
        const a = new T.Vector3(x, base + straight, 0.2),
          b = new T.Vector3(x + Math.cos(t) * radius, base + straight + Math.sin(t) * radius, 0.2);
        const bar = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, a.distanceTo(b), 5), trim);
        bar.position.copy(a.clone().add(b).multiplyScalar(0.5));
        bar.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
        group.add(bar);
      }
      box('arch keystone', x, base + straight + 0.88, 0.25, 0.22, 0.28, 0.18, trim);
    }
  for (const x of [-width * 0.3, 0, width * 0.3]) {
    box('attic window surround', x, 12, 0.16, 1.38, 1.55, 0.14, trim);
    box('attic sash glass', x, 12, 0.25, 1.15, 1.31, 0.035, glass);
    box('attic sash rail', x, 12, 0.28, 1.15, 0.055, 0.05, trim);
  }
  for (const y of [3.6, 7.05]) {
    box('horizontal string course', 0, y, 0.2, width + 0.12, 0.16, 0.32, cornice);
    box('string course shadow', 0, y - 0.12, 0.12, width, 0.055, 0.2, dark);
  }
  for (const [y, w, d] of [
    [13.75, width + 0.15, 0.35],
    [14.05, width + 0.4, 0.58],
    [14.3, width + 0.55, 0.72],
  ])
    box('roof cornice', 0, y, 0.19, w, 0.19, d, cornice);
  for (let x = -width / 2 + 0.12; x < width / 2; x += 0.28)
    box('cornice dentil', x, 13.89, 0.32, 0.12, 0.18, 0.3, dark);
  const canopy = box('sloping gray awning', 0, 3.36, 0.73, width - 0.2, 0.075, 1.35, awning);
  canopy.rotation.x = 0.18;
  box('awning valance', 0, 3.14, 1.35, width - 0.2, 0.18, 0.045, awning);
  for (let x = -width / 2 + 0.16; x < width / 2 - 0.1; x += 0.18) {
    const scallop = new T.Mesh(new T.CircleGeometry(0.09, 8, Math.PI, Math.PI), awning);
    scallop.position.set(x, 3.05, 1.377);
    group.add(scallop);
  }
  label('CENTRO hanging cafe sign', 'CENTRO', doorX, 2.88, 0.91, 2.15, 0.44, '#244b35', '#e3dbc3');
  batchFacade(group);
  scene.add(group);
  return () => textures.forEach((texture) => texture.dispose());
}
