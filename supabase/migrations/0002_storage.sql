-- teapo — image storage
--
-- A single private bucket. Every object lives under <owner_id>/… and the policies
-- below check that the first path segment equals the caller's uid, so one user can
-- never read or overwrite another's files even if they guess a path.
--
-- The bucket is private, not public: the app reads images through short-lived
-- signed URLs (see createSignedUrl in src/lib/db.js). That keeps the images as
-- private as the rows that reference them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  10485760, -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do nothing;

-- Ownership is decided by the first path segment rather than storage.objects.owner:
-- `owner` is nullable and its semantics have shifted between Supabase versions,
-- whereas the path prefix is set by our own upload code and cannot be forged by a
-- client that only holds the anon key.

drop policy if exists media_own_read on storage.objects;
drop policy if exists media_own_insert on storage.objects;
drop policy if exists media_own_update on storage.objects;
drop policy if exists media_own_delete on storage.objects;

create policy media_own_read on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy media_own_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy media_own_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy media_own_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
