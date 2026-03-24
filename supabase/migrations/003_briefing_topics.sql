-- Add briefing_topics column for personalized morning briefings
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS briefing_topics TEXT[] DEFAULT '{}';
