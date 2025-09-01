-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (auth.jwt() ->> 'sub'::text) 
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add INSERT policy for profiles table using the security definer function
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_current_user_admin());