alter type private.auth_rate_limit_policy add value if not exists 'avatar_upload';
alter type private.auth_rate_limit_policy add value if not exists 'avatar_replace';
alter type private.auth_rate_limit_policy add value if not exists 'avatar_remove';
alter type private.auth_rate_limit_policy add value if not exists 'task_attachment_upload';
alter type private.auth_rate_limit_policy add value if not exists 'task_attachment_remove';
alter type private.auth_rate_limit_policy add value if not exists 'submission_attachment_upload';
alter type private.auth_rate_limit_policy add value if not exists 'submission_attachment_remove';
alter type private.auth_rate_limit_policy add value if not exists 'management_attachment_remove';
alter type private.auth_rate_limit_policy add value if not exists 'storage_signed_url';

begin;

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
    expires_at=excluded.expires_at,last_request_id=excluded.last_request_id
  returning attempt_count into v_count;
  return query select v_count<=v_limit,greatest(v_limit-v_count,0),
    v_expires_at,greatest(1,least(v_window_seconds,
      pg_catalog.ceil(extract(epoch from(v_expires_at-v_now)))::integer));
end;
$function$;

alter table public.attachments
  add column removal_pending_at timestamptz,
  add column removal_requested_by uuid references public.profiles(id) on delete restrict;

create table private.storage_cleanup_jobs(
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  bucket text not null check(bucket in('avatars','task-attachments','submission-attachments')),
  object_path text not null check(pg_catalog.length(object_path)<=512),
  reason_code text not null check(reason_code in(
    'metadata_registration_failed','avatar_profile_update_failed',
    'avatar_old_object_delete_failed','attachment_object_delete_failed')),
  attempt_count integer not null default 0 check(attempt_count between 0 and 5),
  status text not null default 'pending' check(status in('pending','completed','terminal')),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique(bucket,object_path,reason_code)
);
revoke all on private.storage_cleanup_jobs from public,anon,authenticated,service_role;

create or replace function public.begin_attachment_removal_v2(p_attachment_id uuid)
returns table(bucket text,object_path text,already_removed boolean)
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_row public.attachments%rowtype;
  v_submission_status public.submission_status;
begin
  if v_actor is null then raise exception 'attachment not found' using errcode='P0002'; end if;
  select * into v_row from public.attachments
    where id=p_attachment_id and workspace_id=v_workspace for update;
  if not found then raise exception 'attachment not found' using errcode='P0002'; end if;
  if v_row.deleted_at is not null then
    return query select v_row.bucket,v_row.object_path,true; return;
  end if;
  if v_row.submission_id is not null then
    select status into v_submission_status from public.submissions
      where id=v_row.submission_id and workspace_id=v_workspace;
    if v_submission_status in('published','archived') then
      raise exception 'attachment immutable' using errcode='55000';
    end if;
  end if;
  if not public.can_access_storage_object_v1(v_row.bucket,v_row.object_path,true) then
    raise exception 'attachment not found' using errcode='P0002';
  end if;
  update public.attachments set removal_pending_at=pg_catalog.clock_timestamp(),
    removal_requested_by=v_actor where id=p_attachment_id;
  return query select v_row.bucket,v_row.object_path,false;
end;
$function$;

create or replace function public.finish_attachment_removal_v2(
  p_attachment_id uuid,p_object_removed boolean
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_row public.attachments%rowtype;
begin
  select * into v_row from public.attachments
    where id=p_attachment_id and workspace_id=v_workspace for update;
  if v_actor is null or not found or
    (v_row.removal_requested_by<>v_actor and not private.is_management()) then
    raise exception 'attachment not found' using errcode='P0002';
  end if;
  if v_row.deleted_at is not null then return true; end if;
  if v_row.removal_pending_at is null then
    raise exception 'removal not started' using errcode='55000';
  end if;
  if not p_object_removed then
    insert into private.storage_cleanup_jobs(
      workspace_id,actor_id,bucket,object_path,reason_code
    ) values(v_workspace,v_actor,v_row.bucket,v_row.object_path,
      'attachment_object_delete_failed') on conflict do nothing;
    return false;
  end if;
  update public.attachments set deleted_at=pg_catalog.clock_timestamp(),
    removal_pending_at=null where id=p_attachment_id;
  update private.storage_cleanup_jobs set status='completed',
    updated_at=pg_catalog.clock_timestamp()
    where bucket=v_row.bucket and object_path=v_row.object_path
      and reason_code='attachment_object_delete_failed';
  perform private.append_business_audit_event(
    'attachment_removed',v_actor,v_workspace,'attachment',p_attachment_id,
    '{}'::jsonb);
  return true;
end;
$function$;

create or replace function public.record_storage_cleanup_v1(
  p_bucket text,p_object_path text,p_reason_code text
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
begin
  if v_actor is null or p_reason_code not in(
    'metadata_registration_failed','avatar_profile_update_failed',
    'avatar_old_object_delete_failed') or
    not public.can_access_storage_object_v1(p_bucket,p_object_path,false) then
    raise exception 'not authorized' using errcode='42501';
  end if;
  insert into private.storage_cleanup_jobs(
    workspace_id,actor_id,bucket,object_path,reason_code
  ) values(v_workspace,v_actor,p_bucket,p_object_path,p_reason_code)
  on conflict do nothing;
  return true;
end;
$function$;

revoke all on function public.begin_attachment_removal_v2(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.begin_attachment_removal_v2(uuid) to authenticated;
revoke all on function public.finish_attachment_removal_v2(uuid,boolean)
  from public,anon,authenticated,service_role;
grant execute on function public.finish_attachment_removal_v2(uuid,boolean) to authenticated;
revoke all on function public.record_storage_cleanup_v1(text,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.record_storage_cleanup_v1(text,text,text) to authenticated;

commit;
