-- ============================================================
-- Sprint 5 Migration — Two-Stage Chanakya + Agent Boundaries
-- ============================================================

-- S5-01: Rename credibility scores (agent boundary cleanup)
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS self_credibility_score integer;
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS editorial_credibility_score integer;

-- S5-02: Industry signals table (pre-Chanakya market sweep)
CREATE TABLE IF NOT EXISTS industry_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  industry     text NOT NULL,
  signals      jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE industry_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own industry_signals"
  ON industry_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage industry_signals"
  ON industry_signals FOR ALL USING (true);

-- S5-03: Clarification sessions table (Two-Stage Chanakya dialogue)
CREATE TABLE IF NOT EXISTS clarification_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE,
  chanakya_summary text,
  strongest_signal text,
  questions        jsonb DEFAULT '[]',  -- [{gap, why_it_matters, question}]
  assumptions_made text,
  user_responses   jsonb DEFAULT '{}',  -- {question_index: answer}
  status           text DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'complete')),
  created_at       timestamptz DEFAULT now(),
  answered_at      timestamptz
);
ALTER TABLE clarification_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own clarification_sessions"
  ON clarification_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own clarification_sessions"
  ON clarification_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage clarification_sessions"
  ON clarification_sessions FOR ALL USING (true);

-- S5-05: Upgraded brand_frameworks schema (verified anchors, platform strategy, community map)
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS verified_career_anchors jsonb DEFAULT '[]';
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS audience_personas        jsonb DEFAULT '[]';
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS platform_strategy        jsonb DEFAULT '[]';
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS community_map            jsonb DEFAULT '{}';
-- gap_analysis was output-only before — now persisted (fix from Sprint 5 spec)
ALTER TABLE brand_frameworks ADD COLUMN IF NOT EXISTS gap_analysis             jsonb DEFAULT '{}';

-- S5-06: New onboarding profile fields (18 new fields)
-- Step 01 — Identity & Profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_tenure          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS board_roles          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_stage        text;
-- Step 02 — Career Narrative
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credibility_inventory text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS built_from_scratch    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_of_a_kind       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recognition           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS origin_moment         text;
-- Step 03 — Brand Goals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_persona        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desired_action        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS audience_online       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warm_relationships    text;
-- Step 04 — Voice & Tone
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vulnerability_comfort text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nervous_topics        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instant_delete_triggers text;
-- Step 05 — Topics & Expertise
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contrarian_thesis     text;
-- Step 06 — Calendar & Logistics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_preferences  text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platforms_to_avoid    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_comfort         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS writing_style         text;
-- Step 07 — Competitive Landscape
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS competitive_whitespace text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_dislike       text;
-- Step 08 — Success Metrics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS early_signal          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_following    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_engagement    text;
