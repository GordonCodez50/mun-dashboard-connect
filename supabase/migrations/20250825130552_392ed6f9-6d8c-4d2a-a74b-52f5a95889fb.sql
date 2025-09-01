-- Add INSERT policy for profiles table to allow admins to insert profiles
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = (auth.jwt() ->> 'sub'::text) 
    AND p.role = 'admin'
  )
);