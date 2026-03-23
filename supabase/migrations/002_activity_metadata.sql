-- ============================================
-- Add metadata JSONB column to agent_activity
-- Run this in Supabase SQL Editor
-- ============================================

-- Add metadata column for storing rich activity details
-- (email content, calendar event details, search results, etc.)
ALTER TABLE public.agent_activity
  ADD COLUMN IF NOT EXISTS metadata JSONB;
