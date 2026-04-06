-- ============================================================
-- supabase/migrations/007_verify_columns.sql
-- Run in Supabase SQL Editor to verify all V2 migrations ran.
-- Expected result: 25 rows across 5 tables.
-- ============================================================

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE
  (table_name = 'content_drafts' AND column_name IN (
    'word_count', 'credibility_anchor', 'contrarian_tension',
    'strategic_rationale', 'credibility_score', 'agent_version',
    'performance_score', 'editor_feedback', 'aristotle_cx_score',
    'aristotle_credibility_score', 'aristotle_composite_score',
    'aristotle_evaluation', 'approved_for_publish', 'revision_count',
    'calendar_event_id'
  ))
  OR
  (table_name = 'brand_frameworks' AND column_name IN (
    'mentor_memo', 'mentor_insights', 'user_edits_summary'
  ))
  OR
  (table_name = 'agent_jobs' AND column_name IN (
    'user_id'
  ))
  OR
  (table_name = 'approvals' AND column_name IN (
    'draft_id', 'escalation_reason'
  ))
  OR
  (table_name = 'user_edits' AND column_name IN (
    'user_id', 'entity_type', 'entity_id', 'field_path'
  ))
ORDER BY table_name, column_name;

-- ── Expected results ─────────────────────────────────────────
-- content_drafts  : 15 rows
-- brand_frameworks: 3 rows
-- agent_jobs      : 1 row
-- approvals       : 2 rows
-- user_edits      : 4 rows
-- ─────────────────────────────────────────────────────────────
-- TOTAL           : 25 rows
--
-- Any table returning fewer rows than expected = missing column.
-- Cross-reference against the counts above to identify the gap.
-- Run 007_missing_columns.sql to fix any missing columns.
-- ============================================================
