import * as T from 'three';
import { batchFacade } from './geometry/batch-facade.ts';
import type { Building } from './geometry/building-geometry';
export const SPC_BUILDING_ID = 1171034242;

export function buildSouthParkCommons(scene: T.Scene, building: Building) {
  const root = new T.Group();
  root.name = 'South Park Commons — 380 Brannan';
  const a = building.points[3],
    b = building.points[4];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  root.position.set(a[0], 0, a[1]);
  root.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  scene.add(root);
  const mat = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.8 });
  const blue = mat('#52626a'),
    trim = mat('#66757b'),
    dark = mat('#202b32'),
    coral = mat('#cb7477'),
    steel = mat('#9ba7a6'),
    glass = mat('#899b9d');
  const box = (
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
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const rod = (a: T.Vector3, b: T.Vector3, r: number) => {
    const delta = b.clone().sub(a);
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, delta.length(), 6), steel);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    mesh.name = 'Fire escape steelwork';
    root.add(mesh);
  };
  // Continuous upper coral band and substantial blue parapet, as in the reference.
  box('Coral parapet stripe', length / 2, 9.8, 0.15, length, 0.88, 0.2, coral);
  box('Blue parapet cap', length / 2, 10.65, 0.2, length + 0.08, 0.38, 0.35, trim);
  box('Upper sill course', length / 2, 6.25, 0.22, length, 0.2, 0.3, trim);
  function arch(
    name: string,
    x: number,
    bottom: number,
    w: number,
    h: number,
    material: T.Material,
    z = 0.22,
  ) {
    const shape = new T.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h - 0.35);
    shape.quadraticCurveTo(0, h + 0.3, -w / 2, h - 0.35);
    shape.closePath();
    const mesh = new T.Mesh(new T.ShapeGeometry(shape), material);
    mesh.position.set(x, bottom, z);
    mesh.name = name;
    root.add(mesh);
  }
  for (let i = 0; i < 8; i++) {
    const x = 1.7 + (i * (length - 3.4)) / 7;
    box('Tall upper window recess', x, 7.83, 0.17, 1.15, 2.25, 0.16, dark);
    box('Upper window glass', x, 7.83, 0.27, 0.96, 2.06, 0.07, glass);
    for (const dx of [-0.48, 0, 0.48])
      box('Window mullion', x + dx, 7.83, 0.33, 0.045, 2.12, 0.04, dark);
    for (let j = 0; j < 5; j++)
      box('Window transom', x, 6.85 + j * 0.49, 0.33, 1, 0.045, 0.04, dark);
  }
  for (const x of [7.9, 10.5, 13.2]) {
    arch('Arched mezzanine window', x, 4.2, 1.4, 1.2, dark);
    box('Mezzanine glass', x, 4.71, 0.27, 1.15, 0.85, 0.07, glass);
    for (const dy of [-0.23, 0, 0.23])
      box('Mezzanine transom', x, 4.7 + dy, 0.33, 1.15, 0.04, 0.04, dark);
    box('Mezzanine mullion', x, 4.71, 0.33, 0.045, 0.85, 0.04, dark);
    box('Mezzanine sill', x, 4.11, 0.25, 1.6, 0.13, 0.3, trim);
  }
  arch('Large arched carriage entrance', 2.5, 0.15, 3.3, 3.6, dark);
  for (let i = 0; i < 13; i++)
    box('Carriage door boards', 1 + i * 0.25, 1.72, 0.3, 0.21, 3.05, 0.07, blue);
  box('Carriage door center seam', 2.5, 1.7, 0.37, 0.065, 3.1, 0.05, dark);
  arch('380 entrance arch', 10.5, 0.15, 1.6, 3.03, trim);
  box('SPC entrance door', 10.5, 1.46, 0.34, 1.25, 2.6, 0.12, dark);
  box('Door mail slot', 10.5, 1.02, 0.42, 0.38, 0.055, 0.025, steel);
  for (const x of [6.75, 13.1, 16.3]) {
    box('Ground window surround', x, 1.7, 0.24, 2.25, 1.85, 0.2, trim);
    box('Ground window glass', x, 1.7, 0.37, 2.02, 1.61, 0.08, glass);
    for (let j = 0; j < 9; j++) {
      const u = x - 0.92 + j * 0.23;
      for (const side of [-1, 1])
        rod(new T.Vector3(u, 0.92, 0.46), new T.Vector3(u + side * 0.13, 2.47, 0.46), 0.012);
    }
  }
  box('Fire escape landing', 11.3, 6.52, 0.95, 3.8, 0.13, 1.7, steel);
  for (const z of [0.22, 1.75]) {
    rod(new T.Vector3(9.4, 7.55, z), new T.Vector3(13.2, 7.55, z), 0.04);
    for (let u = 9.4; u <= 13.2; u += 0.26)
      rod(new T.Vector3(u, 6.58, z), new T.Vector3(u, 7.55, z), 0.022);
  }
  for (const u of [10.8, 11.3])
    rod(new T.Vector3(u, 6.6, 0.45), new T.Vector3(u, 11.55, 0.45), 0.032);
  for (let y = 6.8; y < 11.6; y += 0.3)
    rod(new T.Vector3(10.8, y, 0.45), new T.Vector3(11.3, y, 0.45), 0.023);
  for (const u of [9.6, 12.9]) rod(new T.Vector3(u, 5.7, 0.2), new T.Vector3(u, 6.5, 1.65), 0.045);
  const textures: T.Texture[] = [];
  function lettering(text: string, sub: string, w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#cf7478';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#fff9e5';
    ctx.textAlign = 'center';
    ctx.font = '900 265px sans-serif';
    ctx.fillText(text, 512, 305);
    ctx.font = 'bold 43px sans-serif';
    ctx.fillText(sub, 512, 405);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    return new T.Mesh(
      new T.PlaneGeometry(w, h, 16, 4),
      new T.MeshStandardMaterial({ map: texture, side: T.DoubleSide, roughness: 0.85 }),
    );
  }
  // Projecting flag is readable from the driving approach along Brannan.
  rod(new T.Vector3(11.9, 5.6, 0.2), new T.Vector3(11.9, 5.6, 2.5), 0.045);
  const flagTexture = new T.TextureLoader().load('/brands/spc-flag.svg');
  flagTexture.colorSpace = T.SRGBColorSpace;
  textures.push(flagTexture);
  const flag = new T.Mesh(
    new T.PlaneGeometry(2.1, 1.15, 16, 4),
    new T.MeshStandardMaterial({ map: flagTexture, side: T.DoubleSide, roughness: 0.85 }),
  );
  flag.name = 'SPC projecting flag';
  flag.position.set(11.9, 4.98, 1.4);
  flag.rotation.y = Math.PI / 2;
  const pos = flag.geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 1.05) * 5) * 0.065);
  flag.geometry.computeVertexNormals();
  root.add(flag);
  const nameplate = lettering('SPC', '380 BRANNAN', 1.05, 0.55);
  nameplate.name = 'SPC entrance plaque';
  nameplate.position.set(11.7, 2.8, 0.35);
  root.add(nameplate);
  batchFacade(root);
  return () => textures.forEach((texture) => texture.dispose());
}
