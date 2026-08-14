begin;

select plan(20);

select has_function(
  'public', 'update_brand_v2',
  array['uuid','text','text','text','text','text','brand_status','timestamp with time zone']
);
select has_function(
  'public', 'set_brand_archived_v2',
  array['uuid','boolean','timestamp with time zone']
);
select function_privs_are(
  'public', 'update_brand_v2',
  array['uuid','text','text','text','text','text','brand_status','timestamp with time zone'],
  'authenticated', array['EXECUTE']
);
select function_privs_are(
  'public', 'set_brand_archived_v2',
  array['uuid','boolean','timestamp with time zone'],
  'authenticated', array['EXECUTE']
);
select function_privs_are(
  'public', 'update_brand_v2',
  array['uuid','text','text','text','text','text','brand_status','timestamp with time zone'],
  'anon', array[]::text[]
);
select function_privs_are(
  'public', 'set_brand_archived_v2',
  array['uuid','boolean','timestamp with time zone'],
  'anon', array[]::text[]
);
select function_privs_are(
  'public', 'update_brand_v2',
  array['uuid','text','text','text','text','text','brand_status','timestamp with time zone'],
  'service_role', array[]::text[]
);
select function_privs_are(
  'public', 'set_brand_archived_v2',
  array['uuid','boolean','timestamp with time zone'],
  'service_role', array[]::text[]
);
select volatility_is(
  'public', 'update_brand_v2',
  array['uuid','text','text','text','text','text','brand_status','timestamp with time zone'],
  'v'
);
select volatility_is(
  'public', 'set_brand_archived_v2',
  array['uuid','boolean','timestamp with time zone'],
  'v'
);
select is(
  (
    select p.proconfig
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_brand_v2'
  ),
  array['search_path=pg_catalog, auth, public, private','row_security=off'],
  'brand update uses a fixed safe search path'
);
select extensions.has_index(
  'public',
  'brands',
  'brands_workspace_normalized_name_key',
  'normalized brand names are unique per workspace'
);
select has_function(
  'public', 'get_brand_schedule_slots_v1', array['uuid']
);
select has_function(
  'public', 'create_brand_schedule_slot_v1',
  array['uuid','smallint','department_type','text','time without time zone','platform_type[]']
);
select function_privs_are(
  'public', 'get_brand_schedule_slots_v1', array['uuid'],
  'authenticated', array['EXECUTE']
);
select function_privs_are(
  'public', 'create_brand_schedule_slot_v1',
  array['uuid','smallint','department_type','text','time without time zone','platform_type[]'],
  'authenticated', array['EXECUTE']
);
select function_privs_are(
  'public', 'get_brand_schedule_slots_v1', array['uuid'],
  'anon', array[]::text[]
);
select function_privs_are(
  'public', 'create_brand_schedule_slot_v1',
  array['uuid','smallint','department_type','text','time without time zone','platform_type[]'],
  'anon', array[]::text[]
);
select volatility_is(
  'public', 'get_brand_schedule_slots_v1', array['uuid'], 's'
);
select volatility_is(
  'public', 'create_brand_schedule_slot_v1',
  array['uuid','smallint','department_type','text','time without time zone','platform_type[]'],
  'v'
);

select * from finish();
rollback;
