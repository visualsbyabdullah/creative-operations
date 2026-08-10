begin;

create type private.employee_invitation_state as enum (
  'prepared',
  'invited',
  'finalized',
  'needs_reconciliation'
);

create table private.employee_invitation_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  created_by uuid not null,
  email_digest bytea not null check (octet_length(email_digest) = 32),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  role public.app_role not null,
  department public.department_type,
  manager_id uuid,
  invited_user_id uuid,
  state private.employee_invitation_state not null default 'prepared',
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (workspace_id, email_digest),
  check (
    (role = 'graphic_designer' and department = 'graphic_design') or
    (role = 'video_editor' and department = 'video_editing') or
    (role in ('manager', 'hr') and department is null)
  ),
  foreign key (created_by, workspace_id)
    references public.profiles(id, workspace_id) on delete restrict,
  foreign key (manager_id, workspace_id)
    references public.profiles(id, workspace_id) on delete restrict
);

alter table private.employee_invitation_intents enable row level security;
alter table private.employee_invitation_intents force row level security;
revoke all on private.employee_invitation_intents
  from public, anon, authenticated, service_role;

create or replace function private.phase5_safe_profile(
  p_profile_id uuid,
  p_workspace_id uuid
)
returns table (
  id uuid,
  email text,
  full_name text,
  role public.app_role,
  department public.department_type,
  job_title text,
  phone text,
  timezone text,
  avatar_url text,
  is_active boolean,
  manager_id uuid,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select p.id, p.email, p.full_name, p.role, p.department, p.job_title,
         p.phone, p.timezone, p.avatar_url, p.is_active, p.manager_id,
         p.updated_at
  from public.profiles p
  where p.id = p_profile_id and p.workspace_id = p_workspace_id;
$function$;

create or replace function public.get_employee_directory(
  p_search text default null,
  p_roles public.app_role[] default null,
  p_departments public.department_type[] default null,
  p_is_active boolean default null,
  p_sort text default 'full_name',
  p_direction text default 'asc',
  p_limit integer default 25,
  p_cursor uuid default null
)
returns table (
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  role public.app_role,
  department public.department_type,
  is_active boolean,
  manager_id uuid,
  manager_full_name text,
  active_task_count bigint,
  completed_task_count bigint,
  review_pending_count bigint,
  delayed_task_count bigint,
  progress_percent numeric,
  workload_status text,
  updated_at timestamptz,
  next_cursor uuid
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
     or p_sort not in ('full_name','email','role','department','is_active','created_at','updated_at')
     or p_direction not in ('asc','desc')
     or length(coalesce(p_search, '')) > 100 then
    raise exception 'invalid directory input' using errcode = '22023';
  end if;

  return query
  with filtered as (
    select profile.*, manager.full_name as manager_name
    from public.profiles profile
    left join public.profiles manager
      on manager.id = profile.manager_id
     and manager.workspace_id = profile.workspace_id
    where profile.workspace_id = v_workspace
      and (p_cursor is null or profile.id > p_cursor)
      and (
        nullif(btrim(p_search), '') is null
        or profile.full_name ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
        or profile.email ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
      )
      and (p_roles is null or profile.role = any(p_roles))
      and (p_departments is null or profile.department = any(p_departments))
      and (p_is_active is null or profile.is_active = p_is_active)
  ),
  metrics as (
    select f.*,
      count(a.task_id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
      ) as active_count,
      count(a.task_id) filter (
        where t.status = 'completed'
          and t.updated_at >= pg_catalog.clock_timestamp() - interval '30 days'
      ) as completed_count,
      count(a.task_id) filter (where t.status = 'submitted') as review_count,
      count(a.task_id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
          and t.deadline_at < pg_catalog.clock_timestamp()
      ) as delayed_count
    from filtered f
    left join public.task_assignees a
      on a.profile_id = f.id and a.workspace_id = f.workspace_id
    left join public.tasks t
      on t.id = a.task_id and t.workspace_id = a.workspace_id
    group by f.id, f.workspace_id, f.email, f.full_name, f.role, f.department,
      f.job_title, f.phone, f.timezone, f.bio, f.avatar_path, f.avatar_url,
      f.is_active, f.manager_id, f.created_at, f.updated_at, f.manager_name
  ),
  page as (
    select *
    from metrics
    order by
      case when p_sort = 'full_name' and p_direction = 'asc' then lower(metrics.full_name) end asc,
      case when p_sort = 'full_name' and p_direction = 'desc' then lower(metrics.full_name) end desc,
      case when p_sort = 'email' and p_direction = 'asc' then lower(metrics.email) end asc,
      case when p_sort = 'email' and p_direction = 'desc' then lower(metrics.email) end desc,
      case when p_sort = 'role' and p_direction = 'asc' then metrics.role::text end asc,
      case when p_sort = 'role' and p_direction = 'desc' then metrics.role::text end desc,
      case when p_sort = 'department' and p_direction = 'asc' then metrics.department::text end asc,
      case when p_sort = 'department' and p_direction = 'desc' then metrics.department::text end desc,
      case when p_sort = 'is_active' and p_direction = 'asc' then metrics.is_active end asc,
      case when p_sort = 'is_active' and p_direction = 'desc' then metrics.is_active end desc,
      case when p_sort = 'created_at' and p_direction = 'asc' then metrics.created_at end asc,
      case when p_sort = 'created_at' and p_direction = 'desc' then metrics.created_at end desc,
      case when p_sort = 'updated_at' and p_direction = 'asc' then metrics.updated_at end asc,
      case when p_sort = 'updated_at' and p_direction = 'desc' then metrics.updated_at end desc,
      metrics.id asc
    limit p_limit
  )
  select page.id, page.full_name, page.email, page.avatar_url, page.role,
    page.department, page.is_active, page.manager_id, page.manager_name,
    page.active_count, page.completed_count, page.review_count,
    page.delayed_count,
    case when page.completed_count + page.active_count = 0 then null
      else round(page.completed_count::numeric * 100 /
        (page.completed_count + page.active_count), 2) end,
    case when page.delayed_count > 0 then 'Delayed'
      when page.review_count > 0 then 'Review Pending'
      else 'On Track' end,
    page.updated_at, page.id
  from page;
end;
$function$;

create or replace function public.get_employee_detail(p_profile_id uuid)
returns table (
  id uuid, full_name text, email text, avatar_url text, role public.app_role,
  department public.department_type, is_active boolean, manager_id uuid,
  manager_full_name text, phone text, timezone text, job_title text,
  active_task_count bigint, completed_task_count bigint,
  review_pending_count bigint, delayed_task_count bigint,
  progress_percent numeric, workload_status text, updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select d.id, d.full_name, d.email, d.avatar_url, d.role, d.department,
    d.is_active, d.manager_id, d.manager_full_name, p.phone, p.timezone,
    p.job_title, d.active_task_count, d.completed_task_count,
    d.review_pending_count, d.delayed_task_count, d.progress_percent,
    d.workload_status, d.updated_at
  from public.get_employee_directory(null, null, null, null, 'full_name',
    'asc', 100, null) d
  join public.profiles p on p.id = d.id
  where d.id = p_profile_id
    and private.is_management()
    and p.workspace_id = private.current_workspace_id();
$function$;

create or replace function public.update_own_settings_v2(
  p_full_name text,
  p_avatar_url text,
  p_phone text,
  p_timezone text,
  p_preferences jsonb,
  p_expected_updated_at timestamptz
)
returns setof public.profiles
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_profile public.profiles%rowtype;
begin
  if v_actor is null or jsonb_typeof(p_preferences) <> 'object'
     or (p_preferences - array['new_task_assignments','deadline_reminders',
       'revision_requests','approval_updates','publishing_updates',
       'email_enabled','in_app_enabled']) <> '{}'::jsonb then
    raise exception 'invalid settings input' using errcode = '22023';
  end if;
  select * into v_profile from public.profiles where id = v_actor for update;
  if v_profile.updated_at <> p_expected_updated_at then
    raise exception 'stale update' using errcode = '40001';
  end if;
  update public.profiles set full_name = p_full_name, avatar_url = p_avatar_url,
    phone = p_phone, timezone = p_timezone where id = v_actor
    returning * into v_profile;
  insert into public.notification_preferences (
    profile_id, new_task_assignments, deadline_reminders, revision_requests,
    approval_updates, publishing_updates, email_enabled, in_app_enabled
  ) values (
    v_actor,
    (p_preferences->>'new_task_assignments')::boolean,
    (p_preferences->>'deadline_reminders')::boolean,
    (p_preferences->>'revision_requests')::boolean,
    (p_preferences->>'approval_updates')::boolean,
    (p_preferences->>'publishing_updates')::boolean,
    (p_preferences->>'email_enabled')::boolean,
    (p_preferences->>'in_app_enabled')::boolean
  ) on conflict (profile_id) do update set
    new_task_assignments = excluded.new_task_assignments,
    deadline_reminders = excluded.deadline_reminders,
    revision_requests = excluded.revision_requests,
    approval_updates = excluded.approval_updates,
    publishing_updates = excluded.publishing_updates,
    email_enabled = excluded.email_enabled,
    in_app_enabled = excluded.in_app_enabled;
  perform private.append_business_audit_event(
    'profile_updated', v_actor, v_workspace, 'profile', v_actor,
    '{"changed_fields":"full_name,avatar_url,phone,timezone,notification_preferences"}'
  );
  return next v_profile;
end;
$function$;

create or replace function public.update_own_profile_v2(
  p_full_name text, p_avatar_url text, p_phone text, p_timezone text,
  p_expected_updated_at timestamptz
)
returns setof public.profiles
language sql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select * from public.update_own_settings_v2(
    p_full_name, p_avatar_url, p_phone, p_timezone,
    coalesce((select to_jsonb(n) - 'profile_id' - 'created_at' - 'updated_at'
      from public.notification_preferences n
      where n.profile_id = private.current_active_profile_id()),
      '{"new_task_assignments":true,"deadline_reminders":true,"revision_requests":true,"approval_updates":true,"publishing_updates":true,"email_enabled":true,"in_app_enabled":true}'::jsonb),
    p_expected_updated_at
  );
$function$;

create or replace function public.manage_profile_v2(
  p_profile_id uuid, p_full_name text, p_avatar_url text, p_phone text,
  p_timezone text, p_department public.department_type, p_role public.app_role,
  p_is_active boolean, p_manager_id uuid, p_expected_updated_at timestamptz
)
returns setof public.profiles
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_old public.profiles%rowtype;
  v_new public.profiles%rowtype;
begin
  if v_actor is null or not private.is_management() or p_profile_id = v_actor then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_old from public.profiles
    where id = p_profile_id and workspace_id = v_workspace for update;
  if not found then raise exception 'profile not found' using errcode = 'P0002'; end if;
  if v_old.updated_at <> p_expected_updated_at then
    raise exception 'stale update' using errcode = '40001';
  end if;
  if v_old.role = 'manager' and v_old.is_active
     and (p_role <> 'manager' or not p_is_active)
     and not exists (
       select 1 from public.profiles p
       where p.workspace_id = v_workspace and p.role = 'manager'
         and p.is_active and p.id <> p_profile_id
     ) then
    raise exception 'last active manager is protected' using errcode = '23514';
  end if;
  if p_manager_id is not null and not exists (
    select 1 from public.profiles p where p.id = p_manager_id
      and p.workspace_id = v_workspace and p.is_active
      and p.role in ('manager','hr')
  ) then raise exception 'invalid manager' using errcode = '23514'; end if;
  update public.profiles set full_name=p_full_name, avatar_url=p_avatar_url,
    phone=p_phone, timezone=p_timezone, department=p_department, role=p_role,
    is_active=p_is_active, manager_id=p_manager_id
  where id=p_profile_id returning * into v_new;
  perform private.append_business_audit_event(
    'profile_updated', v_actor, v_workspace, 'profile', p_profile_id,
    '{"changed_fields":"full_name,avatar_url,phone,timezone,department,role,is_active,manager_id"}'
  );
  return next v_new;
end;
$function$;

create or replace function public.prepare_employee_invitation(
  p_email_digest bytea, p_full_name text, p_role public.app_role,
  p_department public.department_type, p_manager_id uuid
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
  v_id uuid;
begin
  if v_actor is null or not private.is_management()
     or p_email_digest is null or octet_length(p_email_digest) <> 32 then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into private.employee_invitation_intents (
    workspace_id, created_by, email_digest, full_name, role, department,
    manager_id
  ) values (
    v_workspace, v_actor, p_email_digest, p_full_name, p_role, p_department,
    p_manager_id
  ) on conflict (workspace_id, email_digest) do update set
    updated_at = pg_catalog.clock_timestamp()
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.finalize_employee_invitation(
  p_intent_id uuid, p_invited_user_id uuid
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
  v_intent private.employee_invitation_intents%rowtype;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_intent from private.employee_invitation_intents
   where id = p_intent_id and workspace_id = v_workspace for update;
  if not found then raise exception 'intent not found' using errcode = 'P0002'; end if;
  if v_intent.invited_user_id is not null
     and v_intent.invited_user_id <> p_invited_user_id then
    raise exception 'invitation conflict' using errcode = '23505';
  end if;
  update public.profiles set full_name=v_intent.full_name, role=v_intent.role,
    department=v_intent.department, manager_id=v_intent.manager_id,
    is_active=false
  where id=p_invited_user_id and workspace_id=v_workspace;
  if not found then
    update private.employee_invitation_intents set
      invited_user_id=p_invited_user_id, state='needs_reconciliation',
      updated_at=pg_catalog.clock_timestamp() where id=p_intent_id;
    return false;
  end if;
  update private.employee_invitation_intents set
    invited_user_id=p_invited_user_id, state='finalized',
    updated_at=pg_catalog.clock_timestamp() where id=p_intent_id;
  perform private.append_business_audit_event(
    'profile_updated', v_actor, v_workspace, 'profile', p_invited_user_id,
    '{"changed_fields":"invitation_finalized"}'
  );
  return true;
end;
$function$;

revoke all on function private.phase5_safe_profile(uuid,uuid)
  from public, anon, authenticated, service_role;

revoke all on function public.get_employee_directory(
  text,public.app_role[],public.department_type[],boolean,text,text,integer,uuid
) from public,anon,authenticated,service_role;
revoke all on function public.get_employee_detail(uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.update_own_settings_v2(
  text,text,text,text,jsonb,timestamptz
) from public,anon,authenticated,service_role;
revoke all on function public.update_own_profile_v2(
  text,text,text,text,timestamptz
) from public,anon,authenticated,service_role;
revoke all on function public.manage_profile_v2(
  uuid,text,text,text,text,public.department_type,public.app_role,boolean,uuid,timestamptz
) from public,anon,authenticated,service_role;
revoke all on function public.prepare_employee_invitation(
  bytea,text,public.app_role,public.department_type,uuid
) from public,anon,authenticated,service_role;
revoke all on function public.finalize_employee_invitation(uuid,uuid)
  from public,anon,authenticated,service_role;

grant execute on function public.get_employee_directory(
  text,public.app_role[],public.department_type[],boolean,text,text,integer,uuid
) to authenticated;
grant execute on function public.get_employee_detail(uuid) to authenticated;
grant execute on function public.update_own_settings_v2(
  text,text,text,text,jsonb,timestamptz
) to authenticated;
grant execute on function public.update_own_profile_v2(
  text,text,text,text,timestamptz
) to authenticated;
grant execute on function public.manage_profile_v2(
  uuid,text,text,text,text,public.department_type,public.app_role,boolean,uuid,timestamptz
) to authenticated;
grant execute on function public.prepare_employee_invitation(
  bytea,text,public.app_role,public.department_type,uuid
) to authenticated;
grant execute on function public.finalize_employee_invitation(uuid,uuid)
  to authenticated;

commit;
