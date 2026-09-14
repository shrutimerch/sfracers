import { CHARACTERS, type CharacterId } from '../characters/roster.ts';
import { isEngineClass, type EngineClass } from '../simulation/engine-class.ts';
export function parseChallengeTime(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const time = Number(value);
  return Number.isSafeInteger(time) && time >= 20000 && time <= 3600000 ? time : null;
}

export type ChallengeDetails = {
  name?: string;
  character?: CharacterId;
  cc?: EngineClass;
  position?: number;
};
export function parseChallengeDetails(values: Record<string, unknown>) {
  const rawName = typeof values.name === 'string' ? values.name.trim() : '';
  const name = rawName.length <= 20 && !/[\x00-\x1f<>]/.test(rawName) ? rawName : '';
  const character = CHARACTERS.find((racer) => racer.id === values.character);
  const cc =
    typeof values.cc === 'string' && /^(50|100|150)$/.test(values.cc) ? Number(values.cc) : NaN;
  const position =
    typeof values.position === 'string' && /^[1-4]$/.test(values.position)
      ? Number(values.position)
      : undefined;
  return { name, character, cc: isEngineClass(cc) ? cc : undefined, position };
}
export function challengePath(timeMs?: number, details: ChallengeDetails = {}) {
  if (timeMs === undefined) return '/';
  const params = new URLSearchParams({ time: String(timeMs) });
  if (details.name?.trim()) params.set('name', details.name.trim());
  if (details.character) params.set('character', details.character);
  if (details.cc !== undefined) params.set('cc', String(details.cc));
  if (details.position !== undefined) params.set('position', String(details.position));
  return `/challenge?${params}`;
}

export function isLocalHost(host: string) {
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '[::1]' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}
