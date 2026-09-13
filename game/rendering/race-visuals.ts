import * as T from 'three';
import { createStartMarshal } from './start-marshal.ts';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRacer } from '../characters/racer.ts';
import { DEFAULT_CHARACTER, raceRoster, type CharacterId } from '../characters/roster.ts';
import type { RaceWorld } from './world';
import type { RaceRoute } from '../simulation/route-math';
export function createRaceVisuals(world: RaceWorld, route: RaceRoute) {
  const { scene, cube, officeTextures } = world;
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
    for (let col = 0; col < 12; col++)
      cube(
        gantry,
        (row - 0.5) * 0.55,
        0.18,
        (col - 5.5) * 0.7,
        0.55,
        0.025,
        0.7,
        (row + col) % 2 ? '#fff7df' : '#25333c',
      );
  // A small reflection studio gives the kart paint readable highlights without
  // changing the city's lighting or materials.
  const generator = new T.PMREMGenerator(world.renderer);
  const room = new RoomEnvironment();
  const environment = generator.fromScene(room, 0.04);
  room.dispose();
  generator.dispose();
  const models = new Map<CharacterId, ReturnType<typeof createRacer>>();
  const slots = Array.from({ length: 4 }, () => new T.Group());
  slots.forEach((slot) => scene.add(slot));
  const [player, ...rivalMeshes] = slots;
  let roster = raceRoster(DEFAULT_CHARACTER);
  const selectCharacter = (id: CharacterId) => {
    roster = raceRoster(id);
    slots.forEach((slot) => slot.clear());
    roster.forEach((character, index) => {
      if (!models.has(character))
        models.set(character, createRacer(character, environment.texture));
      slots[index].add(models.get(character)!.root);
    });
  };
  selectCharacter(DEFAULT_CHARACTER);
  const animateRacers = (
    dt: number,
    speed: number,
    steer: number,
    drifting: boolean,
    elapsed: number,
    rivalSpeeds: number[],
  ) => {
    roster.forEach((character, index) =>
      models
        .get(character)!
        .update(
          dt,
          index === 0 ? speed : rivalSpeeds[index - 1],
          index === 0 ? steer : 0,
          index === 0 && drifting,
          elapsed,
        ),
    );
  };
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

  // Place the marshal on the grid-facing side of the gantry, clear of the banner.
  const startMarshal = createStartMarshal(scene, {
    x: finish.x - Math.cos(finish.a) * 3,
    z: finish.z - Math.sin(finish.a) * 3,
    a: finish.a,
  });
  return {
    startMarshal,
    player,
    rivalMeshes,
    ring,
    pads,
    selectCharacter,
    animateRacers,
    disposeRacerEnvironment: () => {
      models.forEach((model) => {
        model.root.removeFromParent();
        model.dispose();
      });
      environment.dispose();
    },
  };
}
