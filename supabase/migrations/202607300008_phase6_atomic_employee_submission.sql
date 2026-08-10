begin;

create table private.task_submission_idempotency (
  actor_id uuid not null,
  idempotency_key uuid not null,
  request_digest bytea not null check (octet_length(request_digest)=32),
  submission_id uuid,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key(actor_id,idempotency_key),
  foreign key(submission_id) references public.submissions(id) on delete restrict
);
alter table private.task_submission_idempotency enable row level security;
alter table private.task_submission_idempotency force row level security;
revoke all on private.task_submission_idempotency from public,anon,authenticated,service_role;

create or replace function public.atomic_submit_task_v2(
  p_task_id uuid,
  p_expected_updated_at timestamptz,
  p_idempotency_key uuid,
  p_type public.submission_type,
  p_source_url text,
  p_final_url text,
  p_notes text
)
returns table (
  submission_id uuid,
  task_id uuid,
  submission_status public.submission_status,
  task_status public.task_status,
  revision_number integer
)
language plpgsql security definer
set search_path=pg_catalog,auth,public,private,extensions
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_task public.tasks%rowtype;
  v_submission public.submissions%rowtype;
  v_digest bytea;
  v_existing private.task_submission_idempotency%rowtype;
  v_manager record;
  v_notification uuid;
begin
  if v_actor is null or p_idempotency_key is null or p_expected_updated_at is null
     or p_final_url is null or p_final_url !~ '^https://'
     or (p_source_url is not null and p_source_url !~ '^https://')
     or length(coalesce(p_notes,''))>5000 then
    raise exception 'invalid submission' using errcode='22023';
  end if;
  v_digest:=extensions.digest(pg_catalog.concat_ws('|',p_task_id::text,
    p_expected_updated_at::text,p_type::text,coalesce(p_source_url,''),
    p_final_url,coalesce(p_notes,'')),'sha256');
  insert into private.task_submission_idempotency(
    actor_id,idempotency_key,request_digest
  ) values(v_actor,p_idempotency_key,v_digest)
  on conflict(actor_id,idempotency_key) do nothing;
  select * into v_existing from private.task_submission_idempotency
    where actor_id=v_actor and idempotency_key=p_idempotency_key for update;
  if v_existing.request_digest<>v_digest then
    raise exception 'idempotency conflict' using errcode='23505';
  end if;
  if v_existing.submission_id is not null then
    select * into v_submission from public.submissions where id=v_existing.submission_id;
    select * into v_task from public.tasks where id=v_submission.task_id;
    return query select v_submission.id,v_task.id,v_submission.status,
      v_task.status,v_submission.revision_number;
    return;
  end if;
  select * into v_task from public.tasks where id=p_task_id
    and workspace_id=v_workspace for update;
  if not found or not private.is_task_assignee(p_task_id) or v_task.status<>'in_progress' then
    raise exception 'task not submittable' using errcode='42501';
  end if;
  if v_task.updated_at<>p_expected_updated_at then
    raise exception 'stale task' using errcode='40001';
  end if;
  v_submission.id:=public.create_submission(
    p_task_id,p_type,p_source_url,p_final_url,p_notes
  );
  perform public.submit_submission(v_submission.id);
  select * into v_submission from public.submissions where id=v_submission.id;
  select * into v_task from public.tasks where id=p_task_id;
  update private.task_submission_idempotency set submission_id=v_submission.id
    where actor_id=v_actor and idempotency_key=p_idempotency_key;
  for v_manager in select id from public.profiles where workspace_id=v_workspace
    and is_active and role in ('manager','hr')
  loop
    insert into public.notifications(
      workspace_id,recipient_id,type,title,body,task_id,submission_id,brand_id,action_path
    ) values(
      v_workspace,v_manager.id,'submission_created','Submission ready for review',
      'An assigned employee submitted work for review.',p_task_id,
      v_submission.id,v_task.brand_id,'/submissions'
    ) returning id into v_notification;
    perform private.append_business_audit_event(
      'notification_created',v_actor,v_workspace,'notification',v_notification,
      pg_catalog.jsonb_build_object('recipient_id',v_manager.id,'submission_id',v_submission.id)
    );
  end loop;
  return query select v_submission.id,v_task.id,v_submission.status,
    v_task.status,v_submission.revision_number;
end;
$function$;

revoke all on function public.atomic_submit_task_v2(
  uuid,timestamptz,uuid,public.submission_type,text,text,text
) from public,anon,authenticated,service_role;
grant execute on function public.atomic_submit_task_v2(
  uuid,timestamptz,uuid,public.submission_type,text,text,text
) to authenticated;

commit;
