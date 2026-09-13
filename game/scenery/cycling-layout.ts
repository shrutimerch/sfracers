import { embarcaderoBikeCenter } from './config/embarcadero-layout.ts';
import data from './data/road-marking-data.ts';
import { bicycleSides, bicycleAppearance, type Tags } from './road-marking-rules.ts';
import type { MapData, Point } from '../types';
type CyclingStrip = { a: Point; b: Point; halfWidth: number; direction: number };

export function cyclingStrips(_d: MapData): CyclingStrip[] {
  const strips: CyclingStrip[] = data.cycleways.flatMap((track) =>
    track.points
      .slice(1)
      .map((b, i) => ({
        a: track.points[i],
        b,
        halfWidth: 1.15,
        direction:
          (track.tags as Tags)['oneway:bicycle'] === '-1' || (track.tags as Tags).oneway === '-1'
            ? -1
            : 1,
      })),
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
          direction: bicycleDirection(feature.tags as Tags, side.side),
          a: shift(a),
          b: shift(b),
          halfWidth: appearance.protected || appearance.buffered ? 1.5 : 0.95,
        });
      }
    }
  return strips;
}
// Original road-marking offsets, shared with tree-clearance geometry.
function bikeOffset(
  feature: { tags: Tags; points: Point[] },
  side: { side: number; kind: string },
) {
  return (
    side.side *
    (feature.tags.name === 'The Embarcadero'
      ? embarcaderoBikeCenter({ name: feature.tags.name, points: feature.points })
      : feature.tags.name === 'King Street'
        ? 3.7
        : side.kind === 'shared_lane'
          ? 3.5
          : 5.55)
  );
}

// Road coordinates follow the mapped way; left-hand lanes on two-way roads run back along it.
export function bicycleDirection(tags: Tags, side: number) {
  const lane = side < 0 ? 'left' : 'right';
  const explicit = tags[`cycleway:${lane}:oneway`] ?? tags['oneway:bicycle'];
  if (explicit === '-1') return -1;
  if (explicit === 'yes' || explicit === '1') return 1;
  if ((tags[`cycleway:${lane}`] ?? tags.cycleway)?.startsWith('opposite_')) return -1;
  if (tags.oneway === '-1') return -1;
  if (tags.oneway === 'yes' || tags.oneway === '1') return 1;
  return side;
}
