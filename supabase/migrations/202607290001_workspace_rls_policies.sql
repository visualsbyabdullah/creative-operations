begin;

-- Workspace integrity for relationships whose original foreign keys only
-- proved parent existence, not tenant equality.
alter table public.profiles
  add constraint profiles_id_workspace_key unique (id, workspace_id);
alter table public.brands
  add constraint brands_id_workspace_key unique (id, workspace_id);
alter table public.tasks
  add constraint tasks_id_workspace_key unique (id, workspace_id);
alter table public.submissions
  add constraint submissions_id_workspace_key unique (id, workspace_id);

alter table public.brand_members add column workspace_id uuid;
update public.brand_members child
set workspace_id = parent.workspace_id
from public.brands parent
where parent.id = child.brand_id;
alter table public.brand_members alter column workspace_id set not null;

alter table public.brand_platforms add column workspace_id uuid;
update public.brand_platforms child
set workspace_id = parent.workspace_id
from public.brands parent
where parent.id = child.brand_id;
alter table public.brand_platforms alter column workspace_id set not null;

alter table public.brand_schedule_slots add column workspace_id uuid;
update public.brand_schedule_slots child
set workspace_id = parent.workspace_id
from public.brands parent
where parent.id = child.brand_id;
alter table public.brand_schedule_slots alter column workspace_id set not null;
alter table public.brand_schedule_slots
  add constraint brand_schedule_slots_id_workspace_key
  unique (id, workspace_id);

alter table public.brand_schedule_slot_platforms add column workspace_id uuid;
update public.brand_schedule_slot_platforms child
set workspace_id = parent.workspace_id
from public.brand_schedule_slots parent
where parent.id = child.schedule_slot_id;
alter table public.brand_schedule_slot_platforms
  alter column workspace_id set not null;

alter table public.task_assignees add column workspace_id uuid;
update public.task_assignees child
set workspace_id = parent.workspace_id
from public.tasks parent
where parent.id = child.task_id;
alter table public.task_assignees alter column workspace_id set not null;

alter table public.task_platforms add column workspace_id uuid;
update public.task_platforms child
set workspace_id = parent.workspace_id
from public.tasks parent
where parent.id = child.task_id;
alter table public.task_platforms alter column workspace_id set not null;

alter table public.task_status_events add column workspace_id uuid;
update public.task_status_events child
set workspace_id = parent.workspace_id
from public.tasks parent
where parent.id = child.task_id;
alter table public.task_status_events alter column workspace_id set not null;

alter table public.submission_reviews add column workspace_id uuid;
update public.submission_reviews child
set workspace_id = parent.workspace_id
from public.submissions parent
where parent.id = child.submission_id;
alter table public.submission_reviews alter column workspace_id set not null;

alter table public.profiles
  add constraint profiles_manager_workspace_fkey
  foreign key (manager_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.tasks
  add constraint tasks_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete restrict,
  add constraint tasks_created_by_workspace_fkey
  foreign key (created_by, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict,
  add constraint tasks_updated_by_workspace_fkey
  foreign key (updated_by, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.brand_members
  add constraint brand_members_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete cascade,
  add constraint brand_members_profile_workspace_fkey
  foreign key (profile_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete cascade;
alter table public.brand_platforms
  add constraint brand_platforms_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete cascade;
alter table public.brand_schedule_slots
  add constraint brand_schedule_slots_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete cascade;
alter table public.brand_schedule_slot_platforms
  add constraint brand_schedule_slot_platforms_slot_workspace_fkey
  foreign key (schedule_slot_id, workspace_id)
  references public.brand_schedule_slots (id, workspace_id)
  on delete cascade;
alter table public.task_assignees
  add constraint task_assignees_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete cascade,
  add constraint task_assignees_profile_workspace_fkey
  foreign key (profile_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict,
  add constraint task_assignees_actor_workspace_fkey
  foreign key (assigned_by, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.task_platforms
  add constraint task_platforms_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete cascade;
alter table public.task_status_events
  add constraint task_status_events_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete cascade,
  add constraint task_status_events_actor_workspace_fkey
  foreign key (actor_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.submissions
  add constraint submissions_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete restrict,
  add constraint submissions_submitter_workspace_fkey
  foreign key (submitted_by, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.submission_reviews
  add constraint submission_reviews_submission_workspace_fkey
  foreign key (submission_id, workspace_id)
  references public.submissions (id, workspace_id)
  on delete restrict,
  add constraint submission_reviews_reviewer_workspace_fkey
  foreign key (reviewer_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict;
alter table public.notifications
  add constraint notifications_recipient_workspace_fkey
  foreign key (recipient_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete cascade,
  add constraint notifications_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete cascade,
  add constraint notifications_submission_workspace_fkey
  foreign key (submission_id, workspace_id)
  references public.submissions (id, workspace_id)
  on delete cascade,
  add constraint notifications_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete cascade;
alter table public.attachments
  add constraint attachments_owner_workspace_fkey
  foreign key (owner_id, workspace_id)
  references public.profiles (id, workspace_id)
  on delete restrict,
  add constraint attachments_task_workspace_fkey
  foreign key (task_id, workspace_id)
  references public.tasks (id, workspace_id)
  on delete restrict,
  add constraint attachments_submission_workspace_fkey
  foreign key (submission_id, workspace_id)
  references public.submissions (id, workspace_id)
  on delete restrict,
  add constraint attachments_brand_workspace_fkey
  foreign key (brand_id, workspace_id)
  references public.brands (id, workspace_id)
  on delete restrict;

alter table public.attachments drop constraint attachments_check;
alter table public.attachments
  add constraint attachments_exactly_one_parent_check
  check (pg_catalog.num_nonnulls(task_id, submission_id, brand_id) = 1);

create index brand_members_workspace_profile_task_idx
  on public.brand_members (workspace_id, profile_id, brand_id);
create index task_assignees_workspace_profile_task_idx
  on public.task_assignees (workspace_id, profile_id, task_id);
create index submissions_workspace_submitter_task_idx
  on public.submissions (workspace_id, submitted_by, task_id);

-- Separate append-only business audit infrastructure.
create type private.business_audit_event_type as enum (
  'profile_updated',
  'user_role_changed',
  'user_status_changed',
  'user_department_changed',
  'manager_assignment_changed',
  'brand_created',
  'brand_updated',
  'brand_archived',
  'task_created',
  'task_assigned',
  'task_reassigned',
  'task_status_changed',
  'task_archived',
  'task_reopened',
  'submission_created',
  'submission_reviewed',
  'submission_revision_requested',
  'submission_published',
  'notification_created',
  'attachment_created',
  'attachment_removed',
  'authorization_denied'
);

create table private.business_audit_events (
  event_id uuid primary key default extensions.gen_random_uuid(),
  event_type private.business_audit_event_type not null,
  actor_user_id uuid not null,
  workspace_id uuid not null,
  target_type text not null
    check (
      target_type in (
        'profile', 'brand', 'task', 'submission',
        'notification', 'attachment'
      )
    ),
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (pg_catalog.jsonb_typeof(metadata) = 'object'),
  check (pg_catalog.pg_column_size(metadata) <= 2048),
  check (
    (
      metadata
      - array[
          'changed_fields',
          'from_status',
          'to_status',
          'role',
          'department',
          'is_active',
          'recipient_id',
          'task_id',
          'submission_id',
          'brand_id',
          'assignee_count',
          'decision'
        ]::text[]
    ) = '{}'::jsonb
  )
);

create index business_audit_events_workspace_time_idx
  on private.business_audit_events (workspace_id, occurred_at desc);
create index business_audit_events_actor_time_idx
  on private.business_audit_events (actor_user_id, occurred_at desc);
create index business_audit_events_target_time_idx
  on private.business_audit_events (
    target_type,
    target_id,
    occurred_at desc
  );

alter table private.business_audit_events enable row level security;
alter table private.business_audit_events force row level security;
revoke all on table private.business_audit_events
  from public, anon, authenticated, service_role;

create or replace function private.reject_business_audit_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, private
as $function$
begin
  raise exception 'business audit events are append-only'
    using errcode = '42501';
end;
$function$;

create trigger business_audit_events_append_only
before update or delete on private.business_audit_events
for each row execute function private.reject_business_audit_mutation();

create or replace function private.append_business_audit_event(
  p_event_type private.business_audit_event_type,
  p_actor_user_id uuid,
  p_workspace_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
begin
  if p_event_type is null
     or p_actor_user_id is null
     or p_workspace_id is null
     or p_target_id is null
     or p_target_type is null then
    raise exception 'invalid business audit input'
      using errcode = '22023';
  end if;

  insert into private.business_audit_events (
    event_type,
    actor_user_id,
    workspace_id,
    target_type,
    target_id,
    metadata
  )
  values (
    p_event_type,
    p_actor_user_id,
    p_workspace_id,
    p_target_type,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$function$;

-- RLS helpers. Table-owner execution plus row_security=off prevents recursive
-- profile/task/assignment policy evaluation.
create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select auth.uid();
$function$;

create or replace function private.current_active_profile_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select profile.id
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.is_active is true
    and profile.role in (
      'manager',
      'hr',
      'graphic_designer',
      'video_editor'
    )
  limit 1;
$function$;

create or replace function private.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select profile.workspace_id
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.is_active is true
    and profile.role in (
      'manager',
      'hr',
      'graphic_designer',
      'video_editor'
    )
  limit 1;
$function$;

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select profile.role
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.is_active is true
    and profile.role in (
      'manager',
      'hr',
      'graphic_designer',
      'video_editor'
    )
  limit 1;
$function$;

create or replace function private.is_management()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select coalesce(
    private.current_role() in ('manager', 'hr'),
    false
  );
$function$;

create or replace function private.is_task_assignee(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select exists (
    select 1
    from public.task_assignees assignment
    where assignment.task_id = p_task_id
      and assignment.profile_id = private.current_active_profile_id()
      and assignment.workspace_id = private.current_workspace_id()
  );
$function$;

create or replace function private.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select exists (
    select 1
    from public.tasks task
    where task.id = p_task_id
      and task.workspace_id = private.current_workspace_id()
      and (
        private.is_management()
        or private.is_task_assignee(task.id)
      )
  );
$function$;

create or replace function private.can_access_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select exists (
    select 1
    from public.brands brand
    where brand.id = p_brand_id
      and brand.workspace_id = private.current_workspace_id()
      and (
        private.is_management()
        or exists (
          select 1
          from public.tasks task
          join public.task_assignees assignment
            on assignment.task_id = task.id
           and assignment.workspace_id = task.workspace_id
          where task.brand_id = brand.id
            and task.workspace_id = brand.workspace_id
            and assignment.profile_id =
              private.current_active_profile_id()
        )
      )
  );
$function$;

create or replace function private.can_access_submission(p_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
  select exists (
    select 1
    from public.submissions submission
    where submission.id = p_submission_id
      and submission.workspace_id = private.current_workspace_id()
      and (
        private.is_management()
        or submission.submitted_by =
          private.current_active_profile_id()
      )
  );
$function$;

create or replace function private.is_same_workspace_resource(
  p_resource_type text,
  p_resource_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
set row_security = off
as $function$
declare
  v_workspace_id uuid := private.current_workspace_id();
begin
  if v_workspace_id is null or p_resource_id is null then
    return false;
  end if;

  case p_resource_type
    when 'profile' then
      return exists (
        select 1 from public.profiles item
        where item.id = p_resource_id
          and item.workspace_id = v_workspace_id
      );
    when 'brand' then
      return exists (
        select 1 from public.brands item
        where item.id = p_resource_id
          and item.workspace_id = v_workspace_id
      );
    when 'task' then
      return exists (
        select 1 from public.tasks item
        where item.id = p_resource_id
          and item.workspace_id = v_workspace_id
      );
    when 'submission' then
      return exists (
        select 1 from public.submissions item
        where item.id = p_resource_id
          and item.workspace_id = v_workspace_id
      );
    else
      return false;
  end case;
end;
$function$;

-- Shared integrity triggers.
create or replace function private.reject_immutable_history_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, private
as $function$
begin
  raise exception 'history rows are immutable'
    using errcode = '42501';
end;
$function$;

create trigger task_status_events_immutable
before update or delete on public.task_status_events
for each row execute function private.reject_immutable_history_mutation();
create trigger submission_reviews_immutable
before update or delete on public.submission_reviews
for each row execute function private.reject_immutable_history_mutation();

-- Explicit profile mutation operations.
create or replace function public.update_own_profile(
  p_full_name text,
  p_avatar_url text,
  p_phone text,
  p_timezone text
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
  if v_actor is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.profiles
  set full_name = p_full_name,
      avatar_url = p_avatar_url,
      phone = p_phone,
      timezone = p_timezone
  where id = v_actor;

  perform private.append_business_audit_event(
    'profile_updated',
    v_actor,
    v_workspace,
    'profile',
    v_actor,
    '{"changed_fields":"full_name,avatar_url,phone,timezone"}'::jsonb
  );
  return true;
end;
$function$;

create or replace function public.manage_profile(
  p_profile_id uuid,
  p_full_name text,
  p_avatar_url text,
  p_phone text,
  p_timezone text,
  p_department public.department_type,
  p_role public.app_role,
  p_is_active boolean,
  p_manager_id uuid
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
  v_old public.profiles%rowtype;
begin
  if v_actor is null
     or not private.is_management()
     or p_profile_id = v_actor then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_old
  from public.profiles
  where id = p_profile_id
    and workspace_id = v_workspace
  for update;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if (p_role = 'graphic_designer' and p_department <> 'graphic_design')
     or (p_role = 'video_editor' and p_department <> 'video_editing')
     or (p_role in ('manager', 'hr') and p_department is not null) then
    raise exception 'invalid role department' using errcode = '22023';
  end if;

  if p_manager_id is not null
     and not private.is_same_workspace_resource('profile', p_manager_id) then
    raise exception 'invalid manager' using errcode = '23503';
  end if;

  if v_old.role = 'manager'
     and v_old.is_active
     and (p_role <> 'manager' or not p_is_active)
     and not exists (
       select 1
       from public.profiles other_manager
       where other_manager.workspace_id = v_workspace
         and other_manager.role = 'manager'
         and other_manager.is_active
         and other_manager.id <> p_profile_id
     ) then
    raise exception 'last active manager is protected'
      using errcode = '23514';
  end if;

  update public.profiles
  set full_name = p_full_name,
      avatar_url = p_avatar_url,
      phone = p_phone,
      timezone = p_timezone,
      department = p_department,
      role = p_role,
      is_active = p_is_active,
      manager_id = p_manager_id
  where id = p_profile_id;

  perform private.append_business_audit_event(
    'profile_updated', v_actor, v_workspace,
    'profile', p_profile_id,
    '{"changed_fields":"full_name,avatar_url,phone,timezone,department,role,is_active,manager_id"}'::jsonb
  );
  if v_old.role is distinct from p_role then
    perform private.append_business_audit_event(
      'user_role_changed', v_actor, v_workspace,
      'profile', p_profile_id,
      pg_catalog.jsonb_build_object('role', p_role::text)
    );
  end if;
  if v_old.is_active is distinct from p_is_active then
    perform private.append_business_audit_event(
      'user_status_changed', v_actor, v_workspace,
      'profile', p_profile_id,
      pg_catalog.jsonb_build_object('is_active', p_is_active)
    );
  end if;
  if v_old.department is distinct from p_department then
    perform private.append_business_audit_event(
      'user_department_changed', v_actor, v_workspace,
      'profile', p_profile_id,
      pg_catalog.jsonb_build_object(
        'department', coalesce(p_department::text, 'none')
      )
    );
  end if;
  if v_old.manager_id is distinct from p_manager_id then
    perform private.append_business_audit_event(
      'manager_assignment_changed', v_actor, v_workspace,
      'profile', p_profile_id,
      pg_catalog.jsonb_build_object(
        'changed_fields', 'manager_id'
      )
    );
  end if;
  return true;
end;
$function$;

-- Protected brand operations.
create or replace function public.create_brand(
  p_name text,
  p_industry text,
  p_accent_color text,
  p_description text,
  p_website_url text
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
  v_id uuid;
begin
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.brands (
    workspace_id, name, industry, accent_color, description, website_url
  ) values (
    v_workspace, p_name, p_industry, p_accent_color, p_description, p_website_url
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'brand_created', v_actor, v_workspace, 'brand', v_id, '{}'::jsonb
  );
  return v_id;
end;
$function$;

create or replace function public.update_brand(
  p_brand_id uuid,
  p_name text,
  p_industry text,
  p_accent_color text,
  p_description text,
  p_website_url text,
  p_status public.brand_status
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
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_status = 'archived' then
    raise exception 'use archive_brand' using errcode = '22023';
  end if;
  update public.brands
  set name = p_name,
      industry = p_industry,
      accent_color = p_accent_color,
      description = p_description,
      website_url = p_website_url,
      status = p_status,
      archived_at = null
  where id = p_brand_id and workspace_id = v_workspace;
  if not found then
    raise exception 'brand not found' using errcode = 'P0002';
  end if;
  perform private.append_business_audit_event(
    'brand_updated', v_actor, v_workspace, 'brand', p_brand_id,
    '{"changed_fields":"name,industry,accent_color,description,website_url,status"}'::jsonb
  );
  return true;
end;
$function$;

create or replace function public.archive_brand(p_brand_id uuid)
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
  if v_actor is null or not private.is_management() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.brands
  set status = 'archived', archived_at = pg_catalog.clock_timestamp()
  where id = p_brand_id and workspace_id = v_workspace;
  if not found then
    raise exception 'brand not found' using errcode = 'P0002';
  end if;
  perform private.append_business_audit_event(
    'brand_archived', v_actor, v_workspace, 'brand', p_brand_id, '{}'::jsonb
  );
  return true;
end;
$function$;

-- Protected task operations.
create or replace function public.create_task(
  p_brand_id uuid,
  p_title text,
  p_department public.department_type,
  p_content_type text,
  p_scheduled_date date,
  p_deadline_at timestamptz,
  p_priority public.task_priority,
  p_description text,
  p_reference_url text
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
  v_id uuid;
begin
  if v_actor is null
     or not private.is_management()
     or not private.is_same_workspace_resource('brand', p_brand_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.tasks (
    workspace_id, brand_id, title, department, content_type,
    scheduled_date, deadline_at, priority, description, reference_url,
    created_by, updated_by
  ) values (
    v_workspace, p_brand_id, p_title, p_department, p_content_type,
    p_scheduled_date, p_deadline_at, p_priority, p_description, p_reference_url,
    v_actor, v_actor
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'task_created', v_actor, v_workspace, 'task', v_id,
    pg_catalog.jsonb_build_object('brand_id', p_brand_id)
  );
  return v_id;
end;
$function$;

create or replace function public.update_task(
  p_task_id uuid,
  p_brand_id uuid,
  p_title text,
  p_department public.department_type,
  p_content_type text,
  p_scheduled_date date,
  p_deadline_at timestamptz,
  p_priority public.task_priority,
  p_description text,
  p_reference_url text
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
  if v_actor is null
     or not private.is_management()
     or not private.is_same_workspace_resource('brand', p_brand_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.tasks
  set brand_id = p_brand_id,
      title = p_title,
      department = p_department,
      content_type = p_content_type,
      scheduled_date = p_scheduled_date,
      deadline_at = p_deadline_at,
      priority = p_priority,
      description = p_description,
      reference_url = p_reference_url,
      updated_by = v_actor
  where id = p_task_id
    and workspace_id = v_workspace
    and status in ('draft', 'assigned');
  if not found then
    raise exception 'task not editable' using errcode = 'P0002';
  end if;
  perform private.append_business_audit_event(
    'task_status_changed', v_actor, v_workspace, 'task', p_task_id,
    '{"changed_fields":"brand,title,department,content_type,schedule,priority,description,reference_url"}'::jsonb
  );
  return true;
end;
$function$;

create or replace function public.set_task_assignees(
  p_task_id uuid,
  p_profile_ids uuid[]
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
  v_task public.tasks%rowtype;
  v_profile_id uuid;
  v_previous_count integer;
begin
  if v_actor is null
     or not private.is_management()
     or p_profile_ids is null
     or pg_catalog.cardinality(p_profile_ids) < 1 then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = p_task_id and workspace_id = v_workspace
  for update;
  if not found or v_task.status not in ('draft', 'assigned') then
    raise exception 'task not assignable' using errcode = 'P0002';
  end if;
  select pg_catalog.count(*) into v_previous_count
  from public.task_assignees
  where task_id = p_task_id and workspace_id = v_workspace;
  foreach v_profile_id in array p_profile_ids loop
    if not exists (
      select 1 from public.profiles profile
      where profile.id = v_profile_id
        and profile.workspace_id = v_workspace
        and profile.is_active
        and profile.role in ('graphic_designer', 'video_editor')
        and profile.department = v_task.department
    ) then
      raise exception 'ineligible assignee' using errcode = '23514';
    end if;
  end loop;
  delete from public.task_assignees
  where task_id = p_task_id and workspace_id = v_workspace;
  insert into public.task_assignees (
    task_id, profile_id, assigned_by, workspace_id
  )
  select p_task_id, item.profile_id, v_actor, v_workspace
  from (
    select distinct pg_catalog.unnest(p_profile_ids) as profile_id
  ) item;
  if v_task.status = 'draft' then
    update public.tasks
    set status = 'assigned', updated_by = v_actor
    where id = p_task_id;
    insert into public.task_status_events (
      task_id, from_status, to_status, actor_id, workspace_id
    ) values (
      p_task_id, 'draft', 'assigned', v_actor, v_workspace
    );
  end if;
  perform private.append_business_audit_event(
    case when v_previous_count = 0 then 'task_assigned'
         else 'task_reassigned' end,
    v_actor, v_workspace, 'task', p_task_id,
    pg_catalog.jsonb_build_object(
      'assignee_count', pg_catalog.cardinality(p_profile_ids)
    )
  );
  return true;
end;
$function$;

create or replace function public.transition_task(
  p_task_id uuid,
  p_expected_from public.task_status,
  p_to_status public.task_status,
  p_reason text default null
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
  v_task public.tasks%rowtype;
  v_management boolean := private.is_management();
  v_allowed boolean := false;
  v_event private.business_audit_event_type := 'task_status_changed';
begin
  if v_actor is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = p_task_id and workspace_id = v_workspace
  for update;
  if not found or v_task.status <> p_expected_from then
    raise exception 'stale or unavailable task' using errcode = 'P0002';
  end if;

  if v_management then
    v_allowed :=
      (p_expected_from = 'submitted' and p_to_status in ('revision_requested', 'completed'))
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
          select 1 from public.submissions submission
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
      delay_reason = case when p_to_status = 'revision_requested'
                          then p_reason else delay_reason end,
      archived_at = case when p_to_status = 'archived'
                         then pg_catalog.clock_timestamp() else null end,
      updated_by = v_actor
  where id = p_task_id;
  insert into public.task_status_events (
    task_id, from_status, to_status, actor_id, reason, workspace_id
  ) values (
    p_task_id, p_expected_from, p_to_status, v_actor, p_reason, v_workspace
  );
  perform private.append_business_audit_event(
    v_event, v_actor, v_workspace, 'task', p_task_id,
    pg_catalog.jsonb_build_object(
      'from_status', p_expected_from::text,
      'to_status', p_to_status::text
    )
  );
  return true;
end;
$function$;

-- Protected submission operations.
create or replace function public.create_submission(
  p_task_id uuid,
  p_type public.submission_type,
  p_source_url text,
  p_final_url text,
  p_notes text
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
  v_role public.app_role := private.current_role();
  v_task public.tasks%rowtype;
  v_id uuid;
  v_revision integer;
begin
  if v_actor is null or not private.is_task_assignee(p_task_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = p_task_id and workspace_id = v_workspace
  for update;
  if not found
     or v_task.status not in ('in_progress', 'revision_requested')
     or (v_role = 'graphic_designer' and p_type <> 'design')
     or (v_role = 'video_editor' and p_type <> 'video') then
    raise exception 'invalid submission task' using errcode = '42501';
  end if;
  select coalesce(pg_catalog.max(revision_number), 0) + 1
  into v_revision
  from public.submissions
  where task_id = p_task_id and submitted_by = v_actor;
  insert into public.submissions (
    workspace_id, task_id, submitted_by, type,
    source_url, final_url, notes, revision_number
  ) values (
    v_workspace, p_task_id, v_actor, p_type,
    p_source_url, p_final_url, p_notes, v_revision
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'submission_created', v_actor, v_workspace,
    'submission', v_id,
    pg_catalog.jsonb_build_object('task_id', p_task_id)
  );
  return v_id;
end;
$function$;

create or replace function public.submit_submission(p_submission_id uuid)
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
  v_task public.tasks%rowtype;
begin
  if v_actor is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_submission from public.submissions
  where id = p_submission_id
    and workspace_id = v_workspace
    and submitted_by = v_actor
  for update;
  if not found
     or v_submission.status not in ('draft', 'revision_requested')
     or v_submission.final_url is null then
    raise exception 'submission not submittable' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = v_submission.task_id and workspace_id = v_workspace
  for update;
  if not found
     or v_task.status <> 'in_progress'
     or not private.is_task_assignee(v_task.id) then
    raise exception 'task not submittable' using errcode = '42501';
  end if;
  update public.submissions
  set status = 'submitted',
      submitted_at = pg_catalog.clock_timestamp()
  where id = p_submission_id;
  update public.tasks
  set status = 'submitted', updated_by = v_actor
  where id = v_task.id;
  insert into public.task_status_events (
    task_id, from_status, to_status, actor_id, workspace_id
  ) values (
    v_task.id, 'in_progress', 'submitted', v_actor, v_workspace
  );
  perform private.append_business_audit_event(
    'task_status_changed', v_actor, v_workspace, 'task', v_task.id,
    '{"from_status":"in_progress","to_status":"submitted"}'::jsonb
  );
  return true;
end;
$function$;

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
  end if;
  perform private.append_business_audit_event(
    case when p_decision = 'revision_requested'
         then 'submission_revision_requested'
         else 'submission_reviewed' end,
    v_actor, v_workspace, 'submission', p_submission_id,
    pg_catalog.jsonb_build_object('decision', p_decision::text)
  );
  return true;
end;
$function$;

create or replace function public.publish_submission(
  p_submission_id uuid,
  p_published_url text
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
  v_task public.tasks%rowtype;
  v_notification_id uuid;
begin
  if v_actor is null
     or not private.is_management()
     or p_published_url is null
     or p_published_url !~ '^https://' then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_submission from public.submissions
  where id = p_submission_id and workspace_id = v_workspace
  for update;
  if not found
     or v_submission.status <> 'approved'
     or v_submission.submitted_by = v_actor then
    raise exception 'submission not publishable' using errcode = '42501';
  end if;
  select * into v_task from public.tasks
  where id = v_submission.task_id and workspace_id = v_workspace
  for update;
  if not found or v_task.status <> 'submitted' then
    raise exception 'task not completable' using errcode = '42501';
  end if;
  update public.submissions
  set status = 'published', published_url = p_published_url
  where id = p_submission_id;
  update public.tasks
  set status = 'completed', updated_by = v_actor, archived_at = null
  where id = v_task.id;
  insert into public.task_status_events (
    task_id, from_status, to_status, actor_id, workspace_id
  ) values (
    v_task.id, 'submitted', 'completed', v_actor, v_workspace
  );
  insert into public.notifications (
    workspace_id, recipient_id, type, title, body,
    task_id, submission_id, brand_id, action_path
  ) values (
    v_workspace,
    v_submission.submitted_by,
    'submission_published',
    'Submission published',
    'Your approved submission has been published.',
    v_task.id,
    p_submission_id,
    v_task.brand_id,
    '/submissions'
  ) returning id into v_notification_id;
  perform private.append_business_audit_event(
    'submission_published', v_actor, v_workspace,
    'submission', p_submission_id,
    pg_catalog.jsonb_build_object(
      'task_id', v_task.id,
      'recipient_id', v_submission.submitted_by
    )
  );
  perform private.append_business_audit_event(
    'task_status_changed', v_actor, v_workspace, 'task', v_task.id,
    '{"from_status":"submitted","to_status":"completed"}'::jsonb
  );
  perform private.append_business_audit_event(
    'notification_created', v_actor, v_workspace,
    'notification', v_notification_id,
    pg_catalog.jsonb_build_object(
      'recipient_id', v_submission.submitted_by,
      'submission_id', p_submission_id
    )
  );
  return true;
end;
$function$;

-- Protected notification operations.
create or replace function public.create_notification(
  p_recipient_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_task_id uuid default null,
  p_submission_id uuid default null,
  p_brand_id uuid default null,
  p_action_path text default null
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
  v_id uuid;
begin
  if v_actor is null
     or not private.is_management()
     or not private.is_same_workspace_resource('profile', p_recipient_id)
     or (p_task_id is not null
         and not private.is_same_workspace_resource('task', p_task_id))
     or (p_submission_id is not null
         and not private.is_same_workspace_resource('submission', p_submission_id))
     or (p_brand_id is not null
         and not private.is_same_workspace_resource('brand', p_brand_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  insert into public.notifications (
    workspace_id, recipient_id, type, title, body,
    task_id, submission_id, brand_id, action_path
  ) values (
    v_workspace, p_recipient_id, p_type, p_title, p_body,
    p_task_id, p_submission_id, p_brand_id, p_action_path
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'notification_created', v_actor, v_workspace,
    'notification', v_id,
    pg_catalog.jsonb_build_object('recipient_id', p_recipient_id)
  );
  return v_id;
end;
$function$;

create or replace function public.mark_notification_read(p_notification_id uuid)
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
  if v_actor is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.notifications
  set read_at = coalesce(read_at, pg_catalog.clock_timestamp())
  where id = p_notification_id
    and recipient_id = v_actor
    and workspace_id = v_workspace;
  if not found then
    raise exception 'notification not found' using errcode = 'P0002';
  end if;
  return true;
end;
$function$;

-- Explicitly remove inherited business privileges, including the default
-- REFERENCES/TRIGGER/TRUNCATE grants observed in the applied catalog.
revoke all privileges on
  public.workspaces,
  public.profiles,
  public.notification_preferences,
  public.brands,
  public.brand_members,
  public.brand_platforms,
  public.brand_schedule_slots,
  public.brand_schedule_slot_platforms,
  public.tasks,
  public.task_assignees,
  public.task_platforms,
  public.task_status_events,
  public.submissions,
  public.submission_reviews,
  public.notifications,
  public.attachments
from public, anon, authenticated, service_role;

grant select on public.workspaces to authenticated;
grant select (
  id, email, full_name, role, department, job_title, phone,
  timezone, bio, avatar_url, is_active, manager_id, created_at, updated_at
) on public.profiles to authenticated;
grant select, insert, update, delete
  on public.notification_preferences to authenticated;
grant select on
  public.brands,
  public.brand_members,
  public.brand_platforms,
  public.brand_schedule_slots,
  public.brand_schedule_slot_platforms,
  public.tasks,
  public.task_assignees,
  public.task_platforms,
  public.task_status_events,
  public.submissions,
  public.submission_reviews,
  public.notifications,
  public.attachments
to authenticated;

-- RLS policy inventory: 19 policies, with all mutations except preferences
-- routed through protected operations.
create policy workspaces_select_own
on public.workspaces for select to authenticated
using (id = private.current_workspace_id());

create policy profiles_select_self_or_management
on public.profiles for select to authenticated
using (
  private.current_active_profile_id() is not null
  and (
    id = private.current_active_profile_id()
    or (
      workspace_id = private.current_workspace_id()
      and private.is_management()
    )
  )
);

create policy notification_preferences_select_own
on public.notification_preferences for select to authenticated
using (profile_id = private.current_active_profile_id());
create policy notification_preferences_insert_own
on public.notification_preferences for insert to authenticated
with check (profile_id = private.current_active_profile_id());
create policy notification_preferences_update_own
on public.notification_preferences for update to authenticated
using (profile_id = private.current_active_profile_id())
with check (profile_id = private.current_active_profile_id());
create policy notification_preferences_delete_own
on public.notification_preferences for delete to authenticated
using (profile_id = private.current_active_profile_id());

create policy brands_select_authorized
on public.brands for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or private.can_access_brand(id)
  )
);
create policy brand_members_select_authorized
on public.brand_members for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or profile_id = private.current_active_profile_id()
  )
);
create policy brand_platforms_select_authorized
on public.brand_platforms for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.can_access_brand(brand_id)
);
create policy brand_schedule_slots_select_management
on public.brand_schedule_slots for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.is_management()
);
create policy brand_schedule_slot_platforms_select_management
on public.brand_schedule_slot_platforms for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.is_management()
);

create policy tasks_select_authorized
on public.tasks for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or private.is_task_assignee(id)
  )
);
create policy task_assignees_select_authorized
on public.task_assignees for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or profile_id = private.current_active_profile_id()
  )
);
create policy task_platforms_select_authorized
on public.task_platforms for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.can_access_task(task_id)
);
create policy task_status_events_select_authorized
on public.task_status_events for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.can_access_task(task_id)
);

create policy submissions_select_authorized
on public.submissions for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or submitted_by = private.current_active_profile_id()
  )
);
create policy submission_reviews_select_authorized
on public.submission_reviews for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and private.can_access_submission(submission_id)
);
create policy notifications_select_own
on public.notifications for select to authenticated
using (
  recipient_id = private.current_active_profile_id()
  and workspace_id = private.current_workspace_id()
);
create policy attachments_select_authorized
on public.attachments for select to authenticated
using (
  workspace_id = private.current_workspace_id()
  and (
    private.is_management()
    or owner_id = private.current_active_profile_id()
    or (
      task_id is not null
      and private.can_access_task(task_id)
    )
    or (
      submission_id is not null
      and private.can_access_submission(submission_id)
    )
    or (
      brand_id is not null
      and private.can_access_brand(brand_id)
    )
  )
);

-- New function ACLs are opt-in.
revoke all on function private.reject_business_audit_mutation()
  from public, anon, authenticated, service_role;
revoke all on function private.append_business_audit_event(
  private.business_audit_event_type, uuid, uuid, text, uuid, jsonb
) from public, anon, authenticated, service_role;
revoke all on function private.reject_immutable_history_mutation()
  from public, anon, authenticated, service_role;

revoke all on function private.current_user_id()
  from public, anon, authenticated, service_role;
revoke all on function private.current_active_profile_id()
  from public, anon, authenticated, service_role;
revoke all on function private.current_workspace_id()
  from public, anon, authenticated, service_role;
revoke all on function private.current_role()
  from public, anon, authenticated, service_role;
revoke all on function private.is_management()
  from public, anon, authenticated, service_role;
revoke all on function private.is_task_assignee(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.can_access_task(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.can_access_brand(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.can_access_submission(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.is_same_workspace_resource(text, uuid)
  from public, anon, authenticated, service_role;

grant execute on function private.current_user_id() to authenticated;
grant execute on function private.current_active_profile_id() to authenticated;
grant execute on function private.current_workspace_id() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_management() to authenticated;
grant execute on function private.is_task_assignee(uuid) to authenticated;
grant execute on function private.can_access_task(uuid) to authenticated;
grant execute on function private.can_access_brand(uuid) to authenticated;
grant execute on function private.can_access_submission(uuid) to authenticated;
grant execute on function private.is_same_workspace_resource(text, uuid)
  to authenticated;

revoke all on function public.update_own_profile(
  text, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.manage_profile(
  uuid, text, text, text, text, public.department_type,
  public.app_role, boolean, uuid
) from public, anon, authenticated, service_role;
revoke all on function public.create_brand(
  text, text, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.update_brand(
  uuid, text, text, text, text, text, public.brand_status
) from public, anon, authenticated, service_role;
revoke all on function public.archive_brand(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.create_task(
  uuid, text, public.department_type, text, date, timestamptz,
  public.task_priority, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.update_task(
  uuid, uuid, text, public.department_type, text, date, timestamptz,
  public.task_priority, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.set_task_assignees(uuid, uuid[])
  from public, anon, authenticated, service_role;
revoke all on function public.transition_task(
  uuid, public.task_status, public.task_status, text
) from public, anon, authenticated, service_role;
revoke all on function public.create_submission(
  uuid, public.submission_type, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.submit_submission(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.review_submission(
  uuid, public.review_decision, text
) from public, anon, authenticated, service_role;
revoke all on function public.publish_submission(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.create_notification(
  uuid, text, text, text, uuid, uuid, uuid, text
) from public, anon, authenticated, service_role;
revoke all on function public.mark_notification_read(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.update_own_profile(
  text, text, text, text
) to authenticated;
grant execute on function public.manage_profile(
  uuid, text, text, text, text, public.department_type,
  public.app_role, boolean, uuid
) to authenticated;
grant execute on function public.create_brand(
  text, text, text, text, text
) to authenticated;
grant execute on function public.update_brand(
  uuid, text, text, text, text, text, public.brand_status
) to authenticated;
grant execute on function public.archive_brand(uuid) to authenticated;
grant execute on function public.create_task(
  uuid, text, public.department_type, text, date, timestamptz,
  public.task_priority, text, text
) to authenticated;
grant execute on function public.update_task(
  uuid, uuid, text, public.department_type, text, date, timestamptz,
  public.task_priority, text, text
) to authenticated;
grant execute on function public.set_task_assignees(uuid, uuid[])
  to authenticated;
grant execute on function public.transition_task(
  uuid, public.task_status, public.task_status, text
) to authenticated;
grant execute on function public.create_submission(
  uuid, public.submission_type, text, text, text
) to authenticated;
grant execute on function public.submit_submission(uuid) to authenticated;
grant execute on function public.review_submission(
  uuid, public.review_decision, text
) to authenticated;
grant execute on function public.publish_submission(uuid, text)
  to authenticated;
grant execute on function public.create_notification(
  uuid, text, text, text, uuid, uuid, uuid, text
) to authenticated;
grant execute on function public.mark_notification_read(uuid)
  to authenticated;

comment on table private.business_audit_events is
  'Append-only business authorization audit events. Initial online retention is 180 days; cleanup requires a separately reviewed trusted operation.';

commit;
