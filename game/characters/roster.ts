export const STANDARD_CHARACTERS = [
  {
    group: 'sf',
    id: 'chonkers',
    name: 'Chonkers',
    title: 'The sea lion',
    color: '#ff894f',
    description: 'Big whiskers. Bigger racing dreams.',
  },
  {
    group: 'sf',
    id: 'karl',
    name: 'Karl',
    title: 'The fog',
    color: '#9cdcf4',
    description: 'A little cloud with somewhere to be.',
  },
  {
    group: 'sf',
    id: 'daniel',
    name: 'Daniel Lurie',
    title: 'City Hall on wheels',
    color: '#779bff',
    description: 'Taking the scenic route to City Hall.',
  },
  {
    group: 'sf',
    id: 'waymo',
    name: 'Waymo',
    title: 'The self-driving wildcard',
    color: '#72e1bd',
    description: 'No driver. Plenty of personality.',
  },
] as const;
export const SECRET_CHARACTERS = [
  {
    id: 'sam',
    group: 'ceo',
    name: 'Sam Altman',
    title: 'OpenAI',
    color: '#51c8b5',
    description: 'One more lap toward the future.',
  },
  {
    id: 'dario',
    group: 'ceo',
    name: 'Dario Amodei',
    title: 'Anthropic',
    color: '#dd9a79',
    description: 'Carefully considering the next corner.',
  },
  {
    id: 'elon',
    group: 'ceo',
    name: 'Elon Musk',
    title: 'xAI / Tesla',
    color: '#e95858',
    description: 'The launch window is open.',
  },
  {
    id: 'mark',
    group: 'ceo',
    name: 'Mark Zuckerberg',
    title: 'Meta',
    color: '#579bff',
    description: 'Connecting every apex.',
  },
  {
    id: 'garry',
    group: 'vc',
    name: 'Garry Tan',
    title: 'YC',
    color: '#ff8845',
    description: 'Welcome to the starting batch.',
  },
  {
    id: 'pejman',
    group: 'vc',
    name: 'Pejman Nozad',
    title: 'Pear',
    color: '#a0cd59',
    description: 'Ex-founders helping new founders reach their full potential',
  },
  {
    id: 'andrew',
    group: 'vc',
    name: 'Andrew Chen',
    title: 'Speedrun / a16z',
    color: '#a290ff',
    description: 'The name of the game is speed.',
  },
  {
    id: 'aditya',
    group: 'vc',
    name: 'Aditya',
    title: 'SPC',
    color: '#edbf5d',
    description: 'Finding the next great racing line.',
  },
] as const;
export const CHARACTERS = [...STANDARD_CHARACTERS, ...SECRET_CHARACTERS];
export type CharacterId = (typeof CHARACTERS)[number]['id'];
export const DEFAULT_CHARACTER: CharacterId = 'chonkers';
export function isCharacterId(value: unknown): value is CharacterId {
  return CHARACTERS.some((character) => character.id === value);
}
export function raceRoster(selected: CharacterId) {
  const group = CHARACTERS.find((character) => character.id === selected)!.group;
  return [
    selected,
    ...CHARACTERS.filter((character) => character.group === group && character.id !== selected).map(
      (character) => character.id,
    ),
  ];
}
