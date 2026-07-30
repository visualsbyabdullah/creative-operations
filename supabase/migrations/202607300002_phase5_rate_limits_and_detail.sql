alter type private.auth_rate_limit_policy add value if not exists 'profile_write';
alter type private.auth_rate_limit_policy add value if not exists 'employee_directory_read';
alter type private.auth_rate_limit_policy add value if not exists 'employee_detail_read';
alter type private.auth_rate_limit_policy add value if not exists 'employee_manage';
alter type private.auth_rate_limit_policy add value if not exists 'employee_status_change';
alter type private.auth_rate_limit_policy add value if not exists 'employee_role_change';
alter type private.auth_rate_limit_policy add value if not exists 'employee_invitation';
alter type private.auth_rate_limit_policy add value if not exists 'employee_invitation_retry';

begin;

create or replace function public.consume_auth_rate_limit(
  p_policy_id text,
  p_key_digest bytea,
  p_request_id uuid
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_policy private.auth_rate_limit_policy;
  v_limit integer;
  v_window_seconds integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_bucket_started_at timestamptz;
  v_expires_at timestamptz;
  v_count integer;
begin
  if p_policy_id is null or p_key_digest is null
     or pg_catalog.octet_length(p_key_digest) <> 32 or p_request_id is null then
    raise exception 'invalid rate limit input' using errcode = '22023';
  end if;
  begin
    v_policy := p_policy_id::private.auth_rate_limit_policy;
  exception when invalid_text_representation then
    raise exception 'invalid rate limit policy' using errcode = '22023';
  end;

  select policy_limit, window_seconds into v_limit, v_window_seconds
  from (values
    ('login_targeted'::private.auth_rate_limit_policy, 5, 900),
    ('login_ip'::private.auth_rate_limit_policy, 30, 900),
    ('forgot_password_targeted'::private.auth_rate_limit_policy, 3, 3600),
    ('forgot_password_ip'::private.auth_rate_limit_policy, 10, 3600),
    ('recovery_callback_ip'::private.auth_rate_limit_policy, 10, 900),
    ('reset_password_targeted'::private.auth_rate_limit_policy, 5, 1800),
    ('reset_password_ip'::private.auth_rate_limit_policy, 15, 1800),
    ('profile_write'::private.auth_rate_limit_policy, 20, 600),
    ('employee_directory_read'::private.auth_rate_limit_policy, 120, 60),
    ('employee_detail_read'::private.auth_rate_limit_policy, 120, 60),
    ('employee_manage'::private.auth_rate_limit_policy, 30, 3600),
    ('employee_status_change'::private.auth_rate_limit_policy, 30, 3600),
    ('employee_role_change'::private.auth_rate_limit_policy, 20, 3600),
    ('employee_invitation'::private.auth_rate_limit_policy, 10, 3600),
    ('employee_invitation_retry'::private.auth_rate_limit_policy, 20, 3600)
  ) policies(policy_id, policy_limit, window_seconds)
  where policy_id = v_policy;
  if v_limit is null then
    raise exception 'unsupported rate limit policy' using errcode = '22023';
  end if;

  v_bucket_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );
  v_expires_at := v_bucket_started_at + pg_catalog.make_interval(secs => v_window_seconds);
  insert into private.auth_rate_limit_buckets (
    policy_id, key_digest, bucket_started_at, attempt_count, expires_at, last_request_id
  ) values (v_policy, p_key_digest, v_bucket_started_at, 1, v_expires_at, p_request_id)
  on conflict (policy_id, key_digest, bucket_started_at) do update set
    attempt_count = private.auth_rate_limit_buckets.attempt_count + 1,
    expires_at = excluded.expires_at,
    last_request_id = excluded.last_request_id
  returning attempt_count into v_count;
  return query select v_count <= v_limit, pg_catalog.greatest(v_limit-v_count,0),
    v_expires_at, pg_catalog.greatest(1, pg_catalog.least(v_window_seconds,
      pg_catalog.ceil(extract(epoch from (v_expires_at-v_now)))::integer));
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
  with authorized as (
    select p.*, manager.full_name as manager_name
    from public.profiles p
    left join public.profiles manager
      on manager.id = p.manager_id and manager.workspace_id = p.workspace_id
    where private.current_active_profile_id() is not null
      and private.is_management()
      and p.workspace_id = private.current_workspace_id()
      and p.id = p_profile_id
  ), metrics as (
    select a.*,
      count(ta.task_id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
      ) as active_count,
      count(ta.task_id) filter (
        where t.status = 'completed'
          and t.updated_at >= pg_catalog.clock_timestamp() - interval '30 days'
      ) as completed_count,
      count(ta.task_id) filter (where t.status = 'submitted') as review_count,
      count(ta.task_id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
          and t.deadline_at < pg_catalog.clock_timestamp()
      ) as delayed_count
    from authorized a
    left join public.task_assignees ta
      on ta.profile_id = a.id and ta.workspace_id = a.workspace_id
    left join public.tasks t on t.id = ta.task_id and t.workspace_id = ta.workspace_id
    group by a.id,a.workspace_id,a.email,a.full_name,a.role,a.department,a.job_title,
      a.phone,a.timezone,a.bio,a.avatar_path,a.avatar_url,a.is_active,a.manager_id,
      a.created_at,a.updated_at,a.manager_name
  )
  select m.id,m.full_name,m.email,m.avatar_url,m.role,m.department,m.is_active,
    m.manager_id,m.manager_name,m.phone,m.timezone,m.job_title,m.active_count,
    m.completed_count,m.review_count,m.delayed_count,
    case when m.completed_count+m.active_count=0 then null
      else round(m.completed_count::numeric*100/(m.completed_count+m.active_count),2) end,
    case when m.delayed_count>0 then 'Delayed'
      when m.review_count>0 then 'Review Pending' else 'On Track' end,
    m.updated_at
  from metrics m;
$function$;

revoke all on function public.consume_auth_rate_limit(text,bytea,uuid)
  from public,anon,authenticated;
grant execute on function public.consume_auth_rate_limit(text,bytea,uuid)
  to service_role;
revoke all on function public.get_employee_detail(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.get_employee_detail(uuid) to authenticated;

commit;
