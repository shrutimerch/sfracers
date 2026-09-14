'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createRaceAudio,
  RACE_TRACKS,
  type AudioRaceState,
  type AudioStatus,
  type Track,
} from './race-audio.ts';

export function useRaceAudio(state: AudioRaceState) {
  const controller = useRef<ReturnType<typeof createRaceAudio> | null>(null);
  const [status, setStatus] = useState<AudioStatus>({
    muted: false,
    starting: false,
    enabled: false,
    unavailable: false,
  });
  useEffect(() => {
    const tracks = Object.fromEntries(
      Object.entries(RACE_TRACKS).map(([name, src]) => {
        const audio = new Audio(src);
        audio.preload = 'none';
        return [name, audio];
      }),
    ) as Record<keyof typeof RACE_TRACKS, HTMLAudioElement>;
    let context: AudioContext | undefined;
    let muted = false;
    try {
      muted = localStorage.getItem('sf-racer-muted') === 'true';
    } catch {}
    const audio = createRaceAudio(
      {
        tracks: tracks as unknown as Record<keyof typeof RACE_TRACKS, Track>,
        unlock() {
          try {
            context ??= new AudioContext();
            void context.resume().catch(() => {});
          } catch {}
        },
        beep(go) {
          if (!context || context.state !== 'running') return;
          const oscillator = context.createOscillator(),
            gain = context.createGain();
          const now = context.currentTime,
            duration = go ? 0.45 : 0.14;
          oscillator.type = 'square';
          oscillator.frequency.value = go ? 1046.5 : 523.25;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.075, now + 0.008);
          gain.gain.setValueAtTime(0.075, now + duration - 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(now);
          oscillator.stop(now + duration);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        },
        notify: setStatus,
        later: (callback, milliseconds) => setTimeout(callback, milliseconds),
        cancel: (timer) => clearTimeout(timer),
      },
      muted,
    );
    controller.current = audio;
    setStatus((current) => ({ ...current, muted }));
    const enable = () => audio.enable();
    const visibility = () => {
      if (document.hidden) audio.suspend();
      else audio.resume();
    };
    window.addEventListener('pointerdown', enable);
    window.addEventListener('keydown', enable);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      controller.current = null;
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      document.removeEventListener('visibilitychange', visibility);
      audio.dispose();
      Object.values(tracks).forEach((track) => {
        track.removeAttribute('src');
        track.load();
      });
      void context?.close().catch(() => {});
    };
  }, []);
  useEffect(() => {
    controller.current?.update(state);
  }, [state.mode, state.count]);
  return {
    ...status,
    startRace: (start: () => void) => {
      if (controller.current) controller.current.startRace(start);
      else start();
    },
    toggleMute: () => {
      const muted = controller.current?.toggleMute() ?? false;
      try {
        localStorage.setItem('sf-racer-muted', String(muted));
      } catch {}
    },
  };
}
