\set ON_ERROR_STOP on

begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(63);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
  ),
  19,
  'the public schema has exactly the approved 19 Phase 4B policies'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = policy_table
      and policyname = policy_name
  ),
  pg_catalog.format('%s.%s exists', policy_table, policy_name)
)
from (
  values
    ('workspaces', 'workspaces_select_own'),
    ('profiles', 'profiles_select_self_or_management'),
    ('notification_preferences', 'notification_preferences_select_own'),
    ('notification_preferences', 'notification_preferences_insert_own'),
    ('notification_preferences', 'notification_preferences_update_own'),
    ('notification_preferences', 'notification_preferences_delete_own'),
    ('brands', 'brands_select_authorized'),
    ('brand_members', 'brand_members_select_authorized'),
    ('brand_platforms', 'brand_platforms_select_authorized'),
    ('brand_schedule_slots', 'brand_schedule_slots_select_management'),
    ('brand_schedule_slot_platforms', 'brand_schedule_slot_platforms_select_management'),
    ('tasks', 'tasks_select_authorized'),
    ('task_assignees', 'task_assignees_select_authorized'),
    ('task_platforms', 'task_platforms_select_authorized'),
    ('task_status_events', 'task_status_events_select_authorized'),
    ('submissions', 'submissions_select_authorized'),
    ('submission_reviews', 'submission_reviews_select_authorized'),
    ('notifications', 'notifications_select_own'),
    ('attachments', 'attachments_select_authorized')
) as approved_policies(policy_table, policy_name);

select extensions.ok(
  not pg_catalog.has_schema_privilege(role_name, 'private', 'usage'),
  pg_catalog.format('%s cannot use the private schema', role_name)
)
from (values ('anon'), ('authenticated')) as application_roles(role_name);

select extensions.ok(
  not pg_catalog.has_table_privilege(
    role_name,
    'private.business_audit_events',
    privilege_name
  ),
  pg_catalog.format(
    '%s has no %s on the private business audit',
    role_name,
    privilege_name
  )
)
from (values ('anon'), ('authenticated')) as application_roles(role_name)
cross join (values ('select'), ('insert'), ('update'), ('delete')) as privileges(privilege_name);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    role_name,
    function_signature,
    'execute'
  ),
  pg_catalog.format('%s cannot execute %s', role_name, function_signature)
)
from (
  values
    ('anon', 'public.create_task(uuid,text,department_type,text,date,timestamp with time zone,task_priority,text,text)'),
    ('anon', 'public.publish_submission(uuid,text)'),
    ('authenticated', 'private.append_business_audit_event(private.business_audit_event_type,uuid,uuid,text,uuid,jsonb)')
) as denied_functions(role_name, function_signature);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    function_signature,
    'execute'
  ),
  pg_catalog.format('authenticated can execute approved RPC %s', function_signature)
)
from (
  values
    ('public.update_own_profile(text,text,text,text)'),
    ('public.manage_profile(uuid,text,text,text,text,department_type,app_role,boolean,uuid)'),
    ('public.create_brand(text,text,text,text,text)'),
    ('public.create_task(uuid,text,department_type,text,date,timestamp with time zone,task_priority,text,text)'),
    ('public.transition_task(uuid,task_status,task_status,text)'),
    ('public.create_submission(uuid,submission_type,text,text,text)'),
    ('public.review_submission(uuid,review_decision,text)'),
    ('public.publish_submission(uuid,text)')
) as approved_functions(function_signature);

select extensions.ok(
  (
    select class.relrowsecurity and class.relforcerowsecurity
    from pg_catalog.pg_class class
    join pg_catalog.pg_namespace namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'private'
      and class.relname = 'business_audit_events'
  ),
  'private.business_audit_events has forced RLS'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'private.business_audit_events'::regclass
      and tgname = 'business_audit_events_append_only'
      and not tgisinternal
  ),
  'business audit immutability trigger exists'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.task_status_events'::regclass
      and tgname = 'task_status_events_immutable'
      and not tgisinternal
  ),
  'task status history immutability trigger exists'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.submission_reviews'::regclass
      and tgname = 'submission_reviews_immutable'
      and not tgisinternal
  ),
  'submission review history immutability trigger exists'
);

insert into public.workspaces (id, name)
values ('20000000-0000-4000-8000-000000000001', 'RLS Isolation Workspace');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'manager@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"manager"}', '{"full_name":"Manager One"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'worker@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"graphic_designer"}', '{"full_name":"Worker One"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'other@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"manager"}', '{"full_name":"Other Manager"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'inactive@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"manager"}', '{"full_name":"Inactive Manager"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'hr@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"hr"}', '{"full_name":"HR One"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'video@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"video_editor"}', '{"full_name":"Video One"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'missing@rls.test', '',
    pg_catalog.clock_timestamp(), '{"role":"graphic_designer"}', '{"full_name":"Missing Profile"}',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );

update public.profiles
set is_active = true
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006'
);

delete from public.profiles
where id = '10000000-0000-4000-8000-000000000007';

update public.profiles
set workspace_id = '20000000-0000-4000-8000-000000000001',
    is_active = true
where id = '10000000-0000-4000-8000-000000000003';

insert into public.brands (id, workspace_id, name, industry)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Assigned Brand', 'Testing'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Other Brand', 'Testing'
  );

insert into public.tasks (
  id, workspace_id, brand_id, title, department, content_type,
  status, created_by, updated_by
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Assigned Task', 'graphic_design', 'Post', 'assigned',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    'Other Task', 'graphic_design', 'Post', 'draft',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003'
  );

insert into public.task_assignees (
  task_id, profile_id, assigned_by, workspace_id
)
values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.workspaces),
  1,
  'management sees only its own workspace'
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.profiles),
  5,
  'management sees profiles only in its workspace, including inactive records'
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.brands),
  1,
  'management sees brands only in its workspace'
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.tasks),
  1,
  'management sees tasks only in its workspace'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.tasks),
  1,
  'employee sees an assigned task'
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.brands),
  1,
  'employee sees a brand only through an assigned task'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.tasks),
  1,
  'other-workspace management cannot see the first workspace task'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000004',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.workspaces),
  0,
  'inactive users see no workspace'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000005',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.tasks),
  1,
  'HR has management-equivalent same-workspace task visibility'
);
select extensions.throws_ok(
  $sql$
    select public.manage_profile(
      '10000000-0000-4000-8000-000000000001',
      'Manager One', null, null, null, null, 'hr', true, null
    )
  $sql$,
  '23514',
  'last active manager is protected',
  'HR cannot demote the last active Manager'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000006',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.tasks),
  0,
  'unassigned video editor sees no tasks'
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.brands),
  0,
  'unassigned video editor sees no brands'
);
select extensions.throws_ok(
  $sql$
    select public.create_brand('Forbidden Brand', 'Testing', null, null, null)
  $sql$,
  '42501',
  'not authorized',
  'employee cannot execute a management brand operation'
);
select extensions.throws_ok(
  $sql$
    select public.set_task_assignees(
      '40000000-0000-4000-8000-000000000001',
      array['10000000-0000-4000-8000-000000000006'::uuid]
    )
  $sql$,
  '42501',
  'not authorized',
  'employee cannot execute a management assignment operation'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000007',
  true
);
select extensions.is(
  (select pg_catalog.count(*)::integer from public.workspaces),
  0,
  'authenticated subject with no profile sees no workspace'
);
select extensions.throws_ok(
  $sql$
    select public.update_own_profile('Missing', null, null, 'UTC')
  $sql$,
  '42501',
  'not authorized',
  'authenticated subject with no profile cannot use profile RPCs'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
select extensions.ok(
  public.update_own_profile(
    'Worker Updated', 'https://example.test/avatar.png', '+1234567', 'UTC'
  ),
  'employee can update approved own-profile fields'
);
select extensions.is(
  (
    select full_name
    from public.profiles
    where id = '10000000-0000-4000-8000-000000000002'
  ),
  'Worker Updated',
  'safe own-profile update is visible without exposing sensitive mutation'
);
reset role;

select * from extensions.finish();

rollback;
