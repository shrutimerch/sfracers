// Photo-based lateral offsets in metres, relative to each directed carriageway.
// The loaded carriageway is 14m wide, including the parking strip. Positive offsets point to the driver's right.
export function hasEmbarcaderoParking(road: { name: string; points: number[][] }) {
  return (
    road.name === 'The Embarcadero' &&
    road.points.at(-1)![1] > road.points[0][1] &&
    road.points.some((p) => p[0] > 550 && p[1] > 145 && p[1] < 465)
  );
}
export const EMBARCADERO_LAYOUT = {
  roadWidth: 14,
  divider: -2,
  trafficCenters: [-4.3, -0.1],
  bikeCenter: 2.7,
  bikeHalfWidth: 0.9,
  parkingCenter: 5.6,
  parkingHalfWidth: 1,
  treeOffset: 8.4,
};

/** Keep the divider midway between the median curb and the bike lane. */
export function embarcaderoBikeCenter(road: { name: string; points: number[][] }) {
  return hasEmbarcaderoParking(road) ? EMBARCADERO_LAYOUT.bikeCenter : 3.7;
}
export function embarcaderoDivider(road: { name: string; points: number[][]; width?: number }) {
  return (-(road.width ?? 9.6) / 2 + embarcaderoBikeCenter(road) - 0.9) / 2;
}
