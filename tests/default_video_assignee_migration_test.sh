#!/bin/sh
set -eu

migration=$(rg -l 'default_video_assignee' supabase/migrations/*.sql)

rg -Fq 'create schema if not exists private' "$migration"
rg -Fq 'anjanapai2508@gmail.com' "$migration"
rg -Fq 'new.next_action_assignee_id is null' "$migration"
rg -Fq 'before insert on public.videos' "$migration"
rg -Fq 'where next_action_assignee_id is null' "$migration"
rg -Fq 'revoke all on function private.default_video_assignee() from public' "$migration"
