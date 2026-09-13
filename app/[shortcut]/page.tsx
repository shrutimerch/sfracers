import { notFound } from 'next/navigation';
import RaceGame from '../../game/ui/race-game';
import { DEV_SHORTCUTS } from '../../game/simulation/dev-shortcuts';

export default async function ShortcutPage({ params }: { params: Promise<{ shortcut: string }> }) {
  const { shortcut } = await params;
  if (process.env.NODE_ENV !== 'development' || !Object.hasOwn(DEV_SHORTCUTS, shortcut)) notFound();
  return <RaceGame />;
}
