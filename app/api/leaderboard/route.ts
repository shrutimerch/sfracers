import { env } from 'cloudflare:workers';
import { LEADERBOARD_COURSE, parseSubmission } from '../../../game/leaderboard/model';
const headers = { 'Cache-Control': 'no-store' };
function connection() {
  const config = env as unknown as Record<string, string>;
  if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY)
    throw Error('Leaderboard connection is not configured yet.');
  return {
    url: `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/race_times`,
    key: config.SUPABASE_PUBLISHABLE_KEY,
  };
}
export async function GET() {
  try {
    const { url, key } = connection();
    const response = await fetch(
      `${url}?course=eq.${LEADERBOARD_COURSE}&select=id,name,x_handle,time_ms,character,position,created_at&order=time_ms.asc,created_at.asc,id.asc&limit=10`,
      { headers: { apikey: key }, signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw Error('Leaderboard is temporarily unavailable.');
    const rows = (await response.json()) as {
      id: string;
      name: string;
      x_handle: string | null;
      time_ms: number;
      character: string;
      position: number;
      created_at: string;
    }[];
    return Response.json(
      {
        entries: rows.map((row) => ({
          id: row.id,
          name: row.name,
          xHandle: row.x_handle,
          timeMs: row.time_ms,
          character: row.character,
          position: row.position,
          createdAt: row.created_at,
        })),
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: 'Leaderboard unavailable. Please try again shortly.' },
      { status: 503, headers },
    );
  }
}
export async function POST(request: Request) {
  let result: ReturnType<typeof parseSubmission>;
  try {
    const body = await request.text();
    if (body.length > 1024) throw Error('Submission is too large.');
    result = parseSubmission(JSON.parse(body));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid result.' },
      { status: 400, headers },
    );
  }
  try {
    const { url, key } = connection();
    const response = await fetch(url, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: result.id,
        name: result.name,
        x_handle: result.xHandle,
        time_ms: result.timeMs,
        character: result.character,
        position: result.position,
        course: LEADERBOARD_COURSE,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 409) return Response.json({ saved: true }, { headers });
    if (!response.ok) throw Error('Submission failed');
    return Response.json({ saved: true }, { status: 201, headers });
  } catch {
    return Response.json(
      { error: 'Your time could not be saved. Please try again.' },
      { status: 503, headers },
    );
  }
}
