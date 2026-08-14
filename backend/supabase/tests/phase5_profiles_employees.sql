\set ON_ERROR_STOP on

begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(28);

select extensions.ok(
  pg_catalog.has_function_privilege('authenticated',
    'public.get_employee_directory(text,app_role[],department_type[],boolean,text,text,integer,uuid)',
    'execute'),
  'authenticated may execute the protected directory'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon',
    'public.get_employee_directory(text,app_role[],department_type[],boolean,text,text,integer,uuid)',
    'execute'),
  'anon cannot execute the protected directory'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated',
    'private.employee_invitation_intents', 'select'),
  'invitation intents are not directly readable'
);
select extensions.ok(
  (select relrowsecurity and relforcerowsecurity from pg_catalog.pg_class
   where oid='private.employee_invitation_intents'::regclass),
  'invitation intents use forced RLS'
);
select extensions.ok(
  pg_catalog.has_function_privilege('authenticated',
    'public.get_employee_directory_v2(text,app_role[],department_type[],boolean,text,text,integer,text,boolean,uuid)',
    'execute'),
  'authenticated may execute the versioned keyset directory'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon',
    'public.get_employee_directory_v2(text,app_role[],department_type[],boolean,text,text,integer,text,boolean,uuid)',
    'execute'),
  'anon cannot execute the versioned keyset directory'
);
select extensions.ok(
  pg_catalog.has_function_privilege('service_role',
    'public.consume_auth_rate_limit(text,bytea,uuid)', 'execute'),
  'service role retains narrow limiter execution'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('authenticated',
    'public.consume_auth_rate_limit(text,bytea,uuid)', 'execute'),
  'authenticated cannot consume limiter buckets directly'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
('51000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','manager@phase5.test','',clock_timestamp(),
 '{"role":"manager"}','{"full_name":"Manager"}',clock_timestamp(),clock_timestamp()),
('51000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','hr@phase5.test','',clock_timestamp(),
 '{"role":"hr"}','{"full_name":"HR"}',clock_timestamp(),clock_timestamp()),
('51000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','worker@phase5.test','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Worker"}',clock_timestamp(),clock_timestamp()),
('51000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','invitee@phase5.test','',clock_timestamp(),
 '{}','{"full_name":"Invitee"}',clock_timestamp(),clock_timestamp());

update public.profiles set is_active=true
where id in (
 '51000000-0000-4000-8000-000000000001',
 '51000000-0000-4000-8000-000000000002',
 '51000000-0000-4000-8000-000000000003'
);

create temporary table phase5_intent_capture (id uuid not null);
grant select, insert on phase5_intent_capture to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);

select extensions.is(
  (select count(*)::integer from public.get_employee_directory(
    null,null,null,null,'full_name','asc',25,null)),
  4, 'manager sees all same-workspace profiles'
);
select extensions.is(
  (select count(*)::integer from public.get_employee_directory(
    null,array['hr'::public.app_role],null,null,'full_name','asc',25,null)),
  1, 'role filters are applied'
);
select extensions.throws_ok(
  $$select * from public.get_employee_directory(null,null,null,null,'unsafe','asc',25,null)$$,
  '22023','invalid directory input','unsafe sort is rejected'
);
select extensions.is(
  (select count(*)::integer from public.get_employee_detail(
    '51000000-0000-4000-8000-000000000003')),
  1, 'manager reads safe employee detail'
);
select extensions.is(
  (select count(*)::integer from public.get_employee_directory_v2(
    null,null,null,null,'full_name','asc',2,null,false,null)),
  2, 'versioned directory enforces bounded page size'
);
select extensions.is(
  (select count(*)::integer from public.get_employee_detail(
    'ffffffff-ffff-4fff-8fff-ffffffffffff')),
  0, 'nonexistent employee detail returns no row'
);

select extensions.throws_ok(
  $$select * from public.update_own_profile_v2(
    'Manager',null,null,'UTC','2000-01-01'::timestamptz)$$,
  '40001','stale update','stale self update is rejected'
);
select extensions.is(
  (select full_name from public.update_own_settings_v2(
    'Manager Updated',null,null,'UTC',
    '{"new_task_assignments":true,"deadline_reminders":true,"revision_requests":true,"approval_updates":true,"publishing_updates":true,"email_enabled":true,"in_app_enabled":true}',
    (select updated_at from public.profiles where id='51000000-0000-4000-8000-000000000001')
  )),
  'Manager Updated','atomic own settings update succeeds'
);
select extensions.ok(
  exists(select 1 from public.notification_preferences
    where profile_id='51000000-0000-4000-8000-000000000001'),
  'settings save creates only the caller preference row'
);

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000002',true);
select extensions.is(
  (select count(*)::integer from public.get_employee_directory(
    null,null,null,null,'full_name','asc',25,null)),
  4, 'HR has equivalent directory access'
);

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000003',true);
select extensions.throws_ok(
  $$select * from public.get_employee_directory(null,null,null,null,'full_name','asc',25,null)$$,
  '42501','not authorized','employee cannot list the directory'
);
select extensions.throws_ok(
  $$select public.prepare_employee_invitation(
    decode(repeat('ab',32),'hex'),'Forbidden','graphic_designer','graphic_design',null)$$,
  '42501','not authorized','employee cannot prepare invitations'
);

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
insert into phase5_intent_capture (id)
select public.prepare_employee_invitation(
    decode(repeat('cd',32),'hex'),'Invitee','video_editor','video_editing',null
  );
select extensions.ok(
  (select id is not null from phase5_intent_capture),
  'management creates a privacy-minimized invitation intent'
);
reset role;
select extensions.is(
  (select count(*)::integer from private.employee_invitation_intents),
  1, 'one invitation intent exists'
);
set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
select extensions.is(
  (select count(*)::integer from (
    select public.prepare_employee_invitation(
      decode(repeat('cd',32),'hex'),'Invitee','video_editor','video_editing',null
    )
  ) retry),
  1, 'repeated preparation returns safely'
);
reset role;
select extensions.is(
  (select count(*)::integer from private.employee_invitation_intents),
  1, 'repeated preparation is idempotent'
);
set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000001',true);
select extensions.ok(
  public.finalize_employee_invitation(
    (select id from phase5_intent_capture limit 1),
    '51000000-0000-4000-8000-000000000004'
  ),
  'invitation finalization succeeds'
);
select extensions.is(
  (select role::text from public.profiles
    where id='51000000-0000-4000-8000-000000000004'),
  'video_editor','finalization assigns the approved role'
);
select extensions.is(
  (select is_active from public.profiles
    where id='51000000-0000-4000-8000-000000000004'),
  false,'invited account remains inactive'
);
select extensions.ok(
  public.finalize_employee_invitation(
    (select id from phase5_intent_capture limit 1),
    '51000000-0000-4000-8000-000000000004'
  ),
  'repeated finalization is idempotent'
);

reset role;
select * from extensions.finish();
rollback;
