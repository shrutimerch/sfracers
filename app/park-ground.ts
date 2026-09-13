import * as T from 'three';
// Seamless fine grass texture with blades and low-frequency color variation; no source photographs.
export function parkGrass() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  let seed = 491;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.fillStyle = '#61763e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 55000; i++) {
    const x = rand() * 512,
      y = rand() * 512,
      v = rand();
    ctx.strokeStyle = v < 0.28 ? '#354c28' : v < 0.6 ? '#607941' : v < 0.88 ? '#78934b' : '#9aa369';
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y - 1 - rand() * 5);
    ctx.stroke();
  }
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.anisotropy = 8;
  const material = new T.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.055,
    roughness: 1,
    side: T.DoubleSide,
  });
  return { material, texture };
}
