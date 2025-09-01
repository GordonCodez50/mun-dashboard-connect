-- Add room and floor number fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN room_no TEXT,
ADD COLUMN floor_no TEXT;