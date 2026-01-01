-- =====================================================
-- MIGRATION SCRIPT AMIS RIM TOGO
-- From: xwnnvnmzpzekoubrmrfg.supabase.co
-- To: supabase.jadeoffice.cloud
-- Date: 2026-01-01
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'resident',
    year TEXT,
    hospital TEXT,
    phone TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sites
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    supervisor TEXT,
    duration TEXT,
    address TEXT,
    city TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    residents TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    year TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: files
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    url TEXT NOT NULL,
    size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contributions
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    month TEXT,
    year TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_method TEXT,
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender TEXT,
    role TEXT,
    subject TEXT,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'info',
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: leisure_events
CREATE TABLE IF NOT EXISTS public.leisure_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('voyage', 'pique-nique', 'fete')),
    event_date TIMESTAMPTZ,
    location TEXT,
    max_participants INTEGER,
    cost_per_person NUMERIC,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: leisure_contributions
CREATE TABLE IF NOT EXISTS public.leisure_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.leisure_events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: leisure_participants
CREATE TABLE IF NOT EXISTS public.leisure_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.leisure_events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('staff', 'epu', 'diu', 'stage')),
    item_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_files_module_id ON public.files(module_id);
CREATE INDEX IF NOT EXISTS idx_files_subject_id ON public.files(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_module_id ON public.subjects(module_id);
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON public.contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_leisure_contributions_event_id ON public.leisure_contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_leisure_contributions_profile_id ON public.leisure_contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_leisure_participants_event_id ON public.leisure_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_leisure_participants_profile_id ON public.leisure_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile_id ON public.attendance(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leisure_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leisure_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leisure_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Sites Policies
CREATE POLICY "Sites viewable by authenticated users" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sites" ON public.sites FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Modules Policies
CREATE POLICY "Modules viewable by authenticated users" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Subjects Policies
CREATE POLICY "Subjects viewable by authenticated users" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Files Policies
CREATE POLICY "Files viewable by authenticated users" ON public.files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage files" ON public.files FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Contributions Policies
CREATE POLICY "Users can view own contributions" ON public.contributions FOR SELECT TO authenticated 
    USING (profile_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage contributions" ON public.contributions FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Messages Policies
CREATE POLICY "Messages viewable by authenticated" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert messages" ON public.messages FOR INSERT TO authenticated 
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Settings Policies
CREATE POLICY "Settings viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Settings updatable by admins" ON public.settings FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Leisure Events Policies
CREATE POLICY "Events viewable by authenticated" ON public.leisure_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON public.leisure_events FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Leisure Contributions Policies
CREATE POLICY "Users can view own leisure contributions" ON public.leisure_contributions FOR SELECT TO authenticated 
    USING (profile_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage leisure contributions" ON public.leisure_contributions FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Leisure Participants Policies
CREATE POLICY "Users can view participants" ON public.leisure_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can register for events" ON public.leisure_participants FOR INSERT TO authenticated 
    WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admins can manage participants" ON public.leisure_participants FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Attendance Policies
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT TO authenticated 
    USING (profile_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can create attendance" ON public.attendance FOR INSERT TO authenticated 
    WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, year, hospital, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    NEW.raw_user_meta_data->>'year',
    NEW.raw_user_meta_data->>'hospital',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger: update_profiles_updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Execute this script in your new Supabase instance
-- 2. Update your .env.local with new credentials
-- 3. Test the application
-- =====================================================
