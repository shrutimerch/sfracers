import { ORACLE_GENERIC_BUILDING_IDS } from '../scenery/oracle-park';
import { buildPromenadePaving } from '../scenery/promenade-paving';
import { embarcaderoDivider } from '../scenery/config/embarcadero-layout';
import { buildEmbarcaderoStreetscape } from '../scenery/embarcadero-streetscape';
import { createBayWater } from '../scenery/bay-water';
import { DELANCEY_PATIO_ID } from '../scenery/delancey-street';
import { HARBOR_BUILDING_IDS } from '../scenery/harbor-buildings';
import { hasBrannanDoubleYellow } from '../scenery/config/scenery-locations';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildingGeometry, type FacadeKind } from '../scenery/geometry/building-geometry';
import { buildRouteScenery } from '../scenery/route-scenery';
import { hasRouteProfile } from '../scenery/config/route-profiles';
import { buildSouthPark, isLocal } from '../scenery/south-park';
import { buildSidewalks } from '../scenery/sidewalks';
import { buildRoadMarkings } from '../scenery/road-markings';
import { buildCityMotion } from '../scenery/city-motion';
import { buildTrafficControls } from '../scenery/traffic-controls';
import { buildStreetSigns } from '../scenery/street-signs';
import { buildBikeStations } from '../scenery/bike-stations';
import type { MapData, Facades, Point } from '../types';
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function createWorld(canvas: HTMLCanvasElement, d: MapData, facades: Facades) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor('#becbcf');
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new T.Scene();
  scene.fog = new T.Fog('#becbcf', 450, 1800);
  const camera = new T.PerspectiveCamera(65, 1, 0.15, 2800);
  scene.add(new T.HemisphereLight('#e3e8e7', '#707267', 1.65));
  const sun = new T.DirectionalLight('#fff3dc', 2.0);
  sun.position.set(-70, 160, 370);
  sun.target.position.set(90, 0, 490);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -155,
    right: 155,
    top: 155,
    bottom: -155,
    near: 1,
    far: 600,
  });
  sun.shadow.normalBias = 0.08;
  scene.add(sun, sun.target);
  const material = (color: T.ColorRepresentation) =>
    new T.MeshStandardMaterial({ color, roughness: 0.85 });
  const ground = new T.Mesh(new T.PlaneGeometry(6500, 6500), material('#abaea5'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);
  const boxGeo = new T.BoxGeometry(1, 1, 1);
  const cube = (
    parent: T.Object3D,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    color: T.ColorRepresentation,
  ) => {
    const m = new T.Mesh(boxGeo, material(color));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  };
  function ribbons(lines: Point[][], width: number, color: string, y: number) {
    const vertices: number[] = [];
    for (const points of lines)
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          len = distance(a, b);
        if (!len) continue;
        const nx = ((-(b[1] - a[1]) / len) * width) / 2,
          nz = (((b[0] - a[0]) / len) * width) / 2;
        vertices.push(
          a[0] + nx,
          y,
          a[1] + nz,
          b[0] + nx,
          y,
          b[1] + nz,
          a[0] - nx,
          y,
          a[1] - nz,
          b[0] + nx,
          y,
          b[1] + nz,
          b[0] - nx,
          y,
          b[1] - nz,
          a[0] - nx,
          y,
          a[1] - nz,
        );
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    const mat = material(color);
    mat.side = T.DoubleSide;
    const mesh = new T.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }
  for (const road of d.roads.filter((r) => r.name !== 'South Park')) {
    ribbons([road.points], (road.width ?? 14) + 6, '#b8b9b1', 0.015);
    ribbons([road.points], road.width ?? 14, '#686c68', 0.055);
  }
  for (const r of d.roads.filter((r) => r.name === 'South Park'))
    ribbons([r.points], (r.width ?? 9.8) + 3.7, '#b8b9b1', 0.015);
  buildPromenadePaving(scene, d.paths || []);
  // Road markings are aligned with the downloaded centerlines.
  const stripes: T.Matrix4[] = [];
  const temp = new T.Object3D();
  for (const road of d.roads.filter(
    (r) => r.name !== 'South Park' && r.name !== '2nd Street' && r.name !== 'King Street',
  )) {
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        len = distance(a, b);
      for (let t = 4; t < len; t += 15) {
        const stripeX = a[0] + ((b[0] - a[0]) * t) / len;
        if (road.name === 'Brannan Street' && hasBrannanDoubleYellow(stripeX)) continue;
        const divider = road.name === 'The Embarcadero' ? embarcaderoDivider(road) : 0;
        temp.position.set(
          a[0] + ((b[0] - a[0]) * t) / len - ((b[1] - a[1]) / len) * divider,
          0.08,
          a[1] + ((b[1] - a[1]) * t) / len + ((b[0] - a[0]) / len) * divider,
        );
        temp.rotation.set(0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0);
        temp.scale.set(Math.min(4, len - t), 0.015, 0.17);
        temp.updateMatrix();
        stripes.push(temp.matrix.clone());
      }
    }
  }
  const stripeMesh = new T.InstancedMesh(boxGeo, material('#f8eab7'), stripes.length);
  stripes.forEach((m, i) => stripeMesh.setMatrixAt(i, m));
  scene.add(stripeMesh);
  // Textures use metres-per-window UVs, so tall walls repeat floors instead of stretching one photograph.
  const kinds: FacadeKind[] = ['brick', 'masonry', 'glass'];
  const walls: Record<FacadeKind, T.BufferGeometry[]> = { brick: [], masonry: [], glass: [] };
  const roofs: T.BufferGeometry[] = [];
  const ledges: T.Matrix4[] = [];
  for (const texture of Object.values(facades))
    texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  for (const building of d.buildings) {
    if (
      building.points.length < 4 ||
      isLocal(building) ||
      hasRouteProfile(building) ||
      building.id === DELANCEY_PATIO_ID ||
      HARBOR_BUILDING_IDS.has(building.id ?? 0) ||
      ORACLE_GENERIC_BUILDING_IDS.has(building.id ?? 0) ||
      building.id === 443021970
    )
      continue;
    const kind = building.facade || 'masonry';
    const geometry = buildingGeometry(building);
    walls[kind].push(geometry.walls);
    roofs.push(geometry.roof);
    for (let i = 1; i < building.points.length; i++) {
      const a = building.points[i - 1],
        b = building.points[i],
        len = distance(a, b);
      if (len < 1) continue;
      temp.position.set((a[0] + b[0]) / 2, building.height + 0.06, (a[1] + b[1]) / 2);
      temp.rotation.set(0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0);
      temp.scale.set(len + 0.12, 0.26, 0.45);
      temp.updateMatrix();
      ledges.push(temp.matrix.clone());
    }
  }
  for (const kind of kinds) {
    if (!walls[kind].length) continue;
    const merged = mergeGeometries(walls[kind]);
    const m = new T.MeshStandardMaterial({
      map: facades[kind],
      color: '#ffffff',
      roughness: kind === 'glass' ? 0.32 : 0.87,
      metalness: kind === 'glass' ? 0.18 : 0,
      side: T.DoubleSide,
    });
    scene.add(new T.Mesh(merged, m));
    walls[kind].forEach((g) => g.dispose());
  }
  if (roofs.length) {
    const merged = mergeGeometries(roofs);
    scene.add(
      new T.Mesh(
        merged,
        new T.MeshStandardMaterial({ color: '#8b8981', roughness: 1, side: T.DoubleSide }),
      ),
    );
    roofs.forEach((g) => g.dispose());
  }
  const cornices = new T.InstancedMesh(boxGeo, material('#a9a59a'), ledges.length);
  ledges.forEach((m, i) => cornices.setMatrixAt(i, m));
  scene.add(cornices);
  const bayWater = createBayWater();
  if (d.coast?.length) {
    for (const coast of d.coast) {
      ribbons([coast], 3, '#ddd1b0', 0.1);
      const waterShape = new T.Shape();
      const pts = [...coast, [3000, coast[coast.length - 1][1]], [3000, coast[0][1]]];
      pts.forEach((p, i) => (i ? waterShape.lineTo(p[0], -p[1]) : waterShape.moveTo(p[0], -p[1])));
      const water = new T.Mesh(new T.ShapeGeometry(waterShape), bayWater.material);
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.12;
      water.name = 'Bay water with wind ripples';
      water.onBeforeRender = () => bayWater.update(performance.now() / 1000);
      scene.add(water);
    }
  }
  // Office markers sit on mapped building frontages; these are race labels, not replica signage.
  const officeTextures: T.Texture[] = [];
  for (const office of d.course?.landmarks || []) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#112b38';
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = '#c4ff58';
    ctx.fillRect(0, 0, 12, 192);
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(office.name, 32, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText(office.address, 32, 135);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    officeTextures.push(texture);
    const marker = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: true }));
    marker.position.set(office.position[0], Math.max(office.height, 24), office.position[1]);
    marker.scale.set(29, 7.25, 1);
    scene.add(marker);
    cube(
      scene,
      office.position[0],
      office.height / 2,
      office.position[1],
      0.3,
      office.height,
      0.3,
      '#c4ff58',
    );
  }
  const disposeRoute = buildRouteScenery(scene, d, facades);
  const disposePark = buildSouthPark(scene, d);
  const sidewalkWalks = buildSidewalks(scene, d);
  const disposeMarkings = buildRoadMarkings(scene, d);
  const disposeTraffic = buildTrafficControls(scene, d);
  const disposeSigns = buildStreetSigns(scene, d);
  const disposeBikeStations = buildBikeStations(scene, d.bikeStations || []);

  const cityMotion = buildCityMotion(scene, d, sidewalkWalks);
  const curbside = buildEmbarcaderoStreetscape(scene, d);
  const scenery = new T.Group();
  // Reparenting removes children from scene; iterate a snapshot, not the live array.
  for (const o of scene.children.slice())
    if (o instanceof T.Mesh || o instanceof T.Group) scenery.add(o);
  scene.add(scenery);
  return {
    renderer,
    scene,
    camera,
    scenery,
    officeTextures,
    cityMotion,
    trafficObstacles: [...cityMotion.obstacles, ...curbside.obstacles],
    cube,
    material,
    disposeTextures() {
      bayWater.dispose();
      disposePark();
      disposeRoute();
      disposeMarkings();
      disposeTraffic();
      disposeSigns();
      disposeBikeStations();
    },
  };
}
export type RaceWorld = ReturnType<typeof createWorld>;
