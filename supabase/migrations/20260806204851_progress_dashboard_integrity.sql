-- Progress dashboard integrity repair.
-- Additive only: existing body_metrics rows and historical BMI values are preserved.

alter table public.wellness_checkins
  add column if not exists weight numeric;

alter table public.body_metrics
  add column if not exists height_cm numeric,
  add column if not exists bmi_override boolean not null default false,
  add column if not exists bmi_override_reason text;

create index if not exists body_metrics_patient_recorded_at_idx
  on public.body_metrics (patient_id, recorded_at desc);

alter table public.body_metrics
  drop constraint if exists body_metrics_height_plausible,
  add constraint body_metrics_height_plausible
    check (height_cm is null or height_cm between 100 and 250) not valid;

alter table public.body_metrics
  drop constraint if exists body_metrics_weight_plausible,
  add constraint body_metrics_weight_plausible
    check (weight_kg is null or weight_kg between 25 and 350) not valid;

alter table public.body_metrics
  drop constraint if exists body_metrics_bmi_plausible,
  add constraint body_metrics_bmi_plausible
    check (bmi is null or bmi between 10 and 80 or bmi_override) not valid;

alter table public.body_metrics
  drop constraint if exists body_metrics_bmi_override_reason_required,
  add constraint body_metrics_bmi_override_reason_required
    check (
      not bmi_override
      or nullif(btrim(bmi_override_reason), '') is not null
    ) not valid;

create or replace function public.set_body_metrics_bmi()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.bmi_override then
    if new.bmi is null then
      raise exception 'BMI override requires a BMI value';
    end if;

    if nullif(btrim(new.bmi_override_reason), '') is null then
      raise exception 'BMI override requires a clinical reason';
    end if;
  elsif new.weight_kg is not null and new.height_cm is not null then
    new.bmi := round(
      (new.weight_kg / power(new.height_cm / 100.0, 2))::numeric,
      1
    );
    new.bmi_override_reason := null;
  end if;

  return new;
end;
$$;

revoke execute on function public.set_body_metrics_bmi() from public, anon, authenticated;

drop trigger if exists set_body_metrics_bmi_before_write on public.body_metrics;
create trigger set_body_metrics_bmi_before_write
before insert or update of weight_kg, height_cm, bmi, bmi_override, bmi_override_reason
on public.body_metrics
for each row
execute function public.set_body_metrics_bmi();

comment on column public.body_metrics.height_cm is
  'Height snapshot used to calculate BMI for this measurement.';
comment on column public.body_metrics.bmi_override is
  'True only when the doctor intentionally overrides calculated BMI.';
comment on column public.body_metrics.bmi_override_reason is
  'Required clinical reason for an intentional BMI override.';
