begin;

create or replace function public.get_management_dashboard_v1()
returns table (
  active_tasks bigint,
  pending_reviews bigint,
  delayed_tasks bigint,
  team_members bigint,
  team jsonb,
  reviews jsonb
)
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  with authorized as (
    select private.current_workspace_id() as workspace_id
    where private.current_active_profile_id() is not null
      and private.is_management()
  ), task_metrics as (
    select
      pg_catalog.count(*) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
      ) as active_count,
      pg_catalog.count(*) filter (where t.status='submitted') as review_count,
      pg_catalog.count(*) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
          and t.deadline_at < pg_catalog.clock_timestamp()
      ) as delayed_count
    from authorized a
    left join public.tasks t on t.workspace_id=a.workspace_id
  ), member_rows as (
    select p.id,p.full_name,p.role,
      pg_catalog.count(distinct t.id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
      ) as active_count,
      pg_catalog.count(distinct t.id) filter (
        where t.status='completed'
          and t.updated_at >= pg_catalog.clock_timestamp()-interval '30 days'
      ) as completed_count,
      pg_catalog.count(distinct t.id) filter (where t.status='submitted') as review_count,
      pg_catalog.count(distinct t.id) filter (
        where t.status in ('assigned','in_progress','revision_requested','submitted')
          and t.deadline_at < pg_catalog.clock_timestamp()
      ) as delayed_count
    from authorized a
    join public.profiles p on p.workspace_id=a.workspace_id
      and p.is_active and p.role in ('graphic_designer','video_editor')
    left join public.task_assignees ta
      on ta.profile_id=p.id and ta.workspace_id=p.workspace_id
    left join public.tasks t on t.id=ta.task_id and t.workspace_id=ta.workspace_id
    group by p.id,p.full_name,p.role
  ), review_rows as (
    select s.id,t.title,b.name as brand_name,p.full_name,s.type
    from authorized a
    join public.submissions s on s.workspace_id=a.workspace_id
      and s.status in ('submitted','in_review')
    join public.tasks t on t.id=s.task_id and t.workspace_id=s.workspace_id
    join public.brands b on b.id=t.brand_id and b.workspace_id=t.workspace_id
    join public.profiles p on p.id=s.submitted_by and p.workspace_id=s.workspace_id
    order by s.submitted_at desc nulls last,s.created_at desc,s.id
    limit 10
  )
  select metrics.active_count,metrics.review_count,metrics.delayed_count,
    (select pg_catalog.count(*) from member_rows),
    coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id',m.id,'name',m.full_name,'role',m.role,
      'active',m.active_count,'completed',m.completed_count,
      'progress',case when m.active_count+m.completed_count=0 then null
        else pg_catalog.round(m.completed_count::numeric*100/(m.active_count+m.completed_count),2) end,
      'status',case when m.delayed_count>0 then 'Delayed'
        when m.review_count>0 then 'Review Pending' else 'On Track' end
    ) order by m.full_name,m.id) from member_rows m),'[]'::jsonb),
    coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id',r.id,'title',r.title,'brand',r.brand_name,
      'assignee',r.full_name,'type',r.type
    )) from review_rows r),'[]'::jsonb)
  from task_metrics metrics
  where exists (select 1 from authorized);
$function$;

revoke all on function public.get_management_dashboard_v1()
  from public,anon,authenticated,service_role;
grant execute on function public.get_management_dashboard_v1()
  to authenticated;

commit;
