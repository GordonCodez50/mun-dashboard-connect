-- Add tutorial_completed_at column to profiles for tracking tutorial completion timestamp
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tutorial_completed_at TIMESTAMPTZ;