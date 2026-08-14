begin;

insert into public.profiles (
  id,
  workspace_id,
  email,
  full_name,
  role,
  department,
  is_active
)
select
  users.id,
  '00000000-0000-4000-8000-000000000001'::uuid,
  pg_catalog.lower(users.email),
  case users.id
    when 'ed247044-97a6-4496-add0-0f16c0672499'::uuid then 'QA Manager'
    else 'QA Graphic Designer'
  end,
  case users.id
    when 'ed247044-97a6-4496-add0-0f16c0672499'::uuid
      then 'manager'::public.app_role
    else 'graphic_designer'::public.app_role
  end,
  case users.id
    when 'ed247044-97a6-4496-add0-0f16c0672499'::uuid then null
    else 'graphic_design'::public.department_type
  end,
  true
from auth.users as users
where users.id in (
  'ed247044-97a6-4496-add0-0f16c0672499'::uuid,
  '6296d1e7-d945-4d23-92cd-fc61e0d09220'::uuid
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  is_active = excluded.is_active;

commit;
