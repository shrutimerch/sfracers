import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function startSignal(mode: string, count: number, time: number) {
  if (mode === 'countdown') return count > 2 ? 0 : 1;
  if (mode === 'racing' && time < 2.5) return 2;
  return -1;
}

// A small cloud-riding turtle holds the starting lights, facing the grid.
export function createStartMarshal(scene: T.Scene, start: { x: number; z: number; a: number }) {
  const root = new T.Group();
  root.name = 'Turtle on a cloud — race starter';
  root.scale.setScalar(0.48);
  root.rotation.y = -start.a - Math.PI / 2;
  scene.add(root);
  const sphere = new T.SphereGeometry(1, 20, 14);
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.45 });
  const white = material('#fffdf3'),
    green = material('#549c45'),
    gold = material('#f5cd59');
  const shell = material('#287249'),
    dark = material('#263647'),
    cream = material('#ffe6a0');
  function egg(m: T.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    const mesh = new T.Mesh(sphere, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    return mesh;
  }
  for (const [x, y, z, s] of [
    [-0.9, 0, 0, 0.62],
    [-0.42, 0.1, 0.05, 0.74],
    [0.3, 0.03, 0, 0.8],
    [0.95, 0, 0, 0.52],
    [0, -0.19, 0.3, 0.65],
  ])
    egg(white, x, y, z, s, s * 0.62, s * 0.75);
  // Shell rim, belly, rounded head and bright aviator goggles.
  egg(cream, 0, 0.85, -0.18, 0.62, 0.69, 0.34);
  egg(shell, 0, 0.88, -0.33, 0.58, 0.63, 0.34);
  egg(gold, 0, 0.79, 0.17, 0.43, 0.54, 0.34);
  egg(green, 0, 1.56, 0.1, 0.48, 0.45, 0.41);
  egg(gold, 0, 1.4, 0.45, 0.4, 0.22, 0.24);
  for (const side of [-1, 1]) {
    egg(gold, side * 0.5, 0.76, 0.26, 0.18, 0.35, 0.18).rotation.z = side * 0.5;
    egg(dark, side * 0.23, 1.66, 0.45, 0.235, 0.23, 0.08);
    egg(white, side * 0.23, 1.67, 0.51, 0.18, 0.175, 0.055);
    egg(dark, side * 0.23, 1.67, 0.56, 0.065, 0.095, 0.025);
    egg(white, side * 0.21, 1.71, 0.58, 0.023, 0.026, 0.01);
    const rope = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.92, 6), dark);
    rope.position.set(side * 0.72, -0.4, 0.36);
    root.add(rope);
  }
  const panel = new T.Mesh(new RoundedBoxGeometry(2.55, 0.88, 0.28, 3, 0.13), dark);
  panel.position.set(0, -1, 0.36);
  root.add(panel);
  const lights = ['#ff433d', '#ffd23f', '#54ee89'].map((color, i) => {
    const m = new T.MeshStandardMaterial({ color, emissive: color, roughness: 0.25 });
    egg(dark, (i - 1) * 0.8, -1, 0.53, 0.34, 0.34, 0.075);
    egg(m, (i - 1) * 0.8, -1, 0.59, 0.27, 0.27, 0.07);
    return m;
  });
  function update(mode: string, count: number, time: number, elapsed: number, groundHeight = 0) {
    // Pause freezes the pose and signal, including a paused countdown.
    if (mode === 'paused') return;
    const signal = startSignal(mode, count, time);
    root.visible = signal >= 0;
    root.position.set(
      start.x,
      groundHeight +
        4.8 +
        Math.sin(elapsed * 2.5) * 0.12 +
        (signal === 2 ? Math.max(0, time - 1) * 3 : 0),
      start.z,
    );
    root.rotation.z = Math.sin(elapsed * 1.8) * 0.035;
    lights.forEach((m, i) => {
      m.emissiveIntensity = i === signal ? 2.4 : 0;
      m.color.set(['#ff433d', '#ffd23f', '#54ee89'][i]).multiplyScalar(i === signal ? 1 : 0.17);
    });
  }
  root.visible = false;
  return { root, update, lights };
}
