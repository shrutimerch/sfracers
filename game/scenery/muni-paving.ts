import * as T from 'three';
import survey from './data/waterfront-geometry.ts';
import { cyclingStrips } from './cycling-layout.ts';
import type { MapData, Point } from '../types';

type Segment = { a: Point; b: Point; halfWidth: number };
const distance = (p: Point, s: Segment) => {
  const dx = s.b[0] - s.a[0],
    dz = s.b[1] - s.a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(p[0] - s.a[0] - dx * t, p[1] - s.a[1] - dz * t);
};

// Clip the paved median to the same road and bike-lane boundaries used by the game.
// A shared grid avoids overlapping surfaces between the two independent track paths.
export function muniPavingCells(d: MapData, palms: Point[]) {
  const size = 0.5,
    buckets = new Map<string, Segment[]>();
  const key = (x: number, z: number) => `${Math.floor(x / 20)},${Math.floor(z / 20)}`;
  const roads: Segment[] = [
    ...[...d.roads, ...(d.paths || [])].flatMap((r) =>
      r.points.slice(1).map((b, i) => ({ a: r.points[i], b, halfWidth: (r.width ?? 14) / 2 })),
    ),
    ...cyclingStrips(d),
  ];
  for (const s of roads) {
    const margin = s.halfWidth + 1;
    for (
      let x = Math.floor((Math.min(s.a[0], s.b[0]) - margin) / 20);
      x <= Math.floor((Math.max(s.a[0], s.b[0]) + margin) / 20);
      x++
    )
      for (
        let z = Math.floor((Math.min(s.a[1], s.b[1]) - margin) / 20);
        z <= Math.floor((Math.max(s.a[1], s.b[1]) + margin) / 20);
        z++
      ) {
        const k = `${x},${z}`,
          bucket = buckets.get(k) || [];
        bucket.push(s);
        buckets.set(k, bucket);
      }
  }
  const candidates = new Map<string, Point>();
  for (const track of survey.rails)
    for (let i = 1; i < track.points.length; i++) {
      const a = track.points[i - 1],
        b = track.points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / length,
        nz = (b[0] - a[0]) / length;
      for (let u = 0; u <= length; u += size * 0.8)
        for (let offset = -4.5; offset <= 4.5; offset += size * 0.8) {
          const px = a[0] + ((b[0] - a[0]) * u) / length + nx * offset;
          const pz = a[1] + ((b[1] - a[1]) * u) / length + nz * offset;
          const x = Math.floor(px / size),
            z = Math.floor(pz / size);
          candidates.set(`${x},${z}`, [(x + 0.5) * size, (z + 0.5) * size]);
        }
    }
  const cells: { point: Point; light: boolean }[] = [];
  for (const p of candidates.values()) {
    if (
      (buckets.get(key(p[0], p[1])) || []).some(
        (s) => distance(p, s) < s.halfWidth + (size * Math.SQRT2) / 2,
      )
    )
      continue;
    cells.push({
      point: p,
      light: palms.some((tree) => Math.abs(tree[0] - p[0]) < 1.8 && Math.abs(tree[1] - p[1]) < 1.8),
    });
  }
  return { size, cells };
}

export function buildMuniPaving(scene: T.Scene, d: MapData, palms: Point[]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  let seed = 351;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.fillStyle = '#77776b';
  ctx.fillRect(0, 0, 512, 512);
  // Staggered, uneven stone setts: one repeat spans four metres in world space.
  for (let row = 0; row < 20; row++)
    for (let col = -1; col < 16; col++) {
      const x = col * 32 + (row % 2) * 16,
        y = row * 25.6;
      const shade = 158 + Math.floor(random() * 66);
      ctx.fillStyle = `rgb(${shade},${shade},${shade - 9})`;
      ctx.beginPath();
      ctx.roundRect(x + 1.6, y + 1.7, 28.8, 22.2, 3 + random() * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,240,0.23)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 3);
      ctx.lineTo(x + 27, y + 3);
      ctx.stroke();
      for (let speck = 0; speck < 13; speck++) {
        ctx.fillStyle = random() > 0.5 ? 'rgba(65,65,56,0.18)' : 'rgba(255,255,245,0.17)';
        ctx.fillRect(x + 3 + random() * 25, y + 3 + random() * 19, 1, 1);
      }
    }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.anisotropy = 8;
  const materials = ['#999c92', '#e4d6b5'].map(
    (color) =>
      new T.MeshStandardMaterial({
        color,
        map: texture,
        bumpMap: texture,
        bumpScale: 0.055,
        roughness: 1,
        side: T.DoubleSide,
      }),
  );
  const vertices: number[][] = [[], []],
    uvs: number[][] = [[], []];
  const { cells, size } = muniPavingCells(d, palms);
  for (const {
    point: [x, z],
    light,
  } of cells) {
    const index = light ? 1 : 0,
      r = size / 2;
    for (const [px, pz] of [
      [x - r, z - r],
      [x + r, z - r],
      [x - r, z + r],
      [x + r, z - r],
      [x + r, z + r],
      [x - r, z + r],
    ]) {
      vertices[index].push(px, 0.085, pz);
      uvs[index].push(px / 4, pz / 4);
    }
  }
  for (let i = 0; i < 2; i++) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices[i], 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs[i], 2));
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, materials[i]);
    mesh.name = i ? 'Light cobblestone palm surrounds' : 'Gray cobblestone Muni median';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  return () => texture.dispose();
}
