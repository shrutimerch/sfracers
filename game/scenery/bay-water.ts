import * as T from 'three';

// Small seamless wind-ripple maps, generated once and shared by every bay polygon.
export function createBayWater() {
  const size = 256,
    color = new Uint8Array(size * size * 4),
    height = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2;
      const ripple =
        0.48 * Math.sin(2 * u + 24 * v + 0.7 * Math.sin(3 * u + 2 * v)) +
        0.28 * Math.sin(-3 * u + 37 * v) +
        0.14 * Math.sin(7 * u + 11 * v) +
        0.1 * Math.sin(13 * u - 5 * v);
      const i = (y * size + x) * 4,
        h = Math.round(128 + ripple * 95);
      const shade = Math.round(218 + ripple * 20);
      color[i] = shade - 8;
      color[i + 1] = shade;
      color[i + 2] = shade + 3;
      color[i + 3] = 255;
      height[i] = height[i + 1] = height[i + 2] = h;
      height[i + 3] = 255;
    }
  const map = new T.DataTexture(color, size, size, T.RGBAFormat);
  map.colorSpace = T.SRGBColorSpace;
  const bump = new T.DataTexture(height, size, size, T.RGBAFormat);
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(1 / 24, 1 / 24);
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
  const material = new T.MeshStandardMaterial({
    color: '#829fa0',
    map,
    bumpMap: bump,
    bumpScale: 0.16,
    roughness: 0.36,
    metalness: 0.28,
    side: T.DoubleSide,
  });
  return {
    material,
    update(seconds: number) {
      map.offset.set((seconds * 0.008) % 1, (seconds * 0.003) % 1);
      bump.offset.copy(map.offset);
    },
    dispose() {
      map.dispose();
      bump.dispose();
    },
  };
}
