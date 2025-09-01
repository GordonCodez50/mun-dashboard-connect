-- Create security definer functions to avoid circular RLS references

-- Function to check if user can access a file
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
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to get files user owns
CREATE OR REPLACE FUNCTION public.get_user_owned_file_ids()
RETURNS TABLE(file_id uuid) AS $$
  SELECT id FROM public.files 
  WHERE uploaded_by = (auth.jwt() ->> 'sub'::text);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to get files shared with user
CREATE OR REPLACE FUNCTION public.get_user_shared_file_ids()
RETURNS TABLE(file_id uuid) AS $$
  SELECT file_shares.file_id 
  FROM public.file_shares 
  WHERE (
    shared_with = (auth.jwt() ->> 'sub'::text) 
    OR shared_with = (auth.jwt() ->> 'email'::text)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies with exact names (including trailing spaces)
DROP POLICY "Users can view files they uploaded or have access to" ON public.files;
DROP POLICY "Users can view activities for their files or files shared with " ON public.file_activities;

-- Create new policies using security definer functions
CREATE POLICY "Users can view files they uploaded or have access to" 
ON public.files 
FOR SELECT 
USING (
  uploaded_by = (auth.jwt() ->> 'sub'::text) 
  OR is_public = true 
  OR id IN (SELECT file_id FROM public.get_user_shared_file_ids())
);

CREATE POLICY "Users can view activities for their files or files shared with them" 
ON public.file_activities 
FOR SELECT 
USING (
  user_id = (auth.jwt() ->> 'sub'::text) 
  OR file_id IN (SELECT file_id FROM public.get_user_owned_file_ids())
  OR file_id IN (SELECT file_id FROM public.get_user_shared_file_ids())
);