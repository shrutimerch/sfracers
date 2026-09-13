import * as T from 'three';

// A compact, closed-cabin Cybertruck silhouette in the existing kart footprint.
export function buildCybertruck(parent: T.Group, environment?: T.Texture) {
  const steel = new T.MeshPhysicalMaterial({
    color: '#aab6bc',
    metalness: 0.8,
    roughness: 0.32,
    envMap: environment ?? null,
  });
  const dark = new T.MeshStandardMaterial({ color: '#1b242d', roughness: 0.7 });
  const glass = new T.MeshPhysicalMaterial({
    color: '#28475d',
    metalness: 0.1,
    roughness: 0.15,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: T.DoubleSide,
    envMap: environment ?? null,
  });
  const light = new T.MeshStandardMaterial({
    color: '#e8faff',
    emissive: '#b7edff',
    emissiveIntensity: 1,
  });
  const red = new T.MeshStandardMaterial({
    color: '#ef3449',
    emissive: '#b00a20',
    emissiveIntensity: 0.5,
  });
  const add = (name: string, geometry: T.BufferGeometry, material: T.Material) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const profile = (name: string, points: number[][], depth: number, material: T.Material) => {
    const shape = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
    const geometry = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    geometry.translate(0, 0, -depth / 2);
    return add(name, geometry, material);
  };
  const panel = (name: string, vertices: number[][], material: T.Material) => {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices.flat(), 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    return add(name, geometry, material);
  };
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
    const mesh = add(name, new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    return mesh;
  };
  profile(
    'Stainless angular body',
    [
      [-1.72, 0.58],
      [-1.72, 1.24],
      [-0.76, 1.43],
      [0.17, 1.3],
      [1.72, 1.08],
      [1.72, 0.58],
      [1.52, 0.58],
      [1.36, 0.99],
      [0.71, 0.99],
      [0.53, 0.58],
      [-0.53, 0.58],
      [-0.71, 0.99],
      [-1.36, 0.99],
      [-1.52, 0.58],
    ],
    1.62,
    steel,
  );
  for (const side of [-1, 1]) {
    const z = side * 0.81;
    const window = panel(
      'Dark side windows',
      [
        [-0.75, 1.45, z],
        [0.08, 1.93, z * 0.87],
        [1.04, 1.26, z],
        [-0.7, 1.26, z],
      ],
      glass,
    );
    window.castShadow = false;
    box('Door seam', -0.17, 1.03, z * 1.007, 0.012, 0.55, 0.012, dark);
    box('Window pillar', -0.17, 1.55, z * 0.94, 0.05, 0.52, 0.028, steel);
    box('Flush door handle', -0.29, 1.2, z * 1.012, 0.15, 0.026, 0.018, dark);
    box('Black rocker trim', 0, 0.6, z, 1.12, 0.105, 0.05, dark);
    for (const x of [-1.02, 1.02]) {
      const arch = profile(
        'Angular wheel arch',
        [
          [x - 0.52, 0.56],
          [x - 0.37, 1.02],
          [x + 0.35, 1.02],
          [x + 0.52, 0.56],
          [x + 0.44, 0.56],
          [x + 0.29, 0.94],
          [x - 0.3, 0.94],
          [x - 0.44, 0.56],
        ],
        0.08,
        dark,
      );
      arch.position.z = z;
    }
    profile(
      'Triangular mirror',
      [
        [0.48, 1.35],
        [0.64, 1.47],
        [0.72, 1.33],
      ],
      0.18,
      dark,
    ).position.z = side * 0.86;
  }
  const windshield = panel(
    'Panoramic windshield',
    [
      [0.1, 1.94, -0.7],
      [0.1, 1.94, 0.7],
      [1.08, 1.27, 0.8],
      [1.08, 1.27, -0.8],
    ],
    glass,
  );
  windshield.castShadow = false;
  panel(
    'Wedge roof',
    [
      [-0.79, 1.46, -0.8],
      [-0.79, 1.46, 0.8],
      [0.1, 1.96, 0.71],
      [0.1, 1.96, -0.71],
    ],
    steel,
  ).material.side = T.DoubleSide;
  panel(
    'Sloped rear bed cover',
    [
      [-1.67, 1.25, -0.73],
      [-1.67, 1.25, 0.73],
      [-0.8, 1.43, 0.73],
      [-0.8, 1.43, -0.73],
    ],
    dark,
  ).material.side = T.DoubleSide;
  box('Full width front light bar', 1.731, 1.071, 0, 0.028, 0.045, 1.61, light);
  box('Front bumper', 1.74, 0.56, 0, 0.08, 0.15, 1.67, dark);
  box('Lower grille', 1.749, 0.73, 0, 0.022, 0.105, 0.74, dark);
  box('Rear bumper', -1.74, 0.56, 0, 0.08, 0.15, 1.67, dark);
  box('Rear light bar', -1.736, 1.225, 0, 0.022, 0.044, 1.56, red);
  return { materials: [steel, dark, glass, light, red] };
}
