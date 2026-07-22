#!/bin/sh
set -eu

migration=$(rg -l 'create or replace function public.handle_new_user_profile' supabase/migrations/*.sql)

rg -Fq 'security definer' "$migration"
rg -Fq "set search_path = ''" "$migration"
rg -Fq 'insert into public.profiles (id, display_name)' "$migration"
rg -Fq "new.raw_user_meta_data ->> 'full_name'" "$migration"
rg -Fq "new.raw_user_meta_data ->> 'name'" "$migration"
rg -Fq "split_part(new.email, '@', 1)" "$migration"
rg -Fq 'on conflict (id) do nothing' "$migration"
rg -Fq 'revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;' "$migration"
rg -Fq 'after insert on auth.users' "$migration"
rg -Fq 'execute function public.handle_new_user_profile();' "$migration"
