\set ON_ERROR_STOP on

begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(45);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
('71000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','manager@workflow.test','',clock_timestamp(),
 '{"role":"manager"}','{"full_name":"Workflow Manager"}',clock_timestamp(),clock_timestamp()),
('71000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','hr@workflow.test','',clock_timestamp(),
 '{"role":"hr"}','{"full_name":"Workflow HR"}',clock_timestamp(),clock_timestamp()),
('71000000-0000-4000-8000-000000000003','00000000-0000-0000-8000-000000000000',
 'authenticated','authenticated','designer@workflow.test','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Workflow Designer"}',clock_timestamp(),clock_timestamp()),
('71000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','video@workflow.test','',clock_timestamp(),
 '{"role":"video_editor"}','{"full_name":"Workflow Video"}',clock_timestamp(),clock_timestamp()),
('71000000-0000-4000-8000-000000000005','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','inactive@workflow.test','',clock_timestamp(),
 '{"role":"graphic_designer"}','{"full_name":"Inactive Designer"}',clock_timestamp(),clock_timestamp()),
('71000000-0000-4000-8000-000000000006','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','outsider@workflow.test','',clock_timestamp(),
 '{"role":"manager"}','{"full_name":"Outside Manager"}',clock_timestamp(),clock_timestamp());

insert into public.workspaces(id,name)
values('72000000-0000-4000-8000-000000000002','Workflow Other Workspace');
update public.profiles set is_active=true
where id in (
  '71000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002',
  '71000000-0000-4000-8000-000000000003',
  '71000000-0000-4000-8000-000000000004',
  '71000000-0000-4000-8000-000000000006'
);
update public.profiles
set workspace_id='72000000-0000-4000-8000-000000000002'
where id='71000000-0000-4000-8000-000000000006';

create temporary table workflow_ids(kind text primary key,id uuid not null);
grant select,insert,update on workflow_ids to authenticated;
create temporary table workflow_times(kind text primary key,value timestamptz not null);
grant select,insert,update on workflow_times to authenticated;
create temporary table workflow_cursors(kind text primary key,value text not null);
grant select,insert,update on workflow_cursors to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
insert into workflow_ids values (
  'brand', public.create_brand('Workflow Brand','Technology','#2f80ed',null,'https://example.com')
);
insert into workflow_ids values (
  'task', public.create_assigned_task_v2(
    (select id from workflow_ids where kind='brand'),
    'Lifecycle Task','graphic_design','Carousel',current_date,
    clock_timestamp()+interval '1 day','medium','Safe test task',null,
    array['71000000-0000-4000-8000-000000000003']::uuid[]
  )
);
select extensions.is(
  (select status::text from public.tasks where id=(select id from workflow_ids where kind='task')),
  'assigned','create-and-assign moves the task to assigned'
);
select extensions.is(
  (select count(*)::integer from public.task_assignees
   where task_id=(select id from workflow_ids where kind='task')),
  1,'create-and-assign creates exactly one assignment'
);
reset role;
select extensions.is(
  (select count(*)::integer from public.notifications
   where task_id=(select id from workflow_ids where kind='task')
     and recipient_id='71000000-0000-4000-8000-000000000003'),
  1,'assignment creates one employee notification'
);
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select extensions.throws_ok(
  $$select public.update_task_v2(
    (select id from workflow_ids where kind='task'),
    (select id from workflow_ids where kind='brand'),
    'Stale','graphic_design','Carousel',current_date,clock_timestamp()+interval '1 day',
    'medium',null,null,'2000-01-01'::timestamptz)$$,
  '40001','stale task','stale management edits are rejected'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.is(
  (select count(*)::integer from public.get_tasks_v2()),1,
  'assigned employee sees the task'
);
select extensions.ok(
  public.transition_task(
    (select id from workflow_ids where kind='task'),'assigned','in_progress',null
  ),'employee starts an assigned task'
);
insert into workflow_times
select 'submission1_expected',updated_at
from public.tasks where id=(select id from workflow_ids where kind='task');
insert into workflow_ids
select 'submission1',submission_id
from public.atomic_submit_task_v2(
  (select id from workflow_ids where kind='task'),
  (select value from workflow_times where kind='submission1_expected'),
  '73000000-0000-4000-8000-000000000001','design',null,
  'https://example.com/final-1','First attempt'
);
select extensions.is(
  (select status::text from public.tasks where id=(select id from workflow_ids where kind='task')),
  'submitted','atomic submit transitions the task'
);
select extensions.is(
  (select count(*)::integer from public.submissions
   where task_id=(select id from workflow_ids where kind='task')),
  1,'atomic submit creates one submission'
);
select extensions.is(
  (select submission_id from public.atomic_submit_task_v2(
    (select id from workflow_ids where kind='task'),
    (select value from workflow_times where kind='submission1_expected'),
    '73000000-0000-4000-8000-000000000001','design',null,
    'https://example.com/final-1','First attempt'
  )),(select id from workflow_ids where kind='submission1'),
  'identical idempotent replay returns the original submission'
);

reset role;
update private.task_submission_idempotency
set request_digest=request_digest
where actor_id='71000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.throws_ok(
  $$select * from public.atomic_submit_task_v2(
    (select id from workflow_ids where kind='task'),clock_timestamp(),
    '73000000-0000-4000-8000-000000000001','design',null,
    'https://example.com/changed','Changed payload')$$,
  '23505','idempotency conflict','changed idempotency payload is rejected'
);
select extensions.is(
  (select count(*)::integer from public.submissions
   where task_id=(select id from workflow_ids where kind='task')),
  1,'idempotency conflict leaves no partial submission'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000004',true);
select extensions.is(
  (select count(*)::integer from public.get_tasks_v2()),0,
  'unassigned employee cannot list another employee task'
);
select extensions.throws_ok(
  $$select * from public.atomic_submit_task_v2(
    (select id from workflow_ids where kind='task'),
    clock_timestamp(),
    '73000000-0000-4000-8000-000000000002','video',null,
    'https://example.com/unauthorized','Guess')$$,
  '42501','task not submittable','unassigned UUID guessing cannot submit'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002',true);
select extensions.is(
  (select count(*)::integer from public.get_submissions_v2()),1,
  'HR has management-equivalent submission visibility'
);
select extensions.ok(
  public.request_submission_revision_v2(
    (select id from workflow_ids where kind='submission1'),'Please revise',
    (select updated_at from public.submissions where id=(select id from workflow_ids where kind='submission1')),
    (select updated_at from public.tasks where id=(select id from workflow_ids where kind='task'))
  ),'HR requests revision atomically'
);
select extensions.is(
  (select status::text from public.tasks where id=(select id from workflow_ids where kind='task')),
  'revision_requested','revision updates task state'
);
select extensions.is(
  (select status::text from public.submissions where id=(select id from workflow_ids where kind='submission1')),
  'revision_requested','revision preserves and marks the historical attempt'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.ok(
  public.transition_task(
    (select id from workflow_ids where kind='task'),
    'revision_requested','in_progress',null
  ),'employee resumes revision-requested work'
);
insert into workflow_ids
select 'submission2',submission_id
from public.atomic_submit_task_v2(
  (select id from workflow_ids where kind='task'),
  (select updated_at from public.tasks where id=(select id from workflow_ids where kind='task')),
  '73000000-0000-4000-8000-000000000003','design',null,
  'https://example.com/final-2','Second attempt'
);
select extensions.is(
  (select count(*)::integer from public.submissions
   where task_id=(select id from workflow_ids where kind='task')),
  2,'resubmission preserves submission history'
);
select extensions.is(
  (select revision_number from public.submissions where id=(select id from workflow_ids where kind='submission2')),
  2,'resubmission increments revision number'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select extensions.throws_ok(
  $$select public.publish_submission_v2(
    (select id from workflow_ids where kind='submission1'),'https://example.com/old',
    (select updated_at from public.submissions where id=(select id from workflow_ids where kind='submission1')),
    (select updated_at from public.tasks where id=(select id from workflow_ids where kind='task')))$$,
  '42501','submission not reviewable','an older revision-requested attempt cannot publish'
);
select extensions.ok(
  public.publish_submission_v2(
    (select id from workflow_ids where kind='submission2'),'https://example.com/published',
    (select updated_at from public.submissions where id=(select id from workflow_ids where kind='submission2')),
    (select updated_at from public.tasks where id=(select id from workflow_ids where kind='task'))
  ),'management atomically approves and publishes the current attempt'
);
select extensions.is(
  (select status::text from public.tasks where id=(select id from workflow_ids where kind='task')),
  'completed','publish completes the task'
);
select extensions.is(
  (select status::text from public.submissions where id=(select id from workflow_ids where kind='submission2')),
  'published','publish marks the current submission published'
);
reset role;
select extensions.ok(
  exists(select 1 from public.notifications
    where submission_id=(select id from workflow_ids where kind='submission2')
      and recipient_id='71000000-0000-4000-8000-000000000003'
      and type='submission_published'),
  'publish notifies the submitting employee'
);
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select extensions.throws_ok(
  $$select public.publish_submission_v2(
    (select id from workflow_ids where kind='submission2'),'https://example.com/twice',
    (select updated_at from public.submissions where id=(select id from workflow_ids where kind='submission2')),
    (select updated_at from public.tasks where id=(select id from workflow_ids where kind='task')))$$,
  '42501','submission not reviewable','double publish is rejected'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.ok(
  public.set_notification_read_v2(
    (select id from public.notifications
     where recipient_id='71000000-0000-4000-8000-000000000003'
     order by created_at limit 1),true
  ),'employee marks an own notification read'
);
select extensions.ok(
  public.set_notification_read_v2(
    (select id from public.notifications
     where recipient_id='71000000-0000-4000-8000-000000000003'
     order by created_at limit 1),true
  ),'repeated mark-read remains idempotent'
);
select extensions.throws_ok(
  $$select public.set_notification_read_v2(
    (select id from public.notifications
     where recipient_id='71000000-0000-4000-8000-000000000001' limit 1),true)$$,
  'P0002','notification not found','cross-user notification mutation is hidden'
);
select extensions.is(
  (select count(*)::integer from public.get_notifications_v2(false,100,null,null)),
  (select count(*)::integer from public.notifications
   where recipient_id='71000000-0000-4000-8000-000000000003'),
  'notification list returns only the caller rows'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000006',true);
select extensions.is(
  (select count(*)::integer from public.get_tasks_v2()),0,
  'cross-workspace management cannot list tasks'
);
select extensions.is(
  (select count(*)::integer from public.get_submissions_v2()),0,
  'cross-workspace management cannot list submissions'
);
select extensions.is(
  (select active_tasks::integer from public.get_management_dashboard_v1()),0,
  'management dashboard is isolated to the caller workspace'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002',true);
select extensions.is(
  (select team_members::integer from public.get_management_dashboard_v1()),2,
  'HR receives the same scoped dashboard aggregate'
);
select extensions.is(
  (select pending_reviews::integer from public.get_management_dashboard_v1()),0,
  'dashboard pending review count reflects the completed workflow'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000005',true);
select extensions.is(
  (select count(*)::integer from public.get_tasks_v2()),0,
  'inactive caller receives no task data'
);
select extensions.is(
  (select count(*)::integer from public.get_management_dashboard_v1()),0,
  'inactive caller receives no management dashboard data'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
insert into workflow_ids values (
  'task_page_two', public.create_assigned_task_v2(
    (select id from workflow_ids where kind='brand'),
    'Second Page Task','video_editing','Video Edit',current_date,
    clock_timestamp()+interval '2 days','high','Pagination test task',null,
    array['71000000-0000-4000-8000-000000000004']::uuid[]
  )
);
select extensions.is(
  pg_catalog.jsonb_array_length(public.query_tasks_page_v3(
    current_date,current_date,null,null,null,null,null,null,'scheduled_date',100,null
  )->'items'),2,
  'management planner query returns same-workspace tasks in the selected range'
);
insert into workflow_cursors
select 'first_page', public.query_tasks_page_v3(
  current_date,current_date,null,null,null,null,null,null,'scheduled_date',1,null
)->>'next_cursor';
select extensions.ok(
  (select value is not null from workflow_cursors where kind='first_page'),
  'bounded planner page returns a continuation cursor'
);
select extensions.is(
  pg_catalog.jsonb_array_length(public.query_tasks_page_v3(
    current_date,current_date,null,null,null,null,null,null,'scheduled_date',1,
    (select value from workflow_cursors where kind='first_page')
  )->'items'),1,
  'keyset cursor returns the stable next page'
);
select extensions.throws_ok(
  $$select public.query_tasks_page_v3(
    current_date,current_date,'changed',null,null,null,null,null,'scheduled_date',1,
    (select value from workflow_cursors where kind='first_page'))$$,
  '22023','stale cursor','cursor is bound to the complete filter set'
);
select extensions.throws_ok(
  $$select public.query_tasks_page_v3(
    current_date,current_date-1,null,null,null,null,null,null,'scheduled_date',50,null)$$,
  '22007','invalid date range','start-after-end ranges are rejected'
);
select extensions.throws_ok(
  $$select public.query_tasks_page_v3(
    current_date,current_date+93,null,null,null,null,null,null,'scheduled_date',50,null)$$,
  '22007','invalid date range','oversized date ranges are rejected'
);

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.is(
  pg_catalog.jsonb_array_length(public.query_tasks_page_v3(
    current_date,current_date,null,null,null,null,null,null,'scheduled_date',100,null
  )->'items'),1,
  'employee schedule query returns only caller-assigned tasks'
);
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000006',true);
select extensions.is(
  pg_catalog.jsonb_array_length(public.query_tasks_page_v3(
    current_date,current_date,null,null,null,null,null,null,'scheduled_date',100,null
  )->'items'),0,
  'planner query preserves cross-workspace isolation'
);

select * from extensions.finish();
rollback;
