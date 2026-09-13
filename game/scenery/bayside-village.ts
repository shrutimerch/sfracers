import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import { broadleafGeometry } from './geometry/broadleaf-geometry.ts';

// Modeled dimensions from the supplied May 2025 Brannan/Embarcadero reference.
// Plaza stays north of Brannan and west of the Embarcadero carriageways.
export function buildBaysideVillage(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Bayside Village — Brannan entrance';
  scene.add(group);
  const textures: T.Texture[] = [];
  const mat = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.88, side: T.DoubleSide });
  const stone = mat('#c4c3b1'),
    trim = mat('#deddd0'),
    roof = mat('#76877c');
  const wood = mat('#574a3c'),
    glass = mat('#314343'),
    paving = mat('#a69b8b');
  const hedge = mat('#476039');
  const bark = mat('#797568'),
    leaves = ['#354d30', '#476039', '#5b7044', '#708151'].map(mat);
  const mesh = (g: T.BufferGeometry, m: T.Material, name: string) => {
    const object = new T.Mesh(g, m);
    object.name = name;
    group.add(object);
    return object;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
    name: string,
    angle = 0,
  ) => {
    const object = mesh(new T.BoxGeometry(w, h, depth), m, name);
    object.position.set(x, y, z);
    object.rotation.y = angle;
    return object;
  };
  const cylinder = (
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    m: T.Material,
    name: string,
  ) => {
    const object = mesh(new T.CylinderGeometry(radius, radius, height, 32), m, name);
    object.position.set(x, y, z);
    return object;
  };
  const sign = (
    text: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    background: string,
    ink: string,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 192);
    ctx.fillStyle = ink;
    ctx.font = '500 72px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 98, 980);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const panel = mesh(
      new T.PlaneGeometry(width, height),
      new T.MeshStandardMaterial({ map: texture, side: T.DoubleSide }),
      text,
    );
    panel.position.set(x, y, z);
    return panel;
  };
  const outline = [
    [555, 115.8],
    [576, 115.8],
    [587.8, 117.4],
    [591, 124.7],
    [588, 130],
    [576, 129],
    [565, 123],
  ];
  const plaza = new T.ShapeGeometry(new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z))));
  plaza.rotateX(-Math.PI / 2);
  plaza.translate(0, 0.19, 0);
  mesh(plaza, paving, 'Entrance plaza');
  // Brick paving joints, interrupted around the circular monument.
  for (let x = 570; x < 588; x += 0.8)
    box(x, 0.2, 121.5, 0.018, 0.012, 5, stone, 'Plaza paving joint');
  cylinder(583, 0.36, 125, 3.2, 0.34, stone, 'Circular monument lower step');
  cylinder(583, 0.65, 125, 2.6, 0.28, trim, 'Circular monument upper step');
  cylinder(583, 1.04, 125, 1.95, 0.5, stone, 'Bayside Village monument');
  sign('BAYSIDE VILLAGE', 583, 1.07, 127, 3.7, 0.43, '#c4c3b1', '#827550');
  cylinder(583, 5.45, 125, 0.055, 9.1, trim, 'Flagpole');
  const finial = mesh(new T.SphereGeometry(0.11, 8, 6), mat('#bba56a'), 'Flagpole finial');
  finial.position.set(583, 10.06, 125);
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 ? '#f3ede0' : '#a33c3d';
    ctx.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1);
  }
  ctx.fillStyle = '#334969';
  ctx.fillRect(0, 0, 152, (200 * 7) / 13);
  ctx.fillStyle = '#f5f0df';
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < (row % 2 ? 5 : 6); col++) {
      ctx.beginPath();
      ctx.arc(12 + col * 25 + (row % 2 ? 12 : 0), 7 + row * 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  const flagTexture = new T.CanvasTexture(canvas);
  flagTexture.colorSpace = T.SRGBColorSpace;
  textures.push(flagTexture);
  const flagGeometry = new T.PlaneGeometry(2.7, 1.45, 16, 8);
  const positions = flagGeometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++)
    positions.setZ(i, Math.sin(positions.getX(i) * 3 + positions.getY(i)) * 0.16);
  flagGeometry.computeVertexNormals();
  const flag = mesh(
    flagGeometry,
    new T.MeshStandardMaterial({ map: flagTexture, side: T.DoubleSide }),
    'American flag',
  );
  flag.position.set(584.35, 9.12, 125);
  for (const [x, z] of [
    [567, 123],
    [572, 126],
    [577, 128],
    [589, 126],
    [590, 120],
    [561, 118],
  ]) {
    cylinder(x, 0.72, z, 0.23, 1.05, stone, 'Cream entrance bollard');
    cylinder(x, 1.16, z, 0.25, 0.13, trim, 'Bollard cap');
  }
  // Dark timber storefront canopy and glazed entrance at the corner wing.
  box(577.5, 1.65, 116.15, 7.8, 3, 0.15, glass, 'Cafe storefront');
  for (const x of [573.8, 576.3, 578.8, 581.2])
    box(x, 1.8, 116.6, 0.19, 3.3, 0.19, wood, 'Cafe timber post');
  box(577.5, 3.5, 117, 8.8, 0.22, 2.8, wood, 'Cafe canopy');
  sign('THE SOCIALITE', 577.5, 3.3, 118.44, 3.5, 0.55, '#393e38', '#e7e4d5');
  sign('LEASING OFFICE', 577.5, 6.2, 116, 4, 0.38, '#c4c3b1', '#eeeee3');
  // Small green hipped roof above the corner's low-rise wing.
  const cap = mesh(new T.ConeGeometry(6.6, 1.6, 4), roof, 'Green hipped roof');
  cap.scale.set(1, 1, 0.8);
  cap.rotation.y = Math.PI / 4 + 0.78;
  cap.position.set(576.5, 11.8, 104);
  box(576.5, 13.3, 104, 1.6, 1.8, 1.4, stone, 'Roof vent');
  box(576.5, 14.2, 104, 1.65, 0.12, 1.45, wood, 'Roof vent cap');
  for (const [x, z, h] of [
    [567, 118, 10.4],
    [585, 114, 10.8],
    [580, 97, 11.4],
    [581, 85, 10.2],
    [568, 99, 9.5],
  ]) {
    broadleafGeometry(
      x,
      z,
      h,
      Math.round(x * 347 + z * 977),
      (g, m) => mesh(g, m, 'Bayside branching tree'),
      { bark, leaves },
    );
  }
  for (const [x, z, width] of [
    [566, 117, 6],
    [582, 99, 5],
  ]) {
    box(x, 0.46, z, width, 0.5, 1.6, stone, 'Low planter wall');
    box(x, 0.82, z, width - 0.3, 0.4, 1.3, hedge, 'Clipped planter hedge');
  }
  batchFacade(group);
  return () => textures.forEach((texture) => texture.dispose());
}
