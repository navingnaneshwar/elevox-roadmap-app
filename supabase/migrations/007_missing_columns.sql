-- ============================================================
-- supabase/migrations/007_missing_columns.sql
-- Closes all gaps from the V2 architecture migrations.
-- Run in Supabase SQL Editor.
-- ============================================================


-- ── Migration 002 — agent_jobs user_id ───────────────────────
-- Was never run. Required for plan enforcement in orchestrator.

ALTER TABLE agent_jobs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);

CREATE POLICY "Users see own jobs" ON agent_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS agent_jobs_user_id_idx 
  ON agent_jobs(user_id);


-- ── Migration 005 gaps — Shakespeare columns missing ─────────
-- performance_score: filled post-publish by analytics agent
-- editor_feedback:   filled by Aristotle after evaluation

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS performance_score  integer,
  ADD COLUMN IF NOT EXISTS editor_feedback    text;


-- ── Migration 006 gaps — Aristotle columns missing ───────────
-- calendar_event_id: links draft to its calendar slot
-- escalation_reason: why Aristotle escalated to human EA

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS calendar_event_id  uuid REFERENCES content_calendar(id);

ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS draft_id           uuid REFERENCES content_drafts(id),
  ADD COLUMN IF NOT EXISTS escalation_reason  text;


-- ── brand_frameworks gap ─────────────────────────────────────
-- user_edits_summary: runtime field Shakespeare reads.
-- Stored here so agents don't need to recompute it each time.

ALTER TABLE brand_frameworks
  ADD COLUMN IF NOT EXISTS user_edits_summary text;


-- ── Indexes ───────────────────────────────────────────────────
-- Voice memory query — Shakespeare reads last 5 approved posts

CREATE INDEX IF NOT EXISTS content_drafts_user_status_idx
  ON content_drafts(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS content_drafts_credibility_idx
  ON content_drafts(user_id, credibility_score DESC);

CREATE INDEX IF NOT EXISTS content_drafts_composite_score_idx
  ON content_drafts(user_id, aristotle_composite_score DESC);

CREATE INDEX IF NOT EXISTS content_drafts_approved_idx
  ON content_drafts(user_id, approved_for_publish, status);


-- ── Verify all columns exist after running ───────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content_drafts'
ORDER BY ordinal_position;
