import * as T from 'three';
import survey from './data/waterfront-geometry.ts';
import type { MapData, Point } from '../types';

export function parkClearance(point: Point, polygon: Point[]) {
  let inside = false,
    distance = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j],
      b = polygon[i];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)),
    );
    distance = Math.min(distance, Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dz));
  }
  return inside ? distance : -distance;
}

export function dogParkAreas(data: MapData) {
  const parks = [
    { name: 'South Park', points: data.parks?.[0] ?? [], preferred: [112, 474] },
    ...survey.parks.map((park) => ({
      ...park,
      preferred: park.name === 'South Beach Park' ? [619, 560] : [642, 215],
    })),
  ];
  return parks
    .filter((park) => park.points.length > 2)
    .flatMap((park) => {
      let center = park.preferred,
        clearance = -Infinity;
      const trees =
        park.name === 'South Park'
          ? (data.parkDetails?.trees ?? [])
          : survey.trees.map((tree) => tree.point);
      for (let x = park.preferred[0] - 8; x <= park.preferred[0] + 8; x += 1)
        for (let z = park.preferred[1] - 8; z <= park.preferred[1] + 8; z += 1) {
          const space = Math.min(
            parkClearance([x, z], park.points),
            ...trees.map((p) => Math.hypot(x - p[0], z - p[1]) - 1.5),
          );
          if (space > clearance) {
            center = [x, z];
            clearance = space;
          }
        }
      return clearance > 3
        ? [{ name: park.name, polygon: park.points, center, radius: Math.min(7, clearance - 1.2) }]
        : [];
    });
}

export function buildParkDogs(root: T.Group, data: MapData, human: T.Group) {
  const sphere = new T.SphereGeometry(0.5, 12, 8);
  const materials = new Map<string, T.MeshStandardMaterial>();
  const part = (
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => {
    if (!materials.has(color))
      materials.set(color, new T.MeshStandardMaterial({ color, roughness: 0.9 }));
    const mesh = new T.Mesh(sphere, materials.get(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  };
  const areas = dogParkAreas(data);
  const dogs: {
    group: T.Group;
    legs: T.Group[];
    tail: T.Group;
    area: (typeof areas)[number];
    phase: number;
    pace: number;
  }[] = [];
  const owners: T.Group[] = [];
  for (const [i, area] of areas.entries()) {
    const owner = human.clone(true);
    owner.name = `Dog owner — ${area.name}`;
    owner.visible = true;
    owner.position.set(area.center[0], 0.14, area.center[1]);
    owner.traverse((object) => {
      if (object instanceof T.Group && (object.name === 'knee' || object.name === 'elbow'))
        object.rotation.z = 0.1;
    });
    root.add(owner);
    owners.push(owner);
    for (let j = 0; j < 2; j++) {
      const group = new T.Group();
      group.name = `Off-leash dog — ${area.name}`;
      root.add(group);
      const coat = ['#c9924f', '#eee3cf', '#4b3930', '#b77b4e', '#292d30', '#d2b58c'][
        (i * 2 + j) % 6
      ];
      group.scale.setScalar(j ? 0.8 : 1.05);
      part(group, coat, 0, 0.57, 0, 0.85, 0.42, 0.35);
      part(group, coat, 0.35, 0.73, 0, 0.31, 0.44, 0.31);
      part(group, coat, 0.49, 0.91, 0, 0.33, 0.32, 0.29);
      part(group, coat, 0.68, 0.85, 0, 0.31, 0.17, 0.2);
      part(group, '#242323', 0.83, 0.87, 0, 0.07, 0.07, 0.14);
      for (const side of [-1, 1]) {
        part(group, '#29251f', 0.6, 0.96, side * 0.125, 0.04, 0.04, 0.025);
        const ear = part(group, coat, 0.4, 0.98, side * 0.17, 0.16, j ? 0.32 : 0.23, 0.085);
        ear.rotation.x = side * 0.3;
      }
      // A collar, but no leash connecting the running dog to its owner.
      part(group, j ? '#4c859a' : '#b44940', 0.35, 0.73, 0, 0.33, 0.075, 0.33);
      const legs: T.Group[] = [];
      for (const x of [-0.29, 0.28])
        for (const z of [-0.12, 0.12]) {
          const leg = new T.Group();
          leg.position.set(x, 0.52, z);
          group.add(leg);
          part(leg, coat, 0, -0.2, 0, 0.1, 0.4, 0.1);
          part(leg, coat, 0.045, -0.4, 0, 0.18, 0.1, 0.12);
          legs.push(leg);
        }
      const tail = new T.Group();
      tail.position.set(-0.4, 0.66, 0);
      group.add(tail);
      const fur = part(tail, coat, -0.2, 0.12, 0, 0.5, 0.12, 0.12);
      fur.rotation.z = -0.55;
      dogs.push({ group, legs, tail, area, phase: j * Math.PI + i, pace: 0.48 + j * 0.09 });
    }
  }
  let time = 0;
  function update(dt: number) {
    time += dt;
    dogs.forEach((dog) => {
      const t = time * dog.pace + dog.phase,
        r = dog.area.radius;
      // Smooth loops fit in the tested clear disk around their nearby owner.
      const x = r * Math.cos(t),
        z = r * 0.55 * Math.sin(t);
      const dx = -r * Math.sin(t),
        dz = r * 0.55 * Math.cos(t);
      dog.group.position.set(
        dog.area.center[0] + x,
        0.15 + Math.abs(Math.sin(time * 9 + dog.phase)) * 0.045,
        dog.area.center[1] + z,
      );
      dog.group.rotation.y = -Math.atan2(dz, dx);
      dog.legs.forEach((leg, index) => {
        leg.rotation.z =
          Math.sin(time * 9 + dog.phase + (index === 0 || index === 3 ? 0 : Math.PI)) * 0.6;
      });
      dog.tail.rotation.y = Math.sin(time * 7 + dog.phase) * 0.5;
    });
    owners.forEach((owner, i) => {
      const dog = dogs[i * 2].group;
      owner.rotation.y = -Math.atan2(
        dog.position.z - owner.position.z,
        dog.position.x - owner.position.x,
      );
    });
  }
  update(0);
  return { update, dogs, owners, areas };
}
