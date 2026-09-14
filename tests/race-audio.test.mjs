import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceAudio } from '../game/audio/race-audio.ts';
function setup(muted = false) {
  const events = [],
    timers = new Map();
  let id = 0;
  const tracks = Object.fromEntries(
    ['menu', 'intro', 'circuit'].map((name) => [
      name,
      {
        loop: false,
        volume: 0,
        currentTime: 0,
        onended: null,
        onerror: null,
        play() {
          events.push(`play:${name}`);
          return Promise.resolve();
        },
        pause() {
          events.push(`pause:${name}`);
        },
        load() {
          events.push(`load:${name}`);
        },
      },
    ]),
  );
  const audio = createRaceAudio(
    {
      tracks,
      unlock() {},
      beep(go) {
        events.push(go ? 'go' : 'beep');
      },
      notify() {},
      later(callback) {
        timers.set(++id, callback);
        return id;
      },
      cancel(id) {
        timers.delete(id);
      },
    },
    muted,
  );
  return { audio, tracks, events, timers };
}
test('menu → complete intro → three beeps → go and looping circuit', () => {
  const { audio, tracks, events } = setup();
  audio.enable();
  assert.equal(tracks.menu.loop, true);
  assert.ok(events.includes('play:menu'));
  let starts = 0;
  audio.startRace(() => starts++);
  assert.ok(events.includes('play:intro'));
  assert.equal(starts, 0);
  audio.startRace(() => starts++);
  tracks.intro.onended();
  tracks.intro.onended();
  assert.equal(starts, 1);
  for (const count of [3, 3, 2, 2, 1]) audio.update({ mode: 'countdown', count });
  audio.update({ mode: 'racing', count: 0 });
  audio.update({ mode: 'racing', count: 0 });
  assert.deepEqual(
    events.filter((e) => e === 'beep' || e === 'go'),
    ['beep', 'beep', 'beep', 'go'],
  );
  assert.equal(events.filter((e) => e === 'play:circuit').length, 1);
  assert.equal(tracks.circuit.loop, true);
  audio.dispose();
});
test('pausing countdown does not repeat its beep; racing resumes at the same music position', () => {
  const { audio, tracks, events } = setup();
  audio.enable();
  audio.update({ mode: 'countdown', count: 2 });
  audio.update({ mode: 'paused', count: 2 });
  audio.update({ mode: 'countdown', count: 2 });
  assert.equal(events.filter((e) => e === 'beep').length, 1);
  audio.update({ mode: 'racing', count: 0 });
  tracks.circuit.currentTime = 41;
  audio.update({ mode: 'paused', count: 0 });
  audio.update({ mode: 'racing', count: 0 });
  assert.equal(tracks.circuit.currentTime, 41);
  audio.dispose();
});
test('muting skips the intro wait, and a stalled intro cannot block a race', () => {
  const { audio, tracks, timers } = setup();
  audio.enable();
  let starts = 0;
  audio.startRace(() => starts++);
  audio.toggleMute();
  assert.equal(starts, 1);
  assert.equal(timers.size, 0);
  tracks.intro.onended();
  assert.equal(starts, 1);
  audio.toggleMute();
  audio.startRace(() => starts++);
  [...timers.values()][0]();
  assert.equal(starts, 2);
  audio.dispose();
});
test('blocked playback starts silently; stale rejection cannot start a disposed game', async () => {
  const { audio, tracks } = setup();
  audio.enable();
  let starts = 0;
  tracks.intro.play = () => Promise.reject(new Error('playback blocked'));
  audio.startRace(() => starts++);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(starts, 1);
  audio.startRace(() => starts++);
  audio.dispose();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(starts, 1);
});
test('hidden tabs silence playback and cannot finish the pre-grid wait', () => {
  const { audio, events, timers } = setup();
  audio.enable();
  audio.startRace(() => {});
  audio.suspend();
  assert.equal(timers.size, 0);
  const plays = events.filter((e) => e.startsWith('play:')).length;
  audio.update({ mode: 'ready', count: 3 });
  assert.equal(events.filter((e) => e.startsWith('play:')).length, plays);
  audio.resume();
  assert.equal(timers.size, 1);
  audio.dispose();
});
