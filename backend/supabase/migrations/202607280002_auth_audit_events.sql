begin;

create type private.auth_audit_event_type as enum (
  'login_succeeded',
  'login_failed',
  'logout_succeeded',
  'logout_failed',
  'password_reset_requested',
  'password_recovery_verified',
  'password_recovery_rejected',
  'password_reset_succeeded',
  'password_reset_failed',
  'inactive_account_denied',
  'missing_profile_denied',
  'invalid_role_denied',
  'authentication_verification_failed',
  'rate_limit_exceeded',
  'recovery_state_invalid',
  'session_cleanup_performed',
  'security_dependency_unavailable'
);

create type private.auth_audit_result as enum (
  'succeeded',
  'failed',
  'denied',
  'accepted',
  'cleaned',
  'unavailable'
);

create type private.auth_audit_source as enum (
  'login_action',
  'forgot_password_action',
  'recovery_callback',
  'reset_password_action',
  'logout_action',
  'signout_route'
);

create table private.auth_audit_events (
  event_id uuid primary key,
  event_type private.auth_audit_event_type not null,
  result private.auth_audit_result not null,
  actor_user_id uuid,
  target_user_id uuid,
  workspace_id uuid,
  request_id uuid not null,
  occurred_at timestamptz not null
    default pg_catalog.clock_timestamp(),
  ip_identifier bytea
    check (
      ip_identifier is null or
      pg_catalog.octet_length(ip_identifier) = 32
    ),
  user_agent_identifier bytea
    check (
      user_agent_identifier is null or
      pg_catalog.octet_length(user_agent_identifier) = 32
    ),
  source private.auth_audit_source not null,
  metadata jsonb not null default '{}'::jsonb,
  schema_version smallint not null default 1
    check (schema_version = 1),
  check (pg_catalog.jsonb_typeof(metadata) = 'object'),
  check (pg_catalog.pg_column_size(metadata) <= 2048)
);

create index auth_audit_events_occurred_at_idx
  on private.auth_audit_events (occurred_at desc);
create index auth_audit_events_type_time_idx
  on private.auth_audit_events (event_type, occurred_at desc);
create index auth_audit_events_actor_time_idx
  on private.auth_audit_events (actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index auth_audit_events_workspace_time_idx
  on private.auth_audit_events (workspace_id, occurred_at desc)
  where workspace_id is not null;
create index auth_audit_events_request_id_idx
  on private.auth_audit_events (request_id);
create index auth_audit_events_result_time_idx
  on private.auth_audit_events (result, occurred_at desc);

alter table private.auth_audit_events enable row level security;
alter table private.auth_audit_events force row level security;

revoke all on table private.auth_audit_events
  from public, anon, authenticated, service_role;

create or replace function private.auth_audit_metadata_is_valid(
  p_metadata jsonb
)
returns boolean
language sql
immutable
set search_path = pg_catalog, private
as $function$
  select
    pg_catalog.jsonb_typeof(p_metadata) = 'object'
    and pg_catalog.pg_column_size(p_metadata) <= 2048
    and not exists (
      select 1
      from pg_catalog.jsonb_each(p_metadata) as item(key, value)
      where item.key not in (
        'reason_code',
        'provider',
        'persistence_mode',
        'limiter_policy',
        'retry_after_seconds',
        'profile_status',
        'role',
        'logout_scope',
        'cleanup_kind',
        'http_method',
        'status_code'
      )
      or pg_catalog.jsonb_typeof(item.value)
        not in ('string', 'number')
      or (
        pg_catalog.jsonb_typeof(item.value) = 'string'
        and (
          pg_catalog.length(item.value #>> '{}') > 128
          or (item.value #>> '{}') ~ '[[:cntrl:]]'
        )
      )
      or (
        item.key = 'reason_code'
        and (item.value #>> '{}') not in (
          'invalid_credentials',
          'inactive_account',
          'missing_profile',
          'invalid_role',
          'verification_failed',
          'invalid_recovery',
          'provider_rejected',
          'rate_limited',
          'dependency_unavailable'
        )
      )
      or (
        item.key = 'provider'
        and (item.value #>> '{}') <> 'supabase'
      )
      or (
        item.key = 'persistence_mode'
        and (item.value #>> '{}') not in (
          'session',
          'persistent'
        )
      )
      or (
        item.key = 'limiter_policy'
        and (item.value #>> '{}') not in (
          'login_targeted',
          'login_ip',
          'forgot_password_targeted',
          'forgot_password_ip',
          'recovery_callback_ip',
          'reset_password_targeted',
          'reset_password_ip'
        )
      )
      or (
        item.key = 'profile_status'
        and (item.value #>> '{}') not in (
          'active',
          'inactive',
          'missing',
          'invalid_role'
        )
      )
      or (
        item.key = 'role'
        and (item.value #>> '{}') not in (
          'manager',
          'hr',
          'graphic_designer',
          'video_editor'
        )
      )
      or (
        item.key = 'logout_scope'
        and (item.value #>> '{}') not in (
          'local',
          'global'
        )
      )
      or (
        item.key = 'cleanup_kind'
        and (item.value #>> '{}') not in (
          'recovery',
          'persistence',
          'session'
        )
      )
      or (
        item.key = 'http_method'
        and (item.value #>> '{}') not in (
          'GET',
          'POST'
        )
      )
      or (
        item.key = 'retry_after_seconds'
        and (
          pg_catalog.jsonb_typeof(item.value) <> 'number'
          or (item.value #>> '{}') !~ '^[0-9]+$'
          or (item.value #>> '{}')::integer not between 1 and 3600
        )
      )
      or (
        item.key = 'status_code'
        and (
          pg_catalog.jsonb_typeof(item.value) <> 'number'
          or (item.value #>> '{}') !~ '^[0-9]+$'
          or (item.value #>> '{}')::integer not between 100 and 599
        )
      )
    );
$function$;

create or replace function public.append_auth_audit_event(
  p_event_id uuid,
  p_event_type text,
  p_result text,
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_workspace_id uuid,
  p_request_id uuid,
  p_ip_identifier bytea,
  p_user_agent_identifier bytea,
  p_source text,
  p_metadata jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_event_type private.auth_audit_event_type;
  v_result private.auth_audit_result;
  v_source private.auth_audit_source;
begin
  if p_event_id is null
     or p_request_id is null
     or p_ip_identifier is null
     or pg_catalog.octet_length(p_ip_identifier) <> 32
     or p_user_agent_identifier is null
     or pg_catalog.octet_length(p_user_agent_identifier) <> 32
     or not private.auth_audit_metadata_is_valid(
       pg_catalog.coalesce(p_metadata, '{}'::jsonb)
     ) then
    raise exception 'invalid audit event input'
      using errcode = '22023';
  end if;

  begin
    v_event_type := p_event_type::private.auth_audit_event_type;
    v_result := p_result::private.auth_audit_result;
    v_source := p_source::private.auth_audit_source;
  exception when invalid_text_representation then
    raise exception 'invalid audit event classification'
      using errcode = '22023';
  end;

  insert into private.auth_audit_events (
    event_id,
    event_type,
    result,
    actor_user_id,
    target_user_id,
    workspace_id,
    request_id,
    ip_identifier,
    user_agent_identifier,
    source,
    metadata
  )
  values (
    p_event_id,
    v_event_type,
    v_result,
    p_actor_user_id,
    p_target_user_id,
    p_workspace_id,
    p_request_id,
    p_ip_identifier,
    p_user_agent_identifier,
    v_source,
    pg_catalog.coalesce(p_metadata, '{}'::jsonb)
  );

  return true;
end;
$function$;

create or replace function private.reject_auth_audit_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, private
as $function$
begin
  if tg_op = 'DELETE'
     and pg_catalog.current_setting(
       'auth.audit_retention_cleanup',
       true
     ) = 'enabled' then
    return old;
  end if;

  raise exception 'authentication audit events are append-only'
    using errcode = '42501';
end;
$function$;

create trigger auth_audit_events_append_only
before update or delete on private.auth_audit_events
for each row execute function private.reject_auth_audit_mutation();

create or replace function private.purge_expired_auth_audit_events(
  p_batch_size integer default 1000
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_deleted integer;
begin
  if p_batch_size < 1 or p_batch_size > 10000 then
    raise exception 'invalid cleanup batch size'
      using errcode = '22023';
  end if;

  perform pg_catalog.set_config(
    'auth.audit_retention_cleanup',
    'enabled',
    true
  );

  with expired as (
    select ctid
    from private.auth_audit_events
    where occurred_at <
      pg_catalog.clock_timestamp() - interval '180 days'
    order by occurred_at
    limit p_batch_size
    for update skip locked
  )
  delete from private.auth_audit_events events
  using expired
  where events.ctid = expired.ctid;

  get diagnostics v_deleted = row_count;

  return v_deleted;
end;
$function$;

revoke all on function public.append_auth_audit_event(
  uuid, text, text, uuid, uuid, uuid, uuid,
  bytea, bytea, text, jsonb
) from public, anon, authenticated;
revoke all on function private.auth_audit_metadata_is_valid(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function private.reject_auth_audit_mutation()
  from public, anon, authenticated, service_role;
revoke all on function private.purge_expired_auth_audit_events(integer)
  from public, anon, authenticated, service_role;

grant execute on function public.append_auth_audit_event(
  uuid, text, text, uuid, uuid, uuid, uuid,
  bytea, bytea, text, jsonb
) to service_role;

comment on table private.auth_audit_events is
  'Append-only authentication security events. Online retention is 180 days; cleanup requires a separately reviewed trusted schedule.';
comment on function private.purge_expired_auth_audit_events(integer) is
  'Restricted bounded retention cleanup for events older than 180 days.';

commit;
