begin;

create or replace function public.get_self_task_brand_options_v1()
returns table (id uuid, name text)
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
begin
  if v_actor is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor and p.workspace_id = v_workspace and p.is_active
      and p.role in ('graphic_designer', 'video_editor')
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select b.id, b.name
  from public.brands b
  where b.workspace_id = v_workspace and b.status = 'active'
  order by pg_catalog.lower(b.name), b.id;
end;
$function$;

revoke all on function public.get_self_task_brand_options_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.get_self_task_brand_options_v1()
  to authenticated;

commit;
