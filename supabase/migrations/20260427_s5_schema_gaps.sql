-- ============================================================
-- S5-05: Schema gaps — columns referenced in agent-strategist
-- but missing from brand_frameworks
-- ============================================================

-- gap_analysis: Chanakya's internal reasoning before building the framework
-- Was being generated and logged but never saved to DB
ALTER TABLE brand_frameworks
  ADD COLUMN IF NOT EXISTS gap_analysis JSONB DEFAULT NULL;

COMMENT ON COLUMN brand_frameworks.gap_analysis IS
  'S5-05: Chanakya gap analysis — linkedin_current, linkedin_ideal, resume_missing, competitor_analysis, biggest_opportunity';

-- voice_traits is already JSONB (supports both old string[] and new {trait,behaviour,never_do}[] format)
-- No migration needed — existing rows keep old format, new rows get enriched format

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'brand_frameworks'
  AND column_name IN (
    'gap_analysis', 'verified_career_anchors', 'audience_personas',
    'platform_strategy', 'community_map', 'voice_traits'
  )
ORDER BY column_name;
