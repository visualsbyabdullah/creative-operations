begin;

create or replace function public.edit_and_reassign_task_v3(
  p_task_id uuid,p_brand_id uuid,p_title text,p_department public.department_type,
  p_content_type text,p_scheduled_date date,p_deadline_at timestamptz,
  p_priority public.task_priority,p_description text,p_reference_url text,
  p_assignee_ids uuid[],p_expected_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_current public.tasks%rowtype;
begin
  if private.current_active_profile_id() is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_current from public.tasks where id=p_task_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  if v_current.updated_at<>p_expected_updated_at then
    raise exception 'stale task' using errcode='40001';
  end if;
  perform public.update_task(p_task_id,p_brand_id,p_title,p_department,p_content_type,
    p_scheduled_date,p_deadline_at,p_priority,p_description,p_reference_url);
  select * into v_current from public.tasks where id=p_task_id for update;
  perform public.reassign_task_v2(p_task_id,p_assignee_ids,v_current.updated_at);
  return true;
end;
$function$;

revoke all on function public.edit_and_reassign_task_v3(
  uuid,uuid,text,public.department_type,text,date,timestamptz,
  public.task_priority,text,text,uuid[],timestamptz
) from public,anon,authenticated,service_role;
grant execute on function public.edit_and_reassign_task_v3(
  uuid,uuid,text,public.department_type,text,date,timestamptz,
  public.task_priority,text,text,uuid[],timestamptz
) to authenticated;

commit;
