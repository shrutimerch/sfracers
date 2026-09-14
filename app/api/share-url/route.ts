import { env } from 'cloudflare:workers';
import { isLocalHost } from '../../../game/leaderboard/challenge';

export function GET() {
  const configured = (env as unknown as Record<string, string>).PUBLIC_GAME_URL;
  const url = new URL(configured || 'https://sfracers.shrutimerchant.com');
  if (isLocalHost(url.hostname) || !['https:', 'http:'].includes(url.protocol)) {
    return Response.json(
      { error: 'Sharing needs a public game address. It isn’t connected yet.' },
      { status: 503 },
    );
  }
  return Response.json({ url: url.origin }, { headers: { 'Cache-Control': 'no-store' } });
}
