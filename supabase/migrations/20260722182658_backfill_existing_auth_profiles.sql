insert into public.profiles (id, display_name)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'User'
  )
from auth.users
on conflict (id) do nothing;
