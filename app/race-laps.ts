export const RACE_LAPS = 2;
export const KART_SCALE = 0.65;
export function completeCheckpoint(cp: number, lap: number, count: number) {
  if (cp + 1 < count) return { cp: cp + 1, lap, finished: false };
  return lap + 1 < RACE_LAPS
    ? { cp: 0, lap: lap + 1, finished: false }
    : { cp: count - 1, lap, finished: true };
}
export function lapDistance(distance: number, length: number) {
  return distance >= length * RACE_LAPS ? length : distance % length;
}
