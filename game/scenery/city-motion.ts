import { buildParkDogs } from './park-dogs.ts';
import * as T from 'three';
import survey from './data/waterfront-geometry.ts';
import type { TrafficObstacle } from '../simulation/traffic-collision';
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
    const mesh = new T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>(
      geometry,
      materials.get(color),
    );
    mesh.position.set(x, y, z);
    mesh.scale.set(l, h, w);
    parent.add(mesh);
    return mesh;
  }
  const rounded = new T.SphereGeometry(0.5, 12, 8);
  const tapered = new T.CylinderGeometry(0.5, 0.38, 1, 10);
  function bodyPart(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    tube = false,
  ) {
    const mesh = box(parent, color, x, y, z, width, height, depth);
    mesh.geometry = tube ? tapered : rounded;
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
  // These mapped lines are individual carriageways, not the whole boulevard.
  // Keep cars in the outer motor lane, clear of the curbside bike lane/promenade.
  // King Street's divider is at -0.8 m and its bike lane starts at +2.875 m.
  const carLaneOffset = 0.75;
  // Keep the first traffic pass sparse and on long waterfront road segments.
  data.roads
    .filter((r) => /Embarcadero|King Street/.test(r.name))
    .filter((r) => motionPath(r.points).length > 100)
    .slice(0, 8)
    .forEach((road, i) => {
      const { group } = add(road.points, 6 + (i % 3), 0.2 + (i % 3) * 0.25, carLaneOffset);
      group.name = 'Ambient car';
      box(group, ['#345c78', '#e1d7bc', '#ad493e', '#53645c'][i % 4], 0, 0.7, 0, 4.3, 0.85, 1.85);
      box(group, '#344852', -0.2, 1.32, 0, 2.3, 0.65, 1.65);
      for (const x of [-1.35, 1.35])
        for (const z of [-0.92, 0.92]) box(group, '#202526', x, 0.36, z, 0.68, 0.68, 0.18);
      for (const z of [-0.6, 0.6]) box(group, '#fff0bd', 2.16, 0.8, z, 0.04, 0.2, 0.38);
    });
  const walkingPaths = [
    ...survey.parkPaths.map((path) => ({ ...path, width: 2, promenade: false })),
    ...(data.paths ?? []).map((path) => ({ ...path, promenade: true })),
  ];
  walkingPaths
    .filter((p) => motionPath(p.points).length > 30)
    .forEach((path, i) => {
      const length = motionPath(path.points).length;
      const count = Math.min(
        path.promenade ? 48 : 18,
        Math.max(4, Math.ceil(length / (path.promenade ? 8 : 12))),
      );
      for (let j = 0; j < count; j++) {
        const variation = ((i * 37 + j * 17) % 101) / 101;
        const side = j % 2 ? 1 : -1;
        const lateral = path.promenade
          ? 0.8 + variation * Math.min(2.5, path.width / 2 - 1.3)
          : 0.35 + variation * 0.18;
        const actor = add(
          path.points,
          0.95 + variation * 0.6,
          (j + 0.25 + variation * 0.5) / count,
          side * lateral,
          true,
        );
        actor.direction = side;
        const { group } = actor;
        group.scale.setScalar(0.91 + variation * 0.17);
        group.name = 'Walking pedestrian';
        const shirt = ['#b1543e', '#416478', '#dab957', '#637857', '#784f76', '#e0d5bb'][
          (i + j) % 6
        ];
        const skin = ['#e2b89a', '#bd8967', '#8b5c42', '#62402f'][(i * 3 + j) % 4];
        const hair = ['#29221f', '#654333', '#b28b55', '#b9b5ae'][(i + j * 3) % 4];
        const trousers = ['#344253', '#41403d', '#796e5b'][(i + j) % 3];
        // Human proportions: a shaped ribcage, shoulders, pelvis and a small oval head.
        bodyPart(group, shirt, 0, 1.17, 0, 0.25, 0.53, 0.43, true);
        bodyPart(group, shirt, 0, 1.35, 0, 0.26, 0.21, 0.47);
        bodyPart(group, trousers, 0, 0.91, 0, 0.26, 0.25, 0.32);
        bodyPart(group, skin, 0, 1.49, 0, 0.105, 0.16, 0.11, true);
        bodyPart(group, skin, 0.015, 1.65, 0, 0.205, 0.28, 0.19);
        bodyPart(group, skin, 0.117, 1.64, 0, 0.057, 0.067, 0.045);
        bodyPart(group, hair, -0.022, 1.735, 0, 0.2, 0.15, 0.205);
        if (j % 3 === 0) bodyPart(group, hair, -0.088, 1.61, 0, 0.14, 0.24, 0.21);
        for (const side of [-1, 1]) {
          const leg = new T.Group();
          leg.position.set(0, 0.88, side * 0.105);
          group.add(leg);
          bodyPart(leg, trousers, 0, -0.2, 0, 0.15, 0.4, 0.16, true);
          const knee = new T.Group();
          knee.name = 'knee';
          knee.position.y = -0.4;
          leg.add(knee);
          bodyPart(knee, trousers, 0, -0.18, 0, 0.115, 0.36, 0.12, true);
          bodyPart(knee, '#292c30', 0.055, -0.395, 0, 0.27, 0.11, 0.135);
          const arm = new T.Group();
          arm.position.set(0, 1.37, side * 0.23);
          group.add(arm);
          bodyPart(arm, shirt, 0, -0.13, 0, 0.125, 0.28, 0.13, true);
          const elbow = new T.Group();
          elbow.name = 'elbow';
          elbow.position.y = -0.26;
          arm.add(elbow);
          bodyPart(elbow, skin, 0, -0.115, 0, 0.085, 0.23, 0.09, true);
          bodyPart(elbow, skin, 0, -0.255, 0, 0.09, 0.13, 0.075);
          actor.limbs.push(leg, arm);
        }
      }
    });
  const parkDogs = buildParkDogs(root, data, actors.find((actor) => actor.walking)!.group);
  // Batch the crowd by geometry and material so more people do not add a draw call per limb.
  const crowdParts = new Map<T.BufferGeometry, Map<T.Material, T.Mesh[]>>();
  for (const actor of actors.filter((a) => a.walking)) {
    actor.group.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      const byMaterial = crowdParts.get(object.geometry) ?? new Map<T.Material, T.Mesh[]>();
      const material = object.material as T.Material;
      const parts = byMaterial.get(material) ?? [];
      parts.push(object);
      byMaterial.set(material, parts);
      crowdParts.set(object.geometry, byMaterial);
    });
    actor.group.visible = false;
  }
  const crowdBatches: { mesh: T.InstancedMesh; parts: T.Mesh[] }[] = [];
  for (const [geometry, byMaterial] of crowdParts)
    for (const [material, parts] of byMaterial) {
      const mesh = new T.InstancedMesh(geometry, material, parts.length);
      mesh.name = 'Pedestrian crowd';
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      root.add(mesh);
      crowdBatches.push({ mesh, parts });
    }
  const inverseRoot = new T.Matrix4(),
    instanceMatrix = new T.Matrix4();
  const cars = actors.filter((actor) => actor.group.name === 'Ambient car');
  const obstacles: TrafficObstacle[] = cars.map(() => ({
    x: 0,
    z: 0,
    previousX: 0,
    previousZ: 0,
    angle: 0,
    halfLength: 2.2,
    halfWidth: 1.01,
  }));
  let elapsed = 0;
  function update(dt: number, observer?: { x: number; z: number }) {
    elapsed += dt;
    for (const actor of actors) {
      const { group, path, speed, walking } = actor;
      const previousX = group.position.x,
        previousZ = group.position.z;
      let recycled = false;
      actor.distance += dt * speed * actor.direction;
      if (walking) {
        if (actor.distance > path.length || actor.distance < 0) {
          actor.direction *= -1;
          actor.distance = Math.max(0, Math.min(path.length, actor.distance));
        }
      } else if (actor.distance > path.length) {
        const beginning = path.at(0, actor.offset),
          end = path.at(path.length, actor.offset);
        const nearby =
          observer &&
          (Math.hypot(observer.x - end.x, observer.z - end.z) < 120 ||
            Math.hypot(observer.x - beginning.x, observer.z - beginning.z) < 120);
        actor.distance = nearby ? path.length : actor.distance % path.length;
        recycled = !nearby;
      }
      const p = path.at(actor.distance, actor.offset);
      group.position.set(p.x, walking ? 0.14 : 0.12, p.z);
      group.rotation.y = -p.angle + (actor.direction < 0 ? Math.PI : 0);
      const carIndex = cars.indexOf(actor);
      if (carIndex >= 0)
        Object.assign(obstacles[carIndex], {
          x: p.x,
          z: p.z,
          angle: p.angle,
          previousX: recycled ? p.x : previousX,
          previousZ: recycled ? p.z : previousZ,
        });
      actor.limbs.forEach((limb, i) => {
        const phase =
          elapsed * speed * 5 + actor.path.length * speed + (i === 0 || i === 3 ? 0 : Math.PI);
        const swing = Math.sin(phase);
        limb.rotation.z = swing * (i % 2 ? 0.28 : 0.36);
        const joint = limb.children.find((child) => child instanceof T.Group);
        if (joint)
          joint.rotation.z = i % 2 ? 0.18 + (swing + 1) * 0.12 : -Math.max(0, -swing) * 0.65;
      });
    }
    parkDogs.update(dt);
    root.updateMatrixWorld(true);
    inverseRoot.copy(root.matrixWorld).invert();
    for (const { mesh, parts } of crowdBatches) {
      parts.forEach((part, index) => {
        instanceMatrix.multiplyMatrices(inverseRoot, part.matrixWorld);
        mesh.setMatrixAt(index, instanceMatrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  update(0);
  obstacles.forEach((car) => {
    car.previousX = car.x;
    car.previousZ = car.z;
  });
  return {
    update,
    obstacles,
    parkDogs,
    root,
    counts: {
      dogs: parkDogs.dogs.length,
      dogOwners: parkDogs.owners.length,
      streetcars: survey.rails.length,
      cars: actors.filter((a) => !a.walking).length - survey.rails.length,
      pedestrians: actors.filter((a) => a.walking).length,
    },
  };
}
