import * as T from 'three';
// Dense feather-palm crown: outer fronds droop, inner spears rise. Shape is illustrative; locations are mapped.
export function palmGeometry(
  x: number,
  z: number,
  height: number,
  add: (g: T.BufferGeometry, m: T.Material) => void,
  materials: { bark: T.Material; leaves: T.Material[] },
) {
  const trunk = new T.CylinderGeometry(0.48, 0.67, height, 16, 30);
  const p = trunk.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i),
      r = 1 + 0.035 * Math.sin(y * 28);
    p.setXYZ(i, p.getX(i) * r, y, p.getZ(i) * r);
  }
  trunk.computeVertexNormals();
  trunk.translate(x, height / 2, z);
  add(trunk, materials.bark);
  for (let y = 0.3; y < height - 0.3; y += 0.32) {
    const g = new T.TorusGeometry(0.67 - (y / height) * 0.19, 0.027, 3, 16);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    add(g, materials.bark);
  }
  const verts: number[][] = [[], [], []];
  for (let f = 0; f < 48; f++) {
    const layer = f < 20 ? 0 : f < 37 ? 1 : 2,
      n = layer === 0 ? 20 : layer === 1 ? 17 : 11,
      k = layer === 0 ? f : layer === 1 ? f - 20 : f - 37,
      a = (k * Math.PI * 2) / n + layer * 0.21,
      reach = [5.2, 4.6, 3.3][layer] + Math.sin(f * 2.37) * 0.65,
      lift = [1.6, 2.0, 2.6][layer] + Math.sin(f * 1.1) * 0.7,
      drop = [3.8, 1.8, -0.6][layer] + Math.sin(f * 0.79) * 0.7;
    const at = (t: number) =>
      new T.Vector3(
        x + Math.cos(a) * reach * t,
        height + lift * Math.sin(t * Math.PI * 0.7) - drop * t * t,
        z + Math.sin(a) * reach * t,
      );
    const curve = new T.CatmullRomCurve3(Array.from({ length: 10 }, (_, j) => at(j / 9)));
    add(new T.TubeGeometry(curve, 16, 0.04, 4, false), materials.leaves[layer]);
    const out = verts[layer];
    for (let j = 2; j < 32; j++) {
      const t = j / 33,
        c = at(t),
        length = 1.5 * Math.pow(Math.sin(t * Math.PI), 0.7),
        width = 0.13 * Math.sin(t * Math.PI) + 0.035;
      for (const side of [-1, 1]) {
        const mid = new T.Vector3(
            c.x - Math.sin(a) * length * 0.58 * side + Math.cos(a) * 0.25,
            c.y - 0.12,
            c.z + Math.cos(a) * length * 0.58 * side + Math.sin(a) * 0.25,
          ),
          tip = new T.Vector3(
            c.x - Math.sin(a) * length * side + Math.cos(a) * 0.65,
            c.y - 0.55,
            c.z + Math.cos(a) * length * side + Math.sin(a) * 0.65,
          );
        const l = mid.clone().add(new T.Vector3(Math.cos(a) * width, 0.045, Math.sin(a) * width)),
          r = mid.clone().add(new T.Vector3(-Math.cos(a) * width, -0.045, -Math.sin(a) * width));
        out.push(
          ...c.toArray(),
          ...l.toArray(),
          ...r.toArray(),
          ...l.toArray(),
          ...tip.toArray(),
          ...r.toArray(),
        );
      }
    }
  }
  verts.forEach((v, i) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    add(g, materials.leaves[i]);
  });
  const crown = new T.SphereGeometry(1, 12, 8);
  crown.scale(1.2, 1.6, 1.2);
  crown.translate(x, height + 0.15, z);
  add(crown, materials.leaves[0]);
}
