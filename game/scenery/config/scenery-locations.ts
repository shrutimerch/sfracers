import type { Point } from '../../types';

// Photo-derived placement overrides, in the same local meter coordinates as the OSM map.
// These are modeled estimates, not additional surveyed map features. See reference/README.md.
export const SCENERY_LOCATIONS = {
  deBoomShelter: { x: 202.4, z: 420.3, angle: Math.PI / 4 },
  brannanLamps: [
    [590, 126],
    [609, 155],
  ] as Point[],
  brannanCourtyard: {
    origin: [365.17, 366.68],
    outline: [
      [365.17, 366.68],
      [392.07, 339.69],
      [409.64, 357.59],
      [417.47, 358.36],
      [407.66, 368.01],
      [386.72, 388.59],
    ] as Point[],
    beds: [
      { u: 9, v: 7, width: 12, depth: 9 },
      { u: 27, v: 7, width: 13, depth: 9 },
      { u: 5, v: 23, width: 6, depth: 7 },
      { u: 28, v: 19, width: 10, depth: 7 },
    ],
    trees: [
      [8, 7, 8],
      [27, 8, 9],
      [5, 23, 7],
      [27, 20, 8],
    ],
  },
  shell: {
    canopyBuildingId: 124889461,
    forecourt: [
      [5, 585],
      [22.72, 572.5],
      [48.34, 598.06],
      [39.19, 607.22],
      [29, 617],
    ] as Point[],
    pumps: [
      [26, 589],
      [29, 598],
    ],
  },
};

// One definition is shared by the base-road and painted-marking layers, preventing overlap.
export const ROAD_APPEARANCE = {
  brannanDoubleYellow: { minX: 250, maxX: 600 },
  thirdGreenLaneMinZ: 793,
  thirdTransitLaneMaxZ: 790,
};
export function hasBrannanDoubleYellow(x: number) {
  const { minX, maxX } = ROAD_APPEARANCE.brannanDoubleYellow;
  return x >= minX && x <= maxX;
}
export function hasObservedGreenLane(name: string | undefined, point: Point) {
  return (
    name === '2nd Street' ||
    name === 'King Street' ||
    (name === '3rd Street' && point[1] > ROAD_APPEARANCE.thirdGreenLaneMinZ)
  );
}
