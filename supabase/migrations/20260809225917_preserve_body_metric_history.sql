-- Additive, append-only audit controls for historical progress records.
-- Existing body_metrics rows are preserved verbatim; no row is updated or deleted.

alter table public.body_metrics
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists correction_reason text,
  add column if not exists corrected_at timestamptz,
  add column if not exists corrected_by uuid,
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid;

alter table public.body_metrics
  drop constraint if exists body_metrics_status_check,
  add constraint body_metrics_status_check
    check (status in ('active', 'voided'));

create table if not exists public.body_metric_revisions (
  id uuid primary key default gen_random_uuid(),
  body_metric_id uuid not null
    references public.body_metrics(id) on delete restrict,
  changed_by uuid not null,
  change_type text not null
    check (change_type in ('correction', 'void')),
  reason text not null
    check (nullif(btrim(reason), '') is not null),
  previous_record jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists body_metric_revisions_metric_created_idx
  on public.body_metric_revisions (body_metric_id, created_at desc);

alter table public.body_metric_revisions enable row level security;

revoke all on table public.body_metric_revisions from anon, authenticated;
grant select on table public.body_metric_revisions to authenticated;

drop policy if exists "Doctors read body metric revisions"
  on public.body_metric_revisions;
create policy "Doctors read body metric revisions"
on public.body_metric_revisions
for select
to authenticated
using ((select public.get_my_role()) = 'doctor');

create or replace function public.audit_body_metric_change()
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
    raise exception 'An annulled progress record cannot be changed';
  end if;

  if new.id is distinct from old.id
    or new.patient_id is distinct from old.patient_id
    or new.recorded_at is distinct from old.recorded_at
    or new.recorded_by is distinct from old.recorded_by then
    raise exception 'Progress record identity fields cannot be changed';
  end if;

  clinical_fields_changed :=
    new.weight_kg is distinct from old.weight_kg
    or new.height_cm is distinct from old.height_cm
    or new.body_fat_pct is distinct from old.body_fat_pct
    or new.bmi is distinct from old.bmi
    or new.bmi_override is distinct from old.bmi_override
    or new.bmi_override_reason is distinct from old.bmi_override_reason
    or new.muscle_kg is distinct from old.muscle_kg
    or new.waist_cm is distinct from old.waist_cm
    or new.notes is distinct from old.notes
    or new.consultation_id is distinct from old.consultation_id;

  if new.status = 'voided' and old.status <> 'voided' then
    if clinical_fields_changed then
      raise exception 'Correct the progress record before annulling it';
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
    raise exception 'No permitted progress record changes were supplied';
  end if;

  insert into public.body_metric_revisions (
    body_metric_id,
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

revoke all on function public.audit_body_metric_change()
  from public, anon, authenticated;

drop trigger if exists audit_body_metric_change_before_update
  on public.body_metrics;
create trigger audit_body_metric_change_before_update
before update on public.body_metrics
for each row
execute function public.audit_body_metric_change();

-- Replace overlapping legacy policies with explicit doctor/patient policies.
drop policy if exists "Doctors can insert body_metrics"
  on public.body_metrics;
drop policy if exists "Doctors can insert metrics"
  on public.body_metrics;
drop policy if exists "Doctors can read all body_metrics"
  on public.body_metrics;
drop policy if exists "Doctors can view all metrics"
  on public.body_metrics;
drop policy if exists "Patients can read own body_metrics"
  on public.body_metrics;
drop policy if exists "Patients can view own metrics"
  on public.body_metrics;

create policy "Doctors read all body metrics"
on public.body_metrics
for select
to authenticated
using ((select public.get_my_role()) = 'doctor');

create policy "Patients read active own body metrics"
on public.body_metrics
for select
to authenticated
using (
  (select auth.uid()) = patient_id
  and status = 'active'
);

create policy "Doctors create body metrics"
on public.body_metrics
for insert
to authenticated
with check (
  (select public.get_my_role()) = 'doctor'
  and (select auth.uid()) = recorded_by
);

create policy "Doctors correct or annul body metrics"
on public.body_metrics
for update
to authenticated
using ((select public.get_my_role()) = 'doctor')
with check ((select public.get_my_role()) = 'doctor');

revoke all on table public.body_metrics from anon;
revoke delete, truncate, trigger, references
  on table public.body_metrics from authenticated;
grant select, insert, update
  on table public.body_metrics to authenticated;

comment on table public.body_metric_revisions is
  'Immutable before-images for doctor corrections and annulments of progress records.';
comment on column public.body_metrics.status is
  'Active records appear in progress charts; voided records remain available to doctors for audit.';
