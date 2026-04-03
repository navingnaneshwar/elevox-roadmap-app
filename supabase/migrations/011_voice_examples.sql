-- ============================================================
-- 011_voice_examples.sql
-- Voice learning table — stores every post the CxO approved
-- or personally wrote. Shakespeare reads these before drafting.
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_examples (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source            text        NOT NULL CHECK (source IN ('user_submitted', 'shakespeare_approved', 'shakespeare_edited')),
  original_text     text,       -- what Shakespeare wrote (null if user_submitted)
  final_text        text        NOT NULL, -- what the CxO actually approved
  edit_delta        text,       -- diff between original and final (filled on approve)
  performance_score integer,   -- filled later from LinkedIn analytics
  content_pillar    text,       -- which pillar this post serves
  created_at        timestamptz DEFAULT now()
);

-- RLS: users only see their own voice examples
ALTER TABLE voice_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own voice examples" ON voice_examples
  FOR ALL USING (auth.uid() = user_id);

-- Index: Shakespeare fetches last N examples ordered by date
CREATE INDEX IF NOT EXISTS voice_examples_user_created_idx
  ON voice_examples(user_id, created_at DESC);
