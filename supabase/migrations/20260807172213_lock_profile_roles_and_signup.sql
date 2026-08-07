-- Public signups are always patients. Doctor accounts must be provisioned by an
-- administrator using a trusted server-side path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'patient'
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.email, sqlerrm;
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Keep the role helper available to authenticated RLS policies, but remove
-- anonymous RPC access and pin its search path.
alter function public.get_my_role() set search_path = public;
revoke all on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated, service_role;

-- Remove broad client write privileges. Signed-in users may only change safe,
-- non-authorisation fields on their own profile.
revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, trigger, references
on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone, language, has_seen_intro, has_signed_waiver)
on table public.profiles to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Users update safe fields on own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
