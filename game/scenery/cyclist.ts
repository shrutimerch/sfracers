import * as T from 'three';

// Local +X is forward, matching traffic and the painted bike paths.
export function buildCyclist(group: T.Group, index: number) {
  const metal = new T.MeshStandardMaterial({ color: '#bbc5ca', roughness: 0.45 });
  const rubber = new T.MeshStandardMaterial({ color: '#222b32' });
  const jersey = new T.MeshStandardMaterial({
    color: ['#da653c', '#387cba', '#dabd42'][index % 3],
  });
  const skin = new T.MeshStandardMaterial({ color: ['#dba584', '#956344'][index % 2] });
  const tube = new T.CylinderGeometry(1, 1, 1, 6);
  function rod(a: number[], b: number[], radius: number, material: T.Material) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b);
    const mesh = new T.Mesh(tube, material);
    const delta = end.clone().sub(start);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.scale.set(radius, delta.length(), radius);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    group.add(mesh);
    return mesh;
  }
  const wheels: T.Group[] = [];
  for (const x of [-0.7, 0.7]) {
    const wheel = new T.Group();
    wheel.position.set(x, 0.38, 0);
    wheel.add(new T.Mesh(new T.TorusGeometry(0.34, 0.045, 6, 16), rubber));
    for (let i = 0; i < 4; i++) {
      const spoke = new T.Mesh(new T.BoxGeometry(0.64, 0.014, 0.014), metal);
      spoke.rotation.z = (i * Math.PI) / 4;
      wheel.add(spoke);
    }
    group.add(wheel);
    wheels.push(wheel);
  }
  const rear = [-0.7, 0.38, 0],
    front = [0.7, 0.38, 0];
  const crank = [-0.05, 0.4, 0],
    seat = [-0.3, 0.98, 0],
    head = [0.42, 1.02, 0];
  for (const [a, b] of [
    [rear, crank],
    [rear, seat],
    [seat, crank],
    [seat, head],
    [head, crank],
    [head, front],
  ])
    rod(a, b, 0.035, metal);
  rod([-0.44, 1.01, 0], [-0.17, 1.01, 0], 0.065, rubber);
  rod(head, [0.42, 1.16, 0], 0.025, metal);
  rod([0.42, 1.16, -0.29], [0.42, 1.16, 0.29], 0.028, rubber);
  rod([-0.28, 1.07, 0], [0.03, 1.52, 0], 0.17, jersey);
  const helmet = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), jersey);
  helmet.position.set(0.14, 1.79, 0);
  helmet.scale.set(1.15, 0.7, 1);
  group.add(helmet);
  const face = new T.Mesh(new T.SphereGeometry(0.125, 10, 8), skin);
  face.position.set(0.14, 1.66, 0);
  group.add(face);
  const legs: T.Mesh[][] = [];
  for (const side of [-1, 1]) {
    rod([0.02, 1.48, side * 0.17], [0.24, 1.28, side * 0.23], 0.06, jersey);
    rod([0.24, 1.28, side * 0.23], [0.42, 1.16, side * 0.27], 0.045, skin);
    legs.push([rod([0, 0, 0], [0, 1, 0], 0.075, rubber), rod([0, 0, 0], [0, 1, 0], 0.055, skin)]);
  }
  function animate(distance: number) {
    wheels.forEach((w) => (w.rotation.z = -distance / 0.34));
    legs.forEach((leg, i) => {
      const phase = distance * 2.8 + i * Math.PI;
      const z = i ? 0.17 : -0.17;
      const foot = new T.Vector3(-0.05 + Math.cos(phase) * 0.17, 0.4 + Math.sin(phase) * 0.17, z);
      const hip = new T.Vector3(-0.28, 1.04, z);
      const knee = new T.Vector3(0.12 + Math.cos(phase) * 0.08, 0.76 + Math.sin(phase) * 0.08, z);
      [
        [hip, knee],
        [knee, foot],
      ].forEach(([a, b], j) => {
        const delta = b.clone().sub(a);
        leg[j].position.copy(a).add(b).multiplyScalar(0.5);
        leg[j].scale.y = delta.length();
        leg[j].quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      });
    });
  }
  animate(0);
  return animate;
}
