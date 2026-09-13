// Footprint IDs from OSM; visible materials and window character from the route Street View survey.
// Window spacing and vertical proportions are modeled approximations, not measured elevations.
export type RouteProfile = {
  color: string;
  trim: string;
  frames: string;
  floors: number;
  grid?: boolean;
  brick?: boolean;
  bay?: number;
};
export const routeProfiles: Record<number, RouteProfile> = {
  148551351: { color: '#bdb7a4', trim: '#d3cfc0', frames: '#829b9c', floors: 16, bay: 4.5 }, // The Brannan courtyard west tower
  148551352: { color: '#c3bdab', trim: '#d8d3c4', frames: '#829b9c', floors: 16, bay: 4.5 }, // The Brannan courtyard east tower
  112927451: {
    color: '#956e5b',
    trim: '#805d4f',
    frames: '#414b43',
    floors: 5,
    brick: true,
    bay: 7,
  }, // Warehouse at Second and Brannan, supplied May 2025 view
  112927456: { color: '#717c77', trim: '#8f9890', frames: '#34423e', floors: 3, bay: 4.3 }, // Adjacent gray warehouse
  124884339: {
    color: '#b9c3b4',
    trim: '#d2d8c9',
    frames: '#9aaca9',
    floors: 3,
    grid: true,
    bay: 4,
  }, // Third/South Park glass-fronted corner
  112775863: {
    color: '#bdb4a0',
    trim: '#d4cbb7',
    frames: '#424a46',
    floors: 2,
    grid: true,
    bay: 5,
  }, // Second/De Boom to Brannan
  37058259: { color: '#d5d3c5', trim: '#e7e3d3', frames: '#748782', floors: 4, bay: 3.8 }, // Delancey northwest apartments
  125401316: { color: '#b87c61', trim: '#d4b390', frames: '#768279', floors: 3, bay: 3.6 }, // Delancey southeast apartments
  288714475: { color: '#a88c7d', trim: '#e2dfcc', frames: '#b2c0b9', floors: 4, bay: 4 }, // King/Townsend cafe apartments
  148547436: { color: '#ccc3a2', trim: '#ece3c7', frames: '#343f38', floors: 1, bay: 4 }, // Second/King low restaurant
  149167944: { color: '#c0af87', trim: '#e0d5b9', frames: '#3c433c', floors: 2, bay: 4 }, // Third/King retail
  148325245: {
    color: '#b57b62',
    trim: '#bfc7c6',
    frames: '#364743',
    floors: 5,
    grid: true,
    bay: 4,
  }, // Third/Townsend apartments
  129176901: { color: '#b79d64', trim: '#9e5547', frames: '#3f3934', floors: 2, bay: 4 }, // Third/Townsend low retail
  124890326: {
    color: '#c8bd91',
    trim: '#dcd9bf',
    frames: '#a2b1ad',
    floors: 4,
    grid: true,
    bay: 4,
  }, // Third/Brannan and Varney
  124903637: { color: '#d2d3ca', trim: '#e4e2d6', frames: '#444e4c', floors: 2, bay: 4 }, // Third/Brannan pale low corner
  113545685: {
    color: '#8c5d4f',
    trim: '#b0b4ac',
    frames: '#424f4c',
    floors: 3,
    grid: true,
    bay: 3.5,
  }, // Jack London modern corner
  112758589: { color: '#976b55', trim: '#c3bcb0', frames: '#333d3d', floors: 6, brick: true }, // 300 Brannan
  112775864: {
    color: '#d0d0c7',
    trim: '#dfded3',
    frames: '#626e6c',
    floors: 6,
    grid: true,
    bay: 5,
  }, // 274 Brannan
  104599982: {
    color: '#dfded1',
    trim: '#eeeee1',
    frames: '#46585c',
    floors: 2,
    grid: true,
    bay: 6,
  }, // Pier 38
  148547440: { color: '#9d6850', trim: '#625d52', frames: '#34514e', floors: 5, brick: true }, // 128 King
  149167949: {
    color: '#b9b6a8',
    trim: '#dedbd0',
    frames: '#425766',
    floors: 9,
    grid: true,
    bay: 5,
  }, // 188–190 King
  129176918: { color: '#9d7057', trim: '#b9a58b', frames: '#384846', floors: 4, brick: true }, // 625 Third
};
export const hasRouteProfile = (b: { id?: number }) => !!routeProfiles[b.id ?? 0];
