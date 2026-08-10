begin;

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'manager',
  'hr',
  'graphic_designer',
  'video_editor'
);

create type public.department_type as enum (
  'graphic_design',
  'video_editing'
);

create type public.brand_status as enum (
  'active',
  'paused',
  'archived'
);

create type public.task_status as enum (
  'draft',
  'assigned',
  'in_progress',
  'submitted',
  'revision_requested',
  'completed',
  'archived'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.submission_status as enum (
  'draft',
  'submitted',
  'in_review',
  'revision_requested',
  'approved',
  'published',
  'archived'
);

create type public.submission_type as enum (
  'design',
  'video'
);

create type public.review_decision as enum (
  'revision_requested',
  'approved'
);

create type public.platform_type as enum (
  'facebook',
  'instagram',
  'linkedin',
  'pinterest',
  'tiktok',
  'x',
  'youtube',
  'website',
  'other'
);

create table public.workspaces (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null
    check (
      pg_catalog.length(pg_catalog.btrim(name)) between 1 and 120
    ),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create unique index workspaces_normalized_name_uidx
  on public.workspaces (pg_catalog.lower(pg_catalog.btrim(name)));

insert into public.workspaces (id, name)
values (
  '00000000-0000-4000-8000-000000000001',
  'Creative Operations'
);

create table public.profiles (
  id uuid primary key
    references auth.users (id) on delete cascade,
  workspace_id uuid not null
    default '00000000-0000-4000-8000-000000000001'
    references public.workspaces (id) on delete restrict,
  email text not null
    check (
      pg_catalog.length(pg_catalog.btrim(email)) between 3 and 320
    ),
  full_name text not null
    check (
      pg_catalog.length(pg_catalog.btrim(full_name)) between 1 and 120
    ),
  role public.app_role not null,
  department public.department_type,
  job_title text
    check (
      job_title is null or
      pg_catalog.length(pg_catalog.btrim(job_title)) between 1 and 120
    ),
  phone text
    check (
      phone is null or
      pg_catalog.length(pg_catalog.btrim(phone)) between 3 and 32
    ),
  timezone text
    check (
      timezone is null or
      pg_catalog.length(pg_catalog.btrim(timezone)) between 1 and 64
    ),
  bio text
    check (
      bio is null or pg_catalog.length(bio) <= 2000
    ),
  avatar_path text
    check (
      avatar_path is null or
      (
        pg_catalog.length(avatar_path) between 1 and 512 and
        avatar_path !~ '(^|/)\.\.(/|$)'
      )
    ),
  avatar_url text
    check (
      avatar_url is null or
      (
        pg_catalog.length(avatar_url) <= 2048 and
        avatar_url ~ '^https://'
      )
    ),
  is_active boolean not null default true,
  manager_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (manager_id is null or manager_id <> id),
  check (
    (role = 'graphic_designer' and department = 'graphic_design') or
    (role = 'video_editor' and department = 'video_editing') or
    (role in ('manager', 'hr') and department is null)
  )
);

create unique index profiles_workspace_email_uidx
  on public.profiles (
    workspace_id,
    pg_catalog.lower(pg_catalog.btrim(email))
  );
create index profiles_workspace_role_active_idx
  on public.profiles (workspace_id, role, is_active);
create index profiles_manager_id_idx
  on public.profiles (manager_id)
  where manager_id is not null;

create table public.notification_preferences (
  profile_id uuid primary key
    references public.profiles (id) on delete cascade,
  new_task_assignments boolean not null default true,
  deadline_reminders boolean not null default true,
  revision_requests boolean not null default true,
  approval_updates boolean not null default true,
  publishing_updates boolean not null default true,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create table public.brands (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  name text not null
    check (
      pg_catalog.length(pg_catalog.btrim(name)) between 1 and 120
    ),
  industry text not null
    check (
      pg_catalog.length(pg_catalog.btrim(industry)) between 1 and 120
    ),
  status public.brand_status not null default 'active',
  accent_color text
    check (
      accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
  description text
    check (
      description is null or pg_catalog.length(description) <= 4000
    ),
  website_url text
    check (
      website_url is null or
      (
        pg_catalog.length(website_url) <= 2048 and
        website_url ~ '^https://'
      )
    ),
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (
    (status = 'archived' and archived_at is not null) or
    (status <> 'archived' and archived_at is null)
  )
);

create unique index brands_workspace_name_uidx
  on public.brands (
    workspace_id,
    pg_catalog.lower(pg_catalog.btrim(name))
  );
create index brands_workspace_status_idx
  on public.brands (workspace_id, status);

create table public.brand_members (
  brand_id uuid not null
    references public.brands (id) on delete cascade,
  profile_id uuid not null
    references public.profiles (id) on delete cascade,
  department public.department_type not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (brand_id, profile_id)
);

create index brand_members_profile_brand_idx
  on public.brand_members (profile_id, brand_id);

create table public.brand_platforms (
  brand_id uuid not null
    references public.brands (id) on delete cascade,
  platform public.platform_type not null,
  primary key (brand_id, platform)
);

create table public.brand_schedule_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  brand_id uuid not null
    references public.brands (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  department public.department_type not null,
  content_type text not null
    check (
      pg_catalog.length(pg_catalog.btrim(content_type)) between 1 and 120
    ),
  publishing_time time not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index brand_schedule_slots_brand_weekday_idx
  on public.brand_schedule_slots (brand_id, weekday, department);

create table public.brand_schedule_slot_platforms (
  schedule_slot_id uuid not null
    references public.brand_schedule_slots (id) on delete cascade,
  platform public.platform_type not null,
  primary key (schedule_slot_id, platform)
);

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  brand_id uuid not null
    references public.brands (id) on delete restrict,
  title text not null
    check (
      pg_catalog.length(pg_catalog.btrim(title)) between 1 and 200
    ),
  department public.department_type not null,
  content_type text not null
    check (
      pg_catalog.length(pg_catalog.btrim(content_type)) between 1 and 120
    ),
  scheduled_date date,
  deadline_at timestamptz,
  status public.task_status not null default 'draft',
  priority public.task_priority not null default 'medium',
  description text
    check (
      description is null or pg_catalog.length(description) <= 10000
    ),
  reference_url text
    check (
      reference_url is null or
      (
        pg_catalog.length(reference_url) <= 2048 and
        reference_url ~ '^https://'
      )
    ),
  delay_reason text
    check (
      delay_reason is null or
      pg_catalog.length(pg_catalog.btrim(delay_reason)) between 1 and 2000
    ),
  created_by uuid not null
    references public.profiles (id) on delete restrict,
  updated_by uuid not null
    references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (
    (status = 'archived' and archived_at is not null) or
    (status <> 'archived' and archived_at is null)
  )
);

create index tasks_workspace_status_deadline_idx
  on public.tasks (workspace_id, status, deadline_at);
create index tasks_brand_scheduled_date_idx
  on public.tasks (brand_id, scheduled_date);
create index tasks_department_scheduled_date_idx
  on public.tasks (workspace_id, department, scheduled_date);

create table public.task_assignees (
  task_id uuid not null
    references public.tasks (id) on delete cascade,
  profile_id uuid not null
    references public.profiles (id) on delete restrict,
  assigned_by uuid not null
    references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (task_id, profile_id)
);

create index task_assignees_profile_assigned_idx
  on public.task_assignees (profile_id, assigned_at desc);

create table public.task_platforms (
  task_id uuid not null
    references public.tasks (id) on delete cascade,
  platform public.platform_type not null,
  primary key (task_id, platform)
);

create table public.task_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id uuid not null
    references public.tasks (id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  actor_id uuid not null
    references public.profiles (id) on delete restrict,
  reason text
    check (
      reason is null or
      pg_catalog.length(pg_catalog.btrim(reason)) between 1 and 2000
    ),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (from_status is null or from_status <> to_status)
);

create index task_status_events_task_created_idx
  on public.task_status_events (task_id, created_at desc);

create table public.submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  task_id uuid not null
    references public.tasks (id) on delete restrict,
  submitted_by uuid not null
    references public.profiles (id) on delete restrict,
  type public.submission_type not null,
  source_url text
    check (
      source_url is null or
      (
        pg_catalog.length(source_url) <= 2048 and
        source_url ~ '^https://'
      )
    ),
  final_url text
    check (
      final_url is null or
      (
        pg_catalog.length(final_url) <= 2048 and
        final_url ~ '^https://'
      )
    ),
  notes text
    check (
      notes is null or pg_catalog.length(notes) <= 10000
    ),
  status public.submission_status not null default 'draft',
  revision_number integer not null default 1
    check (revision_number > 0),
  submitted_at timestamptz,
  published_url text
    check (
      published_url is null or
      (
        pg_catalog.length(published_url) <= 2048 and
        published_url ~ '^https://'
      )
    ),
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (
    status = 'draft' or
    (final_url is not null and submitted_at is not null)
  ),
  check (
    (status = 'published' and published_url is not null) or
    status <> 'published'
  ),
  check (
    (status = 'archived' and archived_at is not null) or
    (status <> 'archived' and archived_at is null)
  )
);

create unique index submissions_task_submitter_revision_uidx
  on public.submissions (task_id, submitted_by, revision_number);
create index submissions_task_revision_idx
  on public.submissions (task_id, revision_number desc);
create index submissions_submitter_status_time_idx
  on public.submissions (submitted_by, status, submitted_at desc);
create index submissions_workspace_status_time_idx
  on public.submissions (workspace_id, status, submitted_at desc);

create table public.submission_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null
    references public.submissions (id) on delete restrict,
  reviewer_id uuid not null
    references public.profiles (id) on delete restrict,
  decision public.review_decision not null,
  feedback text
    check (
      feedback is null or
      pg_catalog.length(pg_catalog.btrim(feedback)) between 1 and 10000
    ),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (
    decision <> 'revision_requested' or feedback is not null
  )
);

create index submission_reviews_submission_created_idx
  on public.submission_reviews (submission_id, created_at desc);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  recipient_id uuid not null
    references public.profiles (id) on delete cascade,
  type text not null
    check (
      pg_catalog.length(pg_catalog.btrim(type)) between 1 and 80
    ),
  title text not null
    check (
      pg_catalog.length(pg_catalog.btrim(title)) between 1 and 200
    ),
  body text not null
    check (
      pg_catalog.length(pg_catalog.btrim(body)) between 1 and 2000
    ),
  task_id uuid references public.tasks (id) on delete cascade,
  submission_id uuid
    references public.submissions (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete cascade,
  action_path text
    check (
      action_path is null or
      (
        pg_catalog.length(action_path) <= 512 and
        action_path ~ '^/[A-Za-z0-9/_?=&.-]*$' and
        action_path !~ '^//'
      )
    ),
  read_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index notifications_recipient_read_created_idx
  on public.notifications (recipient_id, read_at, created_at desc);
create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

create table public.attachments (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces (id) on delete restrict,
  owner_id uuid not null
    references public.profiles (id) on delete restrict,
  task_id uuid references public.tasks (id) on delete restrict,
  submission_id uuid
    references public.submissions (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete restrict,
  bucket text not null
    check (
      pg_catalog.length(pg_catalog.btrim(bucket)) between 1 and 63
    ),
  object_path text not null
    check (
      pg_catalog.length(object_path) between 1 and 1024 and
      object_path !~ '(^|/)\.\.(/|$)'
    ),
  original_name text not null
    check (
      pg_catalog.length(pg_catalog.btrim(original_name)) between 1 and 255
    ),
  mime_type text not null
    check (
      pg_catalog.length(pg_catalog.btrim(mime_type)) between 3 and 127
    ),
  byte_size bigint not null check (byte_size > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (pg_catalog.num_nonnulls(task_id, submission_id, brand_id) <= 1)
);

create unique index attachments_bucket_object_path_uidx
  on public.attachments (bucket, object_path);
create index attachments_owner_created_idx
  on public.attachments (owner_id, created_at desc);
create index attachments_task_idx
  on public.attachments (task_id)
  where task_id is not null;
create index attachments_submission_idx
  on public.attachments (submission_id)
  where submission_id is not null;
create index attachments_brand_idx
  on public.attachments (brand_id)
  where brand_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$function$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();
create trigger brand_schedule_slots_set_updated_at
before update on public.brand_schedule_slots
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

create or replace function public.provision_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_role public.app_role;
  v_department public.department_type;
  v_full_name text;
begin
  begin
    v_role := coalesce(
      new.raw_app_meta_data ->> 'role',
      'graphic_designer'
    )::public.app_role;
  exception when invalid_text_representation then
    v_role := 'graphic_designer';
  end;

  v_department := case v_role
    when 'graphic_designer' then 'graphic_design'::public.department_type
    when 'video_editor' then 'video_editing'::public.department_type
    else null
  end;

  v_full_name := pg_catalog.left(
    coalesce(
      nullif(
        pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'),
        ''
      ),
      pg_catalog.split_part(new.email, '@', 1),
      'New User'
    ),
    120
  );

  insert into public.profiles (
    id,
    workspace_id,
    email,
    full_name,
    role,
    department,
    is_active
  )
  values (
    new.id,
    '00000000-0000-4000-8000-000000000001',
    pg_catalog.lower(new.email),
    v_full_name,
    v_role,
    v_department,
    false
  );

  return new;
end;
$function$;

create trigger provision_profile_after_auth_user_insert
after insert on auth.users
for each row execute function public.provision_profile_for_new_user();

revoke all on function public.set_updated_at()
  from public, anon, authenticated;
revoke all on function public.provision_profile_for_new_user()
  from public, anon, authenticated;

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.brands enable row level security;
alter table public.brand_members enable row level security;
alter table public.brand_platforms enable row level security;
alter table public.brand_schedule_slots enable row level security;
alter table public.brand_schedule_slot_platforms enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_platforms enable row level security;
alter table public.task_status_events enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;

comment on table public.workspaces is
  'Primary tenant boundary. Phase 4 policies must scope every business operation to a workspace.';
comment on table public.profiles is
  'Application identities backed by auth.users. Newly provisioned profiles are inactive until management approval. avatar_url is retained for frontend compatibility until private avatar storage replaces it.';
comment on table public.task_status_events is
  'Immutable task lifecycle history; mutation restrictions are added with Phase 4 authorization policies.';
comment on table public.attachments is
  'Private storage metadata only. Bucket creation and Storage RLS are deferred to the dedicated storage phase.';

commit;
