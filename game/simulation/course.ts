import { isOracleServiceAlley } from '../scenery/config/scenery-locations.ts';
import { isEastParkEntrance, isWestParkEntrance } from '../scenery/south-park-parking.ts';
import type { MapData } from '../types';
import { EMBARCADERO_LAYOUT, hasEmbarcaderoParking } from '../scenery/config/embarcadero-layout.ts';
import { createRoute } from './route-math.ts';

// Mapped mouth of South Park at the Third Street curb, rather than the
// intersection's road-center node. Every race element uses this lap boundary.
const SOUTH_PARK_ENTRANCE = [-0.04, 580.5];
function startAtParkEntrance(data: MapData): MapData {
  if (data.course?.name !== 'South Park Waterfront Circuit') return data;
  const index = data.route.findIndex(
    (p) => p[0] === SOUTH_PARK_ENTRANCE[0] && p[1] === SOUTH_PARK_ENTRANCE[1],
  );
  if (index <= 0) return data;
  const original = createRoute(data);
  const offset = original.lengths[index];
  const [park, ...sections] = data.course.sections;
  return {
    ...data,
    route: [...data.route.slice(index), ...data.route.slice(1, index + 1)],
    course: {
      ...data.course,
      sections: [
        { ...park, length: park.length - offset },
        ...sections.map((s) => ({ ...s, start: s.start - offset })),
        { name: 'South Park', start: original.total - offset, length: offset },
      ],
    },
  };
}

// Preserve imported data; wider entrance surfaces accommodate the reference-based parking bays.
export function prepareCourse(data: MapData): MapData {
  return {
    ...startAtParkEntrance(data),
    bikeStations: data.bikeStations?.map((station) => {
      if (station.name !== 'South Park St at 3rd St') return station;
      // The feed pin sits in the driving lane. Keep the modeled row in the
      // reserved southeast parking strip and beyond the pedestrian crossing.
      const center = createRoute(data).at(26);
      return {
        ...station,
        position: [center.x - Math.sin(center.a) * 5.8, center.z + Math.cos(center.a) * 5.8],
        angle: center.a + Math.PI,
      };
    }),
    roads: data.roads.map((r) =>
      isOracleServiceAlley(r)
        ? { ...r, width: 3.4 }
        : isEastParkEntrance(r) || isWestParkEntrance(r)
          ? { ...r, width: 14.8 }
          : hasEmbarcaderoParking(r)
            ? { ...r, width: EMBARCADERO_LAYOUT.roadWidth }
            : r.name === 'King Street' || r.name === 'The Embarcadero'
              ? { ...r, width: 9.6 }
              : r,
    ),
  };
}
