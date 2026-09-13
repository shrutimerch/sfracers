import { EMBARCADERO_LAYOUT } from './config/embarcadero-layout.ts';
import data from './data/road-marking-data.ts';
import { bicycleSides, bicycleAppearance, type Tags } from './road-marking-rules.ts';
import type { MapData, Point } from '../types';
type CyclingStrip = { a: Point; b: Point; halfWidth: number };

export function cyclingStrips(_d: MapData): CyclingStrip[] {
  const strips: CyclingStrip[] = data.cycleways.flatMap((track) =>
    track.points.slice(1).map((b, i) => ({ a: track.points[i], b, halfWidth: 1.15 })),
  );
  for (const feature of data.bikeRoads)
    for (const side of bicycleSides(feature.tags as Tags)) {
      for (let i = 1; i < feature.points.length; i++) {
        const a = feature.points[i - 1],
          b = feature.points[i],
          angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const offset = bikeOffset(feature, side);
        const shift = (p: Point) => [
          p[0] - Math.sin(angle) * offset,
          p[1] + Math.cos(angle) * offset,
        ];
        const appearance = bicycleAppearance(feature.tags as Tags, side.side, side.kind);
        strips.push({
          a: shift(a),
          b: shift(b),
          halfWidth: appearance.protected || appearance.buffered ? 1.5 : 0.95,
        });
      }
    }
  return strips;
}
// Original road-marking offsets, shared with tree-clearance geometry.
function bikeOffset(feature: { tags: Tags }, side: { side: number; kind: string }) {
  return (
    side.side *
    (feature.tags.name === 'The Embarcadero'
      ? EMBARCADERO_LAYOUT.bikeCenter
      : feature.tags.name === 'King Street'
        ? 3.7
        : side.kind === 'shared_lane'
          ? 3.5
          : 5.55)
  );
}
