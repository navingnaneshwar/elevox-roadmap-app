ALTER TABLE content_drafts 
ADD COLUMN word_count integer,
ADD COLUMN credibility_anchor text,
ADD COLUMN contrarian_tension text,
ADD COLUMN strategic_rationale jsonb,
ADD COLUMN credibility_score integer,
ADD COLUMN agent_version text;

ALTER TABLE agent_audit_logs 
ADD COLUMN credibility_score integer;
