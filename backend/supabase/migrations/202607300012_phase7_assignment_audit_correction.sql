begin;

create or replace function public.set_task_assignees(
  p_task_id uuid,
  p_profile_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_task public.tasks%rowtype;
  v_profile_id uuid;
  v_previous_count integer;
  v_event private.business_audit_event_type;
begin
  if v_actor is null
     or not private.is_management()
     or p_profile_ids is null
     or pg_catalog.cardinality(p_profile_ids) < 1
     or pg_catalog.cardinality(p_profile_ids) > 50
     or pg_catalog.cardinality(p_profile_ids)
        <> (select pg_catalog.count(distinct item) from pg_catalog.unnest(p_profile_ids) item)
     or exists (select 1 from pg_catalog.unnest(p_profile_ids) item where item is null) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = p_task_id and workspace_id = v_workspace
  for update;
  if not found or v_task.status not in ('draft', 'assigned') then
    raise exception 'task not assignable' using errcode = 'P0002';
  end if;
  select pg_catalog.count(*) into v_previous_count
  from public.task_assignees
  where task_id = p_task_id and workspace_id = v_workspace;
  foreach v_profile_id in array p_profile_ids loop
    if not exists (
      select 1 from public.profiles profile
      where profile.id = v_profile_id
        and profile.workspace_id = v_workspace
        and profile.is_active
        and profile.role in ('graphic_designer', 'video_editor')
        and profile.department = v_task.department
    ) then
      raise exception 'ineligible assignee' using errcode = '23514';
    end if;
  end loop;
  delete from public.task_assignees
  where task_id = p_task_id and workspace_id = v_workspace;
  insert into public.task_assignees (
    task_id, profile_id, assigned_by, workspace_id
  )
  select p_task_id, item, v_actor, v_workspace
  from pg_catalog.unnest(p_profile_ids) item;
  if v_task.status = 'draft' then
    update public.tasks
    set status = 'assigned', updated_by = v_actor
    where id = p_task_id;
    insert into public.task_status_events (
      task_id, from_status, to_status, actor_id, workspace_id
    ) values (
      p_task_id, 'draft', 'assigned', v_actor, v_workspace
    );
  end if;
  v_event := case when v_previous_count = 0
    then 'task_assigned'::private.business_audit_event_type
    else 'task_reassigned'::private.business_audit_event_type end;
  perform private.append_business_audit_event(
    v_event, v_actor, v_workspace, 'task', p_task_id,
    pg_catalog.jsonb_build_object(
      'assignee_count', pg_catalog.cardinality(p_profile_ids)
    )
  );
  return true;
end;
$function$;

revoke all on function public.set_task_assignees(uuid,uuid[])
  from public,anon,authenticated,service_role;
grant execute on function public.set_task_assignees(uuid,uuid[])
  to authenticated;

commit;
