-- ================================================================
-- PeptBiohacking — Supabase Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Profiles
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'patient' check (role in ('patient', 'doctor')),
  created_at  timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Doctors read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);

-- 2. Consultations
create table if not exists consultations (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid references profiles(id),
  patient_id        uuid references profiles(id),
  patient_email     text,
  chief_complaint   text,
  goals             text,
  health_history    text,
  current_meds      text,
  peptide_protocol  jsonb default '[]',
  notes             text,
  follow_up_date    date,
  status            text default 'active' check (status in ('active', 'completed', 'paused')),
  created_at        timestamptz default now()
);

alter table consultations enable row level security;
create policy "Doctors manage consultations" on consultations for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);
create policy "Patients read own consultations" on consultations for select using (
  auth.uid() = patient_id
);

-- 3. Wellness Check-ins
create table if not exists wellness_checkins (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid references profiles(id) on delete cascade,
  energy_level     int check (energy_level between 1 and 10),
  sleep_quality    int check (sleep_quality between 1 and 10),
  overall_feeling  int check (overall_feeling between 1 and 10),
  notes            text,
  created_at       timestamptz default now()
);

alter table wellness_checkins enable row level security;
create policy "Patients manage own checkins" on wellness_checkins for all using (auth.uid() = patient_id);
create policy "Doctors read all checkins" on wellness_checkins for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
);

-- 4. Storage bucket for consultation photos
insert into storage.buckets (id, name, public) values ('consult-photos', 'consult-photos', false)
on conflict (id) do nothing;

create policy "Doctors upload photos" on storage.objects for insert
  with check (bucket_id = 'consult-photos' and auth.role() = 'authenticated');
create policy "Doctors read photos" on storage.objects for select
  using (bucket_id = 'consult-photos' and auth.role() = 'authenticated');
