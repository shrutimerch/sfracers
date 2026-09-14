import { buildOracleOutfield } from './oracle-outfield.ts';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Facades, Point } from '../types';

// The mapped stadium relation must not also render as a generic apartment block.
// The small approach service structures are modeled below at their low real-world scale.
export const ORACLE_GENERIC_BUILDING_IDS = new Set([
  -7330762, 149167947, 149167945, 149167940, 288716390,
]);

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
      // Replace the southwest entrance notch with the open Willie Mays Gate below.
      if (Math.hypot(mx - 365, mz - 865) < 27) continue;
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
      // Three floors are separated by brick spandrels and narrow pale stone bands.
      for (const y of [6.5, 12.3]) {
        detail(length / 2, y, length, 1.45, brick, 1.42, 0.48);
        detail(length / 2, y + 0.74, length, 0.32, stone, 1.7, 0.48);
      }
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

  // Low utility frontage beside the stadium replaces generic multi-story blocks.
  // The photo shows a pale wall, brick entrance piers and dark gates behind the planting.
  for (const [x, z, w, depth] of [
    [576, 660, 17, 11],
    [565, 677, 22, 13],
    [546, 700, 12, 8],
  ]) {
    box(x, 2, z, w, 4, depth, stone, Math.PI / 4);
    box(x, 4.1, z, w + 0.4, 0.25, depth + 0.4, insetBrick, Math.PI / 4);
    const nx = -Math.SQRT1_2,
      nz = -Math.SQRT1_2;
    box(
      x + nx * (depth / 2 + 0.1),
      1.7,
      z + nz * (depth / 2 + 0.1),
      3,
      3.4,
      0.18,
      steel,
      Math.PI / 4,
    );
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
  const towerRoof = new T.Mesh(new T.ConeGeometry(10, 4.2, 4), material('#68736b'));
  towerRoof.position.copy(transform(0, 37.7, 0));
  towerRoof.rotation.y = rotation + Math.PI / 4;
  towerRoof.name = 'Oracle clock tower pyramidal roof';
  group.add(towerRoof);
  beam(transform(0, 39.8, 0), transform(0, 44, 0), 0.09);
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
    return mesh;
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
  // Broad northeast-facing roof sign is readable from the southbound King Street approach.
  const approachSign = panel(1024, 192, towerSign, 0, 21, 0, 27, 3.8);
  if (approachSign) {
    approachSign.name = 'Oracle Park — King Street approach sign';
    approachSign.position.set(525.9, 20.7, 715.4);
    approachSign.rotation.y = Math.PI * 0.75;
  }
  for (const y of [18.7, 22.8]) box(525.5, y, 715.8, 29, 0.18, 0.3, steel, Math.PI / 4);
  for (const offset of [-10, 0, 10]) {
    box(525.5 + offset * Math.SQRT1_2, 18.6, 715.8 + offset * Math.SQRT1_2, 0.18, 4, 0.25, steel);
  }
  // Willie Mays Plaza: the entrance runs parallel to the waterfront roadway,
  // facing northwest across the mapped palms rather than across the traffic lane.
  // Its open steel portal is flanked by brick wings, rather than a solid facade
  // or a second clock tower. Local +Z goes into the stadium.
  // Match the adjacent King / Embarcadero approach from (300.85, 882.11)
  // to (382.39, 798.99). The plaza, canopy, signs and wings share this frame.
  const gateRotation = Math.atan2(882.11 - 798.99, 382.39 - 300.85);
  const gatePoint = (x: number, y: number, z: number) =>
    new T.Vector3(x, y, z)
      .applyAxisAngle(new T.Vector3(0, 1, 0), gateRotation)
      .add(new T.Vector3(365, 0, 865));
  const gateBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const p = gatePoint(x, y, z);
    box(p.x, p.y, p.z, w, h, d, m, -gateRotation);
  };
  gateBox(0, 0.06, -13, 64, 0.12, 30, stone);
  // Terracotta paving bands across the broad, unobstructed palm court.
  for (const z of [-5, -13, -21]) gateBox(0, 0.13, z, 64, 0.04, 1.5, brick);
  for (const x of [-24, 24]) {
    gateBox(x, 8.8, 3, 24, 17.6, 8, brick);
    gateBox(x, 0.85, -1.15, 24, 1.7, 0.4, stone);
    gateBox(x, 17.5, 3, 24.6, 0.6, 8.5, stone);
    for (const dx of [-8, 0, 8]) {
      gateBox(x + dx, 8.7, -1.2, 4.6, 13.6, 0.18, glass);
      for (let y = 2.4; y < 16; y += 1.4) gateBox(x + dx, y, -1.34, 4.6, 0.1, 0.12, steel);
      for (const mullion of [-2.2, 0, 2.2])
        gateBox(x + dx + mullion, 8.7, -1.34, 0.12, 13.6, 0.12, steel);
    }
    gateBox(x, 6.4, -1.4, 24, 0.55, 0.5, stone);
  }
  // The gate is recessed from the King Street facade. Close the exposed end
  // of its northeast wing with a return wall back to the mapped stadium edge.
  // Overlap both walls slightly so the diagonal join has no daylight seam.
  const returnX = 35.6;
  gateBox(returnX, 8.8, -11.8, 1.6, 17.6, 24, brick);
  gateBox(returnX, 0.85, -11.8, 1.9, 1.7, 24.4, stone);
  gateBox(returnX, 6.4, -11.8, 1.9, 0.55, 24.4, stone);
  gateBox(returnX, 17.5, -11.8, 2.1, 0.6, 24.4, stone);
  for (const z of [-19.5, -12, -4.5]) {
    gateBox(returnX + 0.84, 9.3, z, 0.15, 12.4, 4.6, glass);
    for (let y = 3.5; y < 15.5; y += 1.4) gateBox(returnX + 0.94, y, z, 0.12, 0.1, 4.6, steel);
    for (const dz of [-2.2, 0, 2.2]) gateBox(returnX + 0.94, 9.3, z + dz, 0.12, 12.4, 0.12, steel);
  }
  // Flat-topped plaza clock tower overlaps the connecting wing and street facade.
  gateBox(returnX, 14.5, -17.5, 10.5, 29, 12.5, brick);
  gateBox(returnX, 0.9, -17.5, 10.9, 1.8, 12.9, stone);
  gateBox(returnX, 28.8, -17.5, 11.4, 0.9, 13.4, stone);
  gateBox(returnX, 27.9, -17.5, 10.9, 0.3, 12.9, stone);
  for (const y of [6.5, 17]) {
    gateBox(returnX, y, -23.85, 4.6, 9, 0.3, stone);
    gateBox(returnX, y, -24.04, 3.6, 8.2, 0.12, glass);
    for (let dy = -3.5; dy <= 3.5; dy += 1.15)
      gateBox(returnX, y + dy, -24.14, 3.6, 0.1, 0.1, steel);
    for (const dx of [-1.15, 0, 1.15]) gateBox(returnX + dx, y, -24.14, 0.1, 8.2, 0.1, steel);
  }
  gateBox(returnX, 11.5, -17.5, 10.8, 0.6, 12.8, stone);
  // Taller brick piers frame the sign; the gates are recessed behind the canopy.
  for (const x of [-12, 12]) {
    gateBox(x, 11.2, 0, 2, 22.4, 5, brick);
    gateBox(x, 21.9, 0, 2.3, 0.7, 5.3, stone);
    gateBox(x, 1, -2.55, 2.2, 2, 0.35, stone);
  }
  gateBox(0, 4, 5, 22, 8, 0.35, steel);
  for (let x = -10.5; x <= 10.5; x += 0.55) gateBox(x, 3.5, 4.76, 0.055, 7, 0.12, stone);
  for (const y of [8, 13, 21.5]) gateBox(0, y, -1.8, 24, 0.42, 0.5, steel);
  gateBox(0, 8, 0.5, 25, 0.4, 9, steel);
  for (const x of [-10, -5, 0, 5, 10]) {
    gateBox(x, 14.5, -1.8, 0.28, 14, 0.35, steel);
    beam(gatePoint(x, 8, -3.8), gatePoint(x, 12, 1.5), 0.2);
  }
  const gateSign = (
    draw: (ctx: CanvasRenderingContext2D) => void,
    y: number,
    w: number,
    h: number,
  ) => {
    const sign = panel(1536, 256, draw, 0, 0, 0, w, h);
    if (sign) {
      sign.name = 'Willie Mays Gate entrance lettering';
      sign.position.copy(gatePoint(0, y, -2.12));
      sign.rotation.y = gateRotation + Math.PI;
    }
  };
  gateSign(
    (ctx) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 185px Georgia';
      ctx.strokeStyle = '#dfc5a4';
      ctx.lineWidth = 12;
      ctx.strokeText('ORACLE PARK', 768, 128);
      ctx.fillStyle = '#b74732';
      ctx.fillText('ORACLE PARK', 768, 128);
    },
    19.6,
    22,
    3.7,
  );
  gateSign(
    (ctx) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e26443';
      ctx.font = 'bold 65px Georgia';
      ctx.fillText('HOME OF THE SAN FRANCISCO GIANTS', 768, 128);
    },
    11.5,
    23,
    3.8,
  );
  gateSign(
    (ctx) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#dcc6a3';
      ctx.font = 'bold 78px Georgia';
      ctx.fillText('WILLIE MAYS GATE', 768, 128);
    },
    6.7,
    12,
    2,
  );
  for (let x = -30; x <= 30; x += 3) {
    if (Math.abs(x) < 5) continue;
    gateBox(x, 0.7, -28, 0.35, 1.4, 0.35, steel);
  }

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
  for (const side of [false, true]) {
    const plazaClock = panel(512, 512, clock, 0, 0, 0, 3.5, 3.5);
    if (plazaClock) {
      plazaClock.name = 'Willie Mays Plaza tower clock';
      plazaClock.position.copy(
        gatePoint(side ? returnX + 5.32 : returnX, 25, side ? -17.5 : -23.83),
      );
      plazaClock.rotation.y = gateRotation + (side ? Math.PI / 2 : Math.PI);
    }
  }
  const plazaTowerSign = panel(1024, 192, towerSign, 0, 0, 0, 8.5, 1.2);
  if (plazaTowerSign) {
    plazaTowerSign.name = 'Willie Mays Plaza tower lettering';
    plazaTowerSign.position.copy(gatePoint(returnX, 27.3, -23.84));
    plazaTowerSign.rotation.y = gateRotation + Math.PI;
  }
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
  const disposeOutfield = buildOracleOutfield(group);
  return () => {
    textures.forEach((t) => t.dispose());
    disposeOutfield();
  };
}
