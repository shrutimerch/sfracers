import type { CharacterId } from './roster.ts';

// Interpolate between two complete curves so the middleweights always sit
// between the heavy and light racers, even beyond the displayed speed bands.
export const CHARACTER_PERFORMANCE: Record<CharacterId, { lightness: number; feel: string }> = {
  sam: { lightness: 0.65, feel: 'Balanced · a little more launch' },
  dario: { lightness: 0.4, feel: 'Smooth · strong at speed' },
  elon: { lightness: 0.9, feel: 'Quick launch · fades at speed' },
  mark: { lightness: 0.55, feel: 'Balanced through the speed range' },
  garry: { lightness: 0.75, feel: 'Quick off the line' },
  pejman: { lightness: 0.25, feel: 'Patient launch · strong at speed' },
  andrew: { lightness: 0.85, feel: 'Fast launch · lighter at speed' },
  aditya: { lightness: 0.5, feel: 'Balanced through the speed range' },
  chonkers: { lightness: 0, feel: 'Slow launch · strong at speed' },
  karl: { lightness: 1, feel: 'Quick launch · fades at speed' },
  daniel: { lightness: 0.6, feel: 'Balanced · a little more launch' },
  waymo: { lightness: 0.4, feel: 'Smooth · a little more staying power' },
};
export function characterAcceleration(character: CharacterId, speed: number, boosting = false) {
  const forward = Math.max(0, speed);
  const heavy = 7.5 / (1 + (forward / 38) ** 2);
  const light = 15 / (1 + (forward / 18) ** 2);
  const mix = CHARACTER_PERFORMANCE[character].lightness;
  return (heavy + (light - heavy) * mix) * (boosting ? 20 / 11 : 1);
}
export const ACCELERATION_BANDS = [
  { label: 'Launch', mph: 0 },
  { label: 'At 40 mph', mph: 40 },
  { label: 'At 80 mph', mph: 80 },
] as const;
export function accelerationRating(character: CharacterId, mph: number) {
  const speed = mph / 2.237;
  const strongest = Math.max(
    characterAcceleration('chonkers', speed),
    characterAcceleration('karl', speed),
  );
  return Math.round((100 * characterAcceleration(character, speed)) / strongest);
}
