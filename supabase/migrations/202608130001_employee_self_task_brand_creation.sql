begin;

create or replace function public.create_self_task_brand_v1(p_name text, p_industry text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, auth, public, private set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_id uuid;
begin
  if v_actor is null or not exists (
    select 1 from public.profiles p where p.id = v_actor and p.workspace_id = v_workspace
      and p.is_active and p.role in ('graphic_designer', 'video_editor')
  ) then raise exception 'not authorized' using errcode = '42501'; end if;
  if pg_catalog.length(pg_catalog.btrim(p_name)) not between 1 and 120
     or pg_catalog.length(pg_catalog.btrim(p_industry)) not between 1 and 120
  then raise exception 'invalid brand' using errcode = '22023'; end if;
  insert into public.brands (workspace_id, name, industry)
  values (v_workspace, pg_catalog.btrim(p_name), pg_catalog.btrim(p_industry)) returning id into v_id;
  perform private.append_business_audit_event(
    'brand_created', v_actor, v_workspace, 'brand', v_id, '{"source":"employee_self_task"}'::jsonb
  );
  return v_id;
end;
$function$;

revoke all on function public.create_self_task_brand_v1(text, text) from public, anon, authenticated, service_role;
grant execute on function public.create_self_task_brand_v1(text, text) to authenticated;

commit;
