'use client';
import { Leaderboard } from './leaderboard';
import { MobileControls } from './mobile-controls';
import { RaceFinish } from './race-finish';
import { useLeaderboard } from '../leaderboard/use-leaderboard';
import { RACE_LAPS } from '../simulation/race-laps';
import { ENGINE_CLASSES, type EngineClass } from '../simulation/engine-class.ts';
import { useEffect, useRef, useState } from 'react';
import type { HUD, MapData } from '../engine';
import {
  CHARACTERS,
  STANDARD_CHARACTERS,
  SECRET_CHARACTERS,
  DEFAULT_CHARACTER,
  type CharacterId,
} from '../characters/roster.ts';
import { createSecretCode } from '../characters/secret-code.ts';
import { RaceStandings } from './race-standings';
import { raceRoster } from '../characters/roster';
import { CharacterPreview } from './character-preview';
import { useRaceAudio } from '../audio/use-race-audio';
import {
  CHARACTER_PERFORMANCE,
  ACCELERATION_BANDS,
  accelerationRating,
} from '../characters/performance.ts';
const fmt = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
export default function RaceGame() {
  const canvas = useRef<HTMLCanvasElement>(null),
    mini = useRef<HTMLCanvasElement>(null),
    engine = useRef<ReturnType<typeof import('../engine').makeGame> | null>(null);
  const [character, setCharacter] = useState<CharacterId>(DEFAULT_CHARACTER);
  const [engineClass, setEngineClass] = useState<EngineClass>(100);
  const engineClassRef = useRef(engineClass);
  engineClassRef.current = engineClass;
  const characterRef = useRef(character);
  characterRef.current = character;
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const secretCode = useRef(createSecretCode());
  const selected = CHARACTERS.find((c) => c.id === character)!;
  const rosterPack = selected.group;
  const visibleCharacters =
    rosterPack === 'sf'
      ? STANDARD_CHARACTERS
      : SECRET_CHARACTERS.filter((racer) => racer.group === rosterPack);
  const chooseCharacter = (id: CharacterId) => {
    if (
      !engine.current ||
      engine.current.getState().mode === 'loading' ||
      engine.current.selectCharacter(id)
    ) {
      characterRef.current = id;
      setCharacter(id);
      return true;
    }
    return false;
  };
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
  const audio = useRaceAudio(hud);
  const leaderboard = useLeaderboard();
  useEffect(() => {
    let cancelled = false;
    const lifecycle = new AbortController();
    Promise.all([
      Promise.resolve({ googleMapsKey: '' }),
      import('../engine'),
      fetch('/race-course.json', { signal: lifecycle.signal }).then((r) => {
        if (!r.ok) throw Error('Could not load the street map. Please reload.');
        return r.json() as Promise<MapData>;
      }),
    ])
      .then(async ([config, module, data]) => {
        if (cancelled) return;
        const [facades, controls] = await Promise.all([
          module.loadFacades(),
          fetch('/traffic-controls-osm.json', { signal: lifecycle.signal }).then((r) => {
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
          engine.current = await module.makeGameAsync(
            canvas.current,
            mini.current,
            data,
            setHud,
            facades,
            () => characterRef.current,
            lifecycle.signal,
          );
        } catch (error) {
          Object.values(facades).forEach((texture) => texture.dispose());
          if (cancelled) return;
          setError('The race could not finish loading. Please reload and try again.');
          return;
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
                  audio.startRace(() => engine.current?.start(characterRef.current, engineClassRef.current));
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
      engine.current = null;
    };
  }, []);
  const ready = (hud.mode === 'ready' || hud.mode === 'loading') && !audio.starting;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !['loading', 'ready', 'finished'].includes(hud.mode) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('textarea, input:not([type="radio"]), [contenteditable="true"]')
      )
        return;
      if (!secretCode.current.press(event.key, event.repeat)) return;
      event.preventDefault();
      event.stopPropagation();
      setSecretUnlocked(true);
      if (!engine.current || engine.current.selectCharacter('sam')) {
        characterRef.current = 'sam';
        setCharacter('sam');
      }
    };
    const resetCode = () => secretCode.current.reset();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', resetCode);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', resetCode);
      resetCode();
    };
  }, [hud.mode]);
  const imageryLoading = hud.scenery === 'Loading Google scenery…';
  const press = (key: string, value: boolean) => engine.current?.setKey(key, value);
  return (
    <main
      className={`arcade-game ${ready ? 'in-garage' : 'in-race'}${hud.mode === 'finished' ? ' race-finished' : ''}`}
    >
      <link rel="preload" as="image" href="/start-line.jpg" />
      <header>
        <a href="/" className="brand">
          <span className="brand-mark">SF</span> BAY CITY <em>KART</em>
        </a>
        <span className="district">
          SOUTH PARK → WATERFRONT <i>01</i>
        </span>
        <button
          data-audio-toggle
          onClick={audio.toggleMute}
          aria-pressed={audio.muted}
          aria-label={audio.muted ? 'Turn sound on' : !audio.enabled || audio.unavailable ? 'Play music' : 'Mute music and countdown'}
        >
          {audio.muted ? 'Sound off' : !audio.enabled || audio.unavailable ? 'Play music' : 'Sound on'}
        </button>
        <button onClick={() => engine.current?.pause()} disabled={ready || audio.starting}>
          {hud.mode === 'paused' ? 'Resume ▶' : 'Pause Ⅱ'}
        </button>
      </header>
      <section className="arena">
        <canvas
          className="world"
          ref={canvas}
          aria-label="3D kart racing through real San Francisco streets. Arrow keys drive, Space drifts, Shift boosts, V changes camera."
        />
        {hud.mode === 'loading' && (
          <>
            <img
              className="start-line-preview"
              src="/start-line.jpg"
              alt="South Park race start line"
              fetchPriority="high"
            />
            <CharacterPreview character={character} startLine />
          </>
        )}
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
          <>
            <div className="place" aria-label={`Position ${hud.position} of 4`}>
              <b>{hud.position}</b>
              <span>{['', 'st', 'nd', 'rd', 'th'][hud.position] || 'th'}</span>
            </div>
            <RaceStandings order={hud.standings ?? raceRoster(character)} player={character} />
            <div className="lap-counter" aria-label={`Lap ${hud.lap} of ${RACE_LAPS}`}>
              <span className="lap-label">LAP</span>
              <b>{hud.lap}</b>
              <span className="lap-slash">/</span>
              <span className="lap-total">{RACE_LAPS}</span>
            </div>
          </>
        )}
        {!audio.starting && (ready || hud.mode === 'paused' || error) && (
          <div className={`start-card${ready || hud.mode === 'finished' ? ' character-card' : ''}`}>
            <span className="sticker">
              {hud.mode === 'finished'
                ? 'CHECKERED FLAG'
                : hud.mode === 'paused'
                  ? 'PIT STOP'
                  : 'CHOOSE YOUR RACER'}
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
                selected.name
              )}
            </h1>
            <p>
              {error ||
                (hud.mode === 'finished'
                  ? `Finished in ${fmt(hud.time)}. Ready for another race?`
                  : hud.mode === 'paused'
                    ? 'The race is paused. Your rivals can wait.'
                    : selected.description)}
            </p>
            {(ready || hud.mode === 'finished') && !error && (
              <>
                <fieldset className="engine-class-options">
                  <legend>Choose your engine class</legend>
                  <div>
                    {([50, 100, 150] as const).map((cc) => (
                      <label key={cc} className={engineClass === cc ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="engine-class"
                          value={cc}
                          checked={engineClass === cc}
                          onChange={() => {
                            engineClassRef.current = cc;
                            setEngineClass(cc);
                          }}
                        />
                        <b>{cc}cc</b>
                        <span>{ENGINE_CLASSES[cc].label}</span>
                      </label>
                    ))}
                  </div>
                  <small>{ENGINE_CLASSES[engineClass].description}</small>
                </fieldset>
                {secretUnlocked && (
                  <div className="roster-switch">
                    <span role="status">Secret roster unlocked</span>
                    <div role="group" aria-label="Character roster">
                      {(
                        [
                          ['sf', 'SF Racers', 'chonkers'],
                          ['vc', 'Incubators', 'garry'],
                          ['ceo', 'CEOs', 'sam'],
                        ] as const
                      ).map(([group, label, initial]) => (
                        <button
                          key={group}
                          type="button"
                          aria-pressed={rosterPack === group}
                          onClick={() => chooseCharacter(initial)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CharacterPreview character={character} />
                <fieldset className="character-options">
                  <legend>Choose a character</legend>
                  {visibleCharacters.map((racer) => (
                    <label key={racer.id} className={character === racer.id ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="character"
                        value={racer.id}
                        checked={character === racer.id}
                        onChange={() => chooseCharacter(racer.id)}
                      />
                      <span className="character-color" style={{ background: racer.color }} />
                      <span>
                        <strong>{racer.name}</strong>
                        <small>{racer.title}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {rosterPack !== 'sf' && (
                  <p className="rival-group" aria-live="polite">
                    {selected.group === 'ceo' ? 'CEO race' : 'Incubator race'} · Rivals:{' '}
                    {CHARACTERS.filter(
                      (racer) => racer.group === selected.group && racer.id !== character,
                    )
                      .map((racer) => racer.name)
                      .join(', ')}
                  </p>
                )}
                <div className="character-stats" aria-label={`${selected.name} acceleration`}>
                  <p>{CHARACTER_PERFORMANCE[character].feel}</p>
                  {ACCELERATION_BANDS.map((band) => (
                    <div className="character-stat" key={band.mph}>
                      <span>{band.label}</span>
                      <meter
                        min={0}
                        max={100}
                        value={accelerationRating(character, band.mph)}
                        aria-label={`${band.label} acceleration relative to the strongest racer at this speed`}
                      />
                    </div>
                  ))}
                  <small>Acceleration compared at each speed</small>
                </div>
              </>
            )}
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
                <span>{RACE_LAPS === 1 ? 'ONE LAP' : `${RACE_LAPS} LAPS`} · NO SPEED CAP</span>
              </div>
            </div>
            {hud.mode === 'loading' && !error && (
              <p className="track-loading" role="status">
                Choose your racer while the track loads.
              </p>
            )}
            <button
              className="go"
              disabled={hud.mode === 'loading' || !!error || imageryLoading || !!hud.sceneryError}
              onClick={() =>
                hud.mode === 'paused'
                  ? engine.current?.pause()
                  : audio.startRace(() => engine.current?.start(characterRef.current, engineClassRef.current))
              }
            >
              {hud.mode === 'loading'
                ? 'Loading track…'
                : imageryLoading
                  ? 'Loading photographed South Park…'
                  : hud.mode === 'paused'
                    ? 'Back to the race →'
                    : hud.mode === 'finished'
                      ? 'Race again →'
                      : `Race as ${selected.name} →`}
            </button>
            <div className="start-help">
              <span>↑ / W &nbsp; ACCELERATE</span>
              <span>← → / A D &nbsp; STEER</span>
              <span>SPACE &nbsp; DRIFT</span>
              <span>SHIFT &nbsp; BOOST</span>
            </div>
          </div>
        )}
        {ready && <Leaderboard {...leaderboard} />}
        {hud.mode === 'finished' && !audio.starting && (
          <>
            <RaceFinish
              cc={engineClass}
              timeMs={Math.round(hud.time * 1000)}
              character={character}
              position={hud.position}
              submit={leaderboard.submit}
              onRaceAgain={() => engine.current?.garage()}
            />
            <Leaderboard {...leaderboard} />
          </>
        )}
        {hud.mode === 'countdown' && (
          <div className="sr-only" aria-live="assertive">
            {hud.count > 2 ? 'Ready' : 'Set'}: {hud.count}
          </div>
        )}
        {hud.drift && (
          <div className="drift-tag">
            DRIFT CHARGING <span>Release SPACE for a boost</span>
          </div>
        )}
        <div
          className="minimap"
          hidden={
            ready || hud.mode === 'finished' || hud.scenery?.startsWith('Google') || imageryLoading
          }
        >
          <span>
            WATERFRONT CIRCUIT <i>N ↑</i>
          </span>
          <canvas ref={mini} width={180} height={210} aria-label="Course minimap" />
          <div>
            <i /> YOU <small>● RIVALS</small>
          </div>
        </div>
        <div className="bottom-hud">
          <div className="speed" aria-label={`${hud.speed} miles per hour`}>
            <svg className="speed-arc" viewBox="0 0 230 170" aria-hidden="true">
              {[
                '#27e8dc',
                '#40ec88',
                '#8ff543',
                '#c7f538',
                '#f9ea43',
                '#ffbe39',
                '#ff8735',
                '#ff5149',
              ].map((color, i) => {
                const angle = ((180 - i * 20) * Math.PI) / 180;
                const x = 119 + 96 * Math.cos(angle),
                  y = 130 - 96 * Math.sin(angle);
                return (
                  <rect
                    key={color}
                    x={x - 12}
                    y={y - 8}
                    width="24"
                    height="16"
                    rx="3"
                    transform={`rotate(${180 - i * 20 + 90} ${x} ${y})`}
                    fill={hud.speed >= (i + 1) * 12 ? color : '#34414c'}
                    stroke="#111a22"
                    strokeWidth="4"
                  />
                );
              })}
            </svg>
            <b>{hud.speed.toString().padStart(2, '0')}</b>
            <span>MPH</span>
          </div>
          <div className="timer">
            <span className="eyebrow">TIME</span>
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
          <button
            aria-label="Drift — hold Space"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              press(' ', true);
            }}
            onPointerUp={() => press(' ', false)}
            onPointerCancel={() => press(' ', false)}
            onLostPointerCapture={() => press(' ', false)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                press(' ', true);
              }
            }}
            onKeyUp={() => press(' ', false)}
            onBlur={() => press(' ', false)}
          >
            Drift <kbd>Space</kbd>
          </button>
        </div>
        <div className="course-progress">
          <i style={{ width: `${hud.progress}%` }} />
        </div>
        <MobileControls active={hud.mode === 'racing'} onInput={(input) => engine.current?.setMobileInput(input)} />
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
