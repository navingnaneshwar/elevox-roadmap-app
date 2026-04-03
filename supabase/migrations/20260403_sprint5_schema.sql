-- ============================================================
-- SPRINT 5 SCHEMA MIGRATION
-- Branch: sprint5 | Date: 2026-04-03
-- ============================================================

-- ── S5-01: Rename score columns in content_drafts ────────────
-- Shakespeare's internal quality gate score
ALTER TABLE content_drafts 
  ADD COLUMN IF NOT EXISTS self_credibility_score INTEGER;

-- Aristotle's editorial quality gate score (replaces aristotle_credibility_score)
ALTER TABLE content_drafts 
  ADD COLUMN IF NOT EXISTS editorial_credibility_score INTEGER;

-- Backfill from old columns if they exist
UPDATE content_drafts
  SET self_credibility_score = credibility_score
  WHERE self_credibility_score IS NULL AND credibility_score IS NOT NULL;

UPDATE content_drafts
  SET editorial_credibility_score = aristotle_credibility_score
  WHERE editorial_credibility_score IS NULL AND aristotle_credibility_score IS NOT NULL;

COMMENT ON COLUMN content_drafts.self_credibility_score IS 
  'Shakespeare self-assessment score (0-100): how credible the draft is before editorial review';
COMMENT ON COLUMN content_drafts.editorial_credibility_score IS 
  'Aristotle editorial score (0-100): external credibility gate, independent of Shakespeare self-score';

-- ── S5-02: industry_signals table ───────────────────────────
-- Stores Analyst sweep_industry results — broader than per-pillar briefings.
-- Used by Chanakya Stage 1 (gather_intelligence) to ask targeted clarification questions.
CREATE TABLE IF NOT EXISTS industry_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  industry        TEXT NOT NULL,
  sweep_query     TEXT,
  signals         JSONB NOT NULL DEFAULT '[]',   -- [{title, url, summary, relevance_score}]
  themes          JSONB NOT NULL DEFAULT '[]',   -- extracted themes Claude identifies
  opportunity_gaps JSONB DEFAULT '[]',           -- gaps in the exec's current narrative vs market
  sweep_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE industry_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own signals"
  ON industry_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert signals"
  ON industry_signals FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE industry_signals IS
  'S5-02: Pre-Chanakya industry sweep results. Analyst populates this before Chanakya Stage 1.';

-- Index for fast user+date lookups
CREATE INDEX IF NOT EXISTS idx_industry_signals_user_date
  ON industry_signals(user_id, sweep_date DESC);

-- ── S5-03: clarification_sessions table ─────────────────────
-- Chanakya Stage 1 (gather_intelligence mode) stores its Q&A session here.
-- Frontend reads this to drive the ClarificationPage conversation flow.
CREATE TABLE IF NOT EXISTS clarification_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_id       UUID REFERENCES industry_signals(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active'  -- active | complete | abandoned
                  CHECK (status IN ('active', 'complete', 'abandoned')),
  questions       JSONB NOT NULL DEFAULT '[]',    -- [{id, question, category, priority}]
  answers         JSONB NOT NULL DEFAULT '{}',    -- {questionId: answerText}
  extracted_anchors JSONB DEFAULT '[]',           -- verified_career_anchors Chanakya extracts
  context_summary TEXT,                           -- Claude's synthesis of the Q&A
  ready_for_framework BOOLEAN DEFAULT FALSE,      -- true when Chanakya is confident to proceed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clarification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clarification sessions"
  ON clarification_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clarification sessions"
  ON clarification_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clarification sessions"
  ON clarification_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to clarification sessions"
  ON clarification_sessions FOR ALL
  WITH CHECK (true);

COMMENT ON TABLE clarification_sessions IS
  'S5-03: Two-stage Chanakya. Stage 1 gather_intelligence stores questions + answers here before Stage 2 build_framework.';

-- Index for fast active session lookup
CREATE INDEX IF NOT EXISTS idx_clarification_sessions_user_status
  ON clarification_sessions(user_id, status);

-- ── S5-05: Add new columns to brand_frameworks ──────────────
-- Chanakya Stage 2 now outputs richer structured data
ALTER TABLE brand_frameworks
  ADD COLUMN IF NOT EXISTS verified_career_anchors JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS audience_personas        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS platform_strategy        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS community_map            JSONB DEFAULT '[]';

COMMENT ON COLUMN brand_frameworks.verified_career_anchors IS
  'S5-05: Specific career facts the exec confirmed in Chanakya Stage 1 — Shakespeare uses these as credibility anchors';
COMMENT ON COLUMN brand_frameworks.audience_personas IS
  'S5-05: Structured audience personas with platform, hook, and content type preferences';
COMMENT ON COLUMN brand_frameworks.platform_strategy IS
  'S5-05: Per-platform content strategy with format, cadence, and tone rules';
COMMENT ON COLUMN brand_frameworks.community_map IS
  'S5-05: Inner circle / peer network map for Phase 5 Community & Network';
