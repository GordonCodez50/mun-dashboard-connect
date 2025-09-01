-- Update the current user to admin role so they can perform bulk sync
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'logistics-test@isbmun.com';