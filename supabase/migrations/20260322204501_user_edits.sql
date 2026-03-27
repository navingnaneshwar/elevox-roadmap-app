CREATE TABLE user_edits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id),
  entity_type     text NOT NULL, -- 'framework' | 'briefing' | 'draft' | 'calendar'
  entity_id       uuid NOT NULL,
  field_path      text NOT NULL, -- e.g. 'archetype', 'ghostwriting_rules[2]', 'voice_traits'
  original_value  jsonb,
  edited_value    jsonb,
  edit_note       text,          -- user's explanation for why they changed it
  created_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own edits" ON user_edits
  FOR ALL USING (auth.uid() = user_id);
