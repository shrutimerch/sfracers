import { createRoute } from './route-math.ts';
import type { MapData } from '../types';

export const DEV_SHORTCUTS = {
  '1': { name: 'South Park', section: 'South Park', fraction: 0.5 },
  '2': { name: '2nd & Brannan', section: '2nd Street', fraction: 0.85 },
  '3': { name: 'Brannan Street', section: 'Brannan Street', fraction: 0.55 },
  '4': { name: 'Embarcadero', section: 'The Embarcadero', fraction: 0.55 },
  '5': { name: 'Ballpark — Second Street Gate', point: [484.9, 693.43] },
  '6': { name: 'King & 3rd', section: 'King Street', fraction: 0.95 },
  '7': { name: '3rd Street', section: '3rd Street', fraction: 0.55 },
} as const;

export function devShortcutDistance(pathname: string, d: MapData): number | null {
  const match = /^\/([1-7])\/?$/.exec(pathname);
  if (!match) return null;
  const shortcut = DEV_SHORTCUTS[match[1] as keyof typeof DEV_SHORTCUTS];
  if ('point' in shortcut) {
    const nearest = createRoute(d).nearest(...shortcut.point);
    return Number.isFinite(nearest.best) ? nearest.along : null;
  }
  const section = d.course?.sections.find((s) => s.name === shortcut.section);
  return section ? section.start + section.length * shortcut.fraction : null;
}
