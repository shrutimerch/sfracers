import * as T from 'three';
import type { FacadeKind } from '../building-geometry';
import type { Facades } from './types';
export async function loadFacades(): Promise<Facades> {
  const loader = new T.TextureLoader();
  const names: FacadeKind[] = ['brick', 'masonry', 'glass'];
  const entries = await Promise.all(
    names.map(async (name) => {
      const texture = await loader.loadAsync(`/textures/${name}-facade.png`);
      texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = T.RepeatWrapping;
      texture.wrapT = T.RepeatWrapping;
      texture.minFilter = T.LinearMipmapLinearFilter;
      texture.magFilter = T.LinearFilter;
      return [name, texture] as const;
    }),
  );
  return Object.fromEntries(entries) as Facades;
}
