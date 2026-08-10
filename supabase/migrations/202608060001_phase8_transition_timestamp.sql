begin;

create or replace function public.transition_task_v2(
  p_task_id uuid,
  p_expected_from public.task_status,
  p_to_status public.task_status,
  p_reason text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_task public.tasks%rowtype;
  v_management boolean := private.is_management();
  v_allowed boolean := false;
  v_event private.business_audit_event_type := 'task_status_changed';
  v_updated_at timestamptz;
begin
  if v_actor is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
    and workspace_id = v_workspace
  for update;

  if not found or v_task.status <> p_expected_from then
    raise exception 'stale or unavailable task' using errcode = 'P0002';
  end if;

  if v_management then
    v_allowed :=
      (p_expected_from = 'submitted'
        and p_to_status in ('revision_requested', 'completed'))
      or (p_expected_from = 'completed' and p_to_status = 'archived')
      or (p_expected_from = 'archived' and p_to_status = 'draft')
      or (p_expected_from in ('assigned', 'revision_requested')
        and p_to_status = 'in_progress');
  elsif private.is_task_assignee(p_task_id) then
    v_allowed :=
      (p_expected_from = 'assigned' and p_to_status = 'in_progress')
      or (p_expected_from = 'revision_requested' and p_to_status = 'in_progress')
      or (
        p_expected_from = 'in_progress'
        and p_to_status = 'submitted'
        and exists (
          select 1
          from public.submissions submission
          where submission.task_id = p_task_id
            and submission.submitted_by = v_actor
            and submission.status = 'submitted'
        )
      );
  end if;

  if not v_allowed then
    raise exception 'invalid task transition' using errcode = '42501';
  end if;

  if p_to_status = 'revision_requested'
    and coalesce(pg_catalog.btrim(p_reason), '') = '' then
    raise exception 'revision reason required' using errcode = '22023';
  end if;

  if p_to_status = 'archived' then
    v_event := 'task_archived';
  elsif p_expected_from = 'archived' then
    v_event := 'task_reopened';
  end if;

  update public.tasks
  set status = p_to_status,
      delay_reason = case
        when p_to_status = 'revision_requested' then p_reason
        else delay_reason
      end,
      archived_at = case
        when p_to_status = 'archived' then pg_catalog.clock_timestamp()
        else null
      end,
      updated_by = v_actor
  where id = p_task_id
  returning updated_at into v_updated_at;

  insert into public.task_status_events (
    task_id,
    from_status,
    to_status,
    actor_id,
    reason,
    workspace_id
  ) values (
    p_task_id,
    p_expected_from,
    p_to_status,
    v_actor,
    p_reason,
    v_workspace
  );

  perform private.append_business_audit_event(
    v_event,
    v_actor,
    v_workspace,
    'task',
    p_task_id,
    pg_catalog.jsonb_build_object(
      'from_status', p_expected_from::text,
      'to_status', p_to_status::text
    )
  );

  return v_updated_at;
end;
$function$;

revoke all on function public.transition_task_v2(
  uuid,
  public.task_status,
  public.task_status,
  text
) from public, anon, authenticated, service_role;

grant execute on function public.transition_task_v2(
  uuid,
  public.task_status,
  public.task_status,
  text
) to authenticated;

comment on function public.transition_task_v2(
  uuid,
  public.task_status,
  public.task_status,
  text
) is 'Atomically transitions a task and returns the persisted updated_at value required by the next optimistic-concurrency operation.';

commit;