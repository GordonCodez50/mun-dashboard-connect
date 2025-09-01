-- Fix infinite recursion in profiles RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON public.profiles;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.jwt() ->> 'sub'::text));

-- Also fix the participants policies to use the same pattern
DROP POLICY IF EXISTS "Admins can manage all participants" ON public.participants;
DROP POLICY IF EXISTS "Chairs can manage participants in their council" ON public.participants;
DROP POLICY IF EXISTS "Users can view participants in their council" ON public.participants;

-- Create non-recursive participant policies
CREATE POLICY "Users can view their own participants" 
ON public.participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (auth.jwt() ->> 'sub'::text)
    AND (
      p.role = 'admin' 
      OR (p.role = 'chair' AND p.council = participants.council)
      OR p.council = participants.council
    )
  )
);