import * as T from 'three';
import { KART_SCALE } from '../race-laps';
import type { RaceWorld } from './world';
import type { RaceRoute } from './route-math';
export function createRaceVisuals(world: RaceWorld, route: RaceRoute) {
  const { scene, cube, material, officeTextures } = world;
  const { total, at } = route;
  const guideMaterial = new T.MeshBasicMaterial({ color: '#c6ff53', side: T.DoubleSide });
  const arrowShape = new T.Shape();
  arrowShape.moveTo(2.3, 0);
  arrowShape.lineTo(-1.5, 1.25);
  arrowShape.lineTo(-0.6, 0);
  arrowShape.lineTo(-1.5, -1.25);
  arrowShape.closePath();
  const arrowGeometry = new T.ShapeGeometry(arrowShape);
  arrowGeometry.rotateX(-Math.PI / 2);
  for (let s = 12; s < total; s += 22) {
    const p = at(s),
      arrow = new T.Mesh(arrowGeometry, guideMaterial);
    arrow.position.set(p.x, 0.16, p.z);
    arrow.rotation.y = -p.a;
    scene.add(arrow);
  }
  for (let i = 0; i < 10; i++) {
    const p = at(2);
    const tile = cube(
      scene,
      p.x - Math.sin(p.a) * (i - 4.5),
      0.17,
      p.z + Math.cos(p.a) * (i - 4.5),
      1,
      0.04,
      1,
      i % 2 ? '#172d38' : '#ffffff',
    );
    tile.rotation.y = -p.a;
  }
  function kart(color: string) {
    const group = new T.Group();
    cube(group, 0, 0.55, 0, 3.4, 0.55, 1.65, color);
    cube(group, 1.15, 0.9, 0, 1, 0.4, 1.45, color);
    cube(group, -0.85, 0.95, 0, 0.35, 1.1, 1.2, '#263544');
    cube(group, -1.5, 1.2, 0, 0.3, 0.15, 2.3, color);
    for (const x of [-1, 1])
      for (const z of [-1, 1]) {
        const wheel = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.4, 12), material('#202a36'));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.48, z);
        group.add(wheel);
        const hub = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.43, 12), material('#e2e4db'));
        hub.rotation.x = Math.PI / 2;
        hub.position.copy(wheel.position);
        group.add(hub);
      }
    const body = new T.Mesh(new T.CapsuleGeometry(0.35, 0.4, 4, 8), material(color));
    body.position.set(-0.3, 1.35, 0);
    group.add(body);
    const helmet = new T.Mesh(new T.SphereGeometry(0.48, 16, 12), material('#fff2d2'));
    helmet.position.set(-0.22, 1.98, 0);
    group.add(helmet);
    cube(group, 0.18, 1.99, 0, 0.12, 0.23, 0.65, '#263d56');
    const shadow = new T.Mesh(
      new T.CircleGeometry(2.2, 20),
      new T.MeshBasicMaterial({
        color: '#243340',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.1;
    group.add(shadow);
    group.scale.setScalar(KART_SCALE);
    scene.add(group);
    return group;
  }
  // Start/finish gantry across the route's shared lap boundary.
  const finish = at(0),
    gantry = new T.Group();
  gantry.position.set(finish.x, 0, finish.z);
  gantry.rotation.y = -finish.a;
  scene.add(gantry);
  for (const side of [-1, 1]) cube(gantry, 0, 3.4, side * 8, 0.3, 6.8, 0.3, '#233743');
  cube(gantry, 0, 6.2, 0, 0.3, 1.25, 16.3, '#182d39');
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 1024;
  bannerCanvas.height = 128;
  const bc = bannerCanvas.getContext('2d')!;
  bc.fillStyle = '#182d39';
  bc.fillRect(0, 0, 1024, 128);
  bc.fillStyle = '#fff7df';
  bc.font = 'bold 62px sans-serif';
  bc.textAlign = 'center';
  bc.fillText('START / FINISH', 512, 85);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++)
      if ((row + col) % 2 === 0) {
        bc.fillRect(col * 32, row * 32, 32, 32);
        bc.fillRect(896 + col * 32, row * 32, 32, 32);
      }
  const bannerTexture = new T.CanvasTexture(bannerCanvas);
  bannerTexture.colorSpace = T.SRGBColorSpace;
  officeTextures.push(bannerTexture);
  for (const side of [-1, 1]) {
    const face = new T.Mesh(
      new T.PlaneGeometry(16, 1.2),
      new T.MeshBasicMaterial({ map: bannerTexture, side: T.DoubleSide }),
    );
    face.rotation.y = (side * Math.PI) / 2;
    face.position.set(side * 0.17, 6.2, 0);
    gantry.add(face);
  }
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 20; col++)
      cube(
        gantry,
        (row - 0.5) * 0.55,
        0.18,
        (col - 9.5) * 0.7,
        0.55,
        0.025,
        0.7,
        (row + col) % 2 ? '#fff7df' : '#25333c',
      );
  const player = kart('#ff643b');
  const rivalMeshes = ['#a47cff', '#ffcf41', '#36cad0'].map(kart);
  const ring = new T.Mesh(
    new T.TorusGeometry(6, 0.18, 8, 36),
    new T.MeshBasicMaterial({ color: '#baff55', transparent: true, opacity: 0.8 }),
  );
  scene.add(ring);
  const pads: T.Mesh[] = [];
  for (let s = 160; s < total; s += 290) {
    const p = at(s);
    const m = cube(scene, p.x, 0.13, p.z, 8, 0.12, 5, '#2de5dd');
    m.rotation.y = -p.a;
    pads.push(m);
  }

  return { player, rivalMeshes, ring, pads };
}
