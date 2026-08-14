begin;

create or replace function public.review_submission(
  p_submission_id uuid,
  p_decision public.review_decision,
  p_feedback text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_submission public.submissions%rowtype;
  v_event private.business_audit_event_type;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_submission from public.submissions
  where id = p_submission_id and workspace_id = v_workspace
  for update;
  if not found
     or v_submission.status not in ('submitted', 'in_review')
     or v_submission.submitted_by = v_actor
     or (p_decision = 'revision_requested'
         and coalesce(pg_catalog.btrim(p_feedback), '') = '') then
    raise exception 'submission not reviewable' using errcode = '42501';
  end if;
  update public.submissions
  set status = p_decision::text::public.submission_status
  where id = p_submission_id;
  insert into public.submission_reviews (
    submission_id, reviewer_id, decision, feedback, workspace_id
  ) values (
    p_submission_id, v_actor, p_decision, p_feedback, v_workspace
  );
  if p_decision = 'revision_requested' then
    update public.tasks
    set status = 'revision_requested', updated_by = v_actor
    where id = v_submission.task_id and status = 'submitted';
    insert into public.task_status_events (
      task_id, from_status, to_status, actor_id, reason, workspace_id
    ) values (
      v_submission.task_id, 'submitted', 'revision_requested',
      v_actor, p_feedback, v_workspace
    );
    v_event := 'submission_revision_requested';
  else
    v_event := 'submission_reviewed';
  end if;
  perform private.append_business_audit_event(
    v_event, v_actor, v_workspace, 'submission', p_submission_id,
    pg_catalog.jsonb_build_object('decision', p_decision::text)
  );
  return true;
end;
$function$;

revoke all on function public.review_submission(uuid,public.review_decision,text)
  from public,anon,authenticated,service_role;
grant execute on function public.review_submission(uuid,public.review_decision,text)
  to authenticated;

commit;
