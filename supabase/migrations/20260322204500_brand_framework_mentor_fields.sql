-- Add mentor fields to brand_frameworks
ALTER TABLE public.brand_frameworks
  ADD COLUMN IF NOT EXISTS mentor_memo     text,
  ADD COLUMN IF NOT EXISTS mentor_insights jsonb;
