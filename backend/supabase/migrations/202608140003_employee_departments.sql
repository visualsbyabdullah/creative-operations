alter type private.auth_rate_limit_policy add value if not exists 'department_read';
alter type private.auth_rate_limit_policy add value if not exists 'department_mutation';
alter type private.business_audit_event_type add value if not exists 'department_created';
alter type private.business_audit_event_type add value if not exists 'department_updated';
alter type private.business_audit_event_type add value if not exists 'department_archived';

begin;

create type public.department_status as enum (
  'active',
  'archived'
);

create table public.departments (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  key text not null
    check (
      key ~ '^[a-z][a-z0-9_]{0,79}$'
    ),
  name text not null
    check (
      pg_catalog.length(pg_catalog.btrim(name)) between 1 and 80
    ),
  description text
    check (
      description is null or pg_catalog.length(description) <= 4000
    ),
  accent_color text
    check (
      accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
  status public.department_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (
    (status = 'archived' and archived_at is not null) or
    (status <> 'archived' and archived_at is null)
  )
);

create unique index departments_workspace_normalized_name_key
  on public.departments (workspace_id, pg_catalog.lower(pg_catalog.btrim(name)));
create unique index departments_workspace_key_idx
  on public.departments (workspace_id, key);
create index departments_workspace_status_idx
  on public.departments (workspace_id, status);

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

insert into public.departments (workspace_id, key, name, description, accent_color)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'graphic_design',
    'Graphic Design',
    'Creates static visuals, artwork and print-ready content.',
    '#2f80ed'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'video_editing',
    'Video Editing',
    'Produces video, motion graphics and short-form edits.',
    '#7c3aed'
  );

alter table public.departments enable row level security;

revoke all on table public.departments
  from public, anon, authenticated, service_role;
grant select on public.departments to authenticated;

create policy departments_select_authorized
  on public.departments for select to authenticated
  using (
    workspace_id = private.current_workspace_id()
  );

create or replace function public.consume_auth_rate_limit(
  p_policy_id text,p_key_digest bytea,p_request_id uuid
)
returns table(
  allowed boolean,remaining integer,reset_at timestamptz,retry_after_seconds integer
)
language plpgsql security definer
set search_path=pg_catalog,private
as $function$
declare
  v_policy private.auth_rate_limit_policy; v_limit integer; v_window_seconds integer;
  v_now timestamptz:=pg_catalog.clock_timestamp(); v_bucket_started_at timestamptz;
  v_expires_at timestamptz; v_count integer;
begin
  if p_policy_id is null or p_key_digest is null
    or pg_catalog.octet_length(p_key_digest)<>32 or p_request_id is null then
    raise exception 'invalid rate limit input' using errcode='22023';
  end if;
  begin v_policy:=p_policy_id::private.auth_rate_limit_policy;
  exception when invalid_text_representation then
    raise exception 'invalid rate limit policy' using errcode='22023'; end;
  select policy_limit,window_seconds into v_limit,v_window_seconds from(values
    ('login_targeted'::private.auth_rate_limit_policy,5,900),
    ('login_ip'::private.auth_rate_limit_policy,30,900),
    ('forgot_password_targeted'::private.auth_rate_limit_policy,3,3600),
    ('forgot_password_ip'::private.auth_rate_limit_policy,10,3600),
    ('recovery_callback_ip'::private.auth_rate_limit_policy,10,900),
    ('reset_password_targeted'::private.auth_rate_limit_policy,5,1800),
    ('reset_password_ip'::private.auth_rate_limit_policy,15,1800),
    ('profile_write'::private.auth_rate_limit_policy,20,600),
    ('employee_directory_read'::private.auth_rate_limit_policy,120,60),
    ('employee_detail_read'::private.auth_rate_limit_policy,120,60),
    ('employee_manage'::private.auth_rate_limit_policy,30,3600),
    ('employee_status_change'::private.auth_rate_limit_policy,30,3600),
    ('employee_role_change'::private.auth_rate_limit_policy,20,3600),
    ('employee_invitation'::private.auth_rate_limit_policy,10,3600),
    ('employee_invitation_retry'::private.auth_rate_limit_policy,20,3600),
    ('brand_read'::private.auth_rate_limit_policy,120,60),
    ('brand_mutation'::private.auth_rate_limit_policy,30,3600),
    ('department_read'::private.auth_rate_limit_policy,120,60),
    ('department_mutation'::private.auth_rate_limit_policy,30,3600),
    ('avatar_upload'::private.auth_rate_limit_policy,10,600),
    ('avatar_replace'::private.auth_rate_limit_policy,10,600),
    ('avatar_remove'::private.auth_rate_limit_policy,10,600),
    ('task_attachment_upload'::private.auth_rate_limit_policy,20,600),
    ('task_attachment_remove'::private.auth_rate_limit_policy,30,600),
    ('submission_attachment_upload'::private.auth_rate_limit_policy,20,600),
    ('submission_attachment_remove'::private.auth_rate_limit_policy,20,600),
    ('management_attachment_remove'::private.auth_rate_limit_policy,30,600),
    ('storage_signed_url'::private.auth_rate_limit_policy,120,60)
  ) policies(policy_id,policy_limit,window_seconds) where policy_id=v_policy;
  if v_limit is null then raise exception 'unsupported rate limit policy' using errcode='22023'; end if;
  v_bucket_started_at:=pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from v_now)/v_window_seconds)*v_window_seconds);
  v_expires_at:=v_bucket_started_at+pg_catalog.make_interval(secs=>v_window_seconds);
  insert into private.auth_rate_limit_buckets(
    policy_id,key_digest,bucket_started_at,attempt_count,expires_at,last_request_id
  ) values(v_policy,p_key_digest,v_bucket_started_at,1,v_expires_at,p_request_id)
  on conflict(policy_id,key_digest,bucket_started_at) do update set
    attempt_count=private.auth_rate_limit_buckets.attempt_count+1,
    expires_at=excluded.expires_at,
    last_request_id=excluded.last_request_id
  returning attempt_count into v_count;
  return query select v_count<=v_limit, greatest(v_limit-v_count,0),
    v_expires_at, greatest(1, least(v_window_seconds,
      pg_catalog.ceil(extract(epoch from (v_expires_at-v_now)))::integer));
end;
$function$;

alter table private.business_audit_events
  drop constraint business_audit_events_target_type_check;
alter table private.business_audit_events
  add constraint business_audit_events_target_type_check
  check (
    target_type in (
      'profile', 'brand', 'task', 'submission',
      'notification', 'attachment', 'department'
    )
  );

create or replace function public.list_departments()
returns table (
  id uuid,
  key text,
  name text,
  description text,
  accent_color text,
  status public.department_status,
  archived_at timestamptz,
  member_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
begin
  if v_actor is null or v_workspace is null then
    raise exception 'not authorized' using errcode='42501';
  end if;
  return query
  select
    d.id,
    d.key,
    d.name,
    d.description,
    d.accent_color,
    d.status,
    d.archived_at,
    (
      select pg_catalog.count(*)
      from public.profiles p
      where p.workspace_id = d.workspace_id
        and p.department::text = d.key
    )::integer as member_count,
    d.created_at,
    d.updated_at
  from public.departments d
  where d.workspace_id = v_workspace
  order by d.name asc, d.id asc;
end;
$function$;

create or replace function public.create_department(
  p_name text,
  p_key text,
  p_description text,
  p_accent_color text
)
returns uuid
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_id uuid;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if pg_catalog.length(pg_catalog.btrim(coalesce(p_name,''))) not between 1 and 80
     or p_key !~ '^[a-z][a-z0-9_]{0,79}$'
     or (p_description is not null and pg_catalog.length(p_description) > 4000)
     or (p_accent_color is not null and p_accent_color !~ '^#[0-9A-Fa-f]{6}$') then
    raise exception 'invalid department' using errcode='22023';
  end if;
  insert into public.departments (
    workspace_id, key, name, description, accent_color
  ) values (
    v_workspace, p_key, pg_catalog.btrim(p_name), p_description, p_accent_color
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'department_created', v_actor, v_workspace, 'department', v_id, '{}'::jsonb
  );
  return v_id;
end;
$function$;

create or replace function public.update_department(
  p_department_id uuid,
  p_name text,
  p_description text,
  p_accent_color text,
  p_expected_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_current public.departments%rowtype;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if pg_catalog.length(pg_catalog.btrim(coalesce(p_name,''))) not between 1 and 80
     or (p_description is not null and pg_catalog.length(p_description) > 4000)
     or (p_accent_color is not null and p_accent_color !~ '^#[0-9A-Fa-f]{6}$') then
    raise exception 'invalid department' using errcode='22023';
  end if;
  select * into v_current
  from public.departments
  where id = p_department_id and workspace_id = v_workspace
  for update;
  if not found then
    raise exception 'department not found' using errcode='P0002';
  end if;
  if v_current.updated_at <> p_expected_updated_at then
    raise exception 'stale department' using errcode='40001';
  end if;
  update public.departments
  set name = pg_catalog.btrim(p_name),
      description = p_description,
      accent_color = p_accent_color,
      archived_at = null
  where id = p_department_id;
  perform private.append_business_audit_event(
    'department_updated', v_actor, v_workspace, 'department', p_department_id,
    '{"changed_fields":"name,description,accent_color"}'::jsonb
  );
  return true;
end;
$function$;

create or replace function public.set_department_archived(
  p_department_id uuid,
  p_archived boolean,
  p_expected_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_current public.departments%rowtype;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_current
  from public.departments
  where id = p_department_id and workspace_id = v_workspace
  for update;
  if not found then
    raise exception 'department not found' using errcode='P0002';
  end if;
  if v_current.updated_at <> p_expected_updated_at then
    raise exception 'stale department' using errcode='40001';
  end if;
  if p_archived then
    update public.departments
    set status = 'archived', archived_at = pg_catalog.clock_timestamp()
    where id = p_department_id;
    perform private.append_business_audit_event(
      'department_archived', v_actor, v_workspace, 'department', p_department_id, '{}'::jsonb
    );
  else
    update public.departments
    set status = 'active', archived_at = null
    where id = p_department_id;
    perform private.append_business_audit_event(
      'department_updated', v_actor, v_workspace, 'department', p_department_id,
      '{"changed_fields":"status"}'::jsonb
    );
  end if;
  return true;
end;
$function$;

revoke all on function public.consume_auth_rate_limit(text,bytea,uuid)
  from public,anon,authenticated;
grant execute on function public.consume_auth_rate_limit(text,bytea,uuid)
  to service_role;

revoke all on function public.list_departments()
  from public,anon,authenticated,service_role;
grant execute on function public.list_departments() to authenticated;

revoke all on function public.create_department(text,text,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.create_department(text,text,text,text) to authenticated;

revoke all on function public.update_department(uuid,text,text,text,timestamptz)
  from public,anon,authenticated,service_role;
grant execute on function public.update_department(uuid,text,text,text,timestamptz)
  to authenticated;

revoke all on function public.set_department_archived(uuid,boolean,timestamptz)
  from public,anon,authenticated,service_role;
grant execute on function public.set_department_archived(uuid,boolean,timestamptz)
  to authenticated;

commit;
