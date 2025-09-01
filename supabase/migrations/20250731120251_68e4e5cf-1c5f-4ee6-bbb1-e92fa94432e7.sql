-- Create user profiles table with tour completion tracking
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text,
  name text,
  role text not null default 'delegate',
  council text,
  email text,
  has_completed_tour boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_login timestamp with time zone,
  
  primary key (id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile" 
on public.profiles 
for select 
using (auth.uid() = id);

create policy "Users can update their own profile" 
on public.profiles 
for update 
using (auth.uid() = id);

create policy "Users can insert their own profile" 
on public.profiles 
for insert 
with check (auth.uid() = id);

-- Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
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

-- Create trigger to automatically create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for automatic timestamp updates
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();