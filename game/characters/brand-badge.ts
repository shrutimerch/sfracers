import * as T from 'three';
import type { CharacterId } from './roster.ts';
export const REAR_BRANDS: Partial<Record<CharacterId, string>> = {
  sam: 'OpenAI',
  dario: 'Anthropic',
  elon: 'Tesla',
  mark: 'Meta',
  garry: 'Y Combinator',
  pejman: 'Pear',
  andrew: 'Speedrun / a16z',
  aditya: 'SPC',
};
export function createBrandBadge(id: CharacterId) {
  if (!REAR_BRANDS[id]) return null;
  const texture =
    typeof document === 'undefined' ? null : new T.TextureLoader().load(`/brands/badge-${id}.svg`);
  if (texture) {
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
  }
  const material = new T.MeshBasicMaterial({ map: texture, color: '#ffffff', toneMapped: false });
  // A broad rear panel spans the body and bumper; the mark fills the panel.
  const mesh = new T.Mesh(new T.PlaneGeometry(2.1, 1.15), material);
  mesh.name = `${REAR_BRANDS[id]} rear badge`;
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(id === 'elon' ? -1.79 : -1.55, 1.05, 0);
  return { mesh, texture, material };
}
