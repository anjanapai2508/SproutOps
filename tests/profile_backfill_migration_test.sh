#!/bin/sh
set -eu

migration=$(rg -l 'insert into public.profiles \(id, display_name\)[[:space:]]*$' supabase/migrations/*.sql | xargs rg -l 'from auth.users')

rg -Fq "raw_user_meta_data ->> 'full_name'" "$migration"
rg -Fq "raw_user_meta_data ->> 'name'" "$migration"
rg -Fq "split_part(email, '@', 1)" "$migration"
rg -Fq 'from auth.users' "$migration"
rg -Fq 'on conflict (id) do nothing;' "$migration"
