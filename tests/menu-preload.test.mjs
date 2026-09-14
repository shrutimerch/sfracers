import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { menuPlaybackBootstrap } from '../game/audio/menu-preload-script.ts';
import { MENU_AUDIO_ID } from '../game/audio/race-audio.ts';

function setup(muted = false, hidden = false, blocked = false) {
  let plays = 0;
  const listeners = new Map();
  const audio = {
    paused: true,
    volume: 1,
    dataset: {},
    addEventListener() {},
    play() {
      plays++;
      if (blocked && plays === 1) return Promise.reject(new Error('NotAllowedError'));
      this.paused = false;
      return Promise.resolve();
    },
  };
  const document = {
    hidden,
    getElementById(id) {
      assert.equal(id, MENU_AUDIO_ID);
      return audio;
    },
  };
  runInNewContext(menuPlaybackBootstrap, {
    document,
    localStorage: { getItem: () => String(muted) },
    window: {
      addEventListener(name, handler, capture) {
        assert.equal(capture, true);
        listeners.set(name, handler);
      },
      removeEventListener(name, handler, capture) {
        assert.equal(capture, true);
        assert.equal(listeners.get(name), handler);
        listeners.delete(name);
      },
    },
  });
  return {
    audio,
    document,
    listeners,
    get plays() {
      return plays;
    },
  };
}
test('menu attempts playback before any gesture and does not restart on further clicks', () => {
  const page = setup();
  assert.equal(page.plays, 1);
  page.listeners.get('pointerdown')();
  assert.equal(page.plays, 1);
  assert.equal(page.audio.raceAudioActivated, 'true');
  page.listeners.get('keydown')();
  assert.equal(page.plays, 1);
  page.audio.stopEarlyPlayback();
  assert.equal(page.listeners.size, 0);
  assert.equal(page.audio.paused, false, 'handoff preserves the player and its playback');
});
test('early playback respects saved mute and hidden tabs', () => {
  const muted = setup(true);
  muted.listeners.get('pointerdown')();
  assert.equal(muted.plays, 0);
  const hidden = setup(false, true);
  hidden.listeners.get('keydown')();
  assert.equal(hidden.plays, 0);
});

test('blocked autoplay retries on the first interaction', async () => {
  const page = setup(false, false, true);
  await Promise.resolve();
  assert.equal(page.audio.paused, true);
  page.listeners.get('pointerdown')();
  assert.equal(page.plays, 2);
  assert.equal(page.audio.paused, false);
});
