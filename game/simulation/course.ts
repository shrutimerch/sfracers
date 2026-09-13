import { isEastParkEntrance, isWestParkEntrance } from '../scenery/south-park-parking.ts';
import type { MapData } from '../types';
// Preserve imported data; wider entrance surfaces accommodate the reference-based parking bays.
export function prepareCourse(data: MapData): MapData {
  return {
    ...data,
    roads: data.roads.map((r) =>
      isEastParkEntrance(r) || isWestParkEntrance(r) ? { ...r, width: 14.8 } : r,
    ),
  };
}
