# Phase 4A — Workspace-Aware RLS Implementation Plan

## 1. Current schema summary

The applied local schema contains three migrations and sixteen exposed business
tables. The two security-infrastructure tables are in the non-exposed
`private` schema.

| Area | Tables |
|---|---|
| Tenant and identity | `public.workspaces`, `public.profiles`, `public.notification_preferences` |
| Brands | `public.brands`, `public.brand_members`, `public.brand_platforms`, `public.brand_schedule_slots`, `public.brand_schedule_slot_platforms` |
| Tasks | `public.tasks`, `public.task_assignees`, `public.task_platforms`, `public.task_status_events` |
| Submissions | `public.submissions`, `public.submission_reviews` |
| User activity and files | `public.notifications`, `public.attachments` |
| Server-only security | `private.auth_rate_limit_buckets`, `private.auth_audit_events` |

The canonical database roles and lifecycles already match the approved
decisions:

- application roles: `manager`, `hr`, `graphic_designer`, `video_editor`;
- management group: `manager`, `hr`;
- employee group: `graphic_designer`, `video_editor`;
- task lifecycle: `draft`, `assigned`, `in_progress`, `submitted`,
  `revision_requested`, `completed`, `archived`;
- submission lifecycle: `draft`, `submitted`, `in_review`,
  `revision_requested`, `approved`, `published`, `archived`.

All business IDs are UUIDs. The default workspace is
`00000000-0000-4000-8000-000000000001`. Direct application queries currently
touch only `profiles`; every other business module still uses component-local
or browser-local mock data.

The frontend behavior relevant to authorization is:

- management routes expose employee, brand, planner, task-assignment, review,
  and reporting workflows;
- employee routes expose assigned tasks, task-derived schedules, owned
  submissions, own notifications, and own profile/preferences;
- the current employee task mock permits arbitrary status changes and lets an
  employee mark content published; this conflicts with the approved backend
  model and must not influence database authorization;
- brands are management-only in the current approved UI; employees need only
  the safe brand data required to render their assigned tasks;
- notification mutation is limited to marking own notifications read;
- management submission review supports revision requests and approval;
- employee identity switching and department filtering in `EmployeeContext`
  are mock presentation behavior and are never authoritative.

## 2. Existing grants and RLS state

All sixteen business tables have RLS enabled. There are no business policies.
Consequently, authenticated business access is currently deny-by-default.

The applied catalog shows that `anon`, `authenticated`, and `service_role`
have no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` privileges on the business
tables. However, Supabase default privileges left `REFERENCES`, `TRIGGER`, and
`TRUNCATE` on those tables. Phase 4 must explicitly revoke these unnecessary
privileges.

The `private` schema has no `USAGE` for `anon` or `authenticated`. Both private
security tables have RLS enabled and forced, and all table privileges are
revoked from ordinary roles and `service_role`.

The only service-role executable security functions are:

- `public.consume_auth_rate_limit(text, bytea, uuid)`;
- `public.reset_auth_rate_limit(text, bytea)`;
- `public.append_auth_audit_event(uuid, text, text, uuid, uuid, uuid, uuid,
  bytea, bytea, text, jsonb)`.

The cleanup, metadata-validation, mutation-rejection, trigger, and profile
provisioning functions are not executable by ordinary roles. These boundaries
must remain unchanged.

## 3. Table-by-table access matrix

`M` means an active manager or HR in the row's workspace. `E` means an active
employee. “RPC” means no direct table mutation grant; a protected transactional
function performs the operation.

| Table | SELECT | INSERT | UPDATE | DELETE | Ownership/workspace | Enforcement notes |
|---|---|---|---|---|---|---|
| `workspaces` | M/E: own workspace | none | none | none | `id` is tenant key | Read-only identity label. |
| `profiles` | self; M: same workspace team | provisioning trigger only | self safe columns; M sensitive fields through RPC | none | `id`, `workspace_id`, `manager_id` | Column grants plus protected management RPC; no self privilege escalation. |
| `notification_preferences` | self | self | self preference columns | self reset | `profile_id` | `profile_id` must equal active caller ID. |
| `brands` | M: same workspace; E: only brands referenced by assigned tasks | M RPC | M RPC | none; archive RPC | `workspace_id` | Employee view is read-only and assignment-derived. |
| `brand_members` | M: same workspace; E: own membership only | M RPC | M RPC | M RPC | add `workspace_id`; `brand_id`, `profile_id` | Same-workspace and department eligibility enforced structurally/triggered. |
| `brand_platforms` | M: same workspace; E: platforms for readable brands | M RPC | none | M RPC | add `workspace_id`; `brand_id` | Child visibility inherits brand visibility. |
| `brand_schedule_slots` | M: same workspace | M RPC | M RPC | M RPC | add `workspace_id`; `brand_id` | Employees do not need template schedules; their schedule is task-derived. |
| `brand_schedule_slot_platforms` | M: same workspace | M RPC | none | M RPC | add `workspace_id`; `schedule_slot_id` | Inherits schedule-slot workspace. |
| `tasks` | M: same workspace; E: assigned only | M RPC | transition/edit RPC only | none; archive RPC | `workspace_id`, `brand_id`, `created_by`, `updated_by` | UUID guessing returns no row. No employee direct update. |
| `task_assignees` | M: same workspace; E: own assignment rows | M RPC | none | M RPC | add `workspace_id`; `task_id`, `profile_id`, `assigned_by` | Same workspace, active employee, matching department. |
| `task_platforms` | same actors as parent task | M RPC | none | M RPC | add `workspace_id`; `task_id` | Inherits task authorization. |
| `task_status_events` | M: same workspace; E: events for assigned tasks | transition RPC only | none | none | add `workspace_id`; `task_id`, `actor_id` | Append-only immutable history. |
| `submissions` | M: same workspace; E: own submissions | assigned E RPC | draft/resubmit/review/publish RPCs | none; archive RPC | `workspace_id`, `task_id`, `submitted_by` | Actor/workspace/task are derived, never accepted as ownership claims. |
| `submission_reviews` | M: same workspace; submitting E: own feedback | M review RPC | none | none | add `workspace_id`; `submission_id`, `reviewer_id` | Append-only; reviewer cannot equal submitter. |
| `notifications` | recipient only | protected RPC/server operation | recipient may update `read_at` only | none | `workspace_id`, `recipient_id`, optional parents | Managers do not read other users' notification inboxes. |
| `attachments` | M: same permitted resource; E: owned/permitted parent | none until Storage phase | none until Storage phase | none until Storage phase | `workspace_id`, `owner_id`, one parent | Metadata visibility inherits task/submission/brand authorization. |

## 4. Role-by-role permission matrix

| Capability | Manager | HR | Graphic Designer | Video Editor |
|---|---:|---:|---:|---:|
| Read own active profile/preferences/workspace | yes | yes | yes | yes |
| Read workspace employee profiles | yes | yes | no | no |
| Change own role/activity/workspace/department/manager | no | no | no | no |
| Manage employee access fields for another user | protected RPC | protected RPC | no | no |
| Read/manage workspace brands | yes | yes | no management; assigned-task brand read only | same |
| Read all workspace tasks | yes | yes | no | no |
| Read assigned tasks | yes | yes | own assignments | own assignments |
| Create/edit/assign/archive tasks | protected RPC | protected RPC | no | no |
| Start/resume/submit assigned work | protected transition RPC | protected transition RPC | own assigned matching-department task | own assigned matching-department task |
| Request revision/complete/archive | yes | yes | no | no |
| Create/resubmit work | review scope | review scope | own assigned task | own assigned task |
| Review/approve/publish submissions | yes | yes | no | no |
| Read/mark notifications | own only | own only | own only | own only |
| Read attachment metadata | permitted same-workspace resource | same | owned/assigned/own-submission resource | same |
| Access auth limiter/audit tables | no | no | no | no |

Manager and HR use the same helper predicate and the same RPC branches. There
must be no policy whose behavior differs only because the role is `manager`
versus `hr`.

## 5. Workspace-isolation architecture

RLS filters are necessary but insufficient because several current foreign
keys prove only that parent IDs exist, not that their workspaces match.
Before policies are added, introduce explicit workspace integrity:

1. Add `unique (id, workspace_id)` to `profiles`, `brands`, `tasks`, and
   `submissions`.
2. Add `workspace_id uuid not null` to `brand_members`, `brand_platforms`,
   `brand_schedule_slots`, `brand_schedule_slot_platforms`,
   `task_assignees`, `task_platforms`, `task_status_events`, and
   `submission_reviews`. Backfill from the authoritative parent in the same
   migration before setting `NOT NULL`.
3. Add composite foreign keys:
   - `profiles(manager_id, workspace_id) -> profiles(id, workspace_id)`;
   - `tasks(brand_id, workspace_id) -> brands(id, workspace_id)`;
   - `tasks(created_by, workspace_id)` and
     `tasks(updated_by, workspace_id) -> profiles(id, workspace_id)`;
   - all brand child `(parent_id, workspace_id)` references;
   - `brand_members(profile_id, workspace_id) -> profiles`;
   - all task child `(task_id, workspace_id)` references;
   - task assignment actor/profile composite references;
   - `submissions(task_id, workspace_id) -> tasks`;
   - `submissions(submitted_by, workspace_id) -> profiles`;
   - `submission_reviews(submission_id, workspace_id) -> submissions`;
   - `submission_reviews(reviewer_id, workspace_id) -> profiles`;
   - notification recipient and each optional parent paired with
     `workspace_id`;
   - attachment owner and each optional parent paired with `workspace_id`.
4. Retain the existing single-column foreign keys only where needed for their
   current delete behavior; otherwise replace them transactionally with the
   composite form and preserve the same `ON DELETE` action.
5. Add supporting indexes whose leading columns match policy joins:
   - `tasks(id, workspace_id)` unique;
   - `task_assignees(profile_id, workspace_id, task_id)`;
   - `brand_members(profile_id, workspace_id, brand_id)`;
   - `submissions(submitted_by, workspace_id, task_id)`;
   - `notifications(recipient_id, workspace_id, read_at, created_at desc)`;
   - child `(workspace_id, parent_id)` indexes where not covered by a PK.

RPCs derive `workspace_id`, `created_by`, `updated_by`, `assigned_by`,
`submitted_by`, `reviewer_id`, `recipient_id` where applicable, and audit actor
identity from the active profile. They do not trust request fields for these
values.

## 6. Active-profile enforcement

Every business policy must depend on an active canonical profile, not merely
an authenticated JWT. The foundational identity expression is:

```sql
private.current_active_profile_id() is not null
```

The helper returns `auth.uid()` only when exactly one `public.profiles` row
exists with:

```sql
id = auth.uid()
and is_active is true
and role in (
  'manager',
  'hr',
  'graphic_designer',
  'video_editor'
)
```

`private.current_workspace_id()` and `private.current_role()` return `null`
when that condition is not met. Therefore missing, inactive, anonymous, and
noncanonical contexts fail closed in every policy and RPC.

## 7. Profile column-security strategy

RLS cannot hide columns within an otherwise visible profile row. Use this
combination:

- Employees can read only their own `profiles` row.
- Management can read profiles in its workspace because the existing employee
  management UI requires name, email, role, department, activity, job title,
  manager, and workload identity data.
- Application code must continue selecting explicit columns; no `select("*")`.
- Grant authenticated self-update only on:
  `full_name`, `phone`, `timezone`, `bio`, `avatar_path`, and `avatar_url`.
- Do not grant direct update on `email`, `role`, `is_active`, `workspace_id`,
  `department`, `manager_id`, `id`, or timestamps.
- Email changes must be coordinated with Supabase Auth through a later
  protected account workflow; changing only the mirrored profile email is not
  allowed.
- Management changes to another user's approved access fields use
  `public.manage_profile_access(...)`, which derives the actor and workspace,
  locks the target row, rejects `target_id = auth.uid()`, and accepts an
  explicit allowlist only.
- Do not create a broad public profile view. If a later UI needs colleague
  display names, create a separate `security_invoker` safe-directory view with
  only `id`, `full_name`, `role`, `department`, and `avatar_url`, plus its own
  approved access decision.

## 8. Helper-function architecture

Create these minimal helpers in `private`:

| Function | Return | Purpose |
|---|---|---|
| `private.current_active_profile_id()` | `uuid` | Active canonical caller ID or null. |
| `private.current_workspace_id()` | `uuid` | Active caller workspace or null. |
| `private.current_role()` | `public.app_role` | Active caller role or null. |
| `private.is_management()` | `boolean` | True for active manager/HR. |
| `private.is_task_assignee(uuid)` | `boolean` | Active caller has assignment to task in own workspace. |
| `private.can_read_task(uuid)` | `boolean` | Management workspace access or own assignment. |
| `private.can_read_brand(uuid)` | `boolean` | Management workspace access or brand referenced by own assigned task. |
| `private.can_read_submission(uuid)` | `boolean` | Management workspace access or caller is submitter. |

All helpers must be `stable`, `security definer`, owned by the migration owner,
and use:

```sql
set search_path = pg_catalog, auth, public, private
set row_security = off
```

Their bodies must use fully qualified object names, no dynamic SQL, no
client-provided identity, and return only a scalar UUID, enum, or boolean.
They must validate `auth.uid()` and never accept workspace, role, actor, or
owner from the caller.

Revoke all function execution from `public`, `anon`, `authenticated`, and
`service_role`, then grant `EXECUTE` only on the helper functions required by
stored RLS expressions to `authenticated`. Because `private` has no schema
`USAGE` and is not an exposed API schema, callers cannot invoke helpers as
ordinary API endpoints; pgTAP must prove both the policy behavior and direct
API inaccessibility.

Protected mutation functions belong in `public` only when PostgREST must expose
them. Each must be `security definer`, have a fixed safe search path, validate
the active caller, lock affected rows, derive security fields, reject unknown
state transitions, avoid dynamic SQL, return minimal identifiers/results, and
grant `EXECUTE` only to `authenticated`.

The approved protected-operation set is:

- `public.manage_profile_access`;
- `public.create_brand`, `public.update_brand`, `public.archive_brand`,
  `public.set_brand_members`, `public.upsert_brand_schedule_slot`;
- `public.create_task`, `public.update_task`, `public.set_task_assignees`,
  `public.transition_task`;
- `public.create_submission`, `public.update_submission_draft`,
  `public.submit_submission`, `public.review_submission`,
  `public.publish_submission`, `public.archive_submission`;
- `public.create_notification` for validated management-originated messages;
  event-generated notifications should be inserted inside the relevant
  transactional business RPC instead.

No business function is granted to `anon` or `service_role`. The isolated
administrative client remains limited to the existing authentication
limiter/audit functions.

## 9. RLS recursion analysis

The `profiles` policy cannot query `profiles` through an invoker helper:
doing so would recursively re-enter the same policy. The current-profile
helpers therefore query `public.profiles` as narrowly reviewed
`SECURITY DEFINER` functions owned by the table owner with row security off.

Other cycles to avoid are:

- `tasks` policy querying `task_assignees` while the assignment policy queries
  `tasks`;
- `brands` policy querying assigned `tasks` while task policy joins `brands`;
- `submissions` and `submission_reviews` policies querying each other.

The scalar `private.is_task_assignee`, `private.can_read_task`,
`private.can_read_brand`, and `private.can_read_submission` helpers break those
cycles. Policies must not call a view or invoker function that re-enters the
same protected relation.

Tests must run every policy under real `authenticated` role/JWT simulation and
must fail on recursion, unexpected row exposure, or helper execution leakage.

## 10. Exact proposed policy names

Create exactly these 21 policies:

1. `workspaces_select_own`
2. `profiles_select_self_or_management`
3. `profiles_update_self_safe`
4. `notification_preferences_select_own`
5. `notification_preferences_insert_own`
6. `notification_preferences_update_own`
7. `notification_preferences_delete_own`
8. `brands_select_authorized`
9. `brand_members_select_authorized`
10. `brand_platforms_select_authorized`
11. `brand_schedule_slots_select_management`
12. `brand_schedule_slot_platforms_select_management`
13. `tasks_select_authorized`
14. `task_assignees_select_authorized`
15. `task_platforms_select_authorized`
16. `task_status_events_select_authorized`
17. `submissions_select_authorized`
18. `submission_reviews_select_authorized`
19. `notifications_select_own`
20. `notifications_update_own_read_status`
21. `attachments_select_authorized`

Do not create direct write policies for RPC-only tables. Absence of a policy
is an intentional second denial layer behind absence of a table grant.

## 11. Exact USING and WITH CHECK logic

The clauses below are the approved policy predicates. Table names are included
where needed to avoid ambiguity.

| Policy | Command | `USING` | `WITH CHECK` |
|---|---|---|---|
| `workspaces_select_own` | SELECT | `workspaces.id = private.current_workspace_id()` | n/a |
| `profiles_select_self_or_management` | SELECT | `private.current_active_profile_id() is not null and (profiles.id = private.current_active_profile_id() or (profiles.workspace_id = private.current_workspace_id() and private.is_management()))` | n/a |
| `profiles_update_self_safe` | UPDATE | `profiles.id = private.current_active_profile_id()` | `profiles.id = private.current_active_profile_id() and profiles.workspace_id = private.current_workspace_id()` |
| preferences SELECT | SELECT | `notification_preferences.profile_id = private.current_active_profile_id()` | n/a |
| preferences INSERT | INSERT | n/a | `notification_preferences.profile_id = private.current_active_profile_id()` |
| preferences UPDATE | UPDATE | `notification_preferences.profile_id = private.current_active_profile_id()` | same as `USING` |
| preferences DELETE | DELETE | `notification_preferences.profile_id = private.current_active_profile_id()` | n/a |
| `brands_select_authorized` | SELECT | `brands.workspace_id = private.current_workspace_id() and (private.is_management() or private.can_read_brand(brands.id))` | n/a |
| `brand_members_select_authorized` | SELECT | `brand_members.workspace_id = private.current_workspace_id() and (private.is_management() or brand_members.profile_id = private.current_active_profile_id())` | n/a |
| `brand_platforms_select_authorized` | SELECT | `brand_platforms.workspace_id = private.current_workspace_id() and private.can_read_brand(brand_platforms.brand_id)` | n/a |
| `brand_schedule_slots_select_management` | SELECT | `brand_schedule_slots.workspace_id = private.current_workspace_id() and private.is_management()` | n/a |
| schedule-slot-platform SELECT | SELECT | `brand_schedule_slot_platforms.workspace_id = private.current_workspace_id() and private.is_management()` | n/a |
| `tasks_select_authorized` | SELECT | `tasks.workspace_id = private.current_workspace_id() and (private.is_management() or private.is_task_assignee(tasks.id))` | n/a |
| `task_assignees_select_authorized` | SELECT | `task_assignees.workspace_id = private.current_workspace_id() and (private.is_management() or task_assignees.profile_id = private.current_active_profile_id())` | n/a |
| `task_platforms_select_authorized` | SELECT | `task_platforms.workspace_id = private.current_workspace_id() and private.can_read_task(task_platforms.task_id)` | n/a |
| `task_status_events_select_authorized` | SELECT | `task_status_events.workspace_id = private.current_workspace_id() and private.can_read_task(task_status_events.task_id)` | n/a |
| `submissions_select_authorized` | SELECT | `submissions.workspace_id = private.current_workspace_id() and (private.is_management() or submissions.submitted_by = private.current_active_profile_id())` | n/a |
| `submission_reviews_select_authorized` | SELECT | `submission_reviews.workspace_id = private.current_workspace_id() and private.can_read_submission(submission_reviews.submission_id)` | n/a |
| `notifications_select_own` | SELECT | `notifications.recipient_id = private.current_active_profile_id() and notifications.workspace_id = private.current_workspace_id()` | n/a |
| `notifications_update_own_read_status` | UPDATE | same as notification SELECT | same as notification SELECT |
| `attachments_select_authorized` | SELECT | `attachments.workspace_id = private.current_workspace_id() and (private.is_management() or attachments.owner_id = private.current_active_profile_id() or (attachments.task_id is not null and private.can_read_task(attachments.task_id)) or (attachments.submission_id is not null and private.can_read_submission(attachments.submission_id)) or (attachments.brand_id is not null and private.can_read_brand(attachments.brand_id)))` | n/a |

No clause is `USING (true)` or `WITH CHECK (true)`.

## 12. Exact grants and revocations

Start by revoking all business access:

```sql
revoke all privileges on all tables in schema public
from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public
from anon, authenticated, service_role;
```

Do not use an unrestricted default-privilege grant. Then grant:

```sql
grant select on public.workspaces to authenticated;
grant select on public.profiles to authenticated;
grant update (
  full_name, phone, timezone, bio, avatar_path, avatar_url
) on public.profiles to authenticated;

grant select, insert, delete
on public.notification_preferences to authenticated;
grant update (
  new_task_assignments,
  deadline_reminders,
  revision_requests,
  approval_updates,
  publishing_updates,
  email_enabled,
  in_app_enabled
) on public.notification_preferences to authenticated;

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

grant update (read_at)
on public.notifications to authenticated;
```

Grant `EXECUTE` to `authenticated` only on the explicitly approved helper and
business RPC signatures. Revoke `EXECUTE` from `public` and `anon` on every
new function. Revoke business RPC execution from `service_role`.

Reapply/verify the existing security-infrastructure function ACLs after the
broad revocation. `anon` receives no business-table or business-function
privileges. `service_role` receives no business-table DML and keeps only its
three approved authentication security RPCs.

## 13. Required constraints and triggers

In addition to the composite workspace foreign keys:

- Add an eligibility trigger on `task_assignees` that requires the assignee to
  be active, in the same workspace, have an employee role, and have a
  department equal to the task department. Require `assigned_by` to be active
  management in that workspace.
- Add the equivalent same-workspace/department eligibility trigger on
  `brand_members`.
- Add a task transition constraint trigger that accepts only the canonical
  graph. Role authorization remains in `transition_task`.
- Make `task_status_events` immutable with a rejecting update/delete trigger.
- Make `submission_reviews` immutable with a rejecting update/delete trigger.
- Add a submission transition constraint trigger; role and ownership checks
  remain in protected RPCs.
- Reject changes to workspace/ownership columns except inside the approved
  protected operation that derives their values.
- Require notification optional parents to belong to the same workspace and
  reject more than one source parent when the event model requires one source.
- Strengthen `attachments` from
  `num_nonnulls(task_id, submission_id, brand_id) <= 1` to an approved parent
  rule. The recommended current rule is exactly one parent for business
  attachments. Profile/avatar objects remain a separate Storage-phase design.
- Preserve soft-delete/archive semantics; ordinary clients receive no hard
  delete path for brands, tasks, submissions, notifications, or attachments.

## 14. Task lifecycle enforcement

Use `public.transition_task(task_id, expected_from, target_status, reason)`.
It must lock the task, verify the expected current state, verify the caller,
derive `updated_by`, update the task, and append one status event atomically.

Allowed transitions:

| From | To | Actor |
|---|---|---|
| `draft` | `assigned` | M after at least one eligible assignment |
| `assigned` | `in_progress` | M or assigned E |
| `in_progress` | `submitted` | M or assigned E, only through submission transaction |
| `submitted` | `revision_requested` | M |
| `submitted` | `completed` | M after an approved submission |
| `revision_requested` | `in_progress` | M or assigned E |
| `completed` | `archived` | M |
| `archived` | approved reopen target | M; decision required |

Employees receive no direct `UPDATE` grant on `tasks`. This is necessary
because column grants cannot validate a state transition, atomically append
history, or prevent an employee from changing management-owned fields in the
same statement.

The current frontend's `Approved`, `Published`, and arbitrary status controls
must later map to submission review/publish operations and the canonical task
transition RPC; they do not justify permissive task policies.

## 15. Submission approval enforcement

Submission operations must be transactional RPCs:

- `create_submission` derives `submitted_by`, `workspace_id`, type, and task
  relationship from the active assigned employee.
- `update_submission_draft` permits only own draft content fields.
- `submit_submission` validates assignment, final URL, expected status, and
  revision number, then transitions the task where applicable.
- `review_submission` requires same-workspace management, rejects
  `reviewer_id = submitted_by`, inserts immutable review history, and performs
  only `submitted/in_review -> revision_requested|approved`.
- `publish_submission` requires management and
  `approved -> published`, requires a validated published URL, and performs
  related task/notification changes atomically.
- Employees cannot approve, publish, complete, or archive any submission,
  including their own.

Workspace, task, submitter, reviewer, revision, and ownership relationships
are derived or checked under row locks. A guessed task or submission UUID must
behave as not found to an unauthorized caller.

## 16. Notification ownership rules

- `SELECT`: recipient only, with active profile and workspace match.
- `UPDATE`: recipient only, and column-level grant limits mutation to
  `read_at`.
- No authenticated user may change `recipient_id`, `workspace_id`, type,
  title, body, source links, action path, or creation fields.
- No user may read or mark another user's notification.
- Management-originated notifications use a protected RPC that validates a
  same-workspace recipient and allowlisted type/action path.
- Business-event notifications are inserted inside the relevant protected
  task/submission transaction.
- There is no ordinary hard-delete grant.

## 17. Attachment metadata rules

Storage policies remain out of scope, but metadata authorization is defined:

- management reads metadata only for same-workspace resources;
- employees read metadata they own or whose parent is an assigned task, their
  own submission, or an assigned-task brand;
- an employee cannot gain access through `owner_id` or parent IDs supplied by
  the client because metadata creation will later derive owner/workspace and
  validate exactly one authorized parent;
- updates cannot relink `workspace_id`, `owner_id`, `task_id`,
  `submission_id`, `brand_id`, bucket, or object path;
- mutation grants remain absent until the Storage phase delivers the matching
  private-bucket workflow and tests;
- profile/avatar metadata requires a separate approved parent model because
  the current `attachments` table has no `profile_id` parent.

## 18. Exact migration files to create

After approval, create in this order:

1. `supabase/migrations/202607290001_phase4_workspace_integrity.sql`
   - workspace columns/backfill;
   - composite unique constraints and foreign keys;
   - supporting indexes;
   - eligibility, immutability, and generic lifecycle triggers.
2. `supabase/migrations/202607290002_phase4_authorization_functions.sql`
   - private scalar authorization helpers;
   - protected public mutation RPCs;
   - fixed search paths, ownership, revocations, and minimal execution grants.
3. `supabase/migrations/202607290003_phase4_rls_policies_and_grants.sql`
   - explicit revocations;
   - 21 named policies;
   - exact column/table/function grants;
   - ACL verification comments.

Each migration must be transactional and independently reviewed. Do not edit
the three already-applied migration files.

## 19. Exact test files to create or modify

After approval:

- create `supabase/tests/rls_fixtures.sql`;
- create `supabase/tests/rls_authorization.sql`;
- create `supabase/tests/rls_integrity.sql`;
- modify `supabase/tests/core_schema.sql` to replace the current “zero Phase 4
  policies” assertions with exact policy names/counts, new workspace columns,
  constraints, indexes, triggers, and helper ACL assertions;
- keep `supabase/tests/auth_security.sql` and its authentication
  limiter/audit expectations unchanged except for a plan-count change only if
  an explicit new isolation assertion is approved there.

## 20. Fixture strategy

Fixtures run inside a transaction and roll back. Insert as the privileged test
runner:

- workspace A and workspace B;
- one manager and one HR in each workspace as needed;
- one graphic designer and one video editor in workspace A;
- a second employee A2 for cross-user tests;
- one employee in workspace B;
- one inactive profile;
- one `auth.users` identity with no profile;
- same-workspace and cross-workspace brands, tasks, assignments, submissions,
  reviews, notifications, and attachment metadata.

Simulate Supabase identity with tightly scoped transactions:

```sql
set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', fixture_user_id,
    'role', 'authenticated'
  )::text,
  true
);
```

Reset the role/JWT between actors. Never derive authorization from JWT
app/user metadata. Test a forged JWT metadata role/workspace and prove it has
no effect because helpers use `auth.uid()` plus protected profile data.

Use pgTAP `set_eq`, `is`, `ok`, `throws_ok`, `lives_ok`, `results_eq`,
`policies_are`, privilege inspection functions, and SQLSTATE `42501` for
expected permission failures.

## 21. Complete negative-test matrix

| Test family | Required denial |
|---|---|
| Anonymous | no business table/function access |
| Profile isolation | employee A cannot read employee B; cannot update role/activity/workspace/department/manager/email |
| Management equivalence | manager and HR produce identical allowed/denied result sets |
| Employee roles | both employee roles denied all management RPCs |
| Workspace isolation | every actor in A denied every B row and guessed B UUID |
| Account state | inactive and missing-profile identities see/mutate nothing |
| Identity trust | forged JWT/client role, owner, actor, workspace, assignee, reviewer, or recipient is ignored/rejected |
| Assignment integrity | cross-workspace, inactive, management-role, or wrong-department assignees rejected |
| Brand/task integrity | task cannot reference another-workspace brand |
| Creator integrity | client cannot spoof `created_by`, `updated_by`, or `assigned_by` |
| Task reads | employee A cannot read/update employee B task; assigned employee can read only own task |
| Task transitions | invalid edge, stale expected state, employee assign/review/complete/archive, and direct updates rejected |
| Submission integrity | unassigned employee, cross-workspace task, spoofed submitter/workspace/revision rejected |
| Approval separation | submitter cannot review/approve/publish own submission |
| Notification isolation | only recipient reads/marks read; recipient/workspace/source fields immutable |
| Attachment isolation | cross-workspace parent, unauthorized parent, multiple/no parent, and relinking rejected |
| Security infrastructure | limiter/audit tables and admin functions remain inaccessible |
| Helpers | anonymous/direct API invocation denied; null UID fails closed; no escalation or data leakage |
| Policy inventory | exactly 21 approved names; expected commands/roles; no extra policy |
| RLS inventory | every exposed table has RLS; no disabled or unrestricted policy |
| ACL inventory | no anon business privileges; no TRUNCATE/TRIGGER/REFERENCES leftovers; authenticated exact grants only |
| Service role | no business DML/RPC grants; only three approved auth-security RPCs |
| Concurrency | row locks reject duplicate/stale task and submission transitions |

“Invalid role” testing must distinguish schema and authorization:

- `app_role` rejects noncanonical stored values;
- forged JWT metadata does not alter protected profile role;
- a missing/noncanonical profile context fails closed.

## 22. Rollback strategy

Before implementation, take a local schema-only dump for comparison. Every
migration is transactional.

Rollback in reverse dependency order:

1. revoke new RPC execution, drop business policies, and restore deny-by-default
   table ACLs;
2. drop protected business RPCs and private authorization helpers;
3. drop new triggers and composite foreign keys/indexes;
4. remove denormalized child `workspace_id` columns only if rollback data
   verification proves the values are derivable and no later migration depends
   on them.

Never rollback by disabling RLS or granting broad table access. If a production
rollback is later required, deploy a reviewed forward migration; do not edit
applied migration history.

## 23. Risks and unresolved decisions

1. **Management-role assignment:** existing decisions say manager/HR backend
   permissions are equivalent but do not approve whether either may promote a
   user to `manager` or `hr`. Recommended limitation: the first
   `manage_profile_access` version may manage employee roles only and must not
   create/promote management accounts.
2. **Archived task reopen target:** “reopen permitted tasks” is approved, but
   the exact target state is not. Recommended target: `archived -> draft`,
   management only, with a status event.
3. **Attachment parent rule:** current schema permits zero parents and has no
   profile parent. Recommended Phase 4 rule: exactly one task/submission/brand
   parent; defer avatar/profile attachment modeling to Storage.
4. **Employee brand visibility:** current UI has no employee brand route.
   Recommended least privilege: only brands referenced by assigned tasks,
   exposing no brand schedules or unrelated membership rows.
5. **Management profile field scope:** management UI currently edits name,
   email, employee role, and activity. Email must remain an Auth-admin workflow,
   not a direct profile update. Confirm the exact management-editable profile
   field allowlist before implementing the RPC.
6. **Publishing transaction:** confirm whether publishing an approved
   submission also transitions its task directly to `completed` and creates
   notifications in the same transaction. Recommended: yes.
7. **Business audit events:** Phase 2B4 audit infrastructure currently supports
   authentication events only. Phase 4 mutation RPCs need a later approved
   business-audit schema/event expansion; they must not overload the current
   authentication audit enum.

## 24. Implementation order

1. Approve the unresolved decisions in section 23.
2. Add and test workspace-integrity columns, composite keys, constraints, and
   supporting indexes.
3. Add and unit-test active-profile and authorization helpers, including
   recursion tests.
4. Add protected mutation RPCs one domain at a time: profiles, brands, tasks,
   submissions, notifications.
5. Revoke all inherited business privileges.
6. Add the 21 read/self-service policies and exact grants.
7. Add fixtures and negative RLS tests.
8. Update core-schema policy inventory tests.
9. Run local reset, all pgTAP tests, application tests, TypeScript, lint, and
   production build.
10. Review query plans for policy joins and add only evidence-backed indexes.
11. Stop for approval. Do not begin frontend integration, APIs, or Storage
    policies in Phase 4A.

## 25. Final verdict

PARTIALLY SUPPORTED — requires an approved limitation

The existing schema, role model, and frontend workflows support a secure
workspace-aware RLS design, but implementation should not begin until the
management-role promotion rule, archived-task reopen target, attachment parent
model, management profile field allowlist, and publish/task transaction are
approved. The recommended least-privilege limitations above allow all other
Phase 4 work to proceed without weakening security.
