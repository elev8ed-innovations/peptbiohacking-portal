-- Additive clinical-history controls. Existing consultation and measurement
-- rows are preserved verbatim; no UPDATE or DELETE statements are used here.

alter table public.consultations
  add column if not exists status text not null default 'completed',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists correction_reason text,
  add column if not exists corrected_at timestamptz,
  add column if not exists corrected_by uuid,
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid;

alter table public.consultations
  drop constraint if exists consultations_status_check,
  add constraint consultations_status_check
    check (status in ('completed', 'voided'));

alter table public.body_metrics
  add column if not exists consultation_id uuid
    references public.consultations(id) on delete restrict;

create index if not exists consultations_patient_created_at_idx
  on public.consultations (patient_id, created_at desc);

create index if not exists body_metrics_consultation_id_idx
  on public.body_metrics (consultation_id)
  where consultation_id is not null;

create table if not exists public.consultation_revisions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null
    references public.consultations(id) on delete restrict,
  changed_by uuid not null,
  change_type text not null
    check (change_type in ('correction', 'void')),
  reason text not null
    check (nullif(btrim(reason), '') is not null),
  previous_record jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.consultation_revisions enable row level security;

revoke all on table public.consultation_revisions from anon, authenticated;
grant select on table public.consultation_revisions to authenticated;

drop policy if exists "Doctors read consultation revisions"
  on public.consultation_revisions;
create policy "Doctors read consultation revisions"
on public.consultation_revisions
for select
to authenticated
using ((select public.get_my_role()) = 'doctor');

create or replace function public.audit_consultation_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  acting_user uuid := auth.uid();
  is_doctor boolean := false;
  audit_reason text;
  audit_type text;
  clinical_fields_changed boolean;
begin
  select exists (
    select 1
    from public.profiles
    where id = acting_user
      and role = 'doctor'
  ) into is_doctor;

  if acting_user is null or not is_doctor then
    raise exception 'Doctor access required';
  end if;

  if old.status = 'voided' then
    raise exception 'An annulled consultation cannot be changed';
  end if;

  if new.id is distinct from old.id
    or new.patient_id is distinct from old.patient_id
    or new.doctor_id is distinct from old.doctor_id
    or new.created_at is distinct from old.created_at
    or new.appointment_id is distinct from old.appointment_id then
    raise exception 'Consultation identity fields cannot be changed';
  end if;

  clinical_fields_changed :=
    new.chief_complaint is distinct from old.chief_complaint
    or new.notes is distinct from old.notes
    or new.peptide_protocol is distinct from old.peptide_protocol
    or new.photos is distinct from old.photos;

  if new.status = 'voided' and old.status <> 'voided' then
    if clinical_fields_changed then
      raise exception 'Correct the consultation before annulling it';
    end if;

    audit_reason := nullif(btrim(new.void_reason), '');
    if audit_reason is null then
      raise exception 'An annulment reason is required';
    end if;

    audit_type := 'void';
    new.void_reason := audit_reason;
    new.voided_at := now();
    new.voided_by := acting_user;
    new.correction_reason := old.correction_reason;
    new.corrected_at := old.corrected_at;
    new.corrected_by := old.corrected_by;
  elsif clinical_fields_changed then
    audit_reason := nullif(btrim(new.correction_reason), '');
    if audit_reason is null then
      raise exception 'A correction reason is required';
    end if;

    audit_type := 'correction';
    new.status := old.status;
    new.correction_reason := audit_reason;
    new.corrected_at := now();
    new.corrected_by := acting_user;
    new.void_reason := old.void_reason;
    new.voided_at := old.voided_at;
    new.voided_by := old.voided_by;
  else
    raise exception 'No permitted consultation changes were supplied';
  end if;

  insert into public.consultation_revisions (
    consultation_id,
    changed_by,
    change_type,
    reason,
    previous_record
  ) values (
    old.id,
    acting_user,
    audit_type,
    audit_reason,
    to_jsonb(old)
  );

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.audit_consultation_change()
  from public, anon, authenticated;

drop trigger if exists audit_consultation_change_before_update
  on public.consultations;
create trigger audit_consultation_change_before_update
before update on public.consultations
for each row
execute function public.audit_consultation_change();

-- Replace overlapping legacy policies with explicit doctor/patient policies.
drop policy if exists "Doctors can manage consultations"
  on public.consultations;
drop policy if exists "Patients can view own consultations"
  on public.consultations;
drop policy if exists "Users see own consultations"
  on public.consultations;

create policy "Doctors read all consultations"
on public.consultations
for select
to authenticated
using ((select public.get_my_role()) = 'doctor');

create policy "Patients read active own consultations"
on public.consultations
for select
to authenticated
using (
  (select auth.uid()) = patient_id
  and status = 'completed'
);

create policy "Doctors create consultations"
on public.consultations
for insert
to authenticated
with check (
  (select public.get_my_role()) = 'doctor'
  and (select auth.uid()) = doctor_id
);

create policy "Doctors correct or annul consultations"
on public.consultations
for update
to authenticated
using ((select public.get_my_role()) = 'doctor')
with check ((select public.get_my_role()) = 'doctor');

revoke all on table public.consultations from anon;
revoke delete, truncate, trigger, references
  on table public.consultations from authenticated;
grant select, insert, update
  on table public.consultations to authenticated;

comment on table public.consultation_revisions is
  'Immutable before-images for doctor corrections and annulments of clinical consultations.';
comment on column public.body_metrics.consultation_id is
  'Optional explicit link to the clinical consultation during which the measurement was recorded.';
