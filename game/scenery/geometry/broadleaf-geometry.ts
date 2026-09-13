import * as T from 'three';

// Photo-inspired street trees: open branching, layered leaf clusters and irregular crowns.
// Seeded by location so reloads keep the same tree, without repeating identical silhouettes.
export function broadleafGeometry(
  x: number,
  z: number,
  height: number,
  seed: number,
  add: (geometry: T.BufferGeometry, material: T.Material) => void,
  materials: { bark: T.Material; leaves: T.Material[] },
  baseHeight = 0.15,
) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const branch = (a: T.Vector3, b: T.Vector3, base: number, tip: number) => {
    const direction = b.clone().sub(a);
    const geometry = new T.CylinderGeometry(tip, base, direction.length(), 7);
    geometry.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()),
    );
    geometry.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    add(geometry, materials.bark);
  };
  const scale = height / 11;
  const root = new T.Vector3(x, baseHeight, z);
  const fork = new T.Vector3(
    x + (random() - 0.5) * 0.7,
    baseHeight + height * 0.34,
    z + (random() - 0.5) * 0.7,
  );
  const bend = root
    .clone()
    .lerp(fork, 0.52)
    .add(new T.Vector3(0.16 * scale, 0, -0.12 * scale));
  branch(root, bend, 0.29 * scale, 0.23 * scale);
  branch(bend, fork, 0.23 * scale, 0.17 * scale);
  const vertices = materials.leaves.map(() => [] as number[]);
  const cluster = (center: T.Vector3, radius: number) => {
    for (let i = 0; i < 70; i++) {
      const azimuth = random() * Math.PI * 2,
        cy = random() * 2 - 1;
      const r = Math.cbrt(random()) * radius,
        horizontal = Math.sqrt(1 - cy * cy);
      const position = center
        .clone()
        .add(
          new T.Vector3(
            Math.cos(azimuth) * horizontal * r,
            cy * r * 0.85,
            Math.sin(azimuth) * horizontal * r,
          ),
        );
      const size = (0.18 + random() * 0.16) * scale;
      const rotation = new T.Euler(
        (random() - 0.5) * 2.4,
        random() * Math.PI * 2,
        (random() - 0.5) * 1.7,
      );
      // A folded, lobed leaf catches light on multiple planes instead of forming a solid ball.
      const outline = [
        [0, 1],
        [0.45, 0.42],
        [0.9, 0.35],
        [0.55, -0.22],
        [0.45, -0.65],
        [0, -0.42],
        [-0.45, -0.65],
        [-0.55, -0.22],
        [-0.9, 0.35],
        [-0.45, 0.42],
      ];
      const out = vertices[Math.floor(random() * vertices.length)];
      const point = (a: number, b: number, fold: number) =>
        new T.Vector3(a * size, fold * size, b * size).applyEuler(rotation).add(position);
      const middle = point(0, 0, 0.14);
      for (let j = 0; j < outline.length; j++) {
        const a = outline[j],
          b = outline[(j + 1) % outline.length];
        out.push(
          ...middle.toArray(),
          ...point(a[0], a[1], 0).toArray(),
          ...point(b[0], b[1], 0).toArray(),
        );
      }
    }
  };
  const twist = random() * Math.PI * 2;
  for (let limb = 0; limb < 5; limb++) {
    const angle = twist + (limb * Math.PI * 2) / 5 + (random() - 0.5) * 0.5;
    const reach = (1.35 + random() * 0.85) * scale;
    const joint = new T.Vector3(
      x + Math.cos(angle) * reach,
      baseHeight + height * (0.58 + random() * 0.12),
      z + Math.sin(angle) * reach,
    );
    branch(fork, joint, 0.13 * scale, 0.065 * scale);
    for (let twig = 0; twig < 3; twig++) {
      const spread = angle + (twig - 1) * 0.85;
      const extension = (0.8 + random() * 0.9) * scale;
      const tip = joint
        .clone()
        .add(
          new T.Vector3(
            Math.cos(spread) * extension,
            (1.15 + random() * 1.6) * scale,
            Math.sin(spread) * extension,
          ),
        );
      branch(joint, tip, 0.052 * scale, 0.012 * scale);
      const leafCenter = tip.clone().add(new T.Vector3(0, 0.25 * scale, 0));
      cluster(leafCenter, (1.15 + random() * 0.45) * scale);
    }
  }
  for (let i = 0; i < vertices.length; i++) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices[i], 3));
    geometry.computeVertexNormals();
    add(geometry, materials.leaves[i]);
  }
}
