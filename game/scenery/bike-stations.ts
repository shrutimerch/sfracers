import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BikeStation } from '../types';

export const BIKE_OCCUPANCY = 0.4;

export function stationDocks(stations: BikeStation[]) {
  return stations.flatMap((station) => {
    // Stable station-specific shuffle leaves natural gaps without bikes popping in/out.
    let seed = 2166136261;
    for (const char of station.id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    const slots = Array.from({ length: station.capacity }, (_, index) => index);
    for (let i = slots.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const occupied = new Set(slots.slice(0, Math.round(station.capacity * BIKE_OCCUPANCY)));
    return Array.from({ length: station.capacity }, (_, index) => {
      const along = (index - (station.capacity - 1) / 2) * 0.82;
      return {
        x: station.position[0] + Math.cos(station.angle) * along,
        z: station.position[1] + Math.sin(station.angle) * along,
        angle: station.angle + Math.PI / 2,
        occupied: occupied.has(index),
      };
    });
  });
}

export function stationBikes(stations: BikeStation[]) {
  return stationDocks(stations).filter((dock) => dock.occupied);
}

// Shared silver step-through Lyft model extracted from the saved South Park scenery.
export function buildBikeStations(scene: T.Scene, stations: BikeStation[]) {
  const textures: T.Texture[] = [];
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  const mat = (color: string, roughness = 0.9) =>
    new T.MeshStandardMaterial({ color, roughness, side: T.DoubleSide });
  const dark = mat('#343a39'),
    concrete = mat('#b7b8ad');
  const add = (geometry: T.BufferGeometry, material: T.Material) => {
    const list = groups.get(material) || [];
    list.push(geometry);
    groups.set(material, list);
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    m: T.Material,
    a = 0,
  ) => {
    const g = new T.BoxGeometry(w, h, l);
    g.rotateY(-a);
    g.translate(x, y, z);
    add(g, m);
  };
  const rod = (a: T.Vector3, b: T.Vector3, r: number, m: T.Material) => {
    const delta = b.clone().sub(a);
    const g = new T.CylinderGeometry(r, r, delta.length(), 7);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()),
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    add(g, m);
  };
  // Silver step-through Lyft bikes with purple rear-wheel skirts, as in the reference.
  const tire = mat('#202427'),
    silver = mat('#bdc4c8', 0.4),
    bikePurple = mat('#7562bc', 0.6),
    bikeReflector = mat('#e64d41');
  const branding = document.createElement('canvas');
  branding.width = 512;
  branding.height = 256;
  const brandContext = branding.getContext('2d')!;
  brandContext.fillStyle = '#7562bc';
  brandContext.fillRect(0, 0, 512, 256);
  brandContext.fillStyle = '#ffffff';
  brandContext.font = '900 112px Arial, sans-serif';
  brandContext.textAlign = 'center';
  brandContext.textBaseline = 'middle';
  brandContext.fillText('lyft', 256, 133);
  const brandTexture = new T.CanvasTexture(branding);
  brandTexture.colorSpace = T.SRGBColorSpace;
  textures.push(brandTexture);
  const brandMaterial = new T.MeshStandardMaterial({ map: brandTexture, roughness: 0.65 });
  for (const bike of stationDocks(stations)) {
    const { x, z, angle } = bike;
    const p = (u: number, y: number, v = 0) =>
      new T.Vector3(
        x + Math.cos(angle) * u - Math.sin(angle) * v,
        y,
        z + Math.sin(angle) * u + Math.cos(angle) * v,
      );
    const dock = p(0.98, 0.42);
    box(dock.x, 0.42, dock.z, 0.28, 0.8, 0.24, silver, angle);
    const bollard = p(-1.2, 0.45);
    rod(bollard.clone().setY(0.12), bollard.clone().setY(0.92), 0.035, concrete);
    if (!bike.occupied) continue;
    for (const u of [-0.7, 0.7]) {
      const center = p(u, 0.39);
      for (const [radius, tube, m] of [
        [0.35, 0.055, tire],
        [0.29, 0.018, silver],
      ] as const) {
        const g = new T.TorusGeometry(radius, tube, 6, 20);
        g.rotateY(-angle);
        g.translate(...center.toArray());
        add(g, m);
      }
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        rod(center, p(u + Math.cos(a) * 0.28, 0.39 + Math.sin(a) * 0.28), 0.009, silver);
      }
    }
    const rear = p(-0.7, 0.39),
      front = p(0.7, 0.39),
      crank = p(-0.06, 0.43),
      seat = p(-0.28, 0.94),
      head = p(0.4, 1.02);
    for (const [a, b] of [
      [rear, crank],
      [crank, seat],
      [seat, rear],
      [seat, p(0.06, 0.52)],
      [p(0.06, 0.52), head],
      [head, front],
    ])
      rod(a, b, 0.042, silver);
    rod(head, p(0.4, 1.2), 0.026, silver);
    rod(p(0.4, 1.2, -0.25), p(0.4, 1.2, 0.25), 0.028, dark);
    box(
      ...([p(-0.29, 1.03).x, 1.03, p(-0.29, 1.03).z] as [number, number, number]),
      0.32,
      0.09,
      0.24,
      dark,
      angle,
    );
    // Rounded wheel skirt leaves the lower tire exposed. Both sides carry readable branding.
    const skirt = new T.Shape();
    skirt.moveTo(-1.06, 0.42);
    skirt.bezierCurveTo(-1.12, 0.78, -0.79, 0.91, -0.49, 0.78);
    skirt.lineTo(-0.26, 0.51);
    skirt.quadraticCurveTo(-0.61, 0.31, -1.06, 0.42);
    for (const side of [-1, 1]) {
      const cover = new T.ShapeGeometry(skirt);
      cover.translate(0, 0, side * 0.085);
      cover.rotateY(-angle);
      cover.translate(x, 0, z);
      add(cover, bikePurple);
      const logo = new T.PlaneGeometry(0.37, 0.185);
      if (side < 0) logo.rotateY(Math.PI);
      logo.translate(-0.71, 0.63, side * 0.091);
      logo.rotateY(-angle);
      logo.translate(x, 0, z);
      add(logo, brandMaterial);
    }
    // Battery, crank, pedals and compact front cargo tray distinguish the shared e-bikes.
    const battery = p(-0.3, 0.76);
    box(battery.x, 0.76, battery.z, 0.12, 0.34, 0.14, tire, angle);
    rod(p(-0.06, 0.43, -0.19), p(-0.06, 0.43, 0.19), 0.028, silver);
    for (const side of [-1, 1]) {
      const pedal = p(-0.06 + side * 0.1, 0.43 + side * 0.08, side * 0.2);
      box(pedal.x, pedal.y, pedal.z, 0.18, 0.045, 0.12, tire, angle);
    }
    const basket = p(0.62, 1.06);
    box(basket.x, 1.06, basket.z, 0.38, 0.06, 0.4, tire, angle);
    for (const side of [-1, 1]) {
      rod(p(0.44, 1.19, side * 0.2), p(0.82, 1.19, side * 0.2), 0.022, tire);
      for (const u of [0.44, 0.63, 0.82])
        rod(p(u, 1.07, side * 0.2), p(u, 1.19, side * 0.2), 0.014, tire);
    }
    rod(p(0.82, 1.19, -0.2), p(0.82, 1.19, 0.2), 0.022, tire);
    const reflector = p(-1.07, 0.61);
    box(reflector.x, 0.61, reflector.z, 0.035, 0.07, 0.13, bikeReflector, angle);
  }
  for (const station of stations) {
    const u = (station.capacity * 0.82) / 2 + 0.8;
    const x = station.position[0] + Math.cos(station.angle) * u,
      z = station.position[1] + Math.sin(station.angle) * u;
    box(x, 1.0, z, 0.55, 2.0, 0.24, silver, station.angle);
    box(x, 1.4, z, 0.42, 0.65, 0.26, tire, station.angle);
  }
  for (const [material, geometries] of groups) {
    const merged = mergeGeometries(geometries, false);
    if (!merged) throw Error('Bike station geometry failed');
    const mesh = new T.Mesh(merged, material);
    mesh.name = 'Bay Wheels docked bikes';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  return () => textures.forEach((t) => t.dispose());
}
