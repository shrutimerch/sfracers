# SF Racer leaderboard

Project: https://supabase.com/dashboard/project/eujzpgbetogrpgmzukfi

The migration in `migrations/202609130001_race_leaderboard.sql` is applied to the project. The `race_times` table permits public reads and constrained inserts; public users cannot update or delete results or choose the server timestamp. Each finished race has a UUID to make submission retries idempotent.

Runtime variables (local `.dev.vars`, and the deployment's server environment):

- `SUPABASE_URL=https://eujzpgbetogrpgmzukfi.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` — the project's publishable key; no service-role key is needed.

Scores are scoped to the one-lap waterfront course version. The leaderboard is a casual, client-timed leaderboard, not a server-verified competitive timing system. Update the course version when changing the course or balancing in ways that invalidate existing records.
