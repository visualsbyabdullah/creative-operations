begin;

create or replace function public.create_self_task_v1(
  p_brand_id uuid,
  p_title text,
  p_scheduled_date date,
  p_priority public.task_priority,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_role public.app_role;
  v_department public.department_type;
  v_task_id uuid;
begin
  select p.role into v_role
  from public.profiles p
  where p.id = v_actor and p.workspace_id = v_workspace and p.is_active = true;

  if v_actor is null or v_role not in ('graphic_designer', 'video_editor') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_scheduled_date is null or pg_catalog.length(pg_catalog.btrim(p_title)) not between 1 and 160
     or p_description is null or pg_catalog.length(p_description) > 5000 then
    raise exception 'invalid task' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.brands b
    where b.id = p_brand_id and b.workspace_id = v_workspace and b.status = 'active'
  ) then
    raise exception 'invalid brand' using errcode = '22023';
  end if;

  v_department := case v_role
    when 'graphic_designer' then 'graphic_design'::public.department_type
    else 'video_editing'::public.department_type
  end;

  insert into public.tasks (
    workspace_id, brand_id, title, department, content_type, scheduled_date,
    deadline_at, status, priority, description, reference_url,
    created_by, updated_by
  ) values (
    v_workspace, p_brand_id, pg_catalog.btrim(p_title), v_department,
    'Personal Task', p_scheduled_date, null, 'assigned', p_priority,
    nullif(pg_catalog.btrim(p_description), ''), null,
    v_actor, v_actor
  ) returning id into v_task_id;

  insert into public.task_assignees (
    workspace_id, task_id, profile_id, assigned_by
  ) values (
    v_workspace, v_task_id, v_actor, v_actor
  );

  perform private.append_business_audit_event(
    'task_created', v_actor, v_workspace, 'task', v_task_id,
    pg_catalog.jsonb_build_object(
      'brand_id', p_brand_id,
      'changed_fields', 'source:self_created'
    )
  );
  return v_task_id;
end;
$function$;

revoke all on function public.create_self_task_v1(
  uuid,text,date,public.task_priority,text
) from public, anon, authenticated, service_role;
grant execute on function public.create_self_task_v1(
  uuid,text,date,public.task_priority,text
) to authenticated;

commit;
