begin;

create or replace function public.get_submissions_v2()
returns table (
  id uuid,task_id uuid,task_title text,brand_name text,submitted_by uuid,
  submitter_name text,type public.submission_type,source_url text,final_url text,
  notes text,status public.submission_status,revision_number integer,
  submitted_at timestamptz,published_url text,updated_at timestamptz,
  task_updated_at timestamptz,latest_feedback text
)
language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select s.id,s.task_id,t.title,b.name,s.submitted_by,p.full_name,s.type,
    s.source_url,s.final_url,s.notes,s.status,s.revision_number,s.submitted_at,
    s.published_url,s.updated_at,t.updated_at,
    (select r.feedback from public.submission_reviews r
      where r.submission_id=s.id and r.workspace_id=s.workspace_id
      order by r.created_at desc limit 1)
  from public.submissions s
  join public.tasks t on t.id=s.task_id and t.workspace_id=s.workspace_id
  join public.brands b on b.id=t.brand_id and b.workspace_id=t.workspace_id
  join public.profiles p on p.id=s.submitted_by and p.workspace_id=s.workspace_id
  where private.current_active_profile_id() is not null
    and s.workspace_id=private.current_workspace_id()
    and (private.is_management() or s.submitted_by=private.current_active_profile_id())
  order by s.submitted_at desc nulls last,s.created_at desc,s.id;
$function$;

create or replace function public.get_submission_detail_v2(p_submission_id uuid)
returns table (
  id uuid,task_id uuid,task_title text,brand_name text,submitted_by uuid,
  submitter_name text,type public.submission_type,source_url text,final_url text,
  notes text,status public.submission_status,revision_number integer,
  submitted_at timestamptz,published_url text,updated_at timestamptz,
  task_updated_at timestamptz,latest_feedback text
)
language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select * from public.get_submissions_v2() item where item.id=p_submission_id;
$function$;

create or replace function public.request_submission_revision_v2(
  p_submission_id uuid,p_feedback text,p_expected_submission_updated_at timestamptz,
  p_expected_task_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_submission public.submissions%rowtype; v_task public.tasks%rowtype; v_notification uuid;
begin
  if private.current_active_profile_id() is null or not private.is_management()
     or length(btrim(coalesce(p_feedback,''))) not between 1 and 4000 then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_submission from public.submissions where id=p_submission_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'submission not found' using errcode='P0002'; end if;
  select * into v_task from public.tasks where id=v_submission.task_id for update;
  if v_submission.updated_at<>p_expected_submission_updated_at
     or v_task.updated_at<>p_expected_task_updated_at then
    raise exception 'stale review' using errcode='40001';
  end if;
  perform public.review_submission(p_submission_id,'revision_requested',btrim(p_feedback));
  insert into public.notifications(
    workspace_id,recipient_id,type,title,body,task_id,submission_id,brand_id,action_path
  ) values(
    v_submission.workspace_id,v_submission.submitted_by,'revision_requested',
    'Revision requested','Management requested changes to your submission.',
    v_task.id,v_submission.id,v_task.brand_id,'/submissions'
  ) returning id into v_notification;
  perform private.append_business_audit_event(
    'notification_created',private.current_active_profile_id(),v_submission.workspace_id,
    'notification',v_notification,
    pg_catalog.jsonb_build_object('recipient_id',v_submission.submitted_by,'submission_id',v_submission.id)
  );
  return true;
end;
$function$;

create or replace function public.publish_submission_v2(
  p_submission_id uuid,p_published_url text,p_expected_submission_updated_at timestamptz,
  p_expected_task_updated_at timestamptz
)
returns boolean
language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_submission public.submissions%rowtype; v_task public.tasks%rowtype;
begin
  if private.current_active_profile_id() is null or not private.is_management()
     or p_published_url !~ '^https://' or length(p_published_url)>2048 then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_submission from public.submissions where id=p_submission_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'submission not found' using errcode='P0002'; end if;
  select * into v_task from public.tasks where id=v_submission.task_id for update;
  if v_submission.updated_at<>p_expected_submission_updated_at
     or v_task.updated_at<>p_expected_task_updated_at then
    raise exception 'stale publish' using errcode='40001';
  end if;
  perform public.review_submission(p_submission_id,'approved',null);
  perform public.publish_submission(p_submission_id,p_published_url);
  return true;
end;
$function$;

create or replace function public.get_notifications_v2(
  p_unread_only boolean default false,p_limit integer default 50,
  p_before_created_at timestamptz default null,p_before_id uuid default null
)
returns table (
  id uuid,type text,title text,body text,task_id uuid,submission_id uuid,
  brand_id uuid,action_path text,read_at timestamptz,created_at timestamptz
)
language plpgsql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
begin
  if private.current_active_profile_id() is null or p_limit not between 1 and 100
     or ((p_before_created_at is null)<>(p_before_id is null)) then
    raise exception 'invalid notification query' using errcode='22023';
  end if;
  return query select n.id,n.type,n.title,n.body,n.task_id,n.submission_id,
    n.brand_id,n.action_path,n.read_at,n.created_at
  from public.notifications n where n.recipient_id=private.current_active_profile_id()
    and n.workspace_id=private.current_workspace_id()
    and (not p_unread_only or n.read_at is null)
    and (p_before_created_at is null or (n.created_at,n.id)<(p_before_created_at,p_before_id))
  order by n.created_at desc,n.id desc limit p_limit;
end;
$function$;

create or replace function public.get_unread_notification_count_v2()
returns bigint language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select count(*) from public.notifications n
  where private.current_active_profile_id() is not null
    and n.recipient_id=private.current_active_profile_id()
    and n.workspace_id=private.current_workspace_id() and n.read_at is null;
$function$;

create or replace function public.set_notification_read_v2(p_notification_id uuid,p_read boolean)
returns boolean language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
begin
  if private.current_active_profile_id() is null then
    raise exception 'not authorized' using errcode='42501';
  end if;
  update public.notifications set read_at=case when p_read then
    pg_catalog.clock_timestamp() else null end
  where id=p_notification_id and recipient_id=private.current_active_profile_id()
    and workspace_id=private.current_workspace_id();
  if not found then raise exception 'notification not found' using errcode='P0002'; end if;
  return true;
end;
$function$;

create or replace function public.mark_all_notifications_read_v2()
returns integer language plpgsql security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare v_count integer;
begin
  if private.current_active_profile_id() is null then
    raise exception 'not authorized' using errcode='42501';
  end if;
  update public.notifications set read_at=pg_catalog.clock_timestamp()
  where recipient_id=private.current_active_profile_id()
    and workspace_id=private.current_workspace_id() and read_at is null;
  get diagnostics v_count=row_count;
  return v_count;
end;
$function$;

do $acl$
declare item regprocedure;
begin
  foreach item in array array[
    'public.get_submissions_v2()'::regprocedure,
    'public.get_submission_detail_v2(uuid)'::regprocedure,
    'public.request_submission_revision_v2(uuid,text,timestamptz,timestamptz)'::regprocedure,
    'public.publish_submission_v2(uuid,text,timestamptz,timestamptz)'::regprocedure,
    'public.get_notifications_v2(boolean,integer,timestamptz,uuid)'::regprocedure,
    'public.get_unread_notification_count_v2()'::regprocedure,
    'public.set_notification_read_v2(uuid,boolean)'::regprocedure,
    'public.mark_all_notifications_read_v2()'::regprocedure
  ] loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',item);
    execute format('grant execute on function %s to authenticated',item);
  end loop;
end;
$acl$;

commit;
