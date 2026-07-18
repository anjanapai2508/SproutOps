create policy "Public can view active videos"
on public.videos
for select
to anon
using (archived_at is null);
