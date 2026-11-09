-- Apply only after SONG MEI database is ACTIVE and existing schema has been reviewed.
-- Demonstration of owner-scoped member data. No public or anonymous access.
create table if not exists public.mauyuan_member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);
alter table public.mauyuan_member_profiles enable row level security;
revoke all on public.mauyuan_member_profiles from anon;
grant select, insert, update, delete on public.mauyuan_member_profiles to authenticated;
create policy "member profile select own"
on public.mauyuan_member_profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy "member profile insert own"
on public.mauyuan_member_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "member profile update own"
on public.mauyuan_member_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "member profile delete own"
on public.mauyuan_member_profiles for delete to authenticated
using ((select auth.uid()) = user_id);
