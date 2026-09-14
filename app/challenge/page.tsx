import type { Metadata } from 'next';
import { Trophy, Flag } from 'lucide-react';
import { parseChallengeTime, parseChallengeDetails } from '../../game/leaderboard/challenge';
import { formatRaceTime } from '../../game/leaderboard/model';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const time = parseChallengeTime(params.time);
  const details = parseChallengeDetails(params);
  const title =
    time === null ? 'Race a friend · SF Racer' : `Can you beat ${formatRaceTime(time)}? · SF Racer`;
  const description = `${details.name || 'Your friend'} challenged you${details.character ? ` as ${details.character.name}` : ''}${details.cc ? ` in ${details.cc}cc` : ''}${details.position ? `, finishing ${['', '1st', '2nd', '3rd', '4th'][details.position]}` : ''}. Can you beat their time?`;
  return { title, description, openGraph: { title, description, images: ['/start-line.jpg'] } };
}
export default async function Challenge({ searchParams }: Props) {
  const params = await searchParams;
  const time = parseChallengeTime(params.time);
  const details = parseChallengeDetails(params);
  return (
    <main className="challenge-page">
      <a className="challenge-brand" href="/">
        SF RACER
      </a>
      <section className="challenge-card">
        <span className="sticker">FRIEND CHALLENGE</span>
        <Trophy size={76} className="finish-trophy" aria-hidden="true" />
        <p>
          {time === null
            ? 'A race through San Francisco awaits.'
            : `${details.name || 'Your friend'} raced the waterfront in`}
        </p>
        {time !== null && <strong className="challenge-time">{formatRaceTime(time)}</strong>}
        {time !== null && (details.character || details.cc || details.position) && (
          <p className="challenge-race-details">
            {[
              details.character && `Raced as ${details.character.name}`,
              details.cc && `${details.cc}cc`,
              details.position && `${['', '1st', '2nd', '3rd', '4th'][details.position]} place`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        <h1>{time === null ? 'Ready to race?' : 'Can you beat their time?'}</h1>
        <p>South Park → Waterfront · One lap · Pick your racer</p>
        <a className="challenge-go" href="/">
          <Flag size={20} aria-hidden="true" />
          {time === null ? 'Let’s race' : 'Beat this time'} →
        </a>
        <small>Free to play in your browser.</small>
      </section>
    </main>
  );
}
