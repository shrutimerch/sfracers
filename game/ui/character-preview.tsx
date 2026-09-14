'use client';
import { useEffect, useRef } from 'react';
import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRacer } from '../characters/racer.ts';
import { CHARACTERS, type CharacterId } from '../characters/roster.ts';

export function CharacterPreview({
  character,
  startLine = false,
}: {
  character: CharacterId;
  startLine?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: element, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(33, 1, 0.1, 30);
    if (startLine) {
      camera.position.set(-7, 6, 0);
      camera.lookAt(18, 1.5, 0);
    } else {
      camera.position.set(4.3, 2.9, 4.8);
      camera.lookAt(0, 0.84, 0);
    }
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    scene.environment = environment.texture;
    scene.add(new T.HemisphereLight('#f2fbff', '#3a708b', 2));
    const light = new T.DirectionalLight('#fff0d8', 4);
    light.position.set(3, 6, 4);
    scene.add(light);
    const rim = new T.DirectionalLight('#78d9ff', 3);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const racer = createRacer(character);
    scene.add(racer.root);
    const floor = new T.Mesh(
      new T.CylinderGeometry(1.45, 1.5, 0.08, 64),
      new T.MeshStandardMaterial({ color: '#24475a', roughness: 0.4, metalness: 0.25 }),
    );
    floor.position.y = -0.09;
    if (!startLine) scene.add(floor);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const started = performance.now();
    let frame = 0;
    const draw = () => {
      const width = element.clientWidth,
        height = element.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      if (startLine)
        camera.fov = T.MathUtils.radToDeg(
          2 *
            Math.atan(
              Math.tan(T.MathUtils.degToRad(65 / 2)) * Math.min(1, 1600 / 886 / camera.aspect),
            ),
        );
      camera.updateProjectionMatrix();
      const elapsed = reducedMotion.matches ? 0 : (performance.now() - started) / 1000;
      racer.root.rotation.y = startLine ? 0 : Math.sin(elapsed * 0.45) * 0.38;
      racer.update(0, 0, 0, false, elapsed);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      racer.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      environment.dispose();
      renderer.dispose();
    };
  }, [character, startLine]);
  const name = CHARACTERS.find((c) => c.id === character)!.name;
  return (
    <canvas
      ref={canvas}
      className={startLine ? 'start-line-racer' : 'character-preview'}
      role="img"
      aria-label={`3D preview of ${name} and their kart`}
    />
  );
}
