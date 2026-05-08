-- =============================================================
-- PeptBiohacking Portal — v3 Migration
-- Run each block sequentially in Supabase SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Block 1: Fix handle_new_user trigger (safe full_name extraction)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      role      = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- Block 2: Add has_seen_intro to profiles + RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_intro boolean NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Recreate clean policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors can read all patient profiles
CREATE POLICY "profiles_doctor_read_patients" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- Block 3: assessments table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  form_data   jsonb NOT NULL DEFAULT '{}',
  summary     text
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_patient_own" ON public.assessments
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "assessments_doctor_read" ON public.assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- Block 4: appointments table (Calendly webhook target)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  calendly_uri    text UNIQUE,
  calendly_event  text,
  start_time      timestamptz NOT NULL,
  end_time        timestamptz,
  meeting_link    text,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'canceled', 'rescheduled')),
  intake_data     jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Doctor can read/write all appointments
CREATE POLICY "appointments_doctor_all" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
  );

-- Patient can read own appointments
CREATE POLICY "appointments_patient_read" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

-- Service role (edge function) can insert/update
CREATE POLICY "appointments_service_upsert" ON public.appointments
  FOR ALL USING (auth.role() = 'service_role');

-- Add appointment_id column to consultations if missing
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────────────
-- Block 5: peptide_inventory table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.peptide_inventory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text UNIQUE NOT NULL,
  stock        integer NOT NULL DEFAULT 0,
  unit         text NOT NULL DEFAULT 'vials',
  shop_url     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peptide_inventory ENABLE ROW LEVEL SECURITY;

-- Doctors can manage inventory
CREATE POLICY "inventory_doctor_all" ON public.peptide_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'doctor'
    )
  );

-- Patients can read inventory (for reorder links)
CREATE POLICY "inventory_patient_read" ON public.peptide_inventory
  FOR SELECT USING (auth.role() = 'authenticated');
