-- 1. brand_frameworks
CREATE TABLE IF NOT EXISTS public.brand_frameworks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    archetype TEXT,
    voice_traits JSONB,
    content_pillars JSONB,
    target_audiences JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. industry_briefings
CREATE TABLE IF NOT EXISTS public.industry_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES public.brand_frameworks(id) ON DELETE CASCADE,
    news_links JSONB,
    suggested_angles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. content_drafts
CREATE TABLE IF NOT EXISTS public.content_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES public.brand_frameworks(id) ON DELETE CASCADE,
    briefing_id UUID REFERENCES public.industry_briefings(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'LinkedIn', 'X', 'Newsletter', 'YouTube', 'Personal Blog'
    body_text TEXT,
    hook_text TEXT,
    status TEXT DEFAULT 'draft', -- draft, in_review, rejected, ready_for_client, scheduled, published
    editor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. content_calendar
CREATE TABLE IF NOT EXISTS public.content_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES public.content_drafts(id) ON DELETE CASCADE,
    publish_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled',
    analytics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. agent_audit_logs
CREATE TABLE IF NOT EXISTS public.agent_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_role TEXT NOT NULL,
    event_type TEXT NOT NULL,
    trigger_entity_id UUID,
    prompt_context JSONB,
    response_output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. agent_jobs (Scale Queue)
CREATE TABLE IF NOT EXISTS public.agent_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- e.g., 'generate_draft', 'review_draft', 'build_framework', 'run_news_sweep'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, complete, failed, retrying
    error_logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE
);

-- Add updated_at triggers for tracking modifications over time
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_frameworks_updated_at BEFORE UPDATE ON public.brand_frameworks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_content_drafts_updated_at BEFORE UPDATE ON public.content_drafts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_agent_jobs_updated_at BEFORE UPDATE ON public.agent_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Enablement
ALTER TABLE public.brand_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

-- Basic Setup RLS Policies (Agents bypass RLS because they use Service Role Keys)
-- Allowing authenticated users to view their own records in the UI dashboard
CREATE POLICY "Users can view own brand frameworks" ON public.brand_frameworks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own industry briefings" ON public.industry_briefings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own content drafts" ON public.content_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own content calendar" ON public.content_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own audit logs" ON public.agent_audit_logs FOR SELECT USING (auth.uid() = user_id);
