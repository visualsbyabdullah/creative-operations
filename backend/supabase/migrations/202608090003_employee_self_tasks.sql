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
    pg_catalog.jsonb_build_object('brand_id', p_brand_id, 'source', 'self_created')
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

create or replace function public.query_tasks_page_v3(
  p_start_date date,
  p_end_date date,
  p_search text default null,
  p_status public.task_status default null,
  p_priority public.task_priority default null,
  p_brand_id uuid default null,
  p_assignee_id uuid default null,
  p_department public.department_type default null,
  p_sort text default 'scheduled_date',
  p_page_size integer default 50,
  p_cursor text default null
)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_fingerprint text;
  v_parts text[];
  v_after_date date;
  v_after_id uuid;
  v_result jsonb;
begin
  if v_actor is null then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_start_date is null or p_end_date is null or p_start_date > p_end_date
     or p_end_date - p_start_date > 92 then
    raise exception 'invalid date range' using errcode = '22007';
  end if;
  if p_page_size is null or p_page_size < 1 or p_page_size > 100
     or p_sort <> 'scheduled_date'
     or (p_search is not null and pg_catalog.length(pg_catalog.btrim(p_search)) > 120) then
    raise exception 'invalid query' using errcode = '22023';
  end if;

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.concat_ws('|', v_actor, p_start_date, p_end_date,
      pg_catalog.lower(pg_catalog.btrim(coalesce(p_search, ''))), p_status,
      p_priority, p_brand_id, p_assignee_id, p_department, p_sort, p_page_size),
    'UTF8'), 'sha256'), 'hex');

  if p_cursor is not null then
    v_parts := pg_catalog.string_to_array(p_cursor, '|');
    begin
      if pg_catalog.array_length(v_parts, 1) <> 3 or v_parts[3] <> v_fingerprint then
        raise exception 'stale cursor' using errcode = '22023';
      end if;
      v_after_date := v_parts[1]::date;
      v_after_id := v_parts[2]::uuid;
    exception when invalid_text_representation or invalid_datetime_format then
      raise exception 'invalid cursor' using errcode = '22023';
    end;
  end if;

  with candidates as (
    select t.id, t.brand_id, b.name as brand_name, t.title, t.department,
      t.content_type, t.scheduled_date, t.deadline_at, t.status, t.priority,
      t.description, t.reference_url, t.delay_reason, t.updated_at, t.created_by,
      case when exists (
        select 1 from public.task_assignees own
        join public.profiles creator on creator.id = t.created_by
        where own.task_id = t.id and own.profile_id = t.created_by
          and creator.role in ('graphic_designer', 'video_editor')
      ) then 'self_created' else 'management_assigned' end as task_source,
      coalesce((select pg_catalog.array_agg(a.profile_id order by p.full_name, a.profile_id)
        from public.task_assignees a join public.profiles p on p.id = a.profile_id
        where a.task_id = t.id and a.workspace_id = t.workspace_id), '{}'::uuid[]) as assignee_ids,
      coalesce((select pg_catalog.array_agg(p.full_name order by p.full_name, p.id)
        from public.task_assignees a join public.profiles p on p.id = a.profile_id
        where a.task_id = t.id and a.workspace_id = t.workspace_id), '{}'::text[]) as assignee_names
    from public.tasks t join public.brands b on b.id = t.brand_id and b.workspace_id = t.workspace_id
    where t.workspace_id = v_workspace
      and t.scheduled_date between p_start_date and p_end_date
      and (private.is_management() or private.is_task_assignee(t.id))
      and (p_status is null or t.status = p_status)
      and (p_priority is null or t.priority = p_priority)
      and (p_brand_id is null or t.brand_id = p_brand_id)
      and (p_department is null or t.department = p_department)
      and (p_assignee_id is null or exists (select 1 from public.task_assignees fa
        where fa.task_id=t.id and fa.workspace_id=t.workspace_id and fa.profile_id=p_assignee_id))
      and (p_search is null or pg_catalog.btrim(p_search) = '' or
        t.title ilike '%' || pg_catalog.btrim(p_search) || '%' or
        b.name ilike '%' || pg_catalog.btrim(p_search) || '%')
      and (v_after_date is null or (t.scheduled_date, t.id) > (v_after_date, v_after_id))
    order by t.scheduled_date, t.id limit p_page_size + 1
  ), numbered as (
    select candidates.*, pg_catalog.row_number() over (order by scheduled_date, id) as rn from candidates
  ), page as (
    select * from numbered where rn <= p_page_size
  )
  select pg_catalog.jsonb_build_object(
    'items', coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(page)-'rn' order by scheduled_date,id) from page),'[]'::jsonb),
    'next_cursor', case when (select pg_catalog.count(*) from numbered) > p_page_size
      then (select scheduled_date::text||'|'||id::text||'|'||v_fingerprint from page order by scheduled_date desc,id desc limit 1)
      else null end
  ) into v_result;
  return v_result;
end;
$function$;

commit;
