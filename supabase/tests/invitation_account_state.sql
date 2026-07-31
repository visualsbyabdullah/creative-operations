\set ON_ERROR_STOP on

begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(7);

select extensions.has_function(
  'public',
  'get_own_invitation_account_state_v1',
  array[]::text[],
  'the narrow invitation account-state function exists'
);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_own_invitation_account_state_v1()',
    'execute'
  ),
  'authenticated users may read only their own invitation account state'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.get_own_invitation_account_state_v1()',
    'execute'
  ),
  'anonymous users cannot execute the invitation account-state function'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    'service_role',
    'public.get_own_invitation_account_state_v1()',
    'execute'
  ),
  'service role has no invitation account-state execution grant'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '52000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'active-invite@state.test', '',
  pg_catalog.clock_timestamp(), '{}', '{"full_name":"Active Invite"}',
  pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
),
(
  '52000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'inactive-invite@state.test', '',
  pg_catalog.clock_timestamp(), '{}', '{"full_name":"Inactive Invite"}',
  pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
),
(
  '52000000-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'missing-invite@state.test', '',
  pg_catalog.clock_timestamp(), '{}', '{"full_name":"Missing Invite"}',
  pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
);

update public.profiles
set is_active = true
where id = '52000000-0000-4000-8000-000000000001';

delete from public.profiles
where id = '52000000-0000-4000-8000-000000000003';

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '52000000-0000-4000-8000-000000000001',
  true
);
select extensions.is(
  public.get_own_invitation_account_state_v1(),
  'active',
  'an active invited profile resolves to active'
);

select set_config(
  'request.jwt.claim.sub',
  '52000000-0000-4000-8000-000000000002',
  true
);
select extensions.is(
  public.get_own_invitation_account_state_v1(),
  'inactive',
  'an inactive invited profile resolves to inactive without profile SELECT'
);

select set_config(
  'request.jwt.claim.sub',
  '52000000-0000-4000-8000-000000000003',
  true
);
select extensions.is(
  public.get_own_invitation_account_state_v1(),
  'missing',
  'a missing invited profile fails closed'
);

select * from extensions.finish();
rollback;
