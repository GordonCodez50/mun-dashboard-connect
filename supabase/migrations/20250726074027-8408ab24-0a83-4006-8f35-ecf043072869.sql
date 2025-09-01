-- Fix security warnings by setting search_path for functions

-- Update user_can_access_file function with search_path
CREATE OR REPLACE FUNCTION public.user_can_access_file(file_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.files 
    WHERE id = file_id 
    AND (
      uploaded_by = (auth.jwt() ->> 'sub'::text) 
      OR is_public = true
    )
  ) OR EXISTS (
    SELECT 1 FROM public.file_shares 
    WHERE file_shares.file_id = user_can_access_file.file_id
    AND (
      shared_with = (auth.jwt() ->> 'sub'::text) 
      OR shared_with = (auth.jwt() ->> 'email'::text)
    )
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Update get_user_owned_file_ids function with search_path
CREATE OR REPLACE FUNCTION public.get_user_owned_file_ids()
RETURNS TABLE(file_id uuid) AS $$
  SELECT id FROM public.files 
  WHERE uploaded_by = (auth.jwt() ->> 'sub'::text);
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Update get_user_shared_file_ids function with search_path
CREATE OR REPLACE FUNCTION public.get_user_shared_file_ids()
RETURNS TABLE(file_id uuid) AS $$
  SELECT file_shares.file_id 
  FROM public.file_shares 
  WHERE (
    shared_with = (auth.jwt() ->> 'sub'::text) 
    OR shared_with = (auth.jwt() ->> 'email'::text)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';