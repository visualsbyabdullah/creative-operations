begin;

create or replace function public.get_brand_schedule_slots_v1(p_brand_id uuid)
returns table (
  id uuid,
  weekday smallint,
  department public.department_type,
  content_type text,
  publishing_time time,
  platforms public.platform_type[],
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select slot.id,
    slot.weekday,
    slot.department,
    slot.content_type,
    slot.publishing_time,
    coalesce(
      pg_catalog.array_agg(link.platform order by link.platform)
        filter (where link.platform is not null),
      '{}'::public.platform_type[]
    ),
    slot.updated_at
  from public.brand_schedule_slots slot
  join public.brands brand
    on brand.id = slot.brand_id
   and brand.workspace_id = slot.workspace_id
  left join public.brand_schedule_slot_platforms link
    on link.schedule_slot_id = slot.id
   and link.workspace_id = slot.workspace_id
  where private.current_active_profile_id() is not null
    and private.is_management()
    and slot.workspace_id = private.current_workspace_id()
    and slot.brand_id = p_brand_id
  group by slot.id
  order by slot.weekday, slot.publishing_time, slot.id;
$function$;

create or replace function public.create_brand_schedule_slot_v1(
  p_brand_id uuid,
  p_weekday smallint,
  p_department public.department_type,
  p_content_type text,
  p_publishing_time time,
  p_platforms public.platform_type[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_actor uuid := private.current_active_profile_id();
  v_workspace uuid := private.current_workspace_id();
  v_slot_id uuid;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_weekday not between 1 and 7
     or p_department is null
     or pg_catalog.length(pg_catalog.btrim(p_content_type)) not between 1 and 120
     or p_publishing_time is null
     or p_platforms is null
     or pg_catalog.cardinality(p_platforms) not between 1 and 8
     or pg_catalog.cardinality(p_platforms)
        <> (select pg_catalog.count(distinct item) from pg_catalog.unnest(p_platforms) item)
     or exists (select 1 from pg_catalog.unnest(p_platforms) item where item is null) then
    raise exception 'invalid schedule slot' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.brands
    where id = p_brand_id
      and workspace_id = v_workspace
      and status <> 'archived'
  ) then
    raise exception 'brand not found' using errcode = 'P0002';
  end if;
  insert into public.brand_schedule_slots (
    brand_id, workspace_id, weekday, department, content_type, publishing_time
  ) values (
    p_brand_id, v_workspace, p_weekday, p_department,
    pg_catalog.btrim(p_content_type), p_publishing_time
  ) returning id into v_slot_id;
  insert into public.brand_schedule_slot_platforms (
    schedule_slot_id, workspace_id, platform
  )
  select v_slot_id, v_workspace, item
  from pg_catalog.unnest(p_platforms) item;
  perform private.append_business_audit_event(
    'brand_updated', v_actor, v_workspace, 'brand', p_brand_id,
    '{"changed_fields":"schedule_slots"}'::jsonb
  );
  return v_slot_id;
end;
$function$;

revoke all on function public.get_brand_schedule_slots_v1(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.get_brand_schedule_slots_v1(uuid)
  to authenticated;
revoke all on function public.create_brand_schedule_slot_v1(
  uuid,smallint,public.department_type,text,time,public.platform_type[]
) from public,anon,authenticated,service_role;
grant execute on function public.create_brand_schedule_slot_v1(
  uuid,smallint,public.department_type,text,time,public.platform_type[]
) to authenticated;

commit;
