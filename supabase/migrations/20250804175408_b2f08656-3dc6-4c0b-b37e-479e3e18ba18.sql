-- Fix the search path security warning for handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = 'public'
as $$
begin
  insert into public.profiles (id, email, name, username)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;