-- Migration: content_calendar reserved status
-- content_calendar.status valid values:
--   'reserved'  → slot held, draft not yet written (set by Machiavelli reserve mode)
--   'scheduled' → approved draft linked, ready to publish
--   'published'  → live on platform

COMMENT ON COLUMN content_calendar.status IS 'reserved | scheduled | published';
