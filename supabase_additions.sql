-- ============================================
-- ADDITIONS TO EXISTING SCHEMA — Run in Supabase SQL Editor
-- ============================================

-- Messages table (patient <-> doctor message board)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references profiles(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  sender_role text check (sender_role in ('patient', 'doctor')) not null,
  body text not null,
  created_at timestamptz default now()
);

-- Lab uploads table (patient study/result files)
create table if not exists lab_uploads (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_at timestamptz default now()
);

-- Add new columns to wellness_checkins if they don't exist
alter table wellness_checkins add column if not exists weight numeric;
alter table wellness_checkins add column if not exists energy_level integer;
alter table wellness_checkins add column if not exists sleep_quality integer;

-- Enable RLS
alter table messages enable row level security;
alter table lab_uploads enable row level security;

-- RLS Policies: messages
create policy "Patients can read their own messages" on messages
  for select using (auth.uid() = patient_id or auth.uid() = sender_id);

create policy "Authenticated users can insert messages" on messages
  for insert with check (auth.uid() = sender_id);

-- RLS Policies: lab_uploads
create policy "Patients can manage their own labs" on lab_uploads
  for all using (auth.uid() = patient_id);

create policy "Doctors can view all lab uploads" on lab_uploads
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'doctor')
  );

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
