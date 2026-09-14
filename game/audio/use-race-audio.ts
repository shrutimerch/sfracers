'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createRaceAudio,
  RACE_TRACKS,
  MENU_AUDIO_ID,
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
    const preload = document.getElementById(MENU_AUDIO_ID) as
      | (HTMLAudioElement & {
          stopEarlyPlayback?: () => void;
          raceAudioActivated?: string;
        })
      | null;
    const wasPlaying = !!preload && (!preload.paused || preload.raceAudioActivated === 'true');
    preload?.stopEarlyPlayback?.();
    const tracks = Object.fromEntries(
      Object.entries(RACE_TRACKS).map(([name, src]) => {
        if (name === 'menu' && preload) return [name, preload];
        const audio = new Audio();
        // Set the policy before the URL: only menu music downloads during startup.
        // Buffer it before the first gesture instead of starting its fetch on that click.
        audio.preload = name === 'menu' ? 'auto' : 'none';
        audio.src = src;
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
          if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
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
    if (wasPlaying) audio.enable();
    setStatus((current) => ({ ...current, muted }));
    const enable = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-audio-toggle]')) return;
      if (preload) preload.raceAudioActivated = 'true';
      audio.enable();
    };
    const visibility = () => {
      if (document.hidden) audio.suspend();
      else audio.resume();
    };
    window.addEventListener('pointerdown', enable, true);
    window.addEventListener('keydown', enable, true);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      controller.current = null;
      window.removeEventListener('pointerdown', enable, true);
      window.removeEventListener('keydown', enable, true);
      document.removeEventListener('visibilitychange', visibility);
      audio.dispose();
      Object.values(tracks).forEach((track) => {
        // Retain the initial HTML player's buffer through Strict Mode and HMR remounts.
        if (track === preload) return;
        track.removeAttribute('src');
        track.load();
      });
      void context?.close().catch(() => {});
    };
  }, []);
  useEffect(() => {
    controller.current?.update(state);
  }, [state.mode, state.count, state.position]);
  return {
    ...status,
    startRace: (start: () => void) => {
      if (controller.current) controller.current.startRace(start);
      else start();
    },
    toggleMute: () => {
      if (!status.muted && (!status.enabled || status.unavailable)) {
        controller.current?.enable();
        return;
      }
      const muted = controller.current?.toggleMute() ?? false;
      try {
        localStorage.setItem('sf-racer-muted', String(muted));
      } catch {}
    },
  };
}
