ALTER TABLE content_drafts
ADD COLUMN aristotle_cx_score integer,
ADD COLUMN aristotle_credibility_score integer,
ADD COLUMN aristotle_composite_score integer,
ADD COLUMN aristotle_evaluation jsonb,
ADD COLUMN approved_for_publish boolean,
ADD COLUMN revision_count integer DEFAULT 0;
