'use client';
import { useEffect, useState } from 'react';
import * as T from 'three';
import { createRacer } from '../characters/racer.ts';
import { CHARACTERS, type CharacterId } from '../characters/roster.ts';

// Render portraits from the actual racers once, then use lightweight images in the HUD.
export function RaceStandings({ order, player }: { order: CharacterId[]; player: CharacterId }) {
  const [portraits, setPortraits] = useState<Partial<Record<CharacterId, string>>>({});
  useEffect(() => {
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setSize(160, 160);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight('#ffffff', '#618196', 3));
    const light = new T.DirectionalLight('#fff1da', 4);
    light.position.set(3, 5, 4);
    scene.add(light);
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(2.9, 1.9, 3.1);
    camera.lookAt(0, 0.8, 0);
    const images: Partial<Record<CharacterId, string>> = {};
    for (const { id } of CHARACTERS) {
      const racer = createRacer(id);
      scene.add(racer.root);
      renderer.render(scene, camera);
      images[id] = renderer.domElement.toDataURL();
      scene.remove(racer.root);
      racer.dispose();
    }
    renderer.dispose();
    setPortraits(images);
  }, []);
  return (
    <ol className="race-standings" aria-label="Race standings">
      {order.map((id, index) => {
        const racer = CHARACTERS.find((c) => c.id === id)!;
        return (
          <li key={id} className={id === player ? 'is-player' : ''}>
            <b className="standing-rank">{index + 1}</b>
            <div className="standing-portrait" style={{ backgroundColor: racer.color }}>
              {portraits[id] ? <img src={portraits[id]} alt="" /> : <span>{racer.name[0]}</span>}
            </div>
            <span className="standing-name">
              {racer.name}
              {id === player && <small>YOU</small>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
