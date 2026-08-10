begin;

create or replace function public.sync_profile_email_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles
    set email = pg_catalog.lower(new.email)
    where id = new.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists sync_profile_email_after_auth_user_update on auth.users;
create trigger sync_profile_email_after_auth_user_update
after update of email on auth.users
for each row execute function public.sync_profile_email_from_auth_user();

revoke all on function public.sync_profile_email_from_auth_user()
from public, anon, authenticated, service_role;

commit;
