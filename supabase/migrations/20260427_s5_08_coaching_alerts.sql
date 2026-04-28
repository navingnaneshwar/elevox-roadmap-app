-- S5-08: Fix coaching_alerts schema to match Aristotle's writes
-- Run in QA SQL Editor first, then production after QA passes

ALTER TABLE coaching_alerts
  ADD COLUMN IF NOT EXISTS alert_message      TEXT,
  ADD COLUMN IF NOT EXISTS suggestions        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS questions          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS unverified_claims  JSONB DEFAULT '[]';

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'coaching_alerts'
ORDER BY column_name;
