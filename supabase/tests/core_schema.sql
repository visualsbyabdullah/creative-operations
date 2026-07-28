\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_tables text[] := array[
    'workspaces',
    'profiles',
    'notification_preferences',
    'brands',
    'brand_members',
    'brand_platforms',
    'brand_schedule_slots',
    'brand_schedule_slot_platforms',
    'tasks',
    'task_assignees',
    'task_platforms',
    'task_status_events',
    'submissions',
    'submission_reviews',
    'notifications',
    'attachments'
  ];
  v_table text;
begin
  foreach v_table in array v_tables loop
    assert pg_catalog.to_regclass('public.' || v_table) is not null,
      pg_catalog.format('required table public.%s is missing', v_table);

    assert (
      select class.relrowsecurity
      from pg_catalog.pg_class class
      join pg_catalog.pg_namespace namespace
        on namespace.oid = class.relnamespace
      where namespace.nspname = 'public'
        and class.relname = v_table
    ), pg_catalog.format('RLS is not enabled on public.%s', v_table);
  end loop;
end
$test$;

do $test$
begin
  assert exists (
    select 1
    from public.workspaces
    where id = '00000000-0000-4000-8000-000000000001'
  ), 'default workspace must exist';

  assert not pg_catalog.has_function_privilege(
    'anon',
    'public.provision_profile_for_new_user()',
    'execute'
  ), 'anon must not execute profile provisioning';

  assert not pg_catalog.has_function_privilege(
    'authenticated',
    'public.provision_profile_for_new_user()',
    'execute'
  ), 'authenticated must not execute profile provisioning';
end
$test$;

set local role anon;
do $test$
declare
  v_count bigint;
begin
  select pg_catalog.count(*) into v_count
  from public.workspaces;
  assert v_count = 0,
    'deny-by-default RLS must hide workspaces from anon';
end
$test$;
reset role;

set local role authenticated;
do $test$
declare
  v_count bigint;
begin
  select pg_catalog.count(*) into v_count
  from public.brands;
  assert v_count = 0,
    'deny-by-default RLS must hide brands from authenticated';
end
$test$;
reset role;

rollback;
