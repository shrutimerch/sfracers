import { isCharacterId, type CharacterId } from '../characters/roster.ts';
export const LEADERBOARD_COURSE = 'south-park-waterfront-v1-1lap';
export type RaceResult = { id: string; timeMs: number; character: CharacterId; position: number };
export type LeaderboardEntry = RaceResult & {
  name: string;
  xHandle: string | null;
  createdAt: string;
};
export function formatRaceTime(ms: number) {
  const hundredths = Math.floor(ms / 10);
  const minutes = Math.floor(hundredths / 6000)
    .toString()
    .padStart(2, '0');
  const seconds = (Math.floor(hundredths / 100) % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}.${(hundredths % 100).toString().padStart(2, '0')}`;
}
export function parseSubmission(
  value: unknown,
): RaceResult & { name: string; xHandle: string | null } {
  if (!value || typeof value !== 'object') throw Error('Please enter your name.');
  const v = value as Record<string, unknown>;
  const name = typeof v.name === 'string' ? v.name.trim() : '';
  if (!name || name.length > 20 || /[\x00-\x1f<>]/.test(name))
    throw Error('Use a name of 1–20 characters.');
  const xHandle = parseXHandle(v.xHandle);
  if (
    typeof v.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.id) ||
    typeof v.timeMs !== 'number' ||
    !Number.isInteger(v.timeMs) ||
    v.timeMs < 20000 ||
    v.timeMs > 3600000 ||
    typeof v.character !== 'string' ||
    !isCharacterId(v.character) ||
    typeof v.position !== 'number' ||
    !Number.isInteger(v.position) ||
    v.position < 1 ||
    v.position > 4
  )
    throw Error('This race result is invalid. Please finish a new race.');
  return {
    id: v.id,
    name,
    xHandle,
    timeMs: v.timeMs,
    character: v.character,
    position: v.position,
  };
}

export function parseXHandle(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw Error('Enter a valid X profile link or handle.');
  let handle = value.trim();
  if (!handle) return null;
  if (/^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i.test(handle)) {
    const url = new URL(handle.startsWith('http') ? handle : `https://${handle}`);
    handle = url.pathname.replace(/^\/|\/$/g, '');
  }
  handle = handle.replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle))
    throw Error('Enter an X profile link or @handle, not a post link.');
  return handle;
}
