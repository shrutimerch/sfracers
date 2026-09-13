import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';

export const PIER_40_ID = 104599990;

/** Cream pier warehouse, entrance plaza and moored boats from the supplied street view. */
export function buildPier40(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Pier 40 warehouse and entrance plaza';
  group.position.set(699.5, 0, 481.1);
  group.rotation.y = -Math.PI / 2 - 0.08;
  scene.add(group);
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.9 });
  const cream = mat('#d8d4bf'),
    trim = mat('#ede8d6'),
    dark = mat('#303c36');
  const roof = mat('#77796e'),
    paving = mat('#aaa797'),
    band = mat('#d6cfbb');
  const white = mat('#e7e4d6'),
    soil = mat('#625542'),
    green = mat('#51653b');
  const yellow = mat('#c2a13f'),
    steel = mat('#5a6664'),
    timber = mat('#81745f');
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r * 0.87, h, 16), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  box('cream Pier 40 warehouse', 0, 4.5, -64.3, 32.2, 9, 128.6, cream);
  box('flat warehouse roof', 0, 9.08, -64.3, 32.6, 0.2, 129, roof);
  box('warehouse front parapet', 0, 9.4, 0.04, 32.4, 0.8, 0.35, cream);
  box('front stone cornice', 0, 8.7, 0.22, 32.5, 0.18, 0.5, trim);
  for (let x = -13.5; x <= 14; x += 4.5) {
    box('warehouse front dark glazing', x, 4.2, 0.14, 3.6, 6.7, 0.15, dark);
    for (let dx = -1.5; dx <= 1.5; dx += 0.5)
      box('front window metal mullion', x + dx, 4.2, 0.25, 0.055, 6.7, 0.06, steel);
    for (let y = 1.5; y < 7.5; y += 0.65)
      box('front window transom', x, y, 0.26, 3.6, 0.055, 0.06, steel);
  }
  for (const side of [-1, 1]) {
    box('pier apron', side * 17.4, 0.23, -64, 2.5, 0.35, 131, paving);
    for (let z = -5; z > -127; z -= 6) {
      box('warehouse side window', side * 16.17, 4.6, z, 0.12, 4.8, 4, dark);
      for (const y of [2.8, 4.6, 6.4])
        box('side window transom', side * 16.25, y, z, 0.08, 0.06, 4, steel);
      cylinder('pier timber piling', side * 18, -0.55, z, 0.22, 1.7, timber);
    }
  }
  // The public approach reaches the street, well beyond the warehouse apron.
  // Small running-bond pavers, with color grain and recessed mortar in the bump map.
  const textureSize = 256,
    pixels = new Uint8Array(textureSize * textureSize * 4);
  for (let y = 0; y < textureSize; y++)
    for (let x = 0; x < textureSize; x++) {
      const row = Math.floor(y / 16),
        shifted = (x + (row % 2) * 16) % textureSize;
      const col = Math.floor(shifted / 32),
        mortar = shifted % 32 < 2 || y % 16 < 2;
      const grain = ((x * 13 + y * 7 + x * y) % 9) - 4;
      const shade = mortar ? 105 : 155 + ((row * 17 + col * 11) % 17) + grain;
      const offset = (y * textureSize + x) * 4;
      pixels.set([shade, shade - 3, shade - 13, 255], offset);
    }
  const paverTexture = new T.DataTexture(pixels, textureSize, textureSize);
  paverTexture.wrapS = paverTexture.wrapT = T.RepeatWrapping;
  paverTexture.magFilter = T.LinearFilter;
  paverTexture.minFilter = T.LinearMipmapLinearFilter;
  paverTexture.generateMipmaps = true;
  paverTexture.colorSpace = T.SRGBColorSpace;
  paverTexture.anisotropy = 8;
  paverTexture.needsUpdate = true;
  const paverBump = paverTexture.clone();
  paverBump.colorSpace = T.NoColorSpace;
  paverBump.needsUpdate = true;
  const paverMaterial = new T.MeshStandardMaterial({
    map: paverTexture,
    bumpMap: paverBump,
    bumpScale: 0.045,
    roughness: 0.98,
  });
  const approach = box(
    'Pier 40 small-block paved approach',
    0,
    0.17,
    42,
    40,
    0.18,
    84,
    paverMaterial,
  );
  const positions = approach.geometry.getAttribute('position'),
    uv = approach.geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++)
    uv.setXY(i, positions.getX(i) / 4, positions.getZ(i) / 4);
  uv.needsUpdate = true;
  // Two gently curved borders frame an open central route to the warehouse.
  for (const side of [-1, 1])
    for (let j = 0; j < 64; j++) {
      const z1 = 12 + j * 1.125,
        z2 = z1 + 1.125;
      const edgeX = (z: number) => side * (10 + 7 * Math.pow((z - 12) / 72, 2));
      const x1 = edgeX(z1),
        x2 = edgeX(z2);
      const strip = box(
        'curved pale plaza inlay',
        (x1 + x2) / 2,
        0.28,
        (z1 + z2) / 2,
        Math.hypot(x2 - x1, z2 - z1) + 0.03,
        0.025,
        0.8,
        band,
      );
      strip.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    }
  box('street entrance pale paving band', 0, 0.28, 81, 40, 0.025, 1.1, band);
  for (const [x, z] of [
    [-18, 77],
    [-12, 78],
    [-6, 79],
    [-15, 68],
    [-13, 57],
    [-12, 46],
    [-11, 35],
    [-10.5, 23],
    [17, 78],
    [15, 68],
    [13, 57],
    [12, 46],
    [11, 35],
    [10.5, 23],
  ]) {
    cylinder('white round plaza planter', x, 0.72, z, 1.05, 0.9, white);
    cylinder('planter rolled rim', x, 1.18, z, 1.12, 0.13, trim);
    cylinder('planter soil', x, 1.21, z, 0.91, 0.04, soil);
    const scallop = [];
    for (let j = 0; j <= 64; j++) {
      const a = (j * Math.PI) / 32;
      scallop.push(
        new T.Vector3(
          x + Math.cos(a) * 1.045,
          0.95 + Math.sin(a * 4) * 0.07,
          z + Math.sin(a) * 1.045,
        ),
      );
    }
    const relief = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(scallop), 64, 0.035, 4, false),
      trim,
    );
    relief.name = 'planter decorative wave relief';
    group.add(relief);
    for (let k = 0; k < 12; k++) {
      const a = k * 2.4;
      const plant = new T.Mesh(new T.IcosahedronGeometry(0.25, 1), k % 3 === 0 ? white : green);
      plant.name = 'planter flowers and foliage';
      plant.position.set(x + Math.cos(a) * 0.4, 1.42 + (k % 2) * 0.2, z + Math.sin(a) * 0.4);
      group.add(plant);
    }
  }
  for (const x of [-14, -12, 12, 14])
    cylinder('yellow entrance bollard', x, 0.85, 59, 0.12, 1.3, yellow);
  for (const z of [12, 47]) {
    box('plaza drain', -9, 0.285, z, 1.8, 0.025, 0.55, dark);
    for (let x = -9.8; x < -8.1; x += 0.16)
      box('drain grate bar', x, 0.31, z, 0.04, 0.025, 0.55, steel);
  }
  const textures: T.Texture[] = [paverTexture, paverBump];
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#303c36';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#e7e0bb';
    ctx.textAlign = 'center';
    ctx.font = 'bold 132px Georgia';
    ctx.fillText('40', 512, 140);
    ctx.font = '42px Arial';
    ctx.fillText('SOUTH BEACH HARBOR', 512, 211);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const sign = new T.Mesh(
      new T.PlaneGeometry(9, 2.3),
      new T.MeshStandardMaterial({ map: texture }),
    );
    sign.name = 'Pier 40 harbor sign';
    sign.position.set(0, 8.1, 0.42);
    group.add(sign);
  }
  // Boats lie parallel to the pier, close to its apron, rather than floating in open water.
  for (const [i, z] of [-18, -40, -66, -91, -114].entries()) {
    const boat = new T.Group();
    boat.name = 'Boat moored alongside Pier 40';
    boat.position.set(21.7, 0, z);
    group.add(boat);
    const part = (
      name: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      material: T.Material,
    ) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      boat.add(mesh);
    };
    const shape = new T.Shape();
    shape.moveTo(-1.7, -5.5);
    shape.lineTo(1.7, -5.5);
    shape.lineTo(1.9, 2.5);
    shape.quadraticCurveTo(1.5, 5, 0, 6);
    shape.quadraticCurveTo(-1.5, 5, -1.9, 2.5);
    shape.closePath();
    const hullGeometry = new T.ExtrudeGeometry(shape, {
      depth: 1.15,
      bevelEnabled: false,
      curveSegments: 8,
    });
    hullGeometry.rotateX(Math.PI / 2);
    hullGeometry.translate(0, 1.25, 0);
    const hull = new T.Mesh(hullGeometry, white);
    hull.name = 'pointed moored boat hull';
    boat.add(hull);
    part('boat cabin', 0, 1.65, -0.7, 2.6, 1.1, 3.7, cream);
    part('boat cabin roof', 0, 2.24, -0.7, 2.8, 0.12, 3.9, white);
    for (const x of [-1.32, 1.32]) part('boat cabin windows', x, 1.8, -0.7, 0.04, 0.5, 2.9, dark);
    if (i !== 2) {
      part('sailboat mast', 0, 6.7, 0.8, 0.085, 11.5, 0.085, steel);
      part('furled sail boom', 0, 2.8, -1, 0.13, 0.15, 4.5, white);
    }
    for (const bz of [-3.5, 3.5]) {
      part('pier-side boat fender', -1.95, 0.8, bz, 0.2, 0.75, 0.25, dark);
      part('mooring line to pier', -2.55, 0.65, bz, 1.4, 0.035, 0.035, timber);
    }
    batchFacade(boat);
  }
  batchFacade(group);
  return () => textures.forEach((t) => t.dispose());
}
