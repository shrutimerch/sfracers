export const RACE_TRACKS = {
  menu: '/audio/character-select.m4a',
  intro: '/audio/start-grid.m4a',
  circuit: '/audio/circuit.m4a',
} as const;
export type AudioRaceState = { mode: string; count: number };
export type AudioStatus = {
  muted: boolean;
  starting: boolean;
  enabled: boolean;
  unavailable: boolean;
};
export type Track = {
  loop: boolean;
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  onended: (() => void) | null;
  onerror: (() => void) | null;
};
type Dependencies = {
  tracks: Record<keyof typeof RACE_TRACKS, Track>;
  unlock(): void;
  beep(go: boolean): void;
  notify(status: AudioStatus): void;
  later(callback: () => void, milliseconds: number): ReturnType<typeof setTimeout>;
  cancel(timer: ReturnType<typeof setTimeout>): void;
};

// Audio follows race state; it never owns the race clock or countdown timing.
export function createRaceAudio(deps: Dependencies, initialMuted = false) {
  let muted = initialMuted,
    enabled = false,
    starting = false,
    unavailable = false;
  let state: AudioRaceState = { mode: 'loading', count: 3 };
  let active: keyof typeof RACE_TRACKS | null = null;
  let lastCount = 0,
    pausedFrom = '',
    disposed = false,
    suspended = false,
    generation = 0;
  let pendingStart: (() => void) | null = null;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const notify = () => deps.notify({ muted, starting, enabled, unavailable });
  const stop = () => Object.values(deps.tracks).forEach((track) => track.pause());
  const clearWatchdog = () => {
    if (watchdog !== undefined) deps.cancel(watchdog);
    watchdog = undefined;
  };
  const finishIntro = () => {
    if (!pendingStart || disposed) return;
    clearWatchdog();
    deps.tracks.intro.pause();
    active = null;
    const start = pendingStart;
    pendingStart = null;
    starting = false;
    notify();
    start();
  };
  const play = (name: keyof typeof RACE_TRACKS, restart = false) => {
    if (disposed || suspended || muted || !enabled) return;
    if (active === name && !restart) return;
    stop();
    active = name;
    const track = deps.tracks[name],
      request = ++generation;
    if (restart) track.currentTime = 0;
    void track
      .play()
      .then(() => {
        if (disposed || request !== generation) return;
        unavailable = false;
        notify();
      })
      .catch(() => {
        if (disposed || request !== generation) return;
        unavailable = true;
        active = null;
        notify();
        if (name === 'intro') finishIntro();
      });
  };
  const sync = () => {
    if (disposed || starting) return;
    if (state.mode === 'loading' || state.mode === 'ready' || state.mode === 'finished')
      play('menu');
    else if (state.mode === 'racing' || state.mode === 'inspection') play('circuit');
    else {
      stop();
      active = null;
    }
  };
  deps.tracks.menu.loop = deps.tracks.circuit.loop = true;
  deps.tracks.intro.loop = false;
  for (const track of Object.values(deps.tracks)) track.volume = 0.45;
  deps.tracks.intro.onended = finishIntro;
  deps.tracks.intro.onerror = () => {
    unavailable = true;
    notify();
    finishIntro();
  };
  return {
    enable() {
      if (disposed) return;
      deps.unlock();
      if (!enabled) {
        enabled = true;
        notify();
        sync();
      }
    },
    toggleMute() {
      muted = !muted;
      ++generation;
      if (muted) {
        stop();
        active = null;
        finishIntro();
      } else {
        deps.unlock();
        enabled = true;
        active = null;
        sync();
      }
      notify();
      return muted;
    },
    startRace(start: () => void) {
      if (disposed || starting) return;
      deps.unlock();
      enabled = true;
      if (muted) {
        start();
        return;
      }
      pendingStart = start;
      starting = true;
      lastCount = 0;
      notify();
      deps.tracks.circuit.load();
      // A missing or stalled music file must never trap the player before the race.
      watchdog = deps.later(finishIntro, 12000);
      play('intro', true);
    },
    update(next: AudioRaceState) {
      const previous = state;
      state = next;
      if (next.mode === 'paused') pausedFrom = previous.mode;
      if (next.mode === 'countdown') {
        if (previous.mode !== 'countdown' && previous.mode !== 'paused') lastCount = 0;
        if (next.count > 0 && next.count !== lastCount) {
          if (enabled && !muted && !suspended) deps.beep(false);
          lastCount = next.count;
        }
      }
      if (
        next.mode === 'racing' &&
        (previous.mode === 'countdown' ||
          (previous.mode === 'paused' && pausedFrom === 'countdown'))
      ) {
        if (enabled && !muted && !suspended) deps.beep(true);
        deps.tracks.circuit.currentTime = 0;
        active = null;
      }
      sync();
    },
    suspend() {
      suspended = true;
      clearWatchdog();
      stop();
      active = null;
    },
    resume() {
      suspended = false;
      if (starting) {
        watchdog = deps.later(finishIntro, 12000);
        active = null;
        play('intro');
      } else sync();
    },
    dispose() {
      disposed = true;
      ++generation;
      clearWatchdog();
      pendingStart = null;
      stop();
      deps.tracks.intro.onended = deps.tracks.intro.onerror = null;
    },
  };
}
