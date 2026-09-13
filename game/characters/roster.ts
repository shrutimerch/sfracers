export const CHARACTERS = [
  {
    id: 'chonkers',
    name: 'Chonkers',
    title: 'The sea lion',
    color: '#ff894f',
    description: 'Big whiskers. Bigger racing dreams.',
  },
  {
    id: 'karl',
    name: 'Karl',
    title: 'The fog',
    color: '#9cdcf4',
    description: 'A little cloud with somewhere to be.',
  },
  {
    id: 'daniel',
    name: 'Daniel Lurie',
    title: 'City Hall on wheels',
    color: '#779bff',
    description: 'Taking the scenic route to City Hall.',
  },
  {
    id: 'waymo',
    name: 'Waymo',
    title: 'The self-driving wildcard',
    color: '#72e1bd',
    description: 'No driver. Plenty of personality.',
  },
] as const;
export type CharacterId = (typeof CHARACTERS)[number]['id'];
export const DEFAULT_CHARACTER: CharacterId = 'chonkers';
export function isCharacterId(value: unknown): value is CharacterId {
  return CHARACTERS.some((character) => character.id === value);
}
export function raceRoster(selected: CharacterId) {
  return [
    selected,
    ...CHARACTERS.filter((character) => character.id !== selected).map((character) => character.id),
  ];
}
