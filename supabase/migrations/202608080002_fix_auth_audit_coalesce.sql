begin;

create or replace function public.append_auth_audit_event(
  p_event_id uuid,
  p_event_type text,
  p_result text,
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_workspace_id uuid,
  p_request_id uuid,
  p_ip_identifier bytea,
  p_user_agent_identifier bytea,
  p_source text,
  p_metadata jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_event_type private.auth_audit_event_type;
  v_result private.auth_audit_result;
  v_source private.auth_audit_source;
begin
  if p_event_id is null
     or p_request_id is null
     or p_ip_identifier is null
     or pg_catalog.octet_length(p_ip_identifier) <> 32
     or p_user_agent_identifier is null
     or pg_catalog.octet_length(p_user_agent_identifier) <> 32
     or not private.auth_audit_metadata_is_valid(
       coalesce(p_metadata, '{}'::jsonb)
     ) then
    raise exception 'invalid audit event input'
      using errcode = '22023';
  end if;

  begin
    v_event_type := p_event_type::private.auth_audit_event_type;
    v_result := p_result::private.auth_audit_result;
    v_source := p_source::private.auth_audit_source;
  exception when invalid_text_representation then
    raise exception 'invalid audit event classification'
      using errcode = '22023';
  end;

  insert into private.auth_audit_events (
    event_id,
    event_type,
    result,
    actor_user_id,
    target_user_id,
    workspace_id,
    request_id,
    ip_identifier,
    user_agent_identifier,
    source,
    metadata
  )
  values (
    p_event_id,
    v_event_type,
    v_result,
    p_actor_user_id,
    p_target_user_id,
    p_workspace_id,
    p_request_id,
    p_ip_identifier,
    p_user_agent_identifier,
    v_source,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return true;
end;
$function$;

revoke all on function public.append_auth_audit_event(
  uuid, text, text, uuid, uuid, uuid, uuid,
  bytea, bytea, text, jsonb
) from public, anon, authenticated;

grant execute on function public.append_auth_audit_event(
  uuid, text, text, uuid, uuid, uuid, uuid,
  bytea, bytea, text, jsonb
) to service_role;

commit;
