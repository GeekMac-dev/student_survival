-- =============================================================
-- Sulit App — Supabase Database Schema
-- Run this in your Supabase project: SQL Editor → New query
-- =============================================================

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  school      TEXT,
  course      TEXT,
  year_level  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ── schedule_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day         INTEGER NOT NULL CHECK (day >= 0 AND day <= 5),  -- 0=Mon … 5=Sat
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  name        TEXT NOT NULL,
  professor   TEXT,
  room        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_user ON public.schedule_items(user_id, day, start_time);

ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedule"
  ON public.schedule_items FOR ALL USING (auth.uid() = user_id);


-- ── tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  deadline    TEXT,
  notes       TEXT,
  done        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id, created_at DESC);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);


-- ── expense_groups ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  total       NUMERIC(12, 2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_groups_user ON public.expense_groups(user_id, created_at DESC);

ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expense groups"
  ON public.expense_groups FOR ALL USING (auth.uid() = user_id);


-- ── expense_members ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  paid        BOOLEAN NOT NULL DEFAULT false,
  is_self     BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_expense_members_group ON public.expense_members(group_id);

ALTER TABLE public.expense_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage members via group ownership"
  ON public.expense_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_groups g
      WHERE g.id = group_id AND g.user_id = auth.uid()
    )
  );


-- ── food_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.food_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  shop        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  distance    TEXT,
  open        BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_user ON public.food_items(user_id, price);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food items"
  ON public.food_items FOR ALL USING (auth.uid() = user_id);


-- ── reviewer_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviewer_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  author      TEXT,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  pages       INTEGER,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviewer_user ON public.reviewer_items(user_id, created_at DESC);

ALTER TABLE public.reviewer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reviewers"
  ON public.reviewer_items FOR ALL USING (auth.uid() = user_id);


-- ── user_settings (GPA + Allowance persistence) ───────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gpa_subjects    JSONB DEFAULT '[]'::jsonb,
  allowance_data  JSONB DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL USING (auth.uid() = user_id);


-- ── wellness_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wellness_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood        INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 3),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellness_user ON public.wellness_logs(user_id, created_at DESC);

ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wellness logs"
  ON public.wellness_logs FOR ALL USING (auth.uid() = user_id);


-- =============================================================
-- Auto-create profile row when a new user signs up
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
