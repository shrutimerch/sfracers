import * as T from 'three';
import type { MapData } from '../types';
export type TrafficNode = {
  id: number;
  lat: number;
  lon: number;
  tags: { highway: string; [key: string]: string };
};
export function mappedControls(nodes: TrafficNode[], roads: MapData['roads']) {
  return nodes
    .filter(
      (n) =>
        Number.isFinite(n.lat) &&
        Number.isFinite(n.lon) &&
        ['stop', 'traffic_signals'].includes(n.tags.highway),
    )
    .map((node) => {
      const x = (node.lon + 122.395) * 87900,
        z = (37.786 - node.lat) * 111200;
      let best = Infinity,
        angle = 0,
        half = 7;
      for (const r of roads)
        for (let i = 1; i < r.points.length; i++) {
          const a = r.points[i - 1],
            b = r.points[i],
            dx = b[0] - a[0],
            dz = b[1] - a[1],
            t = Math.max(
              0,
              Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
            ),
            dist = Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
          if (dist < best) {
            best = dist;
            angle = Math.atan2(dz, dx);
            half = r.name === 'South Park' ? 4.9 : 7;
          }
        }
      // OSM nodes often mark a controlled junction/stop line, not a surveyed physical pole.
      return { node, x, z, angle, half, onRoad: best < half };
    });
}
export function buildTrafficControls(scene: T.Scene, d: MapData) {
  const textures: T.Texture[] = [];
  const metal = new T.MeshStandardMaterial({ color: '#666d68', roughness: 0.5 }),
    black = new T.MeshStandardMaterial({ color: '#282e2b', roughness: 0.7 });
  const stopCanvas = document.createElement('canvas');
  stopCanvas.width = 256;
  stopCanvas.height = 256;
  const ctx = stopCanvas.getContext('2d')!;
  ctx.translate(128, 128);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const x = Math.cos(a) * 120,
      y = Math.sin(a) * 120;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#a92020';
  ctx.fill();
  ctx.strokeStyle = '#f6f3e8';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 65px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STOP', 0, 5);
  const stopTexture = new T.CanvasTexture(stopCanvas);
  stopTexture.colorSpace = T.SRGBColorSpace;
  textures.push(stopTexture);
  for (const c of mappedControls(d.trafficControls || [], d.roads)) {
    // Limit this first data-backed pass to the developed waterfront/South Park area.
    if (c.x < -180 || c.x > 730 || c.z < 60 || c.z > 970) continue;
    const group = new T.Group();
    const mesh = (g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => {
      const o = new T.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      group.add(o);
      return o;
    };
    // Curb-side support is inferred from street width when the source node is in the roadway.
    const offset = c.onRoad ? c.half + 0.7 : 0;
    group.position.set(c.x - Math.sin(c.angle) * offset, 0, c.z + Math.cos(c.angle) * offset);
    group.rotation.y = -c.angle;
    if (c.node.tags.highway === 'stop') {
      mesh(new T.CylinderGeometry(0.045, 0.045, 2.8, 8), metal, 0, 1.4, 0);
      const sign = mesh(
        new T.PlaneGeometry(0.88, 0.88),
        new T.MeshStandardMaterial({
          map: stopTexture,
          transparent: true,
          side: T.DoubleSide,
          roughness: 0.8,
        }),
        0,
        2.45,
        0,
      );
      sign.rotation.y = Math.PI / 2;
    } else {
      mesh(new T.CylinderGeometry(0.09, 0.13, 5.5, 10), metal, 0, 2.75, 0);
      const arm = mesh(
        new T.CylinderGeometry(0.065, 0.065, Math.max(offset, 0.8), 8),
        metal,
        0,
        5.35,
        -Math.max(offset, 0.8) / 2,
      );
      arm.rotation.x = Math.PI / 2;
      mesh(new T.BoxGeometry(0.28, 1.05, 0.43), black, 0, 4.85, -offset);
      for (let i = 0; i < 3; i++) {
        const lamp = mesh(
          new T.CircleGeometry(0.115, 16),
          new T.MeshStandardMaterial({
            color: ['#e34430', '#bd8224', '#244b3b'][i],
            emissive: i === 0 ? '#8b2118' : '#000000',
            emissiveIntensity: 0.4,
            side: T.DoubleSide,
          }),
          0.145,
          5.17 - i * 0.32,
          -offset,
        );
        lamp.rotation.y = Math.PI / 2;
      }
    }
    group.userData = {
      osmNodeId: c.node.id,
      mappedPosition: [c.x, c.z],
      mounting: 'representative; support position inferred from road width',
      signalTiming: 'static scenery, not live',
    };
    scene.add(group);
  }
  return () => textures.forEach((t) => t.dispose());
}
