begin;

-- Profile and settings render a signed private avatar from this path. Keep the
-- existing self-or-management RLS policy and expose only the required column.
grant select (avatar_path) on public.profiles to authenticated;

commit;
