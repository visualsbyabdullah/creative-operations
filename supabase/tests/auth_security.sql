\set ON_ERROR_STOP on

begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(52);

select extensions.has_schema(
  'private',
  'private schema exists'
);

select extensions.ok(
  not pg_catalog.has_schema_privilege('anon', 'private', 'usage'),
  'anon has no USAGE on private schema'
);

select extensions.ok(
  not pg_catalog.has_schema_privilege(
    'authenticated',
    'private',
    'usage'
  ),
  'authenticated has no USAGE on private schema'
);

select extensions.ok(
  not pg_catalog.has_table_privilege(role_name, table_name, privilege_name),
  pg_catalog.format(
    '%s has no %s on %s',
    role_name,
    privilege_name,
    table_name
  )
)
from (
  values
    ('anon', 'private.auth_rate_limit_buckets'),
    ('authenticated', 'private.auth_rate_limit_buckets'),
    ('anon', 'private.auth_audit_events'),
    ('authenticated', 'private.auth_audit_events')
) as protected_tables(role_name, table_name)
cross join (
  values ('select'), ('insert'), ('update'), ('delete')
) as privileges(privilege_name);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    role_name,
    function_signature,
    'execute'
  ),
  pg_catalog.format(
    '%s cannot execute %s',
    role_name,
    function_signature
  )
)
from (
  values ('anon'), ('authenticated')
) as roles(role_name)
cross join (
  values
    ('public.consume_auth_rate_limit(text,bytea,uuid)'),
    ('public.reset_auth_rate_limit(text,bytea)'),
    (
      'public.append_auth_audit_event(uuid,text,text,uuid,uuid,uuid,uuid,bytea,bytea,text,jsonb)'
    ),
    ('private.purge_expired_auth_rate_limits(integer)'),
    ('private.auth_audit_metadata_is_valid(jsonb)'),
    ('private.reject_auth_audit_mutation()'),
    ('private.purge_expired_auth_audit_events(integer)')
) as administrative_functions(function_signature);

select extensions.ok(
  pg_catalog.to_regprocedure(function_signature) is not null,
  pg_catalog.format('%s exists', function_signature)
)
from (
  values
    ('public.consume_auth_rate_limit(text,bytea,uuid)'),
    ('public.reset_auth_rate_limit(text,bytea)'),
    (
      'public.append_auth_audit_event(uuid,text,text,uuid,uuid,uuid,uuid,bytea,bytea,text,jsonb)'
    )
) as required_functions(function_signature);

select extensions.ok(
  procedure.prosecdef,
  pg_catalog.format('%s is SECURITY DEFINER', function_signature)
)
from (
  values
    ('public.consume_auth_rate_limit(text,bytea,uuid)'),
    ('public.reset_auth_rate_limit(text,bytea)'),
    (
      'public.append_auth_audit_event(uuid,text,text,uuid,uuid,uuid,uuid,bytea,bytea,text,jsonb)'
    )
) as approved_definers(function_signature)
join pg_catalog.pg_proc procedure
  on procedure.oid = pg_catalog.to_regprocedure(function_signature);

create temporary table limiter_results (
  attempt integer primary key,
  allowed boolean not null,
  remaining integer not null
) on commit drop;

do $setup$
declare
  v_key bytea := pg_catalog.decode(
    pg_catalog.repeat('ab', 32),
    'hex'
  );
  v_request uuid :=
    '00000000-0000-4000-8000-000000000001';
  v_allowed boolean;
  v_remaining integer;
begin
  delete from private.auth_rate_limit_buckets
  where policy_id = 'login_targeted'
    and key_digest = v_key;

  for attempt in 1..6 loop
    select allowed, remaining
    into v_allowed, v_remaining
    from public.consume_auth_rate_limit(
      'login_targeted',
      v_key,
      v_request
    );

    insert into limiter_results (attempt, allowed, remaining)
    values (attempt, v_allowed, v_remaining);
  end loop;
end
$setup$;

select extensions.is(
  allowed,
  true,
  pg_catalog.format(
    'login_targeted allows attempt %s',
    attempt
  )
)
from limiter_results
where attempt between 1 and 5
order by attempt;

select extensions.is(
  remaining,
  5 - attempt,
  pg_catalog.format(
    'login_targeted remaining count is exact after attempt %s',
    attempt
  )
)
from limiter_results
where attempt between 1 and 5
order by attempt;

select extensions.is(
  (select allowed from limiter_results where attempt = 6),
  false,
  'login_targeted denies attempt 6'
);

select extensions.is(
  public.reset_auth_rate_limit(
    'login_targeted',
    pg_catalog.decode(pg_catalog.repeat('ab', 32), 'hex')
  ),
  true,
  'approved reset function clears the limiter bucket'
);

select extensions.throws_ok(
  $sql$
    select *
    from public.consume_auth_rate_limit(
      'attacker_selected',
      pg_catalog.decode(pg_catalog.repeat('cd', 32), 'hex'),
      '00000000-0000-4000-8000-000000000002'
    )
  $sql$,
  '22023',
  'invalid rate limit policy',
  'arbitrary limiter policy is rejected'
);

select * from extensions.finish();
rollback;
