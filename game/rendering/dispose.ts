import * as T from 'three';
export function disposeScene(scene: T.Scene) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    } else if (o instanceof T.Sprite) materials.add(o.material);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
