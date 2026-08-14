begin;

create or replace function public.save_submission_feedback_v2(
  p_submission_id uuid,
  p_feedback text,
  p_expected_submission_updated_at timestamptz,
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
     or length(btrim(coalesce(p_feedback,''))) not between 1 and 4000 then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select * into v_submission from public.submissions where id=p_submission_id
    and workspace_id=private.current_workspace_id() for update;
  if not found then raise exception 'submission not found' using errcode='P0002'; end if;
  select * into v_task from public.tasks where id=v_submission.task_id for update;
  if v_submission.updated_at<>p_expected_submission_updated_at
     or v_task.updated_at<>p_expected_task_updated_at then
    raise exception 'stale feedback' using errcode='40001';
  end if;
  insert into public.submission_reviews(
    submission_id,reviewer_id,decision,feedback,workspace_id
  ) values(
    p_submission_id,private.current_active_profile_id(),'feedback',
    btrim(p_feedback),v_submission.workspace_id
  );
  perform private.append_business_audit_event(
    'submission_reviewed',private.current_active_profile_id(),
    v_submission.workspace_id,'submission',p_submission_id,
    pg_catalog.jsonb_build_object('decision','feedback')
  );
  return true;
end;
$function$;

do $acl$
begin
  execute format('revoke all on function public.save_submission_feedback_v2(uuid,text,timestamptz,timestamptz) from public,anon,authenticated,service_role');
  execute format('grant execute on function public.save_submission_feedback_v2(uuid,text,timestamptz,timestamptz) to authenticated');
end;
$acl$;

commit;
