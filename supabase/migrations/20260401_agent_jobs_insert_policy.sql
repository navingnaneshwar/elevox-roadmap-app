-- ============================================================
-- supabase/migrations/20260401_agent_jobs_insert_policy.sql
-- Adds the missing INSERT RLS policy on agent_jobs so the
-- frontend anon client can queue jobs after onboarding.
--
-- Root cause: 001_initial_schema only created a SELECT policy.
-- 007_missing_columns added FOR ALL but may not have been run.
-- This migration is safe to re-run (uses IF NOT EXISTS pattern).
-- ============================================================

-- Drop the old FOR ALL policy if it exists (from 007_missing_columns)
-- and replace with explicit, separate policies for clarity.
DROP POLICY IF EXISTS "Users see own jobs" ON agent_jobs;

-- SELECT: users can read their own jobs (for dashboard display)
CREATE POLICY "Users can view own jobs"
  ON agent_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can queue their own jobs (needed for onboarding trigger)
CREATE POLICY "Users can insert own jobs"
  ON agent_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify policies are in place
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'agent_jobs'
ORDER BY cmd;
