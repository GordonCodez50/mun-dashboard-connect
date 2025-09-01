-- Fix RLS issue - ensure all public tables have RLS enabled
-- Check for any tables that might not have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for profiles table if they don't exist
DO $$
BEGIN
    -- Check if policies already exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles" 
        ON public.profiles 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (id = (auth.jwt() ->> 'sub'::text));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can update any profile'
    ) THEN
        CREATE POLICY "Admins can update any profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (EXISTS (
            SELECT 1 FROM public.profiles p2
            WHERE p2.id = (auth.jwt() ->> 'sub'::text) 
            AND p2.role = 'admin'
        ));
    END IF;
END
$$;