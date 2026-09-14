'use client';
import { useState } from 'react';
import { challengePath, type ChallengeDetails } from '../leaderboard/challenge';
import { Share2, Copy } from 'lucide-react';
import { formatRaceTime } from '../leaderboard/model';

export function ShareButton({ timeMs, ...details }: { timeMs?: number } & ChallengeDetails) {
  const [status, setStatus] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [busy, setBusy] = useState(false);
  async function share(copyOnly = false) {
    const text =
      timeMs === undefined
        ? 'Race me through San Francisco in SF Racer!'
        : `I raced the waterfront in ${formatRaceTime(timeMs)}. Can you beat my time?`;
    setBusy(true);
    setStatus('');
    setManualLink('');
    try {
      const response = await fetch('/api/share-url');
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url)
        throw Error(data.error || 'Couldn’t create a share link. Try again.');
      const url = new URL(challengePath(timeMs, details), data.url).href;
      if (!copyOnly && navigator.share) {
        try {
          await navigator.share({ title: 'SF Racer', text, url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setStatus('Link copied!');
      } catch {
        setManualLink(url);
        setStatus('Copy this link to share.');
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Couldn’t create a share link. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="share-control">
      <div className="share-actions">
        <button type="button" className="share-button" onClick={() => void share()} disabled={busy}>
          <Share2 size={16} aria-hidden="true" />
          {timeMs === undefined ? 'Share' : 'Share my time'}
        </button>
        <button
          type="button"
          className="share-button"
          onClick={() => void share(true)}
          disabled={busy}
        >
          <Copy size={16} aria-hidden="true" /> Copy link
        </button>
      </div>
      <span className="share-status" role="status">
        {status}
      </span>
      {manualLink && (
        <input
          aria-label="Game link to copy"
          readOnly
          value={manualLink}
          onFocus={(event) => event.currentTarget.select()}
          autoFocus
        />
      )}
    </div>
  );
}
