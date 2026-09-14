import { MENU_AUDIO_ID } from './race-audio.ts';

// Static first-party script. The React audio controller takes over the same element later.
export const menuPlaybackBootstrap = `(() => {
  const audio = document.getElementById('${MENU_AUDIO_ID}');
  if (!audio) return;
  audio.volume = 0.45;
  audio.addEventListener('playing', () => {
    audio.firstPlaybackMs = String(Math.round(performance.now()));
  }, { once: true });
  const enable = (event) => {
    if (event?.target?.closest?.('[data-audio-toggle]')) return;
    try { if (localStorage.getItem('sf-racer-muted') === 'true') return; } catch {}
    if (document.hidden || !audio.paused) return;
    audio.raceAudioActivated = 'true';
    audio.play().catch(() => {});
  };
  window.addEventListener('pointerdown', enable, true);
  window.addEventListener('keydown', enable, true);
  // Returning players may already have autoplay permission. Try now, not after a click.
  enable();
  audio.stopEarlyPlayback = () => {
    window.removeEventListener('pointerdown', enable, true);
    window.removeEventListener('keydown', enable, true);
    delete audio.stopEarlyPlayback;
  };
})();`;
