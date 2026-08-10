alter type private.auth_rate_limit_policy add value if not exists 'brand_read';
alter type private.auth_rate_limit_policy add value if not exists 'brand_mutation';

begin;

create unique index if not exists brands_workspace_normalized_name_key
  on public.brands (workspace_id, pg_catalog.lower(pg_catalog.btrim(name)));

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
    ('employee_invitation_retry'::private.auth_rate_limit_policy, 20, 3600),
    ('brand_read'::private.auth_rate_limit_policy, 120, 60),
    ('brand_mutation'::private.auth_rate_limit_policy, 30, 3600)
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
  return query select v_count <= v_limit, greatest(v_limit-v_count,0),
    v_expires_at, greatest(1, least(v_window_seconds,
      pg_catalog.ceil(extract(epoch from (v_expires_at-v_now)))::integer));
end;
$function$;

create or replace function public.update_brand_v2(
  p_brand_id uuid,
  p_name text,
  p_industry text,
  p_accent_color text,
  p_description text,
  p_website_url text,
  p_status public.brand_status,
  p_expected_updated_at timestamptz
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
  v_current public.brands%rowtype;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_status not in ('active', 'paused') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  select * into v_current
  from public.brands
  where id = p_brand_id and workspace_id = v_workspace
  for update;
  if not found then
    raise exception 'brand not found' using errcode = 'P0002';
  end if;
  if v_current.updated_at <> p_expected_updated_at then
    raise exception 'stale brand' using errcode = '40001';
  end if;
  update public.brands
  set name = p_name,
      industry = p_industry,
      accent_color = p_accent_color,
      description = p_description,
      website_url = p_website_url,
      status = p_status,
      archived_at = null
  where id = p_brand_id;
  perform private.append_business_audit_event(
    'brand_updated', v_actor, v_workspace, 'brand', p_brand_id,
    '{"changed_fields":"name,industry,accent_color,description,website_url,status"}'::jsonb
  );
  return true;
end;
$function$;

create or replace function public.set_brand_archived_v2(
  p_brand_id uuid,
  p_archived boolean,
  p_expected_updated_at timestamptz
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
  v_current public.brands%rowtype;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_current
  from public.brands
  where id = p_brand_id and workspace_id = v_workspace
  for update;
  if not found then
    raise exception 'brand not found' using errcode = 'P0002';
  end if;
  if v_current.updated_at <> p_expected_updated_at then
    raise exception 'stale brand' using errcode = '40001';
  end if;
  if p_archived then
    update public.brands
    set status = 'archived', archived_at = pg_catalog.clock_timestamp()
    where id = p_brand_id;
    perform private.append_business_audit_event(
      'brand_archived', v_actor, v_workspace, 'brand', p_brand_id, '{}'::jsonb
    );
  else
    update public.brands
    set status = 'active', archived_at = null
    where id = p_brand_id;
    perform private.append_business_audit_event(
      'brand_updated', v_actor, v_workspace, 'brand', p_brand_id,
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
revoke all on function public.update_brand_v2(
  uuid,text,text,text,text,text,public.brand_status,timestamptz
) from public,anon,authenticated,service_role;
grant execute on function public.update_brand_v2(
  uuid,text,text,text,text,text,public.brand_status,timestamptz
) to authenticated;
revoke all on function public.set_brand_archived_v2(uuid,boolean,timestamptz)
  from public,anon,authenticated,service_role;
grant execute on function public.set_brand_archived_v2(uuid,boolean,timestamptz)
  to authenticated;

commit;
