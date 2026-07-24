-- Private patient medical-document storage.
-- Objects are stored as: <patient auth uid>/<generated filename>

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'lab-uploads',
  'lab-uploads',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Patients can read their own lab files" on storage.objects;
create policy "Patients can read their own lab files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'lab-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Patients can upload their own lab files" on storage.objects;
create policy "Patients can upload their own lab files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lab-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Patients can update their own lab files" on storage.objects;
create policy "Patients can update their own lab files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'lab-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'lab-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Patients can delete their own lab files" on storage.objects;
create policy "Patients can delete their own lab files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lab-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Doctors can read all lab files" on storage.objects;
create policy "Doctors can read all lab files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'lab-uploads'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'doctor'
  )
);

drop policy if exists "Doctors can upload lab files" on storage.objects;
create policy "Doctors can upload lab files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lab-uploads'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'doctor'
  )
);
