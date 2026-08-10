begin;

create or replace function public.prepare_employee_invitation_v2(
  p_email_digest bytea, p_full_name text, p_role public.app_role,
  p_department public.department_type, p_manager_id uuid
)
returns table (
  intent_id uuid,
  intent_state text,
  invited_user_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_intent private.employee_invitation_intents%rowtype;
begin
  if v_actor is null or not private.is_management()
     or p_email_digest is null or octet_length(p_email_digest)<>32
     or not (
       (p_role='graphic_designer' and p_department='graphic_design') or
       (p_role='video_editor' and p_department='video_editing') or
       (p_role in ('manager','hr') and p_department is null)
     )
     or (p_manager_id is not null and not exists (
       select 1 from public.profiles p where p.id=p_manager_id
         and p.workspace_id=v_workspace and p.is_active
         and p.role in ('manager','hr')
     )) then
    raise exception 'invalid invitation' using errcode='42501';
  end if;
  insert into private.employee_invitation_intents (
    workspace_id,created_by,email_digest,full_name,role,department,manager_id
  ) values (
    v_workspace,v_actor,p_email_digest,btrim(p_full_name),p_role,p_department,p_manager_id
  )
  on conflict (workspace_id,email_digest) do update set
    updated_at=pg_catalog.clock_timestamp()
  returning * into v_intent;
  return query select v_intent.id,v_intent.state::text,v_intent.invited_user_id;
end;
$function$;

create or replace function public.mark_employee_invitation_provider_accepted(
  p_intent_id uuid,
  p_invited_user_id uuid
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
begin
  if v_actor is null or not private.is_management() or p_invited_user_id is null then
    raise exception 'not authorized' using errcode='42501';
  end if;
  update private.employee_invitation_intents set
    invited_user_id=p_invited_user_id,
    state=case when state='finalized' then state else 'invited' end,
    updated_at=pg_catalog.clock_timestamp()
  where id=p_intent_id and workspace_id=v_workspace
    and (invited_user_id is null or invited_user_id=p_invited_user_id);
  if not found then raise exception 'invitation conflict' using errcode='23505'; end if;
  return true;
end;
$function$;

revoke all on function public.prepare_employee_invitation_v2(
  bytea,text,public.app_role,public.department_type,uuid
) from public,anon,authenticated,service_role;
revoke all on function public.mark_employee_invitation_provider_accepted(uuid,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.prepare_employee_invitation_v2(
  bytea,text,public.app_role,public.department_type,uuid
) to authenticated;
grant execute on function public.mark_employee_invitation_provider_accepted(uuid,uuid)
  to authenticated;

commit;
