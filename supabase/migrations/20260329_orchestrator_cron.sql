-- ============================================================
-- supabase/migrations/20260329_orchestrator_cron.sql
-- Wires the agent-orchestrator Edge Function to run on a
-- schedule via pg_cron + pg_net.
--
-- Prerequisites (enable once in Supabase Dashboard):
--   Database → Extensions → pg_cron  (enable)
--   Database → Extensions → pg_net   (enable)
--
-- Run this in Supabase SQL Editor AFTER enabling both extensions.
-- ============================================================

-- Replace <YOUR_PROJECT_REF> with your actual Supabase project ref
-- e.g. https://abcdefghijkl.supabase.co → project ref is 'abcdefghijkl'
-- Replace <YOUR_SERVICE_ROLE_KEY> with the service role key from
-- Supabase Dashboard → Settings → API → service_role key

-- ── Schedule: every 2 minutes ────────────────────────────────
-- Polls agent_jobs for pending rows and processes up to 3 per cycle
-- Adjust the schedule ('*/2 * * * *') as needed

SELECT cron.schedule(
  'elevox-orchestrator-poll',          -- job name (unique)
  '*/2 * * * *',                       -- every 2 minutes
  $$
  SELECT net.http_post(
    url     := 'https://cgjmdxxbrahbwlmsngsu.supabase.co/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY_USED_AT_SETUP_DO_NOT_COMMIT>'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- ── Verify the job was created ────────────────────────────────
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'elevox-orchestrator-poll';
