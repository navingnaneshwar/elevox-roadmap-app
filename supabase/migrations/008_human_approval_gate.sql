-- ============================================================
-- 008_human_approval_gate.sql
-- Adds human approval tracking to content_drafts.
-- Nothing schedules until human_approved_at is set.
-- ============================================================

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS human_approved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS human_approved_by  uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS human_rejected_at  timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_note     text;

-- Index for the approval queue query
CREATE INDEX IF NOT EXISTS content_drafts_approval_queue_idx
  ON content_drafts(user_id, approved_for_publish, human_approved_at, status);

-- ============================================================
-- 009_fix_updated_at_trigger.sql (bundled here for single run)
-- Fixes silent write failure caused by missing updated_at column
-- or a broken BEFORE UPDATE trigger on content_drafts.
-- ============================================================

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_content_drafts_updated_at ON content_drafts;

CREATE TRIGGER set_content_drafts_updated_at
  BEFORE UPDATE ON content_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
