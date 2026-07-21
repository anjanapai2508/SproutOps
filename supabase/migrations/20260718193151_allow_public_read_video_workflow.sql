create policy "Public can view edit versions for active videos"
on public.edit_versions
for select
to anon
using (
  exists (
    select 1 from public.videos
    where videos.id = edit_versions.video_id
      and videos.archived_at is null
  )
);

create policy "Public can view comments for active videos"
on public.edit_comments
for select
to anon
using (
  exists (
    select 1
    from public.edit_versions
    join public.videos on videos.id = edit_versions.video_id
    where edit_versions.id = edit_comments.version_id
      and videos.archived_at is null
  )
);
