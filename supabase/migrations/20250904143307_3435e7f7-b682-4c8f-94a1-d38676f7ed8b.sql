-- Add delegations column to participants table
ALTER TABLE public.participants 
ADD COLUMN delegations text;