'use client';
import { useEffect, useRef, useState } from 'react';
import type { HUD, MapData } from './engine';
const fmt = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
export default function RaceGame() {
  const canvas = useRef<HTMLCanvasElement>(null),
    mini = useRef<HTMLCanvasElement>(null),
    engine = useRef<ReturnType<typeof import('./engine').makeGame> | null>(null);
  const [error, setError] = useState(''),
    [hud, setHud] = useState<HUD>({
      mode: 'loading',
      lap: 1,
      speed: 0,
      time: 0,
      boost: 100,
      progress: 0,
      street: 'South Park',
      position: 4,
      count: 3,
      drift: false,
      camera: 'Driver',
    });
  useEffect(() => {
    let cancelled = false;
    const lifecycle = new AbortController();
    Promise.all([
      Promise.resolve({ googleMapsKey: '' }),
      import('./engine'),
      fetch('/race-course.json').then((r) => {
        if (!r.ok) throw Error('Could not load the street map. Please reload.');
        return r.json() as Promise<MapData>;
      }),
    ])
      .then(async ([config, module, data]) => {
        if (cancelled) return;
        const [facades, controls] = await Promise.all([
          module.loadFacades(),
          fetch('/traffic-controls-osm.json').then((r) => {
            if (!r.ok) throw Error('Traffic map could not load.');
            return r.json() as Promise<{ elements: NonNullable<MapData['trafficControls']> }>;
          }),
        ]);
        data.trafficControls = controls.elements;
        if (cancelled || !canvas.current || !mini.current) {
          Object.values(facades).forEach((t) => t.dispose());
          return;
        }
        try {
          engine.current = module.makeGame(
            canvas.current,
            mini.current,
            data,
            setHud,
            facades,
            config.googleMapsKey,
          );
        } catch {
          setError('3D graphics could not start. Try a browser with WebGL enabled.');
        }
        const context = (
          document as Document & {
            modelContext?: { registerTool: (tool: unknown, options: unknown) => void };
          }
        ).modelContext;
        if (context)
          try {
            context.registerTool(
              {
                name: 'start_race',
                description: 'Start or restart the 3D SoMa kart race.',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
                annotations: { readOnlyHint: false },
                execute: (input: unknown) => {
                  if (!input || typeof input !== 'object' || Object.keys(input).length)
                    throw Error('Expected an empty object');
                  if (!engine.current) throw Error('Game is not ready');
                  engine.current.start();
                  return engine.current.getState();
                },
              },
              { signal: lifecycle.signal },
            );
          } catch {}
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : 'Building textures could not load. Please reload.',
          );
      });
    return () => {
      cancelled = true;
      lifecycle.abort();
      engine.current?.dispose();
    };
  }, []);
  const ready = hud.mode === 'ready' || hud.mode === 'loading';
  const imageryLoading = hud.scenery === 'Loading Google scenery…';
  const press = (key: string, value: boolean) => engine.current?.setKey(key, value);
  return (
    <main>
      <header>
        <a href="/" className="brand">
          <span className="brand-mark">SF</span> BAY CITY <em>KART</em>
        </a>
        <span className="district">
          SOUTH PARK → WATERFRONT <i>01</i>
        </span>
        <button onClick={() => engine.current?.pause()} disabled={ready}>
          {hud.mode === 'paused' ? 'Resume ▶' : 'Pause Ⅱ'}
        </button>
      </header>
      <section className="arena">
        <canvas
          className="world"
          ref={canvas}
          aria-label="3D kart racing through real San Francisco streets. Arrow keys drive, Space drifts, Shift boosts, V changes camera."
        />
        <div className="vignette" />
        {hud.scenery && (
          <div className="scenery-status" role="status">
            {hud.sceneryError || hud.scenery}
            {(imageryLoading || hud.sceneryError) && (
              <button onClick={() => engine.current?.useModeled()}>Use modeled scenery</button>
            )}
          </div>
        )}
        {(hud.scenery?.startsWith('Google') || imageryLoading) && (
          <div className="google-credit">
            <b>Google Maps</b>
            <span>{hud.credits}</span>
          </div>
        )}
        <div className="race-title">
          <span className="eyebrow">SAN FRANCISCO STREET SERIES</span>
          <h2>South Park Waterfront Circuit</h2>
          <p>
            {hud.street} <span> / </span> {hud.camera} camera
          </p>
        </div>
        {!ready && (
          <div className="place">
            <b>{hud.position}</b>
            <span>
              / 4<br />
              POSITION
              <br />
              LAP {hud.lap} / 2
            </span>
          </div>
        )}
        {(ready || hud.mode === 'paused' || hud.mode === 'finished' || error) && (
          <div className="start-card">
            <span className="sticker">
              {hud.mode === 'finished'
                ? 'CHECKERED FLAG'
                : hud.mode === 'paused'
                  ? 'PIT STOP'
                  : 'REAL CITY. KART RULES.'}
            </span>
            <h1>
              {hud.mode === 'finished' ? (
                <>
                  That’s a<br />
                  wrap!
                </>
              ) : hud.mode === 'paused' ? (
                <>
                  Taking
                  <br />a breather.
                </>
              ) : (
                <>
                  South Park
                  <br />
                  to the waterfront.
                </>
              )}
            </h1>
            <p>
              {error ||
                (hud.mode === 'finished'
                  ? `Finished in ${fmt(hud.time)}. Ready for another race?`
                  : hud.mode === 'paused'
                    ? 'The race is paused. Your rivals can wait.'
                    : 'Race from South Park along the waterfront promenade and King, then return on 3rd. Either side of South Park is open. Follow the green checkpoint rings; Shift accelerates faster.')}
            </p>
            <div className="race-spec">
              <div>
                <b>
                  2.18 <small>KM</small>
                </b>
                <span>PROPOSED CIRCUIT</span>
              </div>
              <div>
                <b>
                  4 <small>KARTS</small>
                </b>
                <span>TWO LAPS · NO SPEED CAP</span>
              </div>
            </div>
            <button
              className="go"
              disabled={hud.mode === 'loading' || !!error || imageryLoading || !!hud.sceneryError}
              onClick={() =>
                hud.mode === 'paused' ? engine.current?.pause() : engine.current?.start()
              }
            >
              {hud.mode === 'loading'
                ? 'Building the city…'
                : imageryLoading
                  ? 'Loading photographed South Park…'
                  : hud.mode === 'paused'
                    ? 'Back to the race →'
                    : hud.mode === 'finished'
                      ? 'Race again →'
                      : 'Let’s race →'}
            </button>
            <div className="start-help">
              <span>↑ / W &nbsp; ACCELERATE</span>
              <span>← → / A D &nbsp; STEER</span>
              <span>SPACE &nbsp; DRIFT</span>
              <span>SHIFT &nbsp; BOOST</span>
            </div>
          </div>
        )}
        {hud.mode === 'countdown' && (
          <div className="countdown" aria-live="assertive">
            {hud.count}
          </div>
        )}
        {hud.drift && (
          <div className="drift-tag">
            DRIFT CHARGING <span>Release SPACE for a boost</span>
          </div>
        )}
        <div className="minimap" hidden={hud.scenery?.startsWith('Google') || imageryLoading}>
          <span>
            WATERFRONT CIRCUIT <i>N ↑</i>
          </span>
          <canvas ref={mini} width={180} height={210} aria-label="Course minimap" />
          <div>
            <i /> YOU <small>● RIVALS</small>
          </div>
        </div>
        <div className="bottom-hud">
          <div className="speed">
            <b>{hud.speed.toString().padStart(2, '0')}</b>
            <span>MPH</span>
          </div>
          <div className="timer">
            <span className="eyebrow">RACE TIME</span>
            <b>{fmt(hud.time)}</b>
          </div>
          <div className="boost">
            <span className="eyebrow">
              BOOST <span>SHIFT</span>
            </span>
            <div
              role="meter"
              aria-label="Boost remaining"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(hud.boost)}
            >
              <i style={{ width: `${hud.boost}%` }} />
            </div>
          </div>
        </div>
        <div className="right-controls">
          <button onClick={() => engine.current?.toggleCamera()}>
            ◉ Camera <kbd>V</kbd>
          </button>
          <button onClick={() => engine.current?.recover()}>
            ↻ Unstuck <kbd>R</kbd>
          </button>
        </div>
        <div className="course-progress">
          <i style={{ width: `${hud.progress}%` }} />
        </div>
        <div className="touch">
          {[
            ['←', 'arrowleft'],
            ['↑', 'arrowup'],
            ['↓', 'arrowdown'],
            ['→', 'arrowright'],
            ['DRIFT', ' '],
            ['BOOST', 'shift'],
          ].map(([label, key]) => (
            <button
              key={key}
              aria-label={label}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(key, true);
              }}
              onPointerUp={() => press(key, false)}
              onPointerCancel={() => press(key, false)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <footer>
        <a href="/about">Scenery & privacy</a>
        <span>
          {hud.scenery?.startsWith('Google')
            ? 'SCENERY: GOOGLE MAPS · COURSE: OPENSTREETMAP'
            : 'ROUTE PROTOTYPE · MAPPED BUILDINGS · PHOTO DETAIL NEXT'}
        </span>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          © OpenStreetMap contributors ↗
        </a>
        <span>↑↓←→ DRIVE &nbsp; SPACE DRIFT &nbsp; SHIFT BOOST</span>
      </footer>
    </main>
  );
}
