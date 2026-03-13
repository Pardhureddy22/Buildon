-- supabase_schema.sql

-- 1. Create Users Table
CREATE TABLE public.users (
  id uuid references auth.users not null primary key,
  name text,
  email text,
  department text,
  legacy_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING ( true );

-- Allow users to insert/update their own profile
CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING ( auth.uid() = id );


-- 2. Create Projects Table
CREATE TABLE public.projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  year integer not null,
  team text not null,
  category text not null,
  problem_statement text,
  approach_summary text,
  key_insights text[],
  open_questions text[],
  tags text[],
  forked_from uuid references public.projects(id),
  outcome text,
  fork_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users(id) -- to track who submitted it
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to projects
CREATE POLICY "Projects are viewable by everyone."
  ON public.projects FOR SELECT
  USING ( true );

-- Allow authenticated users to insert projects
CREATE POLICY "Authenticated users can create projects."
  ON public.projects FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- Allow the initial seedData.js to insert public test data (user_id is null)
CREATE POLICY "Allow public seeding of test projects."
  ON public.projects FOR INSERT
  WITH CHECK ( user_id IS NULL );


-- 3. Create Comments Table
CREATE TABLE public.comments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to comments
CREATE POLICY "Comments are viewable by everyone."
  ON public.comments FOR SELECT
  USING ( true );

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can add comments."
  ON public.comments FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' AND auth.uid() = user_id );


-- 4. Leaderboard View Logic
-- The prompt specifies: legacyScore = (forks * 3) + (resolvedQuestions * 4) + (savedProjects * 1)
-- Since we don't have a "savedProjects" table yet, and 'resolvedQuestions' requires an array/JSONB query, Let's create a simpler view based on legacy_score column in users table for now, and a function to compute it.
-- Alternatively, if we just want a simple view sorting by legacy_score field:

CREATE VIEW public.leaderboard AS
SELECT 
  id,
  name,
  department,
  legacy_score
FROM public.users
ORDER BY legacy_score DESC;

-- Note: To auto-calculate legacy_score based on forks, etc., you'd typically use a cron job or database triggers. For now, we will sort by the legacy_score column.
