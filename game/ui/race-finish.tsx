'use client';
import { useRef, useState } from 'react';
import type { EngineClass } from '../simulation/engine-class';
import { ShareButton } from './share-button';
import { Trophy } from 'lucide-react';
import { CHARACTERS } from '../characters/roster';
import { formatRaceTime, type RaceResult } from '../leaderboard/model';
export function RaceFinish({
  timeMs,
  cc,
  character,
  position,
  submit,
  onRaceAgain,
}: Omit<RaceResult, 'id'> & {
  cc: EngineClass;
  submit: (result: RaceResult, name: string, xHandle: string) => Promise<void>;
  onRaceAgain: () => void;
}) {
  const [result] = useState<RaceResult>(() => ({
    id: crypto.randomUUID(),
    timeMs,
    character,
    position,
  }));
  const [raceCc] = useState(cc);
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(''),
    [xHandle, setXHandle] = useState('');
  const [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const pending = useRef(false);
  const place = ['', '1st', '2nd', '3rd', '4th'][result.position];
  return (
    <section
      className={`trophy-screen trophy-place-${result.position}`}
      aria-labelledby="finish-title"
    >
      <div className="trophy-card">
        <span className="sticker">CHECKERED FLAG</span>
        <Trophy className="finish-trophy" size={112} strokeWidth={1.4} aria-hidden="true" />
        <h1 id="finish-title">{result.position === 1 ? 'YOU WIN!' : 'RACE COMPLETE!'}</h1>
        <p className="finish-place">
          {place} PLACE <span>· {CHARACTERS.find((c) => c.id === result.character)?.name}</span>
        </p>
        <div className="finish-time">
          <span>YOUR TIME</span>
          <strong>{formatRaceTime(result.timeMs)}</strong>
        </div>
        {saved ? (
          <p className="score-saved" role="status">
            {name} — time submitted!
          </p>
        ) : editing ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending.current) return;
              pending.current = true;
              setSaving(true);
              setError('');
              try {
                await submit(result, name, xHandle);
                setSaved(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Couldn’t save your time. Try again.');
              } finally {
                pending.current = false;
                setSaving(false);
              }
            }}
          >
            <label htmlFor="leaderboard-name">YOUR NAME</label>
            <div className="name-entry">
              <input
                id="leaderboard-name"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                required
                value={name}
                disabled={saving}
                onChange={(e) => setName(e.target.value)}
                aria-describedby="name-help"
              />
            </div>
            <label htmlFor="leaderboard-x">
              X PROFILE <span>(optional)</span>
            </label>
            <input
              className="x-profile-input"
              id="leaderboard-x"
              placeholder="@handle or https://x.com/handle"
              autoComplete="off"
              value={xHandle}
              disabled={saving}
              onChange={(e) => setXHandle(e.target.value)}
            />
            <p id="name-help">Your name, time, and optional X profile will be public.</p>
            <button className="submit-score" type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Submit time'}
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
        ) : (
          <button className="submit-score" onClick={() => setEditing(true)}>
            Submit to leaderboard
          </button>
        )}
        <ShareButton
          timeMs={result.timeMs}
          name={name}
          character={result.character}
          cc={raceCc}
          position={result.position}
        />
        <div className="finish-actions">
          <button onClick={onRaceAgain} disabled={saving}>
            Race again →
          </button>
        </div>
      </div>
    </section>
  );
}
