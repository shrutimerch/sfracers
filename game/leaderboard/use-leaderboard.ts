'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LeaderboardEntry, RaceResult } from './model';
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/leaderboard');
      const data = (await response.json()) as { entries: LeaderboardEntry[]; error?: string };
      if (!response.ok) throw Error(data.error);
      if (active.current) setEntries(data.entries);
    } catch {
      if (active.current) setError('Couldn’t load times. Try again.');
    } finally {
      if (active.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    active.current = true;
    void refresh();
    return () => {
      active.current = false;
    };
  }, [refresh]);
  const submit = async (result: RaceResult, name: string, xHandle: string) => {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, name, xHandle }),
    });
    const data = (await response.json()) as { saved?: boolean; error?: string };
    if (!response.ok) throw Error(data.error || 'Couldn’t save your time. Try again.');
    void refresh();
  };
  return { entries, loading, error, refresh, submit };
}
