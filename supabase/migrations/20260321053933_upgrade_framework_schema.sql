-- Add new capability columns to brand_frameworks table

ALTER TABLE public.brand_frameworks
ADD COLUMN IF NOT EXISTS content_calendar_cadence JSONB,
ADD COLUMN IF NOT EXISTS social_platforms JSONB,
ADD COLUMN IF NOT EXISTS ghostwriting_rules JSONB;
