import * as T from 'three';
import type { MapData, StreetSign } from '../types';

function nameTexture(name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#126044';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.strokeRect(9, 9, 1006, 142);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 88px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 512, 84, 940);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Separate front/back faces keep lettering readable from both directions. */
export function createStreetSignGroup(
  sign: StreetSign,
  labelMaterial: (name: string) => T.Material,
  poleMaterial: T.Material,
) {
  const group = new T.Group();
  group.name = sign.id;
  group.userData.streetNames = sign.streetNames;
  group.position.set(sign.position[0], 0, sign.position[1]);
  const top = Math.max(4.3, 2.8 + sign.blades.length * 0.8);
  const pole = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, top + 0.25, 8), poleMaterial);
  pole.position.y = (top + 0.25) / 2;
  group.add(pole);
  for (const [index, blade] of sign.blades.entries()) {
    const board = new T.Group();
    board.name = blade.name;
    board.position.y = top - index * 0.8;
    board.rotation.y = -blade.angle;
    const width = Math.max(3.8, Math.min(6.4, blade.name.length * 0.24));
    const geometry = new T.PlaneGeometry(width, 0.72);
    const material = labelMaterial(blade.name);
    const front = new T.Mesh(geometry, material);
    front.position.z = 0.025;
    const back = new T.Mesh(geometry, material);
    back.rotation.y = Math.PI;
    back.position.z = -0.025;
    board.add(front, back);
    group.add(board);
  }
  return group;
}

export function visibleStreetSigns(d: MapData) {
  return (d.streetSigns || []).filter((sign) =>
    d.route.slice(1).some((b, i) => {
      const a = d.route[i];
      const [x, z] = sign.intersectionPosition;
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
      return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) <= 180;
    }),
  );
}

export function buildStreetSigns(scene: T.Scene, d: MapData) {
  const materials = new Map<string, T.MeshBasicMaterial>();
  const poleMaterial = new T.MeshStandardMaterial({
    color: '#a2aaa6',
    roughness: 0.55,
    metalness: 0.5,
  });
  const labelMaterial = (name: string) => {
    let material = materials.get(name);
    if (!material) {
      material = new T.MeshBasicMaterial({ map: nameTexture(name), toneMapped: false });
      materials.set(name, material);
    }
    return material;
  };
  for (const sign of visibleStreetSigns(d)) {
    scene.add(createStreetSignGroup(sign, labelMaterial, poleMaterial));
  }
  // World teardown disposes meshes/materials; texture resources are owned here.
  return () => {
    materials.forEach((material) => material.map?.dispose());
    poleMaterial.dispose();
  };
}
