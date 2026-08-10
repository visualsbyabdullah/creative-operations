# Database Schema Proposal

This is a proposal derived only from existing UI fields. All business primary keys should be UUIDs, timestamps should be `timestamptz`, and every mutable table should have `created_at`/`updated_at`. If multi-workspace operation is confirmed, every business table must include `workspace_id`; the design below assumes that safer model.

## Identity and organization

### `workspaces`

`id uuid PK`, `name text not null`, timestamps. Unique normalized name if required.

### `profiles`

`id uuid PK/FK auth.users(id) on delete cascade`, `workspace_id uuid FK`, `email text not null`, `full_name text not null`, `role app_role not null`, `department department null`, `job_title text null`, `phone text null`, `bio text null`, `avatar_path text null`, `is_active boolean not null default true`, `manager_id uuid null FK profiles`, timestamps.

Constraints: role enum is `manager`, `hr`, `graphic_designer`, `video_editor`; employee role and department must agree; management department may be null. Indexes: `(workspace_id, role, is_active)`, `manager_id`; unique case-insensitive email if application mirrors Auth email. Role, activity, workspace, and manager are management-only fields.

### `notification_preferences`

`profile_id uuid PK/FK profiles`, booleans for `new_task_assignments`, `deadline_reminders`, `revision_requests`, `approval_updates`, `publishing_updates`, `email_enabled`, `in_app_enabled`, timestamps.

## Brands and assignments

### `brands`

`id uuid PK`, `workspace_id`, `name`, `industry`, `status` (`active`,`paused`), `accent_color`, `description`, `website_url null`, timestamps, optional `archived_at`. Unique `(workspace_id, lower(name))`; index `(workspace_id,status)`.

### `brand_members`

`brand_id`, `profile_id`, `department`, timestamps; composite PK `(brand_id,profile_id)`. Validate same workspace and employee department. Index `(profile_id,brand_id)`.

### `brand_platforms`

`brand_id`, `platform` enum, composite PK.

### `brand_schedule_slots`

`id`, `brand_id`, `weekday` (1–5), `department`, `content_type`, `publishing_time time`, timestamps. Index `(brand_id,weekday,department)`.

### `brand_schedule_slot_platforms`

`schedule_slot_id`, `platform`, composite PK.

## Tasks and planning

### `tasks`

`id`, `workspace_id`, `brand_id`, `title`, `department`, `content_type`, `scheduled_date date`, `deadline_at timestamptz`, `status`, `priority`, `description`, `reference_url null`, `delay_reason null`, `created_by uuid FK profiles`, `updated_by uuid`, timestamps, optional `archived_at`.

Use one canonical task status enum covering the UI: `not_started`, `in_progress`, `in_review`, `revision_required`, `approved`, `published`, `delayed`. Priority: `low`, `medium`, `high`, `urgent`. Constraints require a delay reason for `delayed` and prevent publication before approval according to the confirmed workflow. Indexes: `(workspace_id,status,deadline_at)`, `(brand_id,scheduled_date)`, `(department,scheduled_date)`.

### `task_assignees`

`task_id`, `profile_id`, `assigned_by`, `assigned_at`; composite PK `(task_id,profile_id)`. Validate workspace and matching department. Index `(profile_id,assigned_at desc)`.

### `task_platforms`

`task_id`, `platform`, composite PK.

### `task_status_events`

`id`, `task_id`, `from_status`, `to_status`, `actor_id`, `reason null`, `created_at`. Immutable history; index `(task_id,created_at desc)`.

## Submissions and reviews

### `submissions`

`id`, `workspace_id`, `task_id`, `submitted_by`, `type` (`design`,`video`), `source_url null`, `final_url`, `notes null`, `status`, `revision_number int not null default 1`, `submitted_at`, `published_url null`, timestamps.

Canonical submission status: `draft`, `submitted`, `in_review`, `revision_required`, `approved`, `published`. Constraints: revision number > 0; final URL required when submitted; only one active revision per task/submitter unless multiple submissions are confirmed. Indexes `(task_id,revision_number desc)`, `(submitted_by,status,submitted_at desc)`, `(workspace_id,status,submitted_at desc)`.

### `submission_reviews`

`id`, `submission_id`, `reviewer_id`, `decision` (`revision_required`,`approved`), `feedback null`, `created_at`. Feedback required for revision. Index `(submission_id,created_at desc)`.

## Notifications and files

### `notifications`

`id`, `workspace_id`, `recipient_id`, `type`, `title`, `body`, `task_id null`, `submission_id null`, `brand_id null`, `action_path null`, `read_at null`, `created_at`. Indexes `(recipient_id,read_at,created_at desc)` and partial unread index on `(recipient_id,created_at desc) where read_at is null`.

### `attachments`

Only required if direct upload is confirmed: `id`, `workspace_id`, `owner_id`, `task_id null`, `submission_id null`, `brand_id null`, `bucket`, `object_path`, `original_name`, `mime_type`, `byte_size`, `created_at`, optional `deleted_at`. Unique `(bucket,object_path)` and ownership/resource indexes.

## Security operations

### `audit_logs`

Append-only: `id uuid`, `workspace_id`, `actor_id null`, `event_type`, `target_type`, `target_id null`, `metadata jsonb` (redacted), `ip_hash null`, `user_agent_hash null`, `created_at`. Index `(workspace_id,created_at desc)`, `(actor_id,created_at desc)`, `(target_type,target_id,created_at desc)`.

### `rate_limit_events`

Prefer an external atomic rate limiter. If PostgreSQL is chosen: hashed key, action, window start, count, expiry; never store passwords/tokens/raw recovery identifiers.

## Relationships and transactions

Brand membership, task assignment, and submission ownership must never be inferred from names or department alone. Employee creation/invitation, task creation plus assignments/platforms, submission review plus task status/notification, and deactivation plus assignment cleanup require transactions or database RPCs with carefully reviewed fixed `search_path`.

