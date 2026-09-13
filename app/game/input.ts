import type { RaceSimulation } from './simulation';
export function bindRaceInput(sim: RaceSimulation, toggleCamera: () => void) {
  const down = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key))
      e.preventDefault();
    sim.setKey(e.key.toLowerCase(), true);
    if (e.repeat) return;
    if (e.key === 'Escape') sim.pause();
    if (e.key.toLowerCase() === 'r') sim.recover();
    if (e.key.toLowerCase() === 'v') toggleCamera();
  };
  const up = (e: KeyboardEvent) => sim.setKey(e.key.toLowerCase(), false);
  const blur = () => sim.blur();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}
