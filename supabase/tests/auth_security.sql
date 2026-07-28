\set ON_ERROR_STOP on

begin;

do $test$
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

  for attempt in 1..5 loop
    select allowed, remaining
    into v_allowed, v_remaining
    from public.consume_auth_rate_limit(
      'login_targeted',
      v_key,
      v_request
    );
    assert v_allowed,
      'login_targeted must allow attempts 1 through 5';
    assert v_remaining = 5 - attempt,
      'remaining count must be exact';
  end loop;

  select allowed
  into v_allowed
  from public.consume_auth_rate_limit(
    'login_targeted',
    v_key,
    v_request
  );
  assert not v_allowed,
    'login_targeted must deny attempt 6';

  perform public.reset_auth_rate_limit(
    'login_targeted',
    v_key
  );
end
$test$;

set local role anon;
do $test$
begin
  assert not pg_catalog.has_table_privilege(
    'anon',
    'private.auth_rate_limit_buckets',
    'select'
  );
  assert not pg_catalog.has_table_privilege(
    'anon',
    'private.auth_audit_events',
    'select'
  );
  assert not pg_catalog.has_function_privilege(
    'anon',
    'public.consume_auth_rate_limit(text,bytea,uuid)',
    'execute'
  );
  assert not pg_catalog.has_function_privilege(
    'anon',
    'public.append_auth_audit_event(uuid,text,text,uuid,uuid,uuid,uuid,bytea,bytea,text,jsonb)',
    'execute'
  );
end
$test$;
reset role;

set local role authenticated;
do $test$
begin
  assert not pg_catalog.has_table_privilege(
    'authenticated',
    'private.auth_audit_events',
    'insert,update,delete'
  );
  assert not pg_catalog.has_function_privilege(
    'authenticated',
    'public.consume_auth_rate_limit(text,bytea,uuid)',
    'execute'
  );
end
$test$;
reset role;

do $test$
begin
  begin
    perform public.consume_auth_rate_limit(
      'attacker_selected',
      pg_catalog.decode(pg_catalog.repeat('cd', 32), 'hex'),
      '00000000-0000-4000-8000-000000000002'
    );
    assert false, 'arbitrary limiter policy must be rejected';
  exception when invalid_parameter_value then
    null;
  end;
end
$test$;

rollback;
