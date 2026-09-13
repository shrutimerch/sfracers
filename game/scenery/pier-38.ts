import * as T from 'three';
import { buildingGeometry, type Building } from './geometry/building-geometry.ts';
import { batchFacade } from './geometry/batch-facade.ts';

export const PIER_38_ID = 104599982;

// Retain the full mapped pier shed, including the long section extending into the bay.
// The low bay shed and taller gabled street frontage follow the supplied Brannan and Embarcadero views.
export function buildPier38(scene: T.Scene, building: Building) {
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.92 });
  const white = material('#dfdfd2'),
    trim = material('#eeeadd'),
    green = material('#647b64');
  const glass = material('#4e605a'),
    frame = material('#384b42'),
    roof = material('#797e74');
  const body = new T.Group();
  body.name = 'Pier 38 — full mapped waterfront shed';
  scene.add(body);
  const geometry = buildingGeometry({ ...building, height: 7 });
  body.add(new T.Mesh(geometry.walls, white), new T.Mesh(geometry.roof, roof));
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
    mesh.position.set(x, y, z);
    mesh.name = name;
    group.add(mesh);
  };
  const cx = building.points.reduce((s, p) => s + p[0], 0) / building.points.length;
  const cz = building.points.reduce((s, p) => s + p[1], 0) / building.points.length;
  for (let i = 1; i < building.points.length; i++) {
    const a = building.points[i - 1],
      b = building.points[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 8 || (a[0] < 632 && b[0] < 632)) continue;
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]) / length,
      nz = (b[0] - a[0]) / length;
    if ((mx - cx) * nx + (mz - cz) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    const wall = new T.Group();
    wall.name = 'Pier 38 white and green facade';
    wall.position.set(mx, 0, mz);
    wall.rotation.y = Math.atan2(nx, nz);
    body.add(wall);
    box(wall, 'white parapet', 0, 7.05, 0.14, length, 0.55, 0.36, trim);
    box(wall, 'green base course', 0, 0.65, 0.1, length, 0.7, 0.12, green);
    const bays = Math.max(1, Math.round(length / 7)),
      step = length / bays;
    for (let j = 0; j < bays; j++) {
      const x = -length / 2 + (j + 0.5) * step,
        w = step * 0.62,
        door = j % 4 === 0;
      box(wall, 'opening surround', x, 3.1, 0.12, w + 0.25, 4.65, 0.17, trim);
      box(
        wall,
        door ? 'green loading door' : 'industrial glazing',
        x,
        3.1,
        0.24,
        w,
        4.4,
        0.1,
        door ? green : glass,
      );
      for (let k = 1; k < 4; k++)
        box(wall, 'window mullion', x - w / 2 + (w * k) / 4, 3.1, 0.32, 0.065, 4.4, 0.06, frame);
      for (let k = 1; k < 5; k++)
        box(wall, 'window transom', x, 0.9 + k * 0.88, 0.32, w, 0.065, 0.06, frame);
      box(wall, 'white pilaster', -length / 2 + j * step, 3.5, 0.19, 0.35, 6.8, 0.4, white);
    }
    batchFacade(wall);
  }
  // The historic street entrance is taller than the long shed behind it.
  const entrance = new T.Group();
  entrance.name = 'Pier 38 historic arched Embarcadero entrance';
  entrance.position.set(616.5, 0, 388);
  entrance.rotation.y = -Math.PI / 2 + 0.035;
  body.add(entrance);
  for (const [center, width] of [
    [-19, 22],
    [37, 58],
  ]) {
    box(entrance, 'cream two-story frontage', center, 5.65, -0.7, width, 11.3, 2, white);
    box(entrance, 'layered cornice', center, 11.45, 0.45, width + 0.3, 0.25, 0.65, trim);
    box(entrance, 'roof edge', center, 11.7, 0.3, width + 0.5, 0.16, 0.9, roof);
    box(entrance, 'horizontal belt course', center, 7.65, 0.36, width, 0.2, 0.3, trim);
    const bays = Math.round(width / 7),
      step = width / bays;
    for (let j = 0; j < bays; j++) {
      const x = center - width / 2 + (j + 0.5) * step;
      box(entrance, 'large dark ground opening', x, 4.2, 0.36, step * 0.74, 5, 0.12, glass);
      box(entrance, 'solid green lower door panel', x, 2.3, 0.47, step * 0.74, 1.2, 0.08, frame);
      for (let k = 1; k < 6; k++)
        box(
          entrance,
          'industrial lower mullion',
          x - step * 0.37 + (k * step * 0.74) / 6,
          4.3,
          0.48,
          0.06,
          4.8,
          0.06,
          frame,
        );
      for (let y = 3; y < 6.6; y += 0.65)
        box(entrance, 'industrial lower transom', x, y, 0.48, step * 0.74, 0.06, 0.06, frame);
      for (const dx of [-step * 0.22, 0, step * 0.22]) {
        box(entrance, 'upper window recess', x + dx, 9.35, 0.35, step * 0.17, 2.25, 0.15, frame);
        box(entrance, 'upper window glass', x + dx, 9.35, 0.46, step * 0.145, 2.05, 0.08, glass);
        box(entrance, 'upper transom', x + dx, 9.35, 0.53, step * 0.145, 0.055, 0.04, frame);
      }
      box(
        entrance,
        'front pilaster',
        center - width / 2 + j * step,
        5.8,
        0.55,
        0.45,
        11.5,
        0.45,
        trim,
      );
    }
  }
  box(entrance, 'central entrance tower', 0, 7.8, -0.4, 16, 15.6, 2.8, white);
  const gableShape = new T.Shape();
  gableShape.moveTo(-8, 15.6);
  gableShape.lineTo(0, 19.2);
  gableShape.lineTo(8, 15.6);
  gableShape.closePath();
  const gable = new T.Mesh(
    new T.ExtrudeGeometry(gableShape, { depth: 2.8, bevelEnabled: false }),
    white,
  );
  gable.position.z = -1.8;
  gable.name = 'triangular entrance pediment';
  entrance.add(gable);
  for (const side of [-1, 1]) {
    const cornice = new T.Mesh(new T.BoxGeometry(9, 0.32, 3.4), trim);
    cornice.position.set(side * 4, 17.55, -0.2);
    cornice.rotation.z = -side * Math.atan2(3.6, 8);
    cornice.name = 'sloped pediment cornice';
    entrance.add(cornice);
  }
  const archShape = new T.Shape();
  archShape.moveTo(-4.4, 0.4);
  archShape.lineTo(4.4, 0.4);
  archShape.lineTo(4.4, 10.1);
  archShape.absarc(0, 10.1, 4.4, 0, Math.PI, false);
  archShape.closePath();
  const arch = new T.Mesh(new T.ShapeGeometry(archShape), glass);
  arch.position.z = 1.05;
  arch.name = 'arched glazed entrance';
  entrance.add(arch);
  for (const r of [4.55, 4.8, 5.05]) {
    const molding = new T.Mesh(new T.TorusGeometry(r, 0.09, 6, 40, Math.PI), trim);
    molding.position.set(0, 10.1, 1.18);
    molding.name = 'layered arch molding';
    entrance.add(molding);
    for (const side of [-1, 1])
      box(entrance, 'vertical arch molding', side * r, 5.25, 1.18, 0.16, 9.7, 0.16, trim);
  }
  for (let x = -4; x <= 4; x += 0.65) {
    const top = 10.1 + Math.sqrt(Math.max(0, 4.4 * 4.4 - x * x));
    box(entrance, 'arch glazing mullion', x, (top + 0.5) / 2, 1.17, 0.07, top - 0.5, 0.08, frame);
  }
  for (let y = 1.2; y < 14.3; y += 0.7) {
    const half = y <= 10.1 ? 4.4 : Math.sqrt(Math.max(0, 4.4 * 4.4 - (y - 10.1) ** 2));
    box(entrance, 'arch glazing transom', 0, y, 1.18, half * 2, 0.065, 0.08, frame);
  }
  box(entrance, 'entrance lintel', 0, 6.35, 1.26, 8.8, 0.55, 0.18, frame);
  box(entrance, 'entry double door', 0, 2.35, 1.24, 3.4, 4.2, 0.14, frame);
  box(entrance, 'entry door seam', 0, 2.35, 1.36, 0.07, 4.2, 0.08, trim);
  for (const side of [-1, 1])
    box(entrance, 'small flanking door', side * 6.5, 1.55, 1.05, 1.05, 2.7, 0.14, frame);
  // Thin roof flagpole preserves the recognizable entrance silhouette.
  box(entrance, 'roof flagpole', 0, 22, -0.2, 0.1, 6, 0.1, trim);
  // Street-facing identifier; the north-facing lettering also reads from Brannan.
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  let texture: T.CanvasTexture | undefined;
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 192);
    ctx.fillStyle = '#425d4d';
    ctx.font = 'bold 120px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('· PIER · 38 ·', 512, 100);
    texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const signMaterial = new T.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      transparent: true,
    });
    const frontSign = new T.Mesh(new T.PlaneGeometry(8, 1.5), signMaterial);
    frontSign.name = 'Pier 38 pediment lettering';
    frontSign.position.set(0, 16.6, 1.09);
    entrance.add(frontSign);
    const baySign = new T.Mesh(new T.PlaneGeometry(10, 1.75), signMaterial);
    baySign.name = 'Pier 38 bay-side lettering';
    baySign.position.set(650, 5.9, 366.8);
    baySign.rotation.y = -Math.PI / 2 - 1.493;
    body.add(baySign);
  }
  batchFacade(entrance);
  batchFacade(body);
  return () => texture?.dispose();
}
