begin;

create or replace function public.get_tasks_v2()
returns table (
  id uuid, brand_id uuid, brand_name text, title text,
  department public.department_type, content_type text,
  scheduled_date date, deadline_at timestamptz, status public.task_status,
  priority public.task_priority, description text, reference_url text,
  delay_reason text, updated_at timestamptz, assignee_ids uuid[],
  assignee_names text[]
)
language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select t.id,t.brand_id,b.name,t.title,t.department,t.content_type,
    t.scheduled_date,t.deadline_at,t.status,t.priority,t.description,
    t.reference_url,t.delay_reason,t.updated_at,
    coalesce(array_agg(p.id order by p.full_name) filter (where p.id is not null),'{}'::uuid[]),
    coalesce(array_agg(p.full_name order by p.full_name) filter (where p.id is not null),'{}'::text[])
  from public.tasks t
  join public.brands b on b.id=t.brand_id and b.workspace_id=t.workspace_id
  left join public.task_assignees a on a.task_id=t.id and a.workspace_id=t.workspace_id
  left join public.profiles p on p.id=a.profile_id and p.workspace_id=a.workspace_id
  where private.current_active_profile_id() is not null
    and t.workspace_id=private.current_workspace_id()
    and (private.is_management() or private.is_task_assignee(t.id))
  group by t.id,b.name
  order by t.deadline_at asc nulls last,t.id;
$function$;

create or replace function public.get_task_detail_v2(p_task_id uuid)
returns table (
  id uuid, brand_id uuid, brand_name text, title text,
  department public.department_type, content_type text,
  scheduled_date date, deadline_at timestamptz, status public.task_status,
  priority public.task_priority, description text, reference_url text,
  delay_reason text, updated_at timestamptz, assignee_ids uuid[],
  assignee_names text[]
)
language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select * from public.get_tasks_v2() task where task.id=p_task_id;
$function$;

create or replace function public.create_assigned_task_v2(
  p_brand_id uuid,p_title text,p_department public.department_type,
  p_content_type text,p_scheduled_date date,p_deadline_at timestamptz,
  p_priority public.task_priority,p_description text,p_reference_url text,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_id uuid; v_recipient uuid; v_workspace uuid:=private.current_workspace_id();
begin
  if private.current_active_profile_id() is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  v_id:=public.create_task(p_brand_id,p_title,p_department,p_content_type,
    p_scheduled_date,p_deadline_at,p_priority,p_description,p_reference_url);
  perform public.set_task_assignees(v_id,p_assignee_ids);
  foreach v_recipient in array p_assignee_ids loop
    insert into public.notifications(
      workspace_id,recipient_id,type,title,body,task_id,brand_id,action_path
    ) values (
      v_workspace,v_recipient,'task_assigned','New task assigned',
      'A new task has been assigned to you.',v_id,p_brand_id,'/tasks'
    );
  end loop;
  return v_id;
end;
$function$;

create or replace function public.reassign_task_v2(
  p_task_id uuid,p_assignee_ids uuid[],p_expected_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_task public.tasks%rowtype; v_recipient uuid;
begin
  if private.current_active_profile_id() is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_task from public.tasks where id=p_task_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  if v_task.updated_at<>p_expected_updated_at then
    raise exception 'stale task' using errcode='40001';
  end if;
  perform public.set_task_assignees(p_task_id,p_assignee_ids);
  foreach v_recipient in array p_assignee_ids loop
    insert into public.notifications(
      workspace_id,recipient_id,type,title,body,task_id,brand_id,action_path
    ) values (
      v_task.workspace_id,v_recipient,'task_assigned','Task assignment updated',
      'A task assignment has been updated.',p_task_id,v_task.brand_id,'/tasks'
    );
  end loop;
  return true;
end;
$function$;

create or replace function public.update_task_v2(
  p_task_id uuid,p_brand_id uuid,p_title text,p_department public.department_type,
  p_content_type text,p_scheduled_date date,p_deadline_at timestamptz,
  p_priority public.task_priority,p_description text,p_reference_url text,
  p_expected_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_updated timestamptz;
begin
  if private.current_active_profile_id() is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select updated_at into v_updated from public.tasks where id=p_task_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  if v_updated<>p_expected_updated_at then raise exception 'stale task' using errcode='40001'; end if;
  return public.update_task(p_task_id,p_brand_id,p_title,p_department,p_content_type,
    p_scheduled_date,p_deadline_at,p_priority,p_description,p_reference_url);
end;
$function$;

do $acl$
declare item regprocedure;
begin
  foreach item in array array[
    'public.get_tasks_v2()'::regprocedure,
    'public.get_task_detail_v2(uuid)'::regprocedure,
    'public.create_assigned_task_v2(uuid,text,public.department_type,text,date,timestamptz,public.task_priority,text,text,uuid[])'::regprocedure,
    'public.reassign_task_v2(uuid,uuid[],timestamptz)'::regprocedure,
    'public.update_task_v2(uuid,uuid,text,public.department_type,text,date,timestamptz,public.task_priority,text,text,timestamptz)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',item);
    execute format('grant execute on function %s to authenticated',item);
  end loop;
end;
$acl$;

commit;
