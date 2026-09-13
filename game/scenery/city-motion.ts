import * as T from 'three';
import survey from './data/waterfront-geometry.ts';
import type { MapData, Point } from '../types';

// Arc-length sampling keeps speed independent of the spacing of surveyed points.
export function motionPath(points: Point[]) {
  const segments = points.slice(1).flatMap((b, i) => {
    const a = points[i],
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return length > 0 ? [{ a, b, length }] : [];
  });
  const length = segments.reduce((sum, s) => sum + s.length, 0);
  return {
    length,
    at(distance: number, offset = 0) {
      let remaining = Math.max(0, Math.min(length, distance));
      for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        if (remaining <= s.length || i === segments.length - 1) {
          const dx = (s.b[0] - s.a[0]) / s.length,
            dz = (s.b[1] - s.a[1]) / s.length;
          return {
            x: s.a[0] + dx * remaining - dz * offset,
            z: s.a[1] + dz * remaining + dx * offset,
            angle: Math.atan2(dz, dx),
          };
        }
        remaining -= s.length;
      }
      return { x: points[0]?.[0] ?? 0, z: points[0]?.[1] ?? 0, angle: 0 };
    },
  };
}

export function buildCityMotion(scene: T.Scene, data: MapData) {
  const root = new T.Group();
  root.name = 'Animated city life';
  scene.add(root);
  const geometry = new T.BoxGeometry(1, 1, 1);
  const materials = new Map<string, T.MeshStandardMaterial>();
  function box(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    l: number,
    h: number,
    w: number,
  ) {
    if (!materials.has(color))
      materials.set(color, new T.MeshStandardMaterial({ color, roughness: 0.65 }));
    const mesh = new T.Mesh(geometry, materials.get(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(l, h, w);
    parent.add(mesh);
    return mesh;
  }
  type Actor = {
    group: T.Group;
    path: ReturnType<typeof motionPath>;
    speed: number;
    distance: number;
    offset: number;
    walking: boolean;
    limbs: T.Group[];
    direction: number;
  };
  const actors: Actor[] = [];
  function add(points: Point[], speed: number, fraction: number, offset: number, walking = false) {
    const path = motionPath(points),
      group = new T.Group();
    root.add(group);
    const actor = {
      group,
      path,
      speed,
      distance: path.length * fraction,
      offset,
      walking,
      limbs: [] as T.Group[],
      direction: 1,
    };
    actors.push(actor);
    return actor;
  }
  // The two source tracks have opposite directions. Each streetcar stays on its own rails.
  survey.rails.forEach((track, i) => {
    const { group } = add(track.points, 8, i ? 0.65 : 0.38, 0);
    group.name = 'Muni streetcar';
    box(group, '#b73532', 0, 1.15, 0, 14, 1.45, 2.6);
    box(group, '#e9e3cd', 0, 2.42, 0, 13.6, 1.15, 2.55);
    box(group, '#d3d0bd', 0, 3.08, 0, 14.2, 0.22, 2.7);
    for (const side of [-1, 1]) {
      for (let x = -5.5; x < 6; x += 1.35)
        box(group, '#294552', x, 2.45, side * 1.286, 1.02, 0.78, 0.035);
      for (const x of [-4.8, 4.8]) box(group, '#24292b', x, 0.38, side * 0.98, 1.6, 0.55, 0.35);
      box(group, '#294552', side * 6.82, 2.4, 0, 0.035, 0.78, 2.1);
      box(group, '#fff0b0', side * 7.02, 1.15, 0, 0.06, 0.25, 0.35);
    }
    const pole = box(group, '#42494b', -1.8, 4.2, 0, 5, 0.07, 0.07);
    pole.rotation.z = -0.42;
  });
  // Keep the first traffic pass sparse and on long waterfront road segments.
  data.roads
    .filter((r) => /Embarcadero|King Street/.test(r.name))
    .filter((r) => motionPath(r.points).length > 100)
    .slice(0, 8)
    .forEach((road, i) => {
      const { group } = add(road.points, 6 + (i % 3), 0.2 + (i % 3) * 0.25, 3.6);
      group.name = 'Ambient car';
      box(group, ['#345c78', '#e1d7bc', '#ad493e', '#53645c'][i % 4], 0, 0.7, 0, 4.3, 0.85, 1.85);
      box(group, '#344852', -0.2, 1.32, 0, 2.3, 0.65, 1.65);
      for (const x of [-1.35, 1.35])
        for (const z of [-0.92, 0.92]) box(group, '#202526', x, 0.36, z, 0.68, 0.68, 0.18);
      for (const z of [-0.6, 0.6]) box(group, '#fff0bd', 2.16, 0.8, z, 0.04, 0.2, 0.38);
    });
  survey.parkPaths
    .filter((p) => motionPath(p.points).length > 30)
    .slice(0, 10)
    .forEach((path, i) => {
      for (let j = 0; j < 2; j++) {
        const actor = add(
          path.points,
          1.1 + (i % 3) * 0.15,
          0.2 + j * 0.55,
          j ? 0.45 : -0.45,
          true,
        );
        const { group } = actor;
        group.name = 'Walking pedestrian';
        const shirt = ['#b1543e', '#416478', '#dab957', '#637857'][i % 4];
        box(group, shirt, 0, 1.12, 0, 0.34, 0.6, 0.48);
        box(group, '#be9475', 0, 1.63, 0, 0.28, 0.32, 0.29);
        for (const side of [-1, 1]) {
          const leg = new T.Group();
          leg.position.set(0, 0.84, side * 0.14);
          group.add(leg);
          box(leg, '#343e49', 0, -0.36, 0, 0.18, 0.72, 0.18);
          const arm = new T.Group();
          arm.position.set(0, 1.37, side * 0.33);
          group.add(arm);
          box(arm, shirt, 0, -0.27, 0, 0.16, 0.55, 0.16);
          actor.limbs.push(leg, arm);
        }
      }
    });
  // Separate vehicle materials let endpoint fades preserve the models' physical size.
  const vehicleMaterials = new Map<T.Group, T.MeshStandardMaterial[]>();
  for (const actor of actors.filter((a) => !a.walking)) {
    const copies = new Map<T.MeshStandardMaterial, T.MeshStandardMaterial>();
    actor.group.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      const source = object.material as T.MeshStandardMaterial;
      if (!copies.has(source)) copies.set(source, source.clone());
      object.material = copies.get(source)!;
    });
    vehicleMaterials.set(actor.group, [...copies.values()]);
  }
  // Original materials used only by vehicles are no longer attached to the scene.
  const used = new Set<T.Material>();
  root.traverse((object) => {
    if (object instanceof T.Mesh) used.add(object.material as T.Material);
  });
  for (const material of materials.values()) if (!used.has(material)) material.dispose();
  let elapsed = 0;
  function update(dt: number) {
    elapsed += dt;
    for (const actor of actors) {
      const { group, path, speed, walking } = actor;
      actor.distance += dt * speed * actor.direction;
      if (walking) {
        if (actor.distance > path.length || actor.distance < 0) {
          actor.direction *= -1;
          actor.distance = Math.max(0, Math.min(path.length, actor.distance));
        }
      } else if (actor.distance > path.length) actor.distance %= path.length;
      const p = path.at(actor.distance, actor.offset);
      group.position.set(p.x, walking ? 0.14 : 0.12, p.z);
      group.rotation.y = -p.angle + (actor.direction < 0 ? Math.PI : 0);
      // Fade vehicles at the survey boundary rather than teleporting visibly.
      const fade = walking
        ? 1
        : Math.min(1, actor.distance / 18, (path.length - actor.distance) / 18);
      for (const material of vehicleMaterials.get(group) ?? []) {
        const transparent = fade < 1;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
        material.opacity = Math.max(0, fade);
        material.depthWrite = !transparent;
      }
      actor.limbs.forEach((limb, i) => {
        limb.rotation.z = Math.sin(elapsed * speed * 5 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.42;
      });
    }
  }
  update(0);
  return {
    update,
    root,
    counts: {
      streetcars: survey.rails.length,
      cars: actors.filter((a) => !a.walking).length - survey.rails.length,
      pedestrians: actors.filter((a) => a.walking).length,
    },
  };
}
