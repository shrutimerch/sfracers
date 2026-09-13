import { devShortcutDistance } from './simulation/dev-shortcuts';
import { RACE_LAPS, lapDistance } from './simulation/race-laps';
import { prepareCourse } from './simulation/course';
import { createGoogleScenery } from './imagery/google-scenery';
import { createWorld } from './rendering/world';
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
) {
  const d = prepareCourse(data);
  const world = createWorld(canvas, d, facades),
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
  const { player, rivalMeshes, ring, pads } = createRaceVisuals(world, route);
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
  const start = () => {
    if (google && (!google.ready || google.error)) return;
    sim.start();
  };
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
      scenery.visible ? world.cityMotion.obstacles : [],
    );
    const state = sim.state,
      { mode, x, z, angle, speed, time, boost, cp, lap, count, drifting, progress, street } = state;
    if (google) {
      const height = google.update(x, z, now);
      if (height !== null) roadHeight = height;
      for (const pad of pads) pad.position.y = roadHeight + 0.13;
    }
    player.position.set(x, roadHeight + (drifting ? Math.sin(now / 50) * 0.03 : 0), z);
    player.rotation.y = -angle;
    player.rotation.x = drifting ? Math.sin(now / 100) * 0.025 : 0;
    player.visible = !firstPerson;
    rivals.forEach((r, i) => {
      const p = at(lapDistance(r.s, total));
      rivalMeshes[i].position.set(p.x, roadHeight, p.z);
      rivalMeshes[i].rotation.y = -p.a;
    });
    const next = at(checks[Math.min(cp, checks.length - 1)]);
    ring.position.set(next.x, roadHeight + 5.8, next.z);
    ring.rotation.set(0, Math.PI / 2 - next.a, 0);
    ring.material.opacity = 0.6 + Math.sin(now / 250) * 0.2;
    drawCamera(state, firstPerson, roadHeight, dt, !!sim.keys.shift, google);
    if (now - hudTime > 100) {
      hudTime = now;
      drawMinimap(x, z, rivals);
      update({
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
    start,
    pause: sim.pause,
    recover: sim.recover,
    toggleCamera,
    setKey: sim.setKey,
    getState: () => {
      const { mode, time, progress, lap } = sim.state;
      return { mode, time, progress, lap: lap + 1 };
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      google?.dispose();
      world.disposeTextures();
      unbindInput();
      disposeScene(scene);
      officeTextures.forEach((t) => t.dispose());
      Object.values(facades).forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
