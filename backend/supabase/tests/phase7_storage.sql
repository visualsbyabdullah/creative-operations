\set ON_ERROR_STOP on
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(26);

select extensions.is(
  (select count(*)::integer from storage.buckets
   where id in ('avatars','task-attachments','submission-attachments') and not public),
  3,'all application Storage buckets are private'
);
select extensions.is(
  (select count(*)::integer from storage.buckets
   where id in ('avatars','task-attachments','submission-attachments')
     and file_size_limit is not null and allowed_mime_types is not null),
  3,'every private bucket has database-enforced size and MIME limits'
);
select extensions.is(
  (select count(*)::integer from pg_catalog.pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname in ('private_storage_select_v1','private_storage_insert_v1','private_storage_delete_v1')),
  3,'private object policies exist'
);
select extensions.is(
  (select count(*)::integer from pg_catalog.pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname like 'private_storage_%'
     and ('anon'=any(roles) or 'public'=any(roles))),
  0,'private Storage policies never include anonymous roles'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon',
    'public.can_access_storage_object_v1(text,text,boolean)','execute'),
  'anonymous callers cannot execute the Storage authorization helper'
);
select extensions.ok(
  pg_catalog.has_function_privilege('authenticated',
    'public.can_access_storage_object_v1(text,text,boolean)','execute'),
  'authenticated callers may execute the scoped authorization helper'
);

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('81000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','storage-manager@test.local','',clock_timestamp(),
 '{"role":"manager"}','{"full_name":"Storage Manager"}',clock_timestamp(),clock_timestamp()),
('81000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','storage-worker@test.local','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Storage Worker"}',clock_timestamp(),clock_timestamp()),
('81000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','storage-other@test.local','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Other Worker"}',clock_timestamp(),clock_timestamp()),
('81000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','storage-inactive@test.local','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Inactive Worker"}',clock_timestamp(),clock_timestamp());
update public.profiles set is_active=true where id in(
 '81000000-0000-4000-8000-000000000001',
 '81000000-0000-4000-8000-000000000002',
 '81000000-0000-4000-8000-000000000003');

create temporary table storage_ids(kind text primary key,id uuid not null);
grant select,insert on storage_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
insert into storage_ids values(
 'brand',public.create_brand('Storage Brand','Technology','#223344',null,null));
insert into storage_ids values(
 'task',public.create_assigned_task_v2(
  (select id from storage_ids where kind='brand'),'Storage Task','graphic_design',
  'Design',current_date,clock_timestamp()+interval '1 day','medium',null,null,
  array['81000000-0000-4000-8000-000000000002']::uuid[]));

select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',true);
select extensions.ok(public.can_access_storage_object_v1(
 'avatars','00000000-0000-4000-8000-000000000001/81000000-0000-4000-8000-000000000002/82000000-0000-4000-8000-000000000001.jpg',true),
 'active caller may write only the own avatar path'
);
select extensions.ok(not public.can_access_storage_object_v1(
 'avatars','00000000-0000-4000-8000-000000000001/81000000-0000-4000-8000-000000000003/82000000-0000-4000-8000-000000000001.jpg',true),
 'another profile avatar path is denied'
);
select extensions.ok(public.can_access_storage_object_v1(
 'task-attachments',
 '00000000-0000-4000-8000-000000000001/'||(select id from storage_ids where kind='task')||
 '/82000000-0000-4000-8000-000000000002.pdf',true),
 'assigned employee may write an eligible task attachment'
);
select extensions.ok(not public.can_access_storage_object_v1(
 'task-attachments',
 '00000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000099/82000000-0000-4000-8000-000000000002.pdf',true),
 'unrelated task paths are denied'
);
select extensions.ok(not public.can_access_storage_object_v1(
 'task-attachments',
 'ffffffff-ffff-4fff-8fff-ffffffffffff/'||(select id from storage_ids where kind='task')||
 '/82000000-0000-4000-8000-000000000002.pdf',false),
 'cross-workspace path prefixes are denied'
);

select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select extensions.ok(public.can_access_storage_object_v1(
 'task-attachments',
 '00000000-0000-4000-8000-000000000001/'||(select id from storage_ids where kind='task')||
 '/82000000-0000-4000-8000-000000000003.pdf',true),
 'same-workspace management may write a task attachment'
);
reset role;
select extensions.throws_ok(
  $$insert into public.attachments(
    workspace_id,owner_id,bucket,object_path,original_name,mime_type,byte_size
  ) values(
    '00000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001','task-attachments',
    'orphan/path.pdf','orphan.pdf','application/pdf',10
  )$$,
  '23514',null,'attachment metadata cannot be orphaned'
);
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select extensions.throws_ok(
  $$select public.register_attachment_v1(
    'task-attachments','wrong/path.pdf','task',
    (select id from storage_ids where kind='task'),
    'file.pdf','application/pdf',10)$$,
  '22023','invalid attachment','browser-controlled attachment paths are rejected'
);
select extensions.ok(
  (select proconfig @> array['search_path=pg_catalog, auth, public, private, storage','row_security=off']
   from pg_catalog.pg_proc where oid=
    'public.can_access_storage_object_v1(text,text,boolean)'::regprocedure),
  'Storage authorization helper has fixed configuration'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('service_role',
    'public.register_attachment_v1(text,text,text,uuid,text,text,bigint)','execute'),
  'service role has no normal attachment registration RPC access'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon',
    'public.set_own_avatar_path_v1(text,timestamp with time zone)','execute'),
  'anonymous callers cannot mutate avatar metadata'
);
select extensions.ok(
  pg_catalog.has_function_privilege('authenticated',
    'public.get_attachments_v1(text,uuid)','execute'),
  'authenticated callers may execute the parent-authorized attachment list'
);

select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000004',true);
select extensions.ok(not public.can_access_storage_object_v1(
 'avatars','00000000-0000-4000-8000-000000000001/81000000-0000-4000-8000-000000000004/82000000-0000-4000-8000-000000000004.jpg',true),
 'inactive caller cannot access Storage'
);
select extensions.is(
  (select count(*)::integer from public.get_attachments_v1(
    'task',(select id from storage_ids where kind='task'))),0,
  'inactive caller receives no attachment metadata'
);

reset role;
insert into public.attachments(
  id,workspace_id,owner_id,task_id,bucket,object_path,original_name,mime_type,byte_size
) values(
  '83000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000002',
  (select id from storage_ids where kind='task'),'task-attachments',
  '00000000-0000-4000-8000-000000000001/'||
    (select id from storage_ids where kind='task')||
    '/83000000-0000-4000-8000-000000000002.pdf',
  'review.pdf','application/pdf',100
);
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
select extensions.is(
  (select already_removed from public.begin_attachment_removal_v2(
    '83000000-0000-4000-8000-000000000001')),false,
  'management can begin same-workspace attachment removal'
);
select extensions.ok(
  (select removal_pending_at is not null from public.attachments
   where id='83000000-0000-4000-8000-000000000001'),
  'begin removal records a retryable pending state'
);
select extensions.ok(public.finish_attachment_removal_v2(
  '83000000-0000-4000-8000-000000000001',true),
  'successful object removal finalizes metadata'
);
select extensions.is(
  (select already_removed from public.begin_attachment_removal_v2(
    '83000000-0000-4000-8000-000000000001')),true,
  'repeated removal is idempotent'
);
reset role;
select extensions.is(
  (select count(*)::integer from private.business_audit_events
   where target_id='83000000-0000-4000-8000-000000000001'
     and event_type='attachment_removed'),1,
  'finalized removal creates exactly one audit event'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated',
    'private.storage_cleanup_jobs','select'),
  'cleanup reconciliation state is not client-readable'
);

select * from extensions.finish();
rollback;
