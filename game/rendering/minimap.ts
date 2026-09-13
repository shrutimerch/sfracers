import { lapDistance } from '../simulation/race-laps';
import type { MapData } from '../types';
import type { RaceRoute } from '../simulation/route-math';
export function createMinimap(mini: HTMLCanvasElement, d: MapData, route: RaceRoute) {
  const { at, total } = route;
  return function draw(x: number, z: number, rivals: { s: number }[]) {
    const c = mini.getContext('2d');
    if (!c) return;
    const w = mini.width,
      h = mini.height;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#15374c';
    c.fillRect(0, 0, w, h);
    const xs = d.route.map((p) => p[0]),
      zs = d.route.map((p) => p[1]),
      cx = (Math.min(...xs) + Math.max(...xs)) / 2,
      cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const scale = Math.min(
      (w - 22) / (Math.max(...xs) - Math.min(...xs)),
      (h - 22) / (Math.max(...zs) - Math.min(...zs)),
    );
    c.save();
    c.translate(w / 2 - cx * scale, h / 2 - cz * scale);
    c.scale(scale, scale);
    for (const r of [...d.roads, ...(d.paths || [])]) {
      c.beginPath();
      r.points.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.strokeStyle = '#54798a';
      c.lineWidth = 1 / scale;
      c.stroke();
    }
    c.beginPath();
    d.route.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = '#baff55';
    c.lineWidth = 3 / scale;
    c.stroke();
    for (const r of rivals) {
      const p = at(lapDistance(r.s, total));
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(p.x, p.z, 2.5 / scale, 0, 7);
      c.fill();
    }
    c.fillStyle = '#ff704d';
    c.beginPath();
    c.arc(x, z, 3.5 / scale, 0, 7);
    c.fill();
    c.restore();
  };
}
