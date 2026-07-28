begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type private.auth_rate_limit_policy as enum (
  'login_targeted',
  'login_ip',
  'forgot_password_targeted',
  'forgot_password_ip',
  'recovery_callback_ip',
  'reset_password_targeted',
  'reset_password_ip'
);

create table private.auth_rate_limit_buckets (
  policy_id private.auth_rate_limit_policy not null,
  key_digest bytea not null
    check (octet_length(key_digest) = 32),
  bucket_started_at timestamptz not null,
  attempt_count integer not null
    check (attempt_count > 0),
  expires_at timestamptz not null,
  last_request_id uuid not null,
  primary key (
    policy_id,
    key_digest,
    bucket_started_at
  ),
  check (expires_at > bucket_started_at)
);

create index auth_rate_limit_buckets_expires_at_idx
  on private.auth_rate_limit_buckets (expires_at);

alter table private.auth_rate_limit_buckets
  enable row level security;
alter table private.auth_rate_limit_buckets
  force row level security;

revoke all on table private.auth_rate_limit_buckets
  from public, anon, authenticated, service_role;

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
  if p_policy_id is null
     or p_key_digest is null
     or pg_catalog.octet_length(p_key_digest) <> 32
     or p_request_id is null then
    raise exception 'invalid rate limit input'
      using errcode = '22023';
  end if;

  begin
    v_policy := p_policy_id::private.auth_rate_limit_policy;
  exception when invalid_text_representation then
    raise exception 'invalid rate limit policy'
      using errcode = '22023';
  end;

  select policy_limit, window_seconds
  into v_limit, v_window_seconds
  from (
    values
      ('login_targeted'::private.auth_rate_limit_policy, 5, 900),
      ('login_ip'::private.auth_rate_limit_policy, 30, 900),
      ('forgot_password_targeted'::private.auth_rate_limit_policy, 3, 3600),
      ('forgot_password_ip'::private.auth_rate_limit_policy, 10, 3600),
      ('recovery_callback_ip'::private.auth_rate_limit_policy, 10, 900),
      ('reset_password_targeted'::private.auth_rate_limit_policy, 5, 1800),
      ('reset_password_ip'::private.auth_rate_limit_policy, 15, 1800)
  ) as policies(policy_id, policy_limit, window_seconds)
  where policy_id = v_policy;

  if v_limit is null or v_window_seconds is null then
    raise exception 'unsupported rate limit policy'
      using errcode = '22023';
  end if;

  v_bucket_started_at :=
    pg_catalog.to_timestamp(
      pg_catalog.floor(
        pg_catalog.extract(epoch from v_now) /
        v_window_seconds
      ) * v_window_seconds
    );
  v_expires_at :=
    v_bucket_started_at +
    pg_catalog.make_interval(secs => v_window_seconds);

  insert into private.auth_rate_limit_buckets (
    policy_id,
    key_digest,
    bucket_started_at,
    attempt_count,
    expires_at,
    last_request_id
  )
  values (
    v_policy,
    p_key_digest,
    v_bucket_started_at,
    1,
    v_expires_at,
    p_request_id
  )
  on conflict (
    policy_id,
    key_digest,
    bucket_started_at
  )
  do update set
    attempt_count =
      private.auth_rate_limit_buckets.attempt_count + 1,
    expires_at = excluded.expires_at,
    last_request_id = excluded.last_request_id
  returning attempt_count into v_count;

  return query
  select
    v_count <= v_limit,
    pg_catalog.greatest(v_limit - v_count, 0),
    v_expires_at,
    pg_catalog.greatest(
      1,
      pg_catalog.least(
        v_window_seconds,
        pg_catalog.ceil(
          pg_catalog.extract(
            epoch from (v_expires_at - v_now)
          )
        )::integer
      )
    );
end;
$function$;

create or replace function public.reset_auth_rate_limit(
  p_policy_id text,
  p_key_digest bytea
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_policy private.auth_rate_limit_policy;
begin
  if p_key_digest is null
     or pg_catalog.octet_length(p_key_digest) <> 32 then
    raise exception 'invalid rate limit key'
      using errcode = '22023';
  end if;

  begin
    v_policy := p_policy_id::private.auth_rate_limit_policy;
  exception when invalid_text_representation then
    raise exception 'invalid rate limit policy'
      using errcode = '22023';
  end;

  delete from private.auth_rate_limit_buckets
  where policy_id = v_policy
    and key_digest = p_key_digest;

  return true;
end;
$function$;

create or replace function private.purge_expired_auth_rate_limits(
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

  with expired as (
    select ctid
    from private.auth_rate_limit_buckets
    where expires_at < pg_catalog.clock_timestamp()
    order by expires_at
    limit p_batch_size
    for update skip locked
  )
  delete from private.auth_rate_limit_buckets buckets
  using expired
  where buckets.ctid = expired.ctid;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke all on function public.consume_auth_rate_limit(text, bytea, uuid)
  from public, anon, authenticated;
revoke all on function public.reset_auth_rate_limit(text, bytea)
  from public, anon, authenticated;
revoke all on function private.purge_expired_auth_rate_limits(integer)
  from public, anon, authenticated, service_role;

grant execute on function public.consume_auth_rate_limit(text, bytea, uuid)
  to service_role;
grant execute on function public.reset_auth_rate_limit(text, bytea)
  to service_role;

comment on table private.auth_rate_limit_buckets is
  'Privacy-minimized fixed-window authentication counters. Raw email and IP values are prohibited.';
comment on function private.purge_expired_auth_rate_limits(integer) is
  'Restricted bounded cleanup. Schedule only through a separately reviewed trusted database operation.';

commit;
