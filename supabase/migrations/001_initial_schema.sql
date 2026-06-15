-- ============================================================
-- NextEdge Student Portal — Initial Schema
-- Safe to run multiple times: drops & recreates everything.
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Clean slate ──────────────────────────────────────────────
-- Drop in reverse dependency order so FKs don't block the drops.
DROP TABLE IF EXISTS public.event_registrations  CASCADE;
DROP TABLE IF EXISTS public.events               CASCADE;
DROP TABLE IF EXISTS public.course_materials     CASCADE;
DROP TABLE IF EXISTS public.forum_posts          CASCADE;
DROP TABLE IF EXISTS public.forum_threads        CASCADE;
DROP TABLE IF EXISTS public.messages             CASCADE;
DROP TABLE IF EXISTS public.document_requests    CASCADE;
DROP TABLE IF EXISTS public.payments             CASCADE;
DROP TABLE IF EXISTS public.fee_balances         CASCADE;
DROP TABLE IF EXISTS public.attendance           CASCADE;
DROP TABLE IF EXISTS public.grades               CASCADE;
DROP TABLE IF EXISTS public.enrollments          CASCADE;
DROP TABLE IF EXISTS public.courses              CASCADE;
DROP TABLE IF EXISTS public.profiles             CASCADE;

DROP TRIGGER  IF EXISTS on_auth_user_created        ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.increment_thread_views(UUID);

-- ─── Profiles ─────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT,
  date_of_birth       DATE,
  country             TEXT,
  phone               TEXT,
  gender              TEXT,
  student_id          TEXT UNIQUE,
  profile_picture_url TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  year_of_study       INTEGER,
  course_name         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, profile_picture_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Courses ──────────────────────────────────────────────────
CREATE TABLE public.courses (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  credits        INTEGER DEFAULT 3,
  instructor     TEXT,
  department     TEXT,
  duration_weeks INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Enrollments ──────────────────────────────────────────────
CREATE TABLE public.enrollments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE (student_id, course_id)
);

-- ─── Grades ───────────────────────────────────────────────────
CREATE TABLE public.grades (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  assignment_name TEXT NOT NULL,
  score           NUMERIC(6, 2) NOT NULL,
  max_score       NUMERIC(6, 2) NOT NULL DEFAULT 100,
  grade_type      TEXT NOT NULL
                    CHECK (grade_type IN ('assignment', 'midterm', 'final', 'quiz')),
  graded_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance ───────────────────────────────────────────────
CREATE TABLE public.attendance (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL
               CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id, date)
);

-- ─── Fee Balances ─────────────────────────────────────────────
CREATE TABLE public.fee_balances (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_fees  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date    DATE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Payments ─────────────────────────────────────────────────
CREATE TABLE public.payments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'mobile_money')),
  reference      TEXT UNIQUE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'failed')),
  description    TEXT,
  paid_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Document Requests ────────────────────────────────────────
CREATE TABLE public.document_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
                  CHECK (document_type IN ('transcript', 'certificate', 'letter')),
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'ready', 'delivered')),
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages ─────────────────────────────────────────────────
CREATE TABLE public.messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Forum Threads ────────────────────────────────────────────
CREATE TABLE public.forum_threads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT,
  views      INTEGER DEFAULT 0,
  is_pinned  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Forum Posts (Replies) ────────────────────────────────────
CREATE TABLE public.forum_posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id  UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Course Materials ─────────────────────────────────────────
CREATE TABLE public.course_materials (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  material_type TEXT NOT NULL
                  CHECK (material_type IN ('video', 'document', 'link', 'assignment')),
  content_url   TEXT,
  content       TEXT,
  week_number   INTEGER,
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Events ───────────────────────────────────────────────────
CREATE TABLE public.events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ,
  category      TEXT,
  image_url     TEXT,
  max_attendees INTEGER,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Event Registrations ──────────────────────────────────────
CREATE TABLE public.event_registrations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, student_id)
);

-- ─── RPC: increment thread views ──────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_thread_views(thread_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.forum_threads SET views = views + 1 WHERE id = thread_id;
$$;

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_balances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────
-- profiles
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- courses (read-only for all authenticated users)
CREATE POLICY "courses_select" ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- enrollments
CREATE POLICY "enroll_select_own" ON public.enrollments
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "enroll_insert_own" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- grades
CREATE POLICY "grades_select_own" ON public.grades
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "grades_insert_own" ON public.grades
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- attendance
CREATE POLICY "attendance_select_own" ON public.attendance
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "attendance_insert_own" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- fee_balances
CREATE POLICY "fees_select_own" ON public.fee_balances
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "fees_update_own" ON public.fee_balances
  FOR UPDATE USING (auth.uid() = student_id);

-- payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- document_requests
CREATE POLICY "docs_select_own" ON public.document_requests
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "docs_insert_own" ON public.document_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "docs_update_own" ON public.document_requests
  FOR UPDATE USING (auth.uid() = student_id);

-- messages
CREATE POLICY "msg_select" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update_read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- forum_threads
CREATE POLICY "threads_select"     ON public.forum_threads
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "threads_insert"     ON public.forum_threads
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads_update_own" ON public.forum_threads
  FOR UPDATE USING (auth.uid() = author_id);

-- forum_posts
CREATE POLICY "posts_select" ON public.forum_posts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- course_materials
CREATE POLICY "materials_select" ON public.course_materials
  FOR SELECT USING (auth.role() = 'authenticated');

-- events
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- event_registrations
CREATE POLICY "ereg_select" ON public.event_registrations
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "ereg_insert" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "ereg_delete" ON public.event_registrations
  FOR DELETE USING (auth.uid() = student_id);

-- ─── Seed Data ────────────────────────────────────────────────
INSERT INTO public.courses (code, name, description, credits, instructor, department, duration_weeks) VALUES
  ('CS101',  'Introduction to Computer Science', 'Fundamentals of programming and computational thinking', 3, 'Dr. Kwame Asante',   'Computer Science', 16),
  ('MTH201', 'Calculus II',                      'Integral calculus and series',                          4, 'Prof. Akosua Mensah', 'Mathematics',       16),
  ('ENG102', 'Technical Writing',                'Professional and academic writing skills',              2, 'Dr. Abena Osei',     'English',            12),
  ('PHY201', 'Classical Mechanics',              'Newtonian mechanics and wave motion',                   3, 'Dr. Kofi Amoah',     'Physics',            16),
  ('BUS301', 'Business Management',              'Principles of modern business management',              3, 'Prof. Ama Sarpong',  'Business',           16)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.events (title, description, location, event_date, end_date, category, max_attendees) VALUES
  ('Freshman Orientation Week',     'Welcome event for new students with campus tours and society fairs', 'Main Campus Hall',        NOW() + INTERVAL '7 days',  NOW() + INTERVAL '7 days 3 hours',  'Academic', 500),
  ('Inter-Hall Football Championship', 'Annual football tournament between all halls of residence',       'University Sports Complex', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 6 hours', 'Sports',   300),
  ('Career & Internship Fair 2024', 'Meet top employers and explore internship and job opportunities',   'Great Hall',              NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 8 hours', 'Career',  1000),
  ('Cultural Night & Showcase',     'Celebrate diversity with music, dance, food, and art',             'Amphitheatre',            NOW() + INTERVAL '28 days', NULL,                               'Cultural',  400)
ON CONFLICT DO NOTHING;
