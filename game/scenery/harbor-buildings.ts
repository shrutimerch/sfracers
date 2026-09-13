import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Existing OSM footprints replaced by low waterfront structures from the supplied
// May 2025 photo. Dimensions and patio layout are visual estimates.
export const HARBOR_BUILDING_IDS = new Set([148551355, 572156641]);

export function buildHarborBuildings(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'South Beach harbor cafes and octopus mural';
  scene.add(group);
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.9 });
  const cream = mat('#d9d5bd'),
    blue = mat('#35546b'),
    roof = mat('#8e9995');
  const glass = mat('#263b41'),
    wood = mat('#92765a'),
    steel = mat('#455758');
  const paving = mat('#bcb7a6'),
    red = mat('#b75131');
  // Local X runs along the facade; local +Z faces the road to the west.
  const origin = new T.Vector3(633, 0, 513);
  const rotation = -Math.PI / 2;
  const point = (x: number, y: number, z: number) =>
    new T.Vector3(x, y, z).applyAxisAngle(new T.Vector3(0, 1, 0), rotation).add(origin);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const g = new T.BoxGeometry(w, h, depth);
    g.rotateY(rotation);
    g.translate(...point(x, y, z).toArray());
    const list = batches.get(m) || [];
    list.push(g);
    batches.set(m, list);
  };
  box(0, 0.14, 5, 27, 0.25, 20, paving);
  box(0, 2, 0, 14, 4, 8, cream);
  box(0, 4.08, 0, 14.6, 0.23, 8.6, roof);
  box(0, 3.87, 4.1, 14.6, 0.25, 0.2, blue);
  box(0, 0.35, 4.1, 14, 0.45, 0.15, blue);
  for (const x of [-6.9, 6.9]) box(x, 2, 4.12, 0.2, 4, 0.2, blue);
  // Subtle siding joints remain visible beside the mural.
  for (let y = 0.7; y < 3.8; y += 0.32) box(0, y, 4.02, 13.8, 0.026, 0.035, roof);
  const window = (x: number, width: number, y = 2.15, height = 1.75) => {
    box(x, y, 4.12, width + 0.24, height + 0.24, 0.14, blue);
    box(x, y, 4.22, width, height, 0.08, glass);
    box(x, y, 4.3, 0.065, height, 0.06, cream);
    box(x, y, 4.3, width, 0.065, 0.06, cream);
  };
  window(2, 1.55);
  window(4.05, 1.55);
  window(6, 1.25);
  box(0.05, 1.45, 4.13, 1.3, 2.9, 0.16, blue);
  box(0.05, 1.6, 4.26, 0.94, 2.25, 0.1, glass);
  box(0.4, 1.2, 4.34, 0.08, 0.2, 0.05, cream);
  box(3.3, 3.18, 4.8, 7.2, 0.16, 1.7, blue);
  // Generated original mural inspired by the photograph, mounted as a wall texture.
  let disposed = false;
  const mural = new T.TextureLoader().load('/textures/harbor-octopus-mural.png', (texture) => {
    if (disposed) texture.dispose();
  });
  mural.colorSpace = T.SRGBColorSpace;
  const muralMesh = new T.Mesh(
    new T.PlaneGeometry(5.6, 3.1),
    new T.MeshStandardMaterial({ map: mural, roughness: 0.95 }),
  );
  muralMesh.name = 'Street-facing octopus mural';
  muralMesh.position.copy(point(-3.65, 2.02, 4.2));
  muralMesh.rotation.y = rotation;
  group.add(muralMesh);
  const textures: T.Texture[] = [mural];
  const label = (text: string, x: number, y: number, z: number, width: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#e5e0c9';
    ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = '#2e4858';
    ctx.font = 'bold 70px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 66);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const mesh = new T.Mesh(
      new T.PlaneGeometry(width, 0.65),
      new T.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
    );
    mesh.position.copy(point(x, y, z));
    mesh.rotation.y = rotation;
    group.add(mesh);
  };
  label('FRANKIE’S', 3.1, 3.62, 4.22, 5.2);
  // Adjacent low harbor kiosk and weathered timber patio fence to the north.
  box(-18, 1.65, -0.5, 8, 3.3, 7, cream);
  box(-18, 3.37, -0.5, 8.6, 0.2, 7.5, blue);
  for (const x of [-20.5, -18, -15.5]) box(x, 1.95, 3.06, 1.7, 1.6, 0.12, glass);
  label('SOUTH BEACH HARBOR', -18, 2.95, 3.16, 7.2);
  for (let i = 0; i < 18; i++) box(-25 + i * 0.7, 0.9, 9, 0.5, 1.5, 0.15, wood);
  for (const y of [0.55, 1.3]) box(-19, y, 9.1, 12.5, 0.14, 0.12, steel);
  // Picnic tables and separate benches leave the pedestrian frontage open.
  for (const [x, z] of [
    [-17, 6],
    [-10, 6],
    [-5, 8],
    [3, 8],
    [9, 7],
  ]) {
    box(x, 0.88, z, 2.5, 0.12, 1.25, wood);
    for (const side of [-1, 1]) {
      box(x, 0.48, z + side * 0.95, 2.7, 0.1, 0.34, wood);
      for (const dx of [-0.85, 0.85]) box(x + dx, 0.43, z + side * 0.6, 0.1, 0.85, 0.1, steel);
    }
  }
  // Bike Hut occupies its own retained map location farther north.
  box(-42.5, 1.5, -8.2, 5.2, 3, 6.6, cream);
  box(-42.5, 3.1, -8.2, 5.7, 0.2, 7, roof);
  box(-42.5, 1.45, -4.82, 2.8, 2.55, 0.15, blue);
  label('THE BIKE HUT', -42.5, 2.78, -4.7, 4.3);
  // Small planters and bins on the patio edges.
  for (const x of [-23, 10]) {
    box(x, 0.5, 5, 1.2, 1, 1.2, wood);
    box(x, 1.1, 5, 1.3, 0.65, 1.3, mat('#526b38'));
  }
  for (const x of [-8, 7]) box(x, 0.55, 11, 0.55, 1.1, 0.55, steel);
  box(-23, 0.6, 1.5, 0.65, 1.2, 0.65, red);
  for (const [m, geometries] of batches) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error('Harbor building geometry could not be merged');
    const mesh = new T.Mesh(geometry, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  return () => {
    disposed = true;
    textures.forEach((t) => t.dispose());
  };
}
