\set ON_ERROR_STOP on

begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(242);

select extensions.has_table(
  'public',
  table_name,
  pg_catalog.format('public.%s exists', table_name)
)
from (
  values
    ('workspaces'),
    ('profiles'),
    ('notification_preferences'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as expected_tables(table_name);

select extensions.has_column(
  'public',
  table_name,
  column_name,
  pg_catalog.format(
    'public.%s has column %s',
    table_name,
    column_name
  )
)
from (
  values
    ('workspaces', 'id'),
    ('profiles', 'id'),
    ('profiles', 'workspace_id'),
    ('notification_preferences', 'profile_id'),
    ('brands', 'id'),
    ('brands', 'workspace_id'),
    ('brand_members', 'brand_id'),
    ('brand_members', 'profile_id'),
    ('brand_platforms', 'brand_id'),
    ('brand_schedule_slots', 'id'),
    ('brand_schedule_slots', 'brand_id'),
    ('brand_schedule_slot_platforms', 'schedule_slot_id'),
    ('tasks', 'id'),
    ('tasks', 'workspace_id'),
    ('tasks', 'brand_id'),
    ('task_assignees', 'task_id'),
    ('task_assignees', 'profile_id'),
    ('task_platforms', 'task_id'),
    ('task_status_events', 'id'),
    ('task_status_events', 'task_id'),
    ('submissions', 'id'),
    ('submissions', 'workspace_id'),
    ('submissions', 'task_id'),
    ('submission_reviews', 'id'),
    ('submission_reviews', 'submission_id'),
    ('notifications', 'id'),
    ('notifications', 'workspace_id'),
    ('notifications', 'recipient_id'),
    ('attachments', 'id'),
    ('attachments', 'workspace_id'),
    ('attachments', 'owner_id')
) as expected_columns(table_name, column_name);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    join pg_catalog.pg_class class
      on class.oid = constraint_record.conrelid
    join pg_catalog.pg_namespace namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = table_name
      and constraint_record.contype = 'p'
  ),
  pg_catalog.format('public.%s has a primary key', table_name)
)
from (
  values
    ('workspaces'),
    ('profiles'),
    ('notification_preferences'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as primary_key_tables(table_name);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid = 'public.profiles'::regclass
      and constraint_record.confrelid = 'public.workspaces'::regclass
      and constraint_record.contype = 'f'
      and constraint_record.conkey = array[
        (
          select attribute.attnum
          from pg_catalog.pg_attribute attribute
          where attribute.attrelid = 'public.profiles'::regclass
            and attribute.attname = 'workspace_id'
        )
      ]::smallint[]
  ),
  'profiles.workspace_id references workspaces'
);

select extensions.has_type(
  'public',
  type_name,
  pg_catalog.format('public.%s enum exists', type_name)
)
from (
  values
    ('app_role'),
    ('department_type'),
    ('brand_status'),
    ('task_status'),
    ('task_priority'),
    ('submission_status'),
    ('submission_type'),
    ('review_decision'),
    ('platform_type')
) as expected_types(type_name);

select extensions.has_index(
  'public',
  table_name,
  index_name,
  pg_catalog.format('%s exists', index_name)
)
from (
  values
    ('workspaces', 'workspaces_normalized_name_uidx'),
    ('profiles', 'profiles_workspace_email_uidx'),
    ('brands', 'brands_workspace_name_uidx'),
    ('tasks', 'tasks_workspace_status_deadline_idx'),
    ('submissions', 'submissions_task_submitter_revision_uidx'),
    ('attachments', 'attachments_bucket_object_path_uidx')
) as expected_indexes(table_name, index_name);

select extensions.ok(
  class.relrowsecurity,
  pg_catalog.format('RLS is enabled on public.%s', table_name)
)
from (
  values
    ('workspaces'),
    ('profiles'),
    ('notification_preferences'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as rls_tables(table_name)
join pg_catalog.pg_class class
  on class.relname = table_name
join pg_catalog.pg_namespace namespace
  on namespace.oid = class.relnamespace
 and namespace.nspname = 'public';

select extensions.ok(
  not pg_catalog.has_table_privilege(
    role_name,
    pg_catalog.format('public.%I', table_name),
    privilege_name
  ),
  pg_catalog.format(
    '%s has no %s on public.%s',
    role_name,
    privilege_name,
    table_name
  )
)
from (
  values ('anon')
) as application_roles(role_name)
cross join (
  values
    ('workspaces'),
    ('profiles'),
    ('notification_preferences'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as protected_tables(table_name)
cross join (
  values ('select'), ('insert'), ('update'), ('delete')
) as privileges(privilege_name);

select extensions.ok(
  pg_catalog.has_table_privilege(
    'authenticated',
    pg_catalog.format('public.%I', table_name),
    'select'
  ),
  pg_catalog.format(
    'authenticated has SELECT on public.%s for RLS-filtered access',
    table_name
  )
)
from (
  values
    ('workspaces'),
    ('notification_preferences'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as readable_tables(table_name);

select extensions.ok(
  (
    select pg_catalog.bool_and(
      pg_catalog.has_column_privilege(
        'authenticated',
        'public.profiles',
        column_name,
        'select'
      )
    )
    from (
      values
        ('id'), ('email'), ('full_name'), ('role'), ('department'),
        ('job_title'), ('phone'), ('timezone'), ('bio'), ('avatar_url'),
        ('is_active'), ('manager_id'), ('created_at'), ('updated_at')
    ) as readable_profile_columns(column_name)
  ),
  'authenticated has SELECT only through the approved profile projection'
);

select extensions.ok(
  pg_catalog.has_table_privilege(
    'authenticated',
    'public.notification_preferences',
    privilege_name
  ),
  pg_catalog.format(
    'authenticated has %s on own RLS-filtered notification preferences',
    privilege_name
  )
)
from (
  values ('insert'), ('update'), ('delete')
) as preference_privileges(privilege_name);

select extensions.ok(
  not pg_catalog.has_table_privilege(
    'authenticated',
    pg_catalog.format('public.%I', table_name),
    privilege_name
  ),
  pg_catalog.format(
    'authenticated has no direct %s on public.%s',
    privilege_name,
    table_name
  )
)
from (
  values
    ('workspaces'),
    ('profiles'),
    ('brands'),
    ('brand_members'),
    ('brand_platforms'),
    ('brand_schedule_slots'),
    ('brand_schedule_slot_platforms'),
    ('tasks'),
    ('task_assignees'),
    ('task_platforms'),
    ('task_status_events'),
    ('submissions'),
    ('submission_reviews'),
    ('notifications'),
    ('attachments')
) as rpc_write_tables(table_name)
cross join (
  values ('insert'), ('update'), ('delete')
) as privileges(privilege_name);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_policy policy
    where policy.polrelid = pg_catalog.format(
      'public.%I',
      table_name
    )::regclass
  ),
  expected_count,
  pg_catalog.format(
    'public.%s has the approved Phase 4 RLS policy count',
    table_name
  )
)
from (
  values
    ('workspaces', 1),
    ('profiles', 1),
    ('notification_preferences', 4),
    ('brands', 1),
    ('brand_members', 1),
    ('brand_platforms', 1),
    ('brand_schedule_slots', 1),
    ('brand_schedule_slot_platforms', 1),
    ('tasks', 1),
    ('task_assignees', 1),
    ('task_platforms', 1),
    ('task_status_events', 1),
    ('submissions', 1),
    ('submission_reviews', 1),
    ('notifications', 1),
    ('attachments', 1)
) as policy_tables(table_name, expected_count);

select extensions.ok(
  exists (
    select 1
    from public.workspaces
    where id = '00000000-0000-4000-8000-000000000001'
  ),
  'default workspace exists'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    role_name,
    'public.provision_profile_for_new_user()',
    'execute'
  ),
  pg_catalog.format(
    '%s cannot execute profile provisioning',
    role_name
  )
)
from (
  values ('anon'), ('authenticated')
) as application_roles(role_name);

select * from extensions.finish();
rollback;
