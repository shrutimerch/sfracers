'use client';
import { ShareButton } from './share-button';
import { Trophy } from 'lucide-react';
import { CHARACTERS } from '../characters/roster';
import { formatRaceTime, type LeaderboardEntry } from '../leaderboard/model';
export function Leaderboard({
  entries,
  loading,
  error,
  refresh,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string;
  refresh: () => void;
}) {
  return (
    <aside className="leaderboard-panel" aria-label="Global leaderboard">
      <details open>
        <summary>
          <Trophy size={20} aria-hidden="true" /> LEADERBOARD
        </summary>
        <p className="leaderboard-caption">WORLDWIDE · FASTEST LAP</p>
        {loading ? (
          <p role="status">Loading times…</p>
        ) : error ? (
          <div role="status">
            <p>{error}</p>
            <button onClick={refresh}>Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <p className="leaderboard-empty">
            The board is wide open.
            <br />
            Finish a race and set the first time!
          </p>
        ) : (
          <ol className="leaderboard-rows">
            {entries.map((entry, i) => (
              <li key={entry.id}>
                <span className="leaderboard-rank">{i + 1}</span>
                <span>
                  <span className="leaderboard-name">
                    <b>{entry.name}</b>
                    {entry.xHandle && (
                      <a
                        href={`https://x.com/${entry.xHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${entry.name} on X`}
                      >
                        @{entry.xHandle} ↗
                      </a>
                    )}
                  </span>
                  <small>
                    {CHARACTERS.find((c) => c.id === entry.character)?.name ?? entry.character}
                  </small>
                </span>
                <time>{formatRaceTime(entry.timeMs)}</time>
              </li>
            ))}
          </ol>
        )}
        <p className="leaderboard-footnote">South Park Waterfront · 1 lap</p>
      </details>
      <ShareButton />
    </aside>
  );
}
