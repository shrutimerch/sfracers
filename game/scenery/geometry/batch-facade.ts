import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Keep detailed architecture inexpensive: one draw call per facade material. */
export function batchFacade(group: T.Group) {
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const counts: Record<string, number> = {};
  for (const child of group.children.slice()) {
    if (!(child instanceof T.Mesh) || Array.isArray(child.material)) continue;
    counts[child.name] = (counts[child.name] || 0) + 1;
    if (child.name.startsWith('American flag')) continue;
    child.updateMatrix();
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    geometry.applyMatrix4(child.matrix);
    const batch = batches.get(child.material) || [];
    batch.push(geometry);
    batches.set(child.material, batch);
    group.remove(child);
    child.geometry.dispose();
  }
  group.userData.featureCounts = counts;
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) throw Error('Could not merge facade geometry');
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
}
