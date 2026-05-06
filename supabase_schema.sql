-- Run this in Supabase SQL Editor

-- Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('doctor', 'patient')) default 'patient',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Doctors can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Consultations table
create table if not exists consultations (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references profiles(id),
  patient_id uuid references profiles(id),
  goals text[] default '{}',
  weight numeric,
  age integer,
  notes text,
  protocol jsonb default '{}',
  status text check (status in ('active', 'completed', 'paused')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table consultations enable row level security;
create policy "Doctors can manage consultations" on consultations for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);
create policy "Patients can view own consultations" on consultations for select using (patient_id = auth.uid());

-- Wellness checkins table
create table if not exists wellness_checkins (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references profiles(id),
  energy integer check (energy between 1 and 10),
  mood integer check (mood between 1 and 10),
  sleep integer check (sleep between 1 and 10),
  recovery integer check (recovery between 1 and 10),
  notes text,
  created_at timestamptz default now()
);

alter table wellness_checkins enable row level security;
create policy "Patients can manage own checkins" on wellness_checkins for all using (patient_id = auth.uid());
create policy "Doctors can view all checkins" on wellness_checkins for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);

-- Insert Dr. Fernando (run after he registers)
-- update profiles set role = 'doctor' where email = 'drfernando@peptbiohacking.mx';
