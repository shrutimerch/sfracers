import { DEFAULT_CHARACTER, type CharacterId } from './characters/roster.ts';
import { createCharacterSelection } from './characters/selection.ts';
import { devShortcutDistance } from './simulation/dev-shortcuts';
import { RACE_LAPS, lapDistance } from './simulation/race-laps';
import { prepareCourse } from './simulation/course';
import { createGoogleScenery } from './imagery/google-scenery';
import { createWorld, createWorldAsync, type RaceWorld } from './rendering/world';
import { createRaceSimulation } from './simulation/simulation';
import { createRaceVisuals } from './rendering/race-visuals';
import { createRaceCamera } from './rendering/camera';
import { createMinimap } from './rendering/minimap';
import { bindRaceInput } from './input';
import { disposeScene } from './rendering/dispose';
import type { MapData, HUD, Facades } from './types';
// Preserve the existing engine API for both the main game and the legacy /kart route.
export type { MapData, HUD, Facades, Point } from './types';
export { loadFacades } from './rendering/facades';
export function makeGame(
  canvas: HTMLCanvasElement,
  mini: HTMLCanvasElement,
  data: MapData,
  update: (h: HUD) => void,
  facades: Facades,
  googleKey = '',
  initialCharacter: CharacterId = DEFAULT_CHARACTER,
  preparedWorld?: RaceWorld,
) {
  const d = prepareCourse(data);
  const world = preparedWorld ?? createWorld(canvas, d, facades),
    { renderer, scene, camera, scenery, officeTextures } = world;
  const shortcut =
    process.env.NODE_ENV === 'development'
      ? devShortcutDistance(window.location.pathname, d)
      : null;
  const inspection =
    process.env.NODE_ENV === 'development'
      ? (shortcut ??
        Math.max(0, Number(new URLSearchParams(window.location.search).get('inspect')) || 0))
      : 0;
  const sim = createRaceSimulation(d, inspection, !!googleKey, shortcut !== null),
    { route, checks, rivals } = sim,
    { total, at } = route;
  const {
    player,
    rivalMeshes,
    ring,
    pads,
    selectCharacter,
    animateRacers,
    startMarshal,
    disposeRacerEnvironment,
  } = createRaceVisuals(world, route);
  const drawMinimap = createMinimap(mini, d, route),
    drawCamera = createRaceCamera(camera, renderer, scene);
  scenery.visible = !googleKey;
  let google = googleKey ? createGoogleScenery(scene, camera, renderer, googleKey) : null;
  let roadHeight = 0,
    firstPerson = false,
    raf = 0,
    last = 0,
    hudTime = 0,
    disposed = false;
  const toggleCamera = () => {
    firstPerson = !firstPerson;
  };
  const unbindInput = bindRaceInput(sim, toggleCamera);
  const useModeled = () => {
    google?.dispose();
    google = null;
    sim.setPhotographic(false);
    scenery.visible = true;
    roadHeight = 0;
    for (const pad of pads) pad.position.y = 0.13;
  };
  const characterSelection = createCharacterSelection(sim, selectCharacter, initialCharacter);
  const start = (character?: CharacterId) => {
    if (google && (!google.ready || google.error)) return false;
    return characterSelection.start(character);
  };
  let animationTime = 0;
  function frame(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0.016, 0.04);
    last = now;
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (
      canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(height * renderer.getPixelRatio())
    ) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    // The optional imagery mode stays at this boundary; simulation remains independent of it.
    if (sim.state.mode !== 'paused' && scenery.visible) world.cityMotion.update(dt, sim.state);
    sim.step(
      dt,
      (!google || google.ready) && !google?.error,
      scenery.visible ? world.trafficObstacles : [],
    );
    const state = sim.state,
      { mode, x, z, angle, speed, time, boost, cp, lap, count, drifting, progress, street } = state;
    if (google) {
      const height = google.update(x, z, now);
      if (height !== null) roadHeight = height;
      for (const pad of pads) pad.position.y = roadHeight + 0.13;
    }
    world.lighting.update(x, z, roadHeight);
    player.position.set(x, roadHeight + (drifting ? Math.sin(now / 50) * 0.03 : 0), z);
    player.rotation.y = -angle;
    player.rotation.x = drifting ? Math.sin(now / 100) * 0.025 : 0;
    player.visible = !firstPerson;
    rivals.forEach((r, i) => {
      const p = at(lapDistance(r.s, total));
      rivalMeshes[i].position.set(p.x, roadHeight, p.z);
      rivalMeshes[i].rotation.y = -p.a;
    });
    const steer =
      (sim.keys.d || sim.keys.arrowright ? 1 : 0) - (sim.keys.a || sim.keys.arrowleft ? 1 : 0);
    const moving = mode === 'racing' || mode === 'inspection';
    if (mode !== 'paused') animationTime += dt;
    animateRacers(
      mode === 'paused' ? 0 : dt,
      speed,
      steer,
      drifting,
      animationTime,
      rivals.map((r) => (moving && r.s < total * RACE_LAPS ? r.speed : 0)),
    );
    startMarshal.update(mode, count, time, animationTime, roadHeight);
    const next = at(checks[Math.min(cp, checks.length - 1)]);
    ring.position.set(next.x, roadHeight + 5.8, next.z);
    ring.rotation.set(0, Math.PI / 2 - next.a, 0);
    ring.material.opacity = 0.6 + Math.sin(now / 250) * 0.2;
    drawCamera(state, firstPerson, roadHeight, dt, !!sim.keys.shift, google);
    if (now - hudTime > 100) {
      hudTime = now;
      drawMinimap(x, z, rivals);
      const standings = [
        ...rivals.map((r) => ({ character: r.character, distance: r.s })),
        {
          character: state.character,
          distance: mode === 'finished' ? total * RACE_LAPS : progress,
        },
      ]
        .sort((a, b) => b.distance - a.distance)
        .map((r) => r.character);
      update({
        standings,
        mode,
        lap: lap + 1,
        speed: Math.round(Math.abs(speed) * 2.237),
        time,
        boost,
        progress: mode === 'finished' ? 100 : (progress / (total * RACE_LAPS)) * 100,
        street,
        position:
          mode === 'finished'
            ? 1 + rivals.filter((r) => r.s >= total * RACE_LAPS).length
            : 1 + rivals.filter((r) => r.s > progress).length,
        count: Math.ceil(count),
        drift: drifting,
        camera: firstPerson ? 'Driver' : 'Chase',
        scenery: google
          ? google.ready
            ? 'Google photographic scenery'
            : 'Loading Google scenery…'
          : 'Modeled scenery',
        sceneryError: google?.error || '',
        credits: google?.credits() || '',
      });
    }
  }
  const initial = sim.state;
  camera.position.set(
    initial.x - Math.cos(initial.angle) * 10,
    5,
    initial.z - Math.sin(initial.angle) * 10,
  );
  raf = requestAnimationFrame(frame);
  return {
    useModeled,
    selectCharacter: characterSelection.selectCharacter,
    start,
    pause: sim.pause,
    recover: sim.recover,
    toggleCamera,
    setKey: sim.setKey,
    getState: () => {
      const { mode, time, progress, lap } = sim.state;
      return { mode, time, progress, lap: lap + 1, character: sim.state.character };
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      google?.dispose();
      world.disposeTextures();
      unbindInput();
      disposeRacerEnvironment();
      disposeScene(scene);
      officeTextures.forEach((t) => t.dispose());
      Object.values(facades).forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}

export async function makeGameAsync(
  canvas: HTMLCanvasElement,
  mini: HTMLCanvasElement,
  data: MapData,
  update: (h: HUD) => void,
  facades: Facades,
  initialCharacter: () => CharacterId,
  signal?: AbortSignal,
) {
  const world = await createWorldAsync(canvas, prepareCourse(data), facades, signal);
  try {
    signal?.throwIfAborted();
    return makeGame(canvas, mini, data, update, facades, '', initialCharacter(), world);
  } catch (error) {
    world.disposeTextures();
    disposeScene(world.scene);
    world.officeTextures.forEach((texture) => texture.dispose());
    world.renderer.dispose();
    throw error;
  }
}
