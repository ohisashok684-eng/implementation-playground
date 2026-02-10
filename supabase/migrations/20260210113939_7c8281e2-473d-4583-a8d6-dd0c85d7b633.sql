
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'user');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Helper: check if user is super_admin (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- 5. Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount TEXT,
  has_amount BOOLEAN NOT NULL DEFAULT false,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 6. Roadmaps table
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'В работе',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- 7. Roadmap steps
CREATE TABLE public.roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  deadline DATE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;

-- 8. Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_number INTEGER NOT NULL,
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  steps TEXT[] DEFAULT '{}',
  files TEXT[] DEFAULT '{}',
  gradient TEXT NOT NULL DEFAULT 'from-lime to-lime-dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 9. Diary entries
CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'daily',
  entry_date TEXT NOT NULL,
  energy INTEGER,
  text TEXT,
  intent TEXT,
  achievements TEXT,
  lessons TEXT,
  next_step TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- 10. Volcanoes (audit data)
CREATE TABLE public.volcanoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.volcanoes ENABLE ROW LEVEL SECURITY;

-- 11. Progress metrics
CREATE TABLE public.progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_key TEXT NOT NULL,
  label TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  previous_value INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.progress_metrics ENABLE ROW LEVEL SECURITY;

-- 12. Protocols
CREATE TABLE public.protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'zap',
  color TEXT NOT NULL DEFAULT 'amber',
  file_name TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- 13. Point B results
CREATE TABLE public.point_b_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  achieved TEXT NOT NULL DEFAULT '',
  not_achieved TEXT NOT NULL DEFAULT '',
  analysis TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.point_b_results ENABLE ROW LEVEL SECURITY;

-- 14. Route info
CREATE TABLE public.route_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sessions_total INTEGER NOT NULL DEFAULT 8,
  sessions_done INTEGER NOT NULL DEFAULT 0,
  time_weeks INTEGER NOT NULL DEFAULT 12,
  resources TEXT[] DEFAULT '{}'
);
ALTER TABLE public.route_info ENABLE ROW LEVEL SECURITY;

-- 15. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. RLS Policies

-- Profiles: users see own, admin sees all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- User roles
CREATE POLICY "View own role or admin sees all" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Admin manages roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admin updates roles" ON public.user_roles
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admin deletes roles" ON public.user_roles
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- Macro for user-owned tables: SELECT own or admin, CUD own or admin
-- Goals
CREATE POLICY "goals_select" ON public.goals FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "goals_insert" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "goals_update" ON public.goals FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "goals_delete" ON public.goals FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Roadmaps
CREATE POLICY "roadmaps_select" ON public.roadmaps FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "roadmaps_insert" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "roadmaps_update" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "roadmaps_delete" ON public.roadmaps FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Roadmap steps (via roadmap ownership)
CREATE POLICY "roadmap_steps_select" ON public.roadmap_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_steps.roadmap_id AND (user_id = auth.uid() OR public.is_super_admin(auth.uid()))));
CREATE POLICY "roadmap_steps_insert" ON public.roadmap_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_steps.roadmap_id AND (user_id = auth.uid() OR public.is_super_admin(auth.uid()))));
CREATE POLICY "roadmap_steps_update" ON public.roadmap_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_steps.roadmap_id AND (user_id = auth.uid() OR public.is_super_admin(auth.uid()))));
CREATE POLICY "roadmap_steps_delete" ON public.roadmap_steps FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_steps.roadmap_id AND (user_id = auth.uid() OR public.is_super_admin(auth.uid()))));

-- Sessions
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Diary entries
CREATE POLICY "diary_select" ON public.diary_entries FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "diary_insert" ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "diary_update" ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "diary_delete" ON public.diary_entries FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Volcanoes
CREATE POLICY "volcanoes_select" ON public.volcanoes FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "volcanoes_insert" ON public.volcanoes FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "volcanoes_update" ON public.volcanoes FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "volcanoes_delete" ON public.volcanoes FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Progress metrics
CREATE POLICY "metrics_select" ON public.progress_metrics FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "metrics_insert" ON public.progress_metrics FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "metrics_update" ON public.progress_metrics FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "metrics_delete" ON public.progress_metrics FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Protocols
CREATE POLICY "protocols_select" ON public.protocols FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "protocols_insert" ON public.protocols FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "protocols_update" ON public.protocols FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "protocols_delete" ON public.protocols FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Point B results
CREATE POLICY "pointb_select" ON public.point_b_results FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "pointb_insert" ON public.point_b_results FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "pointb_update" ON public.point_b_results FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "pointb_delete" ON public.point_b_results FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Route info
CREATE POLICY "route_select" ON public.route_info FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "route_insert" ON public.route_info FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "route_update" ON public.route_info FOR UPDATE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "route_delete" ON public.route_info FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- 18. Storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('mentoring-files', 'mentoring-files', false);

CREATE POLICY "Admin can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mentoring-files' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Admin can view all files" ON storage.objects
  FOR SELECT USING (bucket_id = 'mentoring-files' AND (public.is_super_admin(auth.uid()) OR auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Admin can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'mentoring-files' AND public.is_super_admin(auth.uid()));
