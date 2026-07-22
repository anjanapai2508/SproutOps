create schema if not exists private;

create or replace function private.default_video_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.next_action_assignee_id is null then
    select profiles.id
    into new.next_action_assignee_id
    from auth.users
    join public.profiles on profiles.id = users.id
    where lower(users.email) = 'anjanapai2508@gmail.com'
    limit 1;
  end if;

  return new;
end;
$$;

revoke all on function private.default_video_assignee() from public, anon, authenticated;

drop trigger if exists set_default_video_assignee on public.videos;

create trigger set_default_video_assignee
before insert on public.videos
for each row
execute function private.default_video_assignee();

with default_profile as (
  select profiles.id
  from auth.users
  join public.profiles on profiles.id = users.id
  where lower(users.email) = 'anjanapai2508@gmail.com'
  limit 1
)
update public.videos
set next_action_assignee_id = default_profile.id
from default_profile
where next_action_assignee_id is null;

grant select on public.profiles to authenticated;

drop policy if exists "Authenticated users can view assignee profiles" on public.profiles;
create policy "Authenticated users can view assignee profiles"
on public.profiles
for select
to authenticated
using (true);
