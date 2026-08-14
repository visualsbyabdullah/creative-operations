\set ON_ERROR_STOP on

begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(23);

select extensions.has_table(
  'public', 'departments',
  'the departments table exists'
);

select extensions.has_function(
  'public', 'list_departments', array[]::text[],
  'the department list function exists'
);
select extensions.has_function(
  'public', 'create_department', array['text','text','text','text'],
  'the department create function exists'
);
select extensions.has_function(
  'public', 'update_department',
  array['uuid','text','text','text','timestamp with time zone'],
  'the department update function exists'
);
select extensions.has_function(
  'public', 'set_department_archived', array['uuid','boolean','timestamp with time zone'],
  'the department archive function exists'
);

select extensions.function_privs_are(
  'public', 'list_departments', array[]::text[],
  'authenticated', array['EXECUTE']
);
select extensions.function_privs_are(
  'public', 'create_department', array['text','text','text','text'],
  'authenticated', array['EXECUTE']
);
select extensions.function_privs_are(
  'public', 'update_department',
  array['uuid','text','text','text','timestamp with time zone'],
  'authenticated', array['EXECUTE']
);
select extensions.function_privs_are(
  'public', 'set_department_archived', array['uuid','boolean','timestamp with time zone'],
  'authenticated', array['EXECUTE']
);

select extensions.function_privs_are(
  'public', 'list_departments', array[]::text[],
  'anon', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'create_department', array['text','text','text','text'],
  'anon', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'update_department',
  array['uuid','text','text','text','timestamp with time zone'],
  'anon', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'set_department_archived', array['uuid','boolean','timestamp with time zone'],
  'anon', array[]::text[]
);

select extensions.function_privs_are(
  'public', 'list_departments', array[]::text[],
  'service_role', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'create_department', array['text','text','text','text'],
  'service_role', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'update_department',
  array['uuid','text','text','text','timestamp with time zone'],
  'service_role', array[]::text[]
);
select extensions.function_privs_are(
  'public', 'set_department_archived', array['uuid','boolean','timestamp with time zone'],
  'service_role', array[]::text[]
);

select extensions.volatility_is(
  'public', 'list_departments', array[]::text[], 'v'
);
select extensions.volatility_is(
  'public', 'create_department', array['text','text','text','text'], 'v'
);
select extensions.volatility_is(
  'public', 'update_department',
  array['uuid','text','text','text','timestamp with time zone'], 'v'
);
select extensions.volatility_is(
  'public', 'set_department_archived', array['uuid','boolean','timestamp with time zone'], 'v'
);

select extensions.has_index(
  'public', 'departments', 'departments_workspace_normalized_name_key',
  'normalized department names are unique per workspace'
);
select extensions.has_index(
  'public', 'departments', 'departments_workspace_key_idx',
  'department keys are unique per workspace'
);

select * from extensions.finish();
rollback;
