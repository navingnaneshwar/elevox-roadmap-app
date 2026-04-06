-- ============================================================
-- ELEVOX — Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI:
--   supabase db push
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Trigger: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- One row per authenticated user. Mirrors Supabase auth.users.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT UNIQUE NOT NULL,

  -- Identity (Step 01)
  full_name               TEXT,
  current_title           TEXT,
  company                 TEXT,
  company_size            TEXT,
  industry                TEXT,
  linkedin_url            TEXT,
  location                TEXT,
  phone                   TEXT,
  ea_name                 TEXT,
  ea_email                TEXT,

  -- Career Narrative (Step 02)
  career_summary          TEXT,
  biggest_win             TEXT,
  pivot_moment            TEXT,
  unusual_background      TEXT,
  current_focus           TEXT,

  -- Brand Goals (Step 03)
  primary_goal            TEXT[],
  dream_outcome           TEXT,
  target_audience         TEXT,
  key_people              TEXT,
  geographic_scope        TEXT,
  timeline                TEXT,

  -- Voice & Tone (Step 04)
  three_words             TEXT,
  communication_style     TEXT[],
  never_sound_like        TEXT,
  humor_level             TEXT,
  opinion_strength        TEXT,
  existing_content        TEXT,
  content_you_admire      TEXT,

  -- Topics & Expertise (Step 05)
  topics_owned            TEXT,
  topics_aspire           TEXT,
  strong_opinions         TEXT,
  industry_trends         TEXT,
  secret_weapon           TEXT,
  content_taboos          TEXT,

  -- Calendar & Logistics (Step 06)
  upcoming_events         TEXT,
  weekly_time             TEXT,
  approval_channel        TEXT,
  approval_timeframe      TEXT,
  posting_frequency       TEXT,
  content_formats         TEXT[],
  ghostwriting_comfort    TEXT,

  -- Competitive Landscape (Step 07)
  peer_cxos               TEXT,
  differentiator          TEXT,
  reputation_now          TEXT,
  brand_gaps              TEXT[],
  associations            TEXT,

  -- Success Metrics (Step 08)
  success_in_30           TEXT,
  success_in_90           TEXT,
  dealbreakers            TEXT,
  previous_attempts       TEXT,
  budget                  TEXT,
  additional_context      TEXT,

  -- Platform state
  onboarding_complete     BOOLEAN DEFAULT FALSE,
  plan                    TEXT DEFAULT 'starter' CHECK (plan IN ('starter','authority','legacy')),
  plan_status             TEXT DEFAULT 'inactive' CHECK (plan_status IN ('inactive','trialing','active','past_due','cancelled')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  avatar_url              TEXT,
  social_tokens           JSONB DEFAULT '{}',

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS: profiles ────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TABLE: brand_briefs
-- AI-generated brand brief. One per user, versioned.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brand_briefs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  executive_summary     TEXT,
  brand_archetype       TEXT,
  positioning_statement TEXT,
  audience_map          TEXT,
  voice_signature       TEXT,
  content_themes        TEXT,
  priority_actions      TEXT,
  recommended_phase     TEXT,
  version               INTEGER DEFAULT 1,
  generated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefs_own" ON public.brand_briefs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: mentor_sessions
-- AI coaching sessions — one per phase/component pair.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phase_id              SMALLINT NOT NULL CHECK (phase_id BETWEEN 1 AND 6),
  component_id          TEXT NOT NULL,
  messages              JSONB NOT NULL DEFAULT '[]',
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  deliverable_extracted TEXT,
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  last_active_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  UNIQUE (user_id, phase_id, component_id)
);

ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_own" ON public.mentor_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: deliverables
-- Extracted outputs from mentor sessions.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deliverables (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id     UUID REFERENCES public.mentor_sessions(id),
  phase_id       SMALLINT NOT NULL,
  component_id   TEXT NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  version        INTEGER DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverables_own" ON public.deliverables
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: anchor_events
-- Milestone events that generate content clusters.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anchor_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  event_month     TEXT,
  event_day       INTEGER,
  notes           TEXT,
  audience        TEXT,
  goal            TEXT,
  derived_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.anchor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anchor_events_own" ON public.anchor_events
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: content_calendar
-- Every piece of content in the pipeline.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anchor_event_id   UUID REFERENCES public.anchor_events(id),
  title             TEXT NOT NULL,
  content_body      TEXT,
  content_type      TEXT NOT NULL CHECK (content_type IN ('text','image','carousel','video','article','poll','podcast','collab','newsletter')),
  platform          TEXT NOT NULL DEFAULT 'linkedin' CHECK (platform IN ('linkedin','twitter','instagram','facebook')),
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','scheduled','published','rejected','skipped')),
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  posting_week      TEXT,
  posting_day       TEXT,
  ai_generated      BOOLEAN DEFAULT FALSE,
  social_post_id    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_own" ON public.content_calendar
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: content_drafts
-- Multiple AI-generated draft versions per calendar event.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_event_id   UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body                TEXT NOT NULL,
  version             INTEGER DEFAULT 1,
  ai_model            TEXT,
  selected            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drafts_own" ON public.content_drafts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: calendar_settings
-- Per-user calendar configuration.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  posting_frequency    TEXT DEFAULT '3x',
  active_days          INTEGER[] DEFAULT '{0,2,4}',
  blackout_weeks       TEXT[] DEFAULT '{}',
  formats_enabled      TEXT[] DEFAULT '{text,image,carousel}',
  approval_channel     TEXT DEFAULT 'whatsapp',
  approval_sla         TEXT DEFAULT '24h',
  weekly_time          TEXT DEFAULT '15min',
  ghost_level          TEXT DEFAULT 'light',
  ea_enabled           BOOLEAN DEFAULT FALSE,
  ea_name              TEXT,
  ea_email             TEXT,
  escalation_rules     JSONB DEFAULT '{"noresponse":"hold","revision":"reassign","breaking":"expedite","sensitive":"skip"}',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cal_settings_own" ON public.calendar_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: approvals
-- Content approval tracking with SLA.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approvals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_event_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id),
  approver_id       UUID REFERENCES public.profiles(id),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  feedback          TEXT,
  sla_hours         INTEGER DEFAULT 24,
  sla_breached      BOOLEAN DEFAULT FALSE,
  due_at            TIMESTAMPTZ NOT NULL,
  actioned_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Cross-user: owner AND approver can read
CREATE POLICY "approvals_read" ON public.approvals
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = approver_id);

CREATE POLICY "approvals_insert" ON public.approvals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "approvals_update_approver" ON public.approvals
  FOR UPDATE USING (auth.uid() = approver_id);

-- ============================================================
-- TABLE: analytics_snapshots
-- Daily analytics pulls from social platforms.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  snapshot_date   DATE NOT NULL,
  followers       BIGINT,
  impressions     BIGINT,
  engagement_rate NUMERIC(6,4),
  post_count      INTEGER,
  top_post_id     TEXT,
  raw_data        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, platform, snapshot_date)
);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_own" ON public.analytics_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: auto-create profile on signup
-- Fires when a new user is created in auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
