import * as T from 'three';
import type { RaceSimulation } from '../simulation/simulation';
import type { createGoogleScenery } from '../imagery/google-scenery';
export function createRaceCamera(
  camera: T.PerspectiveCamera,
  renderer: T.WebGLRenderer,
  scene: T.Scene,
) {
  const camPos = new T.Vector3(),
    look = new T.Vector3(),
    cameraAnchor = new T.Vector3();
  return (
    state: RaceSimulation['state'],
    firstPerson: boolean,
    roadHeight: number,
    dt: number,
    shift: boolean,
    google: ReturnType<typeof createGoogleScenery> | null,
  ) => {
    const { mode, x, z, angle, speed, boostTimer } = state;
    const keys = { shift };
    const ready = mode === 'ready';
    const behind = firstPerson ? -0.85 : ready ? 7 : 6 + Math.abs(speed) * 0.025;
    camPos.set(
      x - Math.cos(angle) * behind,
      google && !google.ready ? 70 : roadHeight + (firstPerson ? 2.6 : ready ? 6 : 5.2),
      z - Math.sin(angle) * behind,
    );
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 8));
    if (google?.ready) {
      camera.position.y = Math.max(camera.position.y, roadHeight + 2.6);
      cameraAnchor.set(x, roadHeight + 2.6, z);
      google.keepCameraClear(cameraAnchor, camera.position);
    }
    look.set(
      x + Math.cos(angle) * 18,
      google && !google.ready ? -20 : roadHeight + (firstPerson ? 1.7 : 1.5),
      z + Math.sin(angle) * 18,
    );
    camera.lookAt(look);
    camera.fov = T.MathUtils.lerp(camera.fov, boostTimer > 0 || keys.shift ? 76 : 65, dt * 3);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
}
