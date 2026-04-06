-- ============================================================
-- supabase/migrations/010_profile_timezone.sql
-- Adds timezone column to profiles table.
-- Default: Asia/Kolkata (IST) for India-based early users.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';

-- Default to IST since you're India-based and your early users likely are too.
-- Users can update this from their profile settings later.

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'timezone';
