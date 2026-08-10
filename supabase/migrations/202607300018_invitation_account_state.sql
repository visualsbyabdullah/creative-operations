begin;

create or replace function public.get_own_invitation_account_state_v1()
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public
set row_security = off
as $function$
declare
  v_user_id uuid := auth.uid();
  v_role public.app_role;
  v_is_active boolean;
begin
  if v_user_id is null then
    return 'missing';
  end if;

  select profile.role, profile.is_active
  into v_role, v_is_active
  from public.profiles as profile
  where profile.id = v_user_id;

  if not found then
    return 'missing';
  end if;

  if v_role not in (
    'manager',
    'hr',
    'graphic_designer',
    'video_editor'
  ) then
    return 'invalid_role';
  end if;

  return case
    when v_is_active then 'active'
    else 'inactive'
  end;
end;
$function$;

revoke all on function
  public.get_own_invitation_account_state_v1()
from public, anon, authenticated, service_role;

grant execute on function
  public.get_own_invitation_account_state_v1()
to authenticated;

commit;
