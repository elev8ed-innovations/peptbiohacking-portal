create table if not exists public.doctor_ai_summary_usage (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  model text not null,
  status text not null check (status in ('success', 'provider_error', 'timeout')),
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

alter table public.doctor_ai_summary_usage enable row level security;

revoke all on public.doctor_ai_summary_usage from anon;
grant select, insert on public.doctor_ai_summary_usage to authenticated;

create policy "Doctors read own AI summary usage"
on public.doctor_ai_summary_usage
for select
to authenticated
using ((select auth.uid()) = doctor_id);

create policy "Doctors record own AI summary usage"
on public.doctor_ai_summary_usage
for insert
to authenticated
with check ((select auth.uid()) = doctor_id);

create index if not exists doctor_ai_summary_usage_doctor_created_idx
on public.doctor_ai_summary_usage (doctor_id, created_at desc);

comment on table public.doctor_ai_summary_usage is
  'Metadata-only audit and quota records for doctor-requested AI summaries. Stores no prompt or generated clinical content.';
