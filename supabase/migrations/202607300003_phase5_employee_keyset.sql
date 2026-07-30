begin;

create or replace function public.get_employee_directory_v2(
  p_search text default null,
  p_roles public.app_role[] default null,
  p_departments public.department_type[] default null,
  p_is_active boolean default null,
  p_sort text default 'full_name',
  p_direction text default 'asc',
  p_limit integer default 25,
  p_cursor_value text default null,
  p_cursor_is_null boolean default false,
  p_cursor_id uuid default null
)
returns table (
  id uuid, full_name text, email text, avatar_url text, role public.app_role,
  department public.department_type, is_active boolean, manager_id uuid,
  manager_full_name text, active_task_count bigint, completed_task_count bigint,
  review_pending_count bigint, delayed_task_count bigint, progress_percent numeric,
  workload_status text, updated_at timestamptz, cursor_value text,
  cursor_is_null boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_workspace uuid := private.current_workspace_id();
begin
  if private.current_active_profile_id() is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_limit not between 1 and 100
     or p_sort not in ('full_name','email','role','department','is_active',
       'active_task_count','completed_task_count','delayed_task_count',
       'progress_percent','updated_at','id')
     or p_direction not in ('asc','desc')
     or length(coalesce(p_search,'')) > 100
     or ((p_cursor_value is not null or p_cursor_is_null) and p_cursor_id is null) then
    raise exception 'invalid directory input' using errcode = '22023';
  end if;

  return query
  with filtered as (
    select profile.*, manager.full_name as manager_name
    from public.profiles profile
    left join public.profiles manager
      on manager.id=profile.manager_id and manager.workspace_id=profile.workspace_id
    where profile.workspace_id=v_workspace
      and (nullif(btrim(p_search),'') is null
        or profile.full_name ilike '%'||replace(replace(replace(btrim(p_search),'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
        or profile.email ilike '%'||replace(replace(replace(btrim(p_search),'\','\\'),'%','\%'),'_','\_')||'%' escape '\')
      and (p_roles is null or profile.role=any(p_roles))
      and (p_departments is null or profile.department=any(p_departments))
      and (p_is_active is null or profile.is_active=p_is_active)
  ), metrics as (
    select f.*,
      count(a.task_id) filter (where t.status in ('assigned','in_progress','revision_requested','submitted')) active_count,
      count(a.task_id) filter (where t.status='completed'
        and t.updated_at>=pg_catalog.clock_timestamp()-interval '30 days') completed_count,
      count(a.task_id) filter (where t.status='submitted') review_count,
      count(a.task_id) filter (where t.status in ('assigned','in_progress','revision_requested','submitted')
        and t.deadline_at<pg_catalog.clock_timestamp()) delayed_count
    from filtered f
    left join public.task_assignees a on a.profile_id=f.id and a.workspace_id=f.workspace_id
    left join public.tasks t on t.id=a.task_id and t.workspace_id=a.workspace_id
    group by f.id,f.workspace_id,f.email,f.full_name,f.role,f.department,f.job_title,
      f.phone,f.timezone,f.bio,f.avatar_path,f.avatar_url,f.is_active,f.manager_id,
      f.created_at,f.updated_at,f.manager_name
  ), shaped as (
    select m.*,
      case when m.completed_count+m.active_count=0 then null
        else round(m.completed_count::numeric*100/(m.completed_count+m.active_count),2) end progress_value
    from metrics m
  ), cursor_filtered as (
    select s.*
    from shaped s
    where p_cursor_id is null or
      case p_sort
        when 'full_name' then
          case when p_cursor_is_null then false
            when p_direction='asc' then lower(s.full_name)>p_cursor_value or (lower(s.full_name)=p_cursor_value and s.id>p_cursor_id)
            else lower(s.full_name)<p_cursor_value or (lower(s.full_name)=p_cursor_value and s.id>p_cursor_id) end
        when 'email' then
          case when p_cursor_is_null then false
            when p_direction='asc' then lower(s.email)>p_cursor_value or (lower(s.email)=p_cursor_value and s.id>p_cursor_id)
            else lower(s.email)<p_cursor_value or (lower(s.email)=p_cursor_value and s.id>p_cursor_id) end
        when 'role' then
          case when p_cursor_is_null then false
            when p_direction='asc' then s.role::text>p_cursor_value or (s.role::text=p_cursor_value and s.id>p_cursor_id)
            else s.role::text<p_cursor_value or (s.role::text=p_cursor_value and s.id>p_cursor_id) end
        when 'department' then
          case when p_cursor_is_null then s.department is null and s.id>p_cursor_id
            when s.department is null then true
            when p_direction='asc' then s.department::text>p_cursor_value or (s.department::text=p_cursor_value and s.id>p_cursor_id)
            else s.department::text<p_cursor_value or (s.department::text=p_cursor_value and s.id>p_cursor_id) end
        when 'is_active' then
          case when p_direction='asc' then s.is_active>p_cursor_value::boolean or (s.is_active=p_cursor_value::boolean and s.id>p_cursor_id)
            else s.is_active<p_cursor_value::boolean or (s.is_active=p_cursor_value::boolean and s.id>p_cursor_id) end
        when 'active_task_count' then
          case when p_direction='asc' then s.active_count>p_cursor_value::bigint or (s.active_count=p_cursor_value::bigint and s.id>p_cursor_id)
            else s.active_count<p_cursor_value::bigint or (s.active_count=p_cursor_value::bigint and s.id>p_cursor_id) end
        when 'completed_task_count' then
          case when p_direction='asc' then s.completed_count>p_cursor_value::bigint or (s.completed_count=p_cursor_value::bigint and s.id>p_cursor_id)
            else s.completed_count<p_cursor_value::bigint or (s.completed_count=p_cursor_value::bigint and s.id>p_cursor_id) end
        when 'delayed_task_count' then
          case when p_direction='asc' then s.delayed_count>p_cursor_value::bigint or (s.delayed_count=p_cursor_value::bigint and s.id>p_cursor_id)
            else s.delayed_count<p_cursor_value::bigint or (s.delayed_count=p_cursor_value::bigint and s.id>p_cursor_id) end
        when 'progress_percent' then
          case when p_cursor_is_null then s.progress_value is null and s.id>p_cursor_id
            when s.progress_value is null then true
            when p_direction='asc' then s.progress_value>p_cursor_value::numeric or (s.progress_value=p_cursor_value::numeric and s.id>p_cursor_id)
            else s.progress_value<p_cursor_value::numeric or (s.progress_value=p_cursor_value::numeric and s.id>p_cursor_id) end
        when 'updated_at' then
          case when p_direction='asc' then s.updated_at>p_cursor_value::timestamptz or (s.updated_at=p_cursor_value::timestamptz and s.id>p_cursor_id)
            else s.updated_at<p_cursor_value::timestamptz or (s.updated_at=p_cursor_value::timestamptz and s.id>p_cursor_id) end
        when 'id' then
          case when p_direction='asc' then s.id>p_cursor_id else s.id<p_cursor_id end
      end
  ), page as (
    select * from cursor_filtered
    order by
      case when p_sort='full_name' and p_direction='asc' then lower(full_name) end asc nulls last,
      case when p_sort='full_name' and p_direction='desc' then lower(full_name) end desc nulls last,
      case when p_sort='email' and p_direction='asc' then lower(email) end asc nulls last,
      case when p_sort='email' and p_direction='desc' then lower(email) end desc nulls last,
      case when p_sort='role' and p_direction='asc' then role::text end asc nulls last,
      case when p_sort='role' and p_direction='desc' then role::text end desc nulls last,
      case when p_sort='department' and p_direction='asc' then department::text end asc nulls last,
      case when p_sort='department' and p_direction='desc' then department::text end desc nulls last,
      case when p_sort='is_active' and p_direction='asc' then is_active end asc,
      case when p_sort='is_active' and p_direction='desc' then is_active end desc,
      case when p_sort='active_task_count' and p_direction='asc' then active_count end asc,
      case when p_sort='active_task_count' and p_direction='desc' then active_count end desc,
      case when p_sort='completed_task_count' and p_direction='asc' then completed_count end asc,
      case when p_sort='completed_task_count' and p_direction='desc' then completed_count end desc,
      case when p_sort='delayed_task_count' and p_direction='asc' then delayed_count end asc,
      case when p_sort='delayed_task_count' and p_direction='desc' then delayed_count end desc,
      case when p_sort='progress_percent' and p_direction='asc' then progress_value end asc nulls last,
      case when p_sort='progress_percent' and p_direction='desc' then progress_value end desc nulls last,
      case when p_sort='updated_at' and p_direction='asc' then updated_at end asc,
      case when p_sort='updated_at' and p_direction='desc' then updated_at end desc,
      case when p_sort='id' and p_direction='asc' then id end asc,
      case when p_sort='id' and p_direction='desc' then id end desc,
      id asc
    limit p_limit
  )
  select page.id,page.full_name,page.email,page.avatar_url,page.role,page.department,
    page.is_active,page.manager_id,page.manager_name,page.active_count,page.completed_count,
    page.review_count,page.delayed_count,page.progress_value,
    case when page.delayed_count>0 then 'Delayed'
      when page.review_count>0 then 'Review Pending' else 'On Track' end,
    page.updated_at,
    case p_sort when 'full_name' then lower(page.full_name) when 'email' then lower(page.email)
      when 'role' then page.role::text when 'department' then page.department::text
      when 'is_active' then page.is_active::text when 'active_task_count' then page.active_count::text
      when 'completed_task_count' then page.completed_count::text
      when 'delayed_task_count' then page.delayed_count::text
      when 'progress_percent' then page.progress_value::text
      when 'updated_at' then page.updated_at::text when 'id' then page.id::text end,
    case p_sort when 'department' then page.department is null
      when 'progress_percent' then page.progress_value is null else false end
  from page;
end;
$function$;

revoke all on function public.get_employee_directory_v2(
  text,public.app_role[],public.department_type[],boolean,text,text,integer,text,boolean,uuid
) from public,anon,authenticated,service_role;
grant execute on function public.get_employee_directory_v2(
  text,public.app_role[],public.department_type[],boolean,text,text,integer,text,boolean,uuid
) to authenticated;

commit;
