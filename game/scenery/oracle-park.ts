import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Facades, Point } from '../types';

type Perimeter = { points: Point[] };

// The footprint comes from OSM. Heights and entrance details are modeled estimates
// based on the supplied May 2025 photograph of the Second Street Gate at 85 King St.
export function buildOraclePark(
  scene: T.Scene,
  stadiums: Perimeter[],
  facades: Facades,
  routeDistance: (x: number, z: number) => number,
) {
  const group = new T.Group();
  group.name = 'Oracle Park';
  scene.add(group);
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const textures: T.Texture[] = [];
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.85 });
  const brick = new T.MeshStandardMaterial({
    color: '#a66950',
    map: facades.brick,
    roughness: 0.95,
  });
  const stone = material('#c9bda3');
  const steel = material('#263330');
  const glass = material('#263c40');
  const insetBrick = material('#613d30');
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
    angle = 0,
  ) => {
    const geometry = new T.BoxGeometry(w, h, depth);
    if (m === brick) {
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 3, (uv.getY(i) * h) / 3);
    }
    geometry.rotateY(-angle);
    geometry.translate(x, y, z);
    const list = batches.get(m) || [];
    list.push(geometry);
    batches.set(m, list);
  };
  const beam = (a: T.Vector3, b: T.Vector3, width = 0.22) => {
    const delta = b.clone().sub(a);
    const geometry = new T.BoxGeometry(width, delta.length(), width);
    geometry.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
    );
    geometry.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    const list = batches.get(steel) || [];
    list.push(geometry);
    batches.set(steel, list);
  };
  for (const stadium of stadiums) {
    const center = stadium.points
      .reduce((c, p) => c.add(new T.Vector2(p[0], p[1])), new T.Vector2())
      .divideScalar(stadium.points.length);
    for (let i = 1; i < stadium.points.length; i++) {
      const a = stadium.points[i - 1],
        b = stadium.points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2,
        mz = (a[1] + b[1]) / 2;
      if (length < 3 || routeDistance(mx, mz) > 90) continue;
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const ux = Math.cos(angle),
        uz = Math.sin(angle);
      const sign = (mx - center.x) * -uz + (mz - center.y) * ux > 0 ? 1 : -1;
      const nx = -uz * sign,
        nz = ux * sign;
      const detail = (
        u: number,
        y: number,
        w: number,
        h: number,
        m: T.Material,
        offset = 1.08,
        depth = 0.18,
      ) => box(a[0] + ux * u + nx * offset, y, a[1] + uz * u + nz * offset, w, h, depth, m, angle);
      box(mx, 9, mz, length, 18, 2, brick, angle);
      detail(length / 2, 0.9, length, 1.8, stone);
      detail(length / 2, 17.7, length, 0.8, stone, 1.12, 0.45);
      const bays = Math.max(1, Math.round(length / 7.5)),
        step = length / bays;
      for (let j = 0; j < bays; j++) {
        const u = (j + 0.5) * step,
          w = step * 0.46;
        detail(u, 9.1, w + 0.45, 13.4, insetBrick);
        detail(u, 9.1, w, 12.8, glass, 1.19);
        for (let k = 0; k < 9; k++) detail(u, 2.7 + k * 1.6, w, 0.1, steel, 1.31);
        for (const du of [-w / 2, 0, w / 2]) detail(u + du, 9.1, 0.12, 12.8, steel, 1.32);
        detail(j * step, 9, 0.7, 16.4, brick, 1.2, 0.6);
        detail(u, 2.4, w + 0.5, 0.3, stone, 1.3, 0.5);
        // Recess the open upper grandstand behind the street facade.
        const p = (along: number, y: number) =>
          new T.Vector3(a[0] + ux * along - nx * 2.4, y, a[1] + uz * along - nz * 2.4);
        beam(p(j * step, 18), p(j * step, 29), 0.34);
        beam(p(j * step, 18), p((j + 1) * step, 29));
        beam(p(j * step, 29), p((j + 1) * step, 18));
        for (const y of [20, 24.5, 29]) beam(p(j * step, y), p((j + 1) * step, y));
      }
    }
  }

  // Clock tower at the King / Second Street corner. Local -Z faces King Street.
  const origin = new T.Vector3(497.6, 0, 714.1);
  const rotation = Math.PI / 4;
  const transform = (x: number, y: number, z: number) =>
    new T.Vector3(x, y, z).applyAxisAngle(new T.Vector3(0, 1, 0), rotation).add(origin);
  const towerBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const p = transform(x, y, z);
    box(p.x, p.y, p.z, w, h, depth, m, -rotation);
  };
  towerBox(0, 17.5, 0, 13, 35, 13, brick);
  towerBox(0, 1, 0, 13.3, 2, 13.3, stone);
  towerBox(0, 34.5, 0, 14, 0.9, 14, stone);
  towerBox(0, 35.3, 0, 13.4, 0.6, 13.4, insetBrick);
  // Tall stone-framed tower window beneath the clock and banner.
  towerBox(0, 10, -6.62, 4.6, 16, 0.3, stone);
  towerBox(0, 10, -6.83, 3.5, 15, 0.12, glass);
  for (let y = 3; y <= 17; y += 1.5) towerBox(0, y, -6.94, 3.5, 0.1, 0.1, steel);
  for (const x of [-1.1, 0, 1.1]) towerBox(x, 10, -6.94, 0.1, 15, 0.1, steel);
  // Entrance wing and its tall gridded window, alongside the clock tower.
  towerBox(-10.3, 12, 0, 7.5, 24, 12.5, brick);
  towerBox(-10.3, 23.5, 0, 8, 0.7, 13, stone);
  towerBox(-10.3, 11.5, -6.45, 5.6, 20, 0.15, glass);
  for (let y = 2; y < 22; y += 1.5) towerBox(-10.3, y, -6.58, 5.6, 0.1, 0.12, steel);
  for (const x of [-12.9, -11.6, -10.3, -9, -7.7]) towerBox(x, 11.5, -6.58, 0.12, 20, 0.12, steel);
  towerBox(-10.3, 18.6, -6.6, 7.5, 0.6, 0.4, stone);

  const panel = (
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    side = false,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    draw(ctx);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const mesh = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        transparent: true,
        side: T.DoubleSide,
      }),
    );
    mesh.position.copy(transform(x, y, z));
    mesh.rotation.y = rotation + (side ? Math.PI / 2 : Math.PI);
    group.add(mesh);
  };
  panel(
    1024,
    384,
    (ctx) => {
      ctx.fillStyle = '#172523';
      ctx.fillRect(0, 0, 1024, 384);
      ctx.strokeStyle = '#d0b98c';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 1000, 360);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f46c3f';
      ctx.font = 'bold 116px Georgia';
      ctx.fillText('ORACLE PARK', 512, 145);
      ctx.fillStyle = '#d0b98c';
      ctx.font = 'bold 31px Georgia';
      ctx.fillText('HOME OF THE SAN FRANCISCO GIANTS', 512, 238);
      ctx.fillRect(35, 274, 954, 4);
      ctx.font = 'bold 45px Georgia';
      ctx.fillText('2ND STREET GATE', 512, 339);
    },
    -10.3,
    8.3,
    -6.78,
    6.8,
    2.55,
  );
  // Raised-looking copper lettering above the clocks on both street-facing sides.
  const towerSign = (ctx: CanvasRenderingContext2D) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 112px Georgia';
    ctx.fillStyle = '#442a21';
    ctx.fillText('ORACLE PARK', 517, 104);
    ctx.strokeStyle = '#edbb89';
    ctx.lineWidth = 2;
    ctx.strokeText('ORACLE PARK', 512, 98);
    ctx.fillStyle = '#cd835c';
    ctx.fillText('ORACLE PARK', 512, 98);
  };
  panel(1024, 192, towerSign, 0, 33.35, -6.73, 9.5, 1.5);
  panel(1024, 192, towerSign, 6.73, 33.35, 0, 9.5, 1.5, true);
  const clock = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#c6b995';
    ctx.beginPath();
    ctx.arc(256, 256, 251, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eee7cd';
    ctx.beginPath();
    ctx.arc(256, 256, 222, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#24312e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 39px Georgia';
    for (let n = 1; n <= 12; n++) {
      const a = (n * Math.PI) / 6;
      ctx.fillText(String(n), 256 + Math.sin(a) * 178, 256 - Math.cos(a) * 178);
    }
    ctx.strokeStyle = '#24312e';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(181, 187);
    ctx.moveTo(256, 256);
    ctx.lineTo(335, 118);
    ctx.stroke();
  };
  panel(512, 512, clock, 0, 30.5, -6.69, 4.6, 4.6);
  panel(512, 512, clock, 6.69, 30.5, 0, 4.6, 4.6, true);
  panel(
    512,
    768,
    (ctx) => {
      ctx.fillStyle = '#d6c8a8';
      ctx.fillRect(0, 0, 512, 768);
      ctx.fillStyle = '#b44e2a';
      ctx.fillRect(20, 20, 472, 728);
      ctx.fillStyle = '#fff0ce';
      ctx.textAlign = 'center';
      ctx.font = 'bold 75px Georgia';
      ctx.fillText('GIANTS', 256, 175);
      ctx.font = 'bold 190px Georgia';
      ctx.fillText('SF', 256, 440);
      ctx.font = 'bold 44px Georgia';
      ctx.fillText('SAN FRANCISCO', 256, 640);
    },
    0,
    23,
    -6.72,
    4.8,
    7.2,
  );
  // Roof-mounted floodlight trusses, visible above the dark grandstand steelwork.
  for (const x of [-35, -65, -95]) {
    for (const dx of [-4, 4]) beam(transform(x + dx, 22, 6), transform(x + dx, 36, 6), 0.32);
    towerBox(x, 35.8, 6, 15, 2.1, 1.2, steel);
    for (let dx = -6; dx <= 6; dx += 2) towerBox(x + dx, 35.8, 5.32, 1, 0.9, 0.18, stone);
  }
  // Dark bollards along the entrance apron, leaving the gate itself clear.
  for (let x = -23; x <= 14; x += 2.8) {
    if (x > -14 && x < -7) continue;
    towerBox(x, 0.65, -10, 0.34, 1.3, 0.34, steel);
  }
  for (const [m, geometries] of batches) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error('Oracle Park geometry could not be merged');
    const mesh = new T.Mesh(geometry, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  return () => textures.forEach((t) => t.dispose());
}
