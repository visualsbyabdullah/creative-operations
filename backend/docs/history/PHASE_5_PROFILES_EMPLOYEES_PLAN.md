# Phase 5A — Profiles and Employee Management Backend-Integration Plan

## Scope, baseline, and constraints

This is a planning-only deliverable. It does not implement application code,
database changes, tests, user creation, invitations, Storage, or remote
Supabase changes.

Baseline observed on 2026-07-29:

- Branch: `backend-development`.
- Initial worktree: clean.
- `npm test`: passed, 6 files and 26/26 tests.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, including all profile, settings, and employee routes.
- Local Supabase was unavailable on 2026-07-29. Verification completed on
  2026-07-30: `npx supabase db reset` passed and `npx supabase test db` passed
  all 357/357 assertions across three files.

The approved UI must remain visually and responsively unchanged. Every server
action is a public endpoint. Authorization must be enforced independently in
the Next.js server layer and in Phase 4B database operations/RLS. The
administrative client must never be used to bypass RLS for normal business
reads or writes.

## 1. Actual frontend file inventory

### Routes

- `src/app/profile/page.tsx` — `ProfilePage`; calls `requireAppProfile`, then
  renders `ManagementProfileSettings` for Manager/HR or
  `EmployeeProfileSettings` for employee roles.
- `src/app/settings/page.tsx` — `SettingsPage`; calls `requireAppProfile` and
  renders `EmployeeSettings` for every active role.
- `src/app/employees/page.tsx` — `EmployeesPage`; calls
  `requireManagementProfile` and renders `ManagementEmployees`.
- `src/app/dashboard/page.tsx` — passes the authoritative active profile to
  employee or management dashboards.

### Profile and settings components

- `src/components/profile/EmployeeProfileSettings.tsx` —
  `EmployeeProfileSettings`; local profile form, seven notification toggles,
  avatar button, and a local-only password form.
- `src/components/profile/EmployeeSettings.tsx` — `EmployeeSettings`; a second
  local copy of the same seven preferences and a local-only password form.
- `src/components/management/ManagementProfileSettings.tsx` —
  `ManagementProfileSettings`; receives a server-loaded profile and is
  display-only.
- `src/components/layout/EmployeeHeader.tsx` — performs its own browser
  `auth.getUser()` plus direct `profiles` query for `full_name, role`; it
  displays identity and links to profile/settings.
- `src/context/EmployeeContext.tsx` — initially exposes fake employee identity,
  then calls browser `auth.getUser()` and directly selects
  `full_name, role, department`; its public `setDepartment` still permits local
  identity simulation.
- `src/config/employee.ts` — fake Abdullah Naeem and Hamza Khan employee
  identities and non-UUID IDs.

### Employee management components

- `src/components/management/ManagementEmployees.tsx` —
  `ManagementEmployees`; contains the directory table, search, Add Employee
  modal, shared add/edit fields, and all local mutations.
- `src/components/management/EmployeeDetailsDrawer.tsx` —
  `EmployeeDetailsDrawer`; displays identity, email, role, status, active and
  completed task counts, overall progress, workload status, and a five-day
  weekly series; exposes edit/save/delete callbacks.
- `src/components/ui/SystemTable.tsx` and
  `src/components/ui/SystemTable.module.css` — existing employee table
  presentation.
- `src/components/ui/PillSelect.tsx` — existing role/status input.
- `src/components/management/ManagementShell.tsx` — management page layout.
- `src/components/dashboard/ManagementDashboard.tsx` — separate hardcoded
  employee/workload list using `EmployeeDetailsDrawer`.

### Identity and greeting consumers

- `src/components/dashboard/CreativeDashboard.tsx` derives the employee
  greeting from the server-provided `profile.full_name`.
- `src/components/dashboard/ManagementDashboard.tsx` derives the management
  greeting from the server-provided `profile.full_name`.
- `src/components/dashboard/roles/EmployeeRoleDashboard.tsx`,
  `HrRoleDashboard.tsx`, and `ManagerRoleDashboard.tsx` pass the profile into
  the dashboards.

### Auth and authorization implementation

- `src/lib/auth/authorization.ts` — verifies the user with `auth.getUser`,
  explicitly selects the active profile, validates the canonical role, and
  defines management-role equivalence.
- `src/lib/auth/requireAppProfile.ts` — active-profile, employee, and
  management route guards.
- `src/app/auth/actions.ts` — hardened login, recovery, reset, and logout
  server actions with strict ad-hoc allowlists, generic errors, rate limits,
  and authentication audit integration.
- `src/app/auth/callback/route.ts` and
  `src/app/auth/signout/route.ts` — recovery and sign-out handlers.
- `src/lib/auth/persistence.ts`, `recovery-state.ts`, and
  `recovery-integration.ts` — persistence and recovery security state.
- `src/proxy.ts` and `src/lib/supabase/proxy.ts` — session refresh and route
  authentication; `/profile`, `/settings`, and `/employees` are protected.
- `src/types/auth.ts` — current `AppRole` and incomplete `EmployeeProfile`
  application types.

### Supabase clients

- `src/lib/supabase/client.ts` — browser SSR client using only publishable
  credentials.
- `src/lib/supabase/server.ts` — cookie-backed server SSR client using the
  caller session and publishable credentials; this is the correct client for
  all Phase 5 business queries/RPCs.
- `src/lib/supabase/admin.ts` — `server-only` administrative client currently
  limited by its `SecurityRpcName` union to three authentication-security RPCs.
  It must not be expanded into a general business-data repository.
- `src/lib/supabase/cookie-adapters.ts` — session/persistence cookie adapters.

## 2. Current mock/static data and mutation inventory

- `ManagementEmployees.tsx` owns `initialMembers`: four numeric-ID employees,
  static identity, role/status, task counts, progress, workload state, and
  weekly arrays.
- Employee search is a client-side substring filter across name, email, and
  display role. There is no status/role/department filter, pagination, or
  sorting control.
- Add Employee appends a `Date.now()` ID to React state. It creates no Auth
  user/profile and sends no invitation.
- Edit Employee mutates name, email, role, and status in React state. This
  incorrectly presents email as an ordinary business-profile field.
- Delete Employee removes the row from React state. The backend model permits
  deactivation, not destructive deletion.
- `EmployeeDetailsDrawer.tsx` receives only local data; its active/completed,
  progress, workload, and weekly figures have no database source.
- `EmployeeProfileSettings.tsx` initializes Abdullah’s static identity,
  email, phone, location, working hours, bio, avatar initials, and preferences.
  Save and password update only change local state/show success messages.
- `EmployeeSettings.tsx` independently initializes the same preferences and
  performs local-only saves/password updates.
- `ManagementProfileSettings.tsx` is the only profile view already populated
  by a verified server profile, but it has no edit workflow or preferences.
- `EmployeeContext.tsx` and `EmployeeHeader.tsx` contain the only direct
  browser profile reads. Neither is an acceptable source of authorization.
- `ManagementDashboard.tsx` contains a second static team list. Replacing
  `/employees` data does not authorize removal of this dashboard mock during
  Phase 5A/5B.
- No current profile/employee component implements server pagination,
  sorting, stale-write handling, or real loading/error state.

Mocks must be removed module-by-module only after the corresponding real
operation and tests pass. In particular, the management dashboard team mock
must remain until dashboard/reporting integration is separately approved.

## 3. Existing protected database operations available

Phase 4B migration
`supabase/migrations/202607290001_workspace_rls_policies.sql` provides:

- `public.update_own_profile(text, text, text, text)` for `full_name`,
  `avatar_url`, `phone`, and `timezone`; it derives the actor/workspace,
  requires an active profile, and appends `profile_updated`.
- `public.manage_profile(uuid, text, text, text, text, department_type,
  app_role, boolean, uuid)` for another same-workspace user; it requires
  Manager/HR, rejects self-management, validates role/department/manager,
  protects the last active Manager, row-locks the target, and appends profile,
  role, status, department, and manager audit events.

Relevant supporting controls:

- `profiles_select_self_or_management` allows active users to read self and
  Manager/HR to read same-workspace profiles.
- The authenticated role has SELECT only on the approved profile projection:
  `id, email, full_name, role, department, job_title, phone, timezone, bio,
  avatar_url, is_active, manager_id, created_at, updated_at`.
- `notification_preferences` has own-row SELECT/INSERT/UPDATE/DELETE RLS.
- Active-profile/workspace/management helpers fail closed for anonymous,
  inactive, missing-profile, and invalid-role callers.
- `private.business_audit_events` is append-only, forced-RLS, and inaccessible
  to ordinary clients.

The Phase 4B profile tests prove safe self update, employee denial of
management calls, missing-profile denial, Manager/HR visibility, workspace
filtering, and last-active-Manager protection. They do not yet cover every
Phase 5-required negative case.

## 4. Missing or insufficient database operations

1. There is no least-privilege list/detail projection that combines profile,
   manager display name, and task aggregates without N+1 queries.
2. Neither profile RPC accepts `expected_updated_at`; concurrent saves can
   silently overwrite each other.
3. `update_own_profile` always overwrites all four fields and reports all four
   as changed. It has no notification-preference transaction.
4. `manage_profile` always overwrites all managed fields and has no optional
   patch semantics; callers must first read and resubmit unchanged values.
5. Direct notification-preference writes are RLS-safe but cannot atomically
   update profile plus preferences or produce the desired profile audit.
6. No RPC creates an invitation/provisioning reservation or reconciles a
   partially successful Auth invitation.
7. Profile provisioning hardcodes the default workspace and derives initial
   role from Auth app metadata. This is safe only for the approved current
   single-workspace deployment and a server-controlled admin caller.
8. No employee workload/read model defines weekly percentages or
   `On Track`/`Review Pending`/`Delayed`.
9. Avatar upload/storage is absent; only an HTTPS `avatar_url` field exists.

Before frontend integration, add a new migration (not edit Phase 4 history)
containing:

- `public.get_employee_directory(p_search, p_roles, p_departments,
  p_is_active, p_sort, p_direction, p_limit, p_cursor)` returning only the
  approved list projection plus `total_count` or a stable cursor.
- `public.get_employee_detail(p_profile_id)` returning the approved detail
  projection and aggregate task summary.
- versioned replacements such as `update_own_profile_v2` and
  `manage_profile_v2` with `p_expected_updated_at`, row locks, explicit
  optional fields, exact change detection, and a returned safe projection.
- Prefer one protected `update_own_settings_v2` transaction if profile and
  preferences save together in the existing UI. Otherwise use two explicit
  actions and clearly show partial success; atomic combined save is safer.

All new reads should be `SECURITY DEFINER` protected read RPCs with a fixed
safe `search_path`, `row_security = off`, active-caller checks, explicit
workspace predicates, minimal return columns, and execution only for
`authenticated`. A security-invoker view alone cannot safely express
validated dynamic sorting, aggregate workload, and one-query pagination.
Direct RLS SELECT remains appropriate for the single self-profile read and
own preferences.

## 5. Self-profile read architecture

`ProfilePage` and `SettingsPage` should call a shared server service using the
normal cookie-backed Supabase client:

1. `requireAppProfile()` establishes authenticated, existing, active,
   canonical identity.
2. Explicitly select self fields from `profiles`:
   `id, email, full_name, role, department, job_title, phone, timezone,
   avatar_url, is_active, manager_id, updated_at`.
3. Select the caller’s single `notification_preferences` row. If absent,
   return schema defaults in the view model; create it only on the first
   explicit save to avoid a read causing mutation.
4. Map database enums/column names to the existing UI labels in a pure mapper.
5. Pass the same server-loaded view model into both profile and settings
   components. Do not allow `EmployeeContext` or header fallback data to
   overwrite it.

Email, role, department, status, job title, and manager are read-only for
self-service. The dashboard continues receiving `profiles.full_name` from
`requireAppProfile`; after a successful save use `revalidatePath("/profile")`,
`revalidatePath("/settings")`, and `revalidatePath("/dashboard")`.

## 6. Self-profile update architecture

Create `updateOwnProfileAction(input: unknown)`. It must:

- validate with a strict server schema;
- call `requireAppProfile`/a non-redirecting equivalent suitable for stable
  action errors;
- rate-limit an authenticated profile write;
- call only `update_own_profile_v2`/`update_own_settings_v2` using the caller’s
  normal Supabase session;
- never accept user ID, role, email, status, workspace, department, manager,
  ownership, or audit actor;
- map PostgreSQL/Supabase failures to stable application codes;
- revalidate affected pages only after success.

The UI may display location, working hours, and bio only as unchanged static
presentation until product/schema approval. They are not on the approved
self-writable allowlist and must not be submitted. Email must become read-only.
Timezone needs an existing-layout input (relabel the unsupported location
field only if product approves that semantic change; otherwise do not silently
repurpose it).

## 7. Employee list architecture

Use one protected read RPC, not one profile query followed by per-row task
queries. The list return shape is:

```text
id
full_name
email
avatar_url
role
department
is_active
manager_id
manager_full_name
active_task_count
completed_task_count
review_pending_count
delayed_task_count
progress_percent
workload_status
updated_at
next_cursor or total_count
```

`active_task_count` counts nonterminal assigned work; `completed_task_count`
counts completed tasks within an approved reporting window. `progress_percent`,
weekly activity, and workload status need one approved definition before they
can be authoritative. Recommended initial limitation: derive counts from all
non-archived assignments, define progress as completed / (completed + active),
and omit/fallback the five-day weekly graph until Tasks/reporting integration.
Do not fabricate zeros and present them as measured workload.

The employee directory may include all same-workspace profiles, including
Manager/HR, because canonical role assignment and last-Manager management are
approved. The current subtitle “Manage Graphic Designers and Video Editors”
and role options expose only employee roles; adding management role options is
a product-visible behavior decision, not merely backend wiring.

## 8. Employee details architecture

Opening the drawer should use the selected row immediately for a responsive
shell, then request `getEmployeeDetailAction({ profileId })`. The protected
detail RPC must return one same-workspace permitted row, the manager’s safe
identity, and aggregates in one query. Unauthorized/cross-workspace IDs must
map to the same `not_found` result.

Detail-only fields:

- safe contact: email, phone;
- account: role, department, active status, manager;
- profile: full name, avatar URL, timezone, job title, updated timestamp;
- aggregate counts and approved workload summary.

Never return workspace ID, auth metadata, password/hash, sessions, tokens,
refresh/recovery data, ownership internals, avatar storage paths, or audit
metadata. `EmployeeDetailsDrawer` should retain its layout and render skeleton,
not-found, and retry content inside the current panel.

## 9. Management update architecture

Create `updateManagedEmployeeAction(input: unknown)` and use
`manage_profile_v2`. The server action:

- verifies the normal user session and active Manager/HR profile;
- accepts the target UUID and only approved fields;
- rejects target self before the RPC, with the database repeating enforcement;
- never accepts workspace or email;
- validates role/department consistency and manager eligibility;
- supplies `expectedUpdatedAt`;
- maps last-active-Manager and stale-version failures separately;
- rate-limits and relies on the RPC’s atomic business audit events.

Replace “Delete Employee” behavior with a confirmation that invokes
deactivation. Preserve the button’s placement/style but change its accessible
label and copy to “Deactivate Employee”; hard deletion is not approved.
Activation uses the same protected management operation. Role, department,
and manager controls must be added only within the existing form/modal layout.

## 10. Employee creation and invitation architecture

### Evaluated options

- Admin `createUser` with a generated or supplied password is rejected for
  this product flow: it introduces password handling, temporary credential
  delivery, and a browser-leak/logging risk.
- Admin `createUser` followed by password setup is still a two-channel
  provisioning workflow and risks an unusable active account.
- `auth.admin.inviteUserByEmail` lets the employee establish their own
  password and is the safest supported fit for the existing email-based Add
  Employee UI.

### Recommended flow

Implement this as **Phase 5B**, after profile reads/updates, because it adds a
distinct administrative boundary and failure-reconciliation requirements:

1. `inviteEmployeeAction` validates and rate-limits input.
2. With the normal cookie-backed client, it verifies authenticated active
   Manager/HR and derives the actor workspace.
3. A narrow `server-only` invitation gateway invokes only
   `auth.admin.inviteUserByEmail`; no admin client is returned to a repository
   or Client Component.
4. The invitation redirect is a fixed allowlisted application URL. Never
   generate, return, or log a password or invitation link.
5. The existing provisioning trigger creates an inactive profile. Server-
   controlled metadata/defaults must ensure the current workspace and desired
   canonical role cannot be supplied by the browser as authority.
6. The action then uses the **actor’s normal RLS-controlled client** and a
   protected provisioning/finalization RPC to assign approved role,
   department, and manager while leaving `is_active = false` by default.
7. Activation is a separate explicit management action after invitation or
   onboarding approval.
8. Return a generic `invitation_accepted` response for duplicate/provider
   cases where enumeration is a concern. Record only safe result/reason codes.

Auth invitation and PostgreSQL profile finalization cannot be one database
transaction. Phase 5B therefore needs an idempotent reconciliation design:
retry finalization by user ID, detect an existing inactive profile, never send
multiple invitations blindly, and expose a safe management retry state. If
Supabase does not expose the invited user ID reliably in the installed SDK,
use a server-generated provisioning intent keyed by a one-way normalized-email
digest; do not query Auth by raw email from the browser.

## 11. Administrative-client boundary

- Keep `src/lib/supabase/admin.ts` server-only and its authentication-security
  RPC surface unchanged.
- Create a separate `src/lib/supabase/admin-auth.ts` marked `server-only`.
  Export only a narrow `inviteUser` function with a typed safe result.
- Add an import-boundary test proving Client Components, profile/employee
  repositories, and business services cannot import `admin-auth.ts`.
- Administrative credentials exist only in the server environment and are
  never serialized, logged, passed to a Client Component, or prefixed
  `NEXT_PUBLIC_`.
- All directory/detail/update business operations use the normal session
  client and RLS/protected RPCs. The admin client is used only for Supabase Auth
  invitation lifecycle operations.

## 12. Exact fields exposed to each role

### Any active user reading self

`id, full_name, email (read-only), avatar_url, phone, timezone, role,
department, job_title, is_active, manager_id, updated_at` plus all seven own
notification preferences. Do not expose `workspace_id` to the UI.

### Employee roles reading others

No employee-directory or employee-detail endpoint. Any later coworker
directory must be a separate decision limited to `id, full_name, role,
department, avatar_url`.

### Manager/HR directory list

`id, full_name, email, avatar_url, role, department, is_active, manager_id,
manager_full_name, approved aggregate counts/status, updated_at`.

### Manager/HR detail

The list fields plus `phone, timezone, job_title` and approved aggregate
details. Notification preferences for another user should not be exposed
unless management editing of those preferences is explicitly confirmed.

### Never exposed

`workspace_id`, `avatar_path`, auth password/hash, identities metadata,
service keys, access/refresh/recovery tokens, sessions, invitation links,
private audit records, internal ownership fields, and raw provider/database
errors.

## 13. Exact validation schemas required

Add Zod during implementation (it is not currently installed), or implement
equivalent strict schemas if package approval is denied. Every object uses
`.strict()`:

- `uuidSchema`: canonical UUID string.
- `fullNameSchema`: trimmed Unicode text, 1–120 characters, reject controls.
- `phoneSchema`: trimmed nullable string, 3–32 characters, conservative
  `+`, digits, spaces, parentheses, dots, and hyphens only.
- `timezoneSchema`: 1–64 characters and must resolve through
  `Intl.DateTimeFormat`/an approved IANA allowlist.
- `avatarUrlSchema`: nullable HTTPS URL, maximum 2048; restrict host/path if
  avatars later move to private Storage.
- `notificationPreferencesSchema`: exactly
  `newTaskAssignments, deadlineReminders, revisionRequests, approvalUpdates,
  publishingUpdates, emailEnabled, inAppEnabled`, all booleans.
- `canonicalRoleSchema`: `manager | hr | graphic_designer | video_editor`.
- `departmentSchema`: `graphic_design | video_editing | null`, with a
  role/department `superRefine`.
- `managerIdSchema`: nullable UUID; eligibility remains database-enforced.
- `activeStatusSchema`: boolean.
- `searchSchema`: trimmed, 0–100 characters, reject controls and wildcard
  syntax as literal input.
- `employeeFiltersSchema`: strict arrays of canonical roles/departments plus
  nullable active status; cap array lengths and deduplicate.
- `paginationSchema`: limit integer 1–100 (default 25), opaque cursor maximum
  512; never accept arbitrary offset without a bounded maximum.
- `sortSchema`: field allowlist `full_name | email | role | department |
  is_active | created_at | updated_at`, direction `asc | desc`.
- `selfProfileUpdateSchema`: full name, avatar URL, phone, timezone,
  preferences, expected updated timestamp; no other fields.
- `managedEmployeeUpdateSchema`: target ID, approved profile/access fields,
  expected updated timestamp; no email/workspace/actor.
- `inviteEmployeeSchema`: normalized email (maximum 254), full name,
  canonical role, compatible department, nullable manager ID; default inactive
  is server-derived and cannot be overridden.

Never spread a parsed request body into RPC parameters; construct each
parameter explicitly.

## 14. Exact Server Actions/Route Handlers to create

Create:

- `src/app/profile/actions.ts`
  - `updateOwnProfileAction`
  - `updateNotificationPreferencesAction` only if combined atomic settings RPC
    is not approved.
- `src/app/employees/actions.ts`
  - `listEmployeesAction`
  - `getEmployeeDetailAction`
  - `updateManagedEmployeeAction`
  - `setEmployeeActiveAction` (a narrow wrapper is preferable for explicit
    activate/deactivate confirmations).
- Phase 5B only: `src/app/employees/invite-actions.ts`
  - `inviteEmployeeAction`

Server-rendered initial reads should be called directly from page/services,
not through self-HTTP. Server Actions handle user-triggered mutations and
subsequent pagination/detail fetches. No Route Handler is required unless a
future non-React client is approved. Every action returns a discriminated safe
result such as `{ok:false, code, fieldErrors?, requestId?}`.

## 15. Exact service/repository files to create

- `src/lib/profiles/profile-schemas.ts`
- `src/lib/profiles/profile-types.ts`
- `src/lib/profiles/profile-mappers.ts`
- `src/lib/profiles/profile-repository.ts` — normal session client only.
- `src/lib/profiles/profile-service.ts` — auth guard orchestration, validation,
  safe error mapping, revalidation.
- `src/lib/employees/employee-schemas.ts`
- `src/lib/employees/employee-types.ts`
- `src/lib/employees/employee-mappers.ts`
- `src/lib/employees/employee-repository.ts` — protected read/write RPC calls
  through the caller session.
- `src/lib/employees/employee-service.ts`
- `src/lib/security/business-rate-limit.ts` — integration hook using an
  approved atomic backend, not in-memory production counters.
- Phase 5B: `src/lib/supabase/admin-auth.ts`
- Phase 5B: `src/lib/employees/invitation-service.ts`

Generated database types should be introduced once the local reset is green;
do not hand-maintain RPC return types indefinitely.

## 16. Exact frontend files to modify during implementation

- `src/app/profile/page.tsx` — load and pass the real profile/settings model.
- `src/app/settings/page.tsx` — load and pass the same preferences model.
- `src/app/employees/page.tsx` — server-load the first authorized page.
- `src/components/profile/EmployeeProfileSettings.tsx` — initialize from
  props, make forbidden fields read-only, invoke real actions, preserve layout.
- `src/components/profile/EmployeeSettings.tsx` — initialize real
  preferences and invoke the shared save action.
- `src/components/management/ManagementProfileSettings.tsx` — only if
  management self-editing is approved; otherwise keep display-only.
- `src/components/management/ManagementEmployees.tsx` — replace local dataset
  and mutations with server results; retain table/modal/search/layout.
- `src/components/management/EmployeeDetailsDrawer.tsx` — accept safe real
  detail/loading/error models; replace deletion with deactivation.
- `src/components/layout/EmployeeHeader.tsx` — receive authoritative identity
  from server/provider and remove duplicate browser profile query.
- `src/context/EmployeeContext.tsx` — remove department identity switching as
  authority; use a server-provided authenticated employee model.
- `src/config/employee.ts` — retain only temporary fallback/mapping data until
  every direct consumer has a real source; do not delete prematurely.
- `src/types/auth.ts` — add approved profile fields or replace with generated
  and view-model types.

Do not modify `ManagementDashboard.tsx` in this phase except, if necessary, to
keep the header identity source consistent. Its workload mock belongs to the
dashboard/reporting phase.

## 17. Error and loading-state mapping

| Condition | Stable code/UI behavior |
|---|---|
| Initial profile/list load | Existing page shell plus inline skeleton; no mock flash |
| Empty employee list | Existing table card with “No employees found”; preserve Add Employee |
| Search/filter empty | “No employees match these filters” and clear-filter action |
| Validation | `validation_failed`; attach field messages, retain entered values |
| Unauthenticated | redirect to `/login` through existing sign-out/session flow |
| Inactive | redirect through `/auth/signout?reason=inactive` |
| Unauthorized/cross-workspace | `not_found` for target reads; `forbidden` for actions |
| Duplicate/invitation provider issue | generic `invitation_not_completed`; do not reveal Auth internals |
| Role change denied | `role_change_denied` |
| Last active Manager | `last_manager_protected` with clear safe copy |
| Stale update | `stale_update`; keep draft and offer Reload/Review latest |
| Network/dependency | `temporarily_unavailable`; retain draft and show Retry |
| Successful profile save | existing success banner; revalidated authoritative data |
| Successful employee update | update row/drawer from returned projection, then revalidate |

Raw Supabase messages, SQLSTATE text, stack traces, Auth errors, and database
constraint names must never reach the browser.

## 18. Search, filter, pagination, and sorting design

- Debounce search by approximately 300 ms and ignore stale responses with a
  request sequence/transition.
- Search only normalized `full_name` and email; optionally canonical/display
  role. Use parameterized SQL. Escape `%`, `_`, and backslash if using
  `ILIKE`, or use a reviewed indexed search expression.
- Apply workspace and authorization inside the protected RPC before search.
- Use keyset/cursor pagination with a deterministic tie-breaker `(sort_field,
  id)`. Default page size 25, maximum 100.
- Allow only enumerated sort fields/directions; implement SQL branches, never
  concatenate raw client identifiers into dynamic SQL.
- Filters are canonical role, department, and active status. The UI currently
  has no filter/sort/pagination controls; add controls only by extending the
  existing toolbar/table patterns without redesign.
- Add evidence-backed indexes after `EXPLAIN` on realistic data, likely
  workspace plus normalized full name/email, role, department, activity, and
  stable ID.
- Return list rows and count/cursor from one RPC call. Do not perform one
  manager/profile/task query per employee.

## 19. Concurrency design

Profile and management updates require optimistic concurrency:

- include the row’s `updated_at` in every edit model;
- `SELECT ... FOR UPDATE` in the RPC;
- update only when `updated_at = p_expected_updated_at`;
- return a dedicated stale SQLSTATE/application code when it differs;
- database constraints and last-Manager checks execute under the same lock;
- return the new projection and new `updated_at`.

Do not automatically retry writes because a retry could overwrite a manager’s
newer decision. Reload current data and ask the user to review. Idempotent list
and detail reads may retry once on transient network failure. Invitation
reconciliation uses a separate idempotency key and never resends blindly.

## 20. Rate-limit and audit integration

Initial configurable recommendations:

- profile/preference writes: 20 per 10 minutes per actor;
- list/search: 120 per minute per actor, with stricter limits for empty broad
  searches;
- detail reads: 120 per minute per actor;
- management updates/activation: 30 per hour per actor;
- invitations: 10 per hour per actor and a lower per-target digest limit.

Use atomic counters and fail closed for management mutations/invitations when
the limiter dependency is unavailable. Reads may use a reviewed degraded mode.

`update_own_profile_v2` and `manage_profile_v2` must append exact business
events in the same database transaction. Invitation initiation/outcome needs
a separate safe server audit integration point because the Auth admin call is
outside the business database transaction. Never audit raw email, links,
passwords, tokens, service keys, cookies, or whole request bodies; use target
user ID when available and a one-way digest otherwise.

## 21. Unit/Vitest plan

- strict acceptance/rejection for every schema and unknown field;
- UUID, name, phone, timezone, avatar URL, pagination, sort, and filter edges;
- role/department normalization and incompatible combinations;
- self and management writable-field allowlists;
- preference database/UI mapping;
- safe SQL/Supabase error-to-code mapping;
- stale and last-Manager result mapping;
- cursor encode/decode and sort allowlist;
- service guards invoked before repository calls;
- repository parameter construction proves actor/workspace/email are not
  spread from input;
- invitation input, generic duplicate behavior, idempotency, and partial
  failure reconciliation;
- static/import-boundary test proving admin-auth cannot enter Client
  Components or business repositories;
- dashboard greeting mapper retains authoritative `profiles.full_name`;
- mock fallback is used only for an explicitly unintegrated module.

## 22. pgTAP plan

Extend the current 357-test baseline only after it is locally reproduced:

- self safe-profile update succeeds and exact audit event is appended;
- self attempts to update role, workspace, department, manager, email, active
  status, another profile, or unknown field fail;
- management may update another same-workspace approved profile field;
- Manager and HR have identical list/detail/update results;
- employee roles cannot call list/detail-management RPCs;
- cross-user employee update and cross-workspace list/detail/update fail;
- last active Manager cannot be demoted or deactivated under concurrent locks;
- caller cannot change own role through management RPC;
- inactive and missing-profile callers fail closed;
- invalid canonical role/role-department combination fails;
- manager ID must be eligible and in the same workspace;
- workspace remains immutable;
- optimistic stale timestamp fails without mutation/audit;
- successful sensitive changes append exact immutable audit events;
- read RPCs expose exactly approved columns and no secrets;
- search/filter/sort/cursor are workspace-scoped, deterministic, and bounded;
- aggregate query does not count another workspace or unauthorized tasks;
- notification-preference own-row isolation remains intact;
- function ACLs deny anon/service role and grant only authenticated;
- direct table writes remain denied.

Add a two-session concurrency harness for last-Manager and stale-update races;
single-transaction pgTAP alone is insufficient to prove lock behavior.

## 23. Browser/manual test plan

- Employee, Manager, and HR profile pages load real data with no mock flash.
- Both dashboard greetings use the persisted `profiles.full_name`.
- Safe self changes and seven preferences persist after refresh.
- Forbidden/read-only fields cannot be submitted by UI tampering.
- Employee list first page, empty state, search, filters, sort, next/previous
  pagination, and URL/back navigation behave consistently.
- Drawer shows the selected record and safe aggregates; guessed/cross-
  workspace UUIDs do not disclose a row.
- Manager and HR can edit another user identically.
- Role, department, manager, activation, and deactivation persist on refresh.
- Self-role change and last-Manager deactivation/demotion display safe denial.
- Concurrent two-browser edits produce a stale warning, not silent overwrite.
- Invitation sends no password/link to the browser, creates an inactive
  profile, handles duplicate/retry generically, and requires explicit
  activation.
- Employee roles do not see or invoke management controls.
- Network failures preserve form data and allow retry.
- Existing responsive table, drawer, modal, profile forms, loading states, and
  empty states remain visually unchanged.

## 24. Implementation order

1. Start local Supabase; reproduce reset, 357/357 pgTAP, and all application
   baseline checks.
2. Approve the product/security decisions in section 26.
3. Define generated database types and strict schemas/view models.
4. Add migration for safe list/detail RPCs and optimistic versioned profile
   RPCs; add pgTAP and concurrency tests.
5. Build normal-session repositories/services/actions and unit tests.
6. Integrate self-profile and preferences first; retain unsupported static
   display values until approved.
7. Integrate employee list/search/filter/sort/pagination.
8. Integrate drawer detail and management edits.
9. Replace destructive delete UI behavior with protected deactivation.
10. Re-run reset, all pgTAP, unit tests, TypeScript, lint, build, diff review,
    and browser tests.
11. Stop for review.
12. Implement invitation/admin boundary separately as Phase 5B, then repeat
    the full validation suite. Do not start Tasks, reporting, Notifications,
    Brands, or Storage integration.

## 25. Rollback strategy

- Keep existing component layout and module-specific mocks available until
  each real module passes all tests; rollback a frontend module by restoring
  its data adapter, not by weakening RLS.
- Database changes are additive, transactional forward migrations. If
  rollback is needed, deploy a reviewed forward migration that revokes new
  RPC execution and drops only the new functions/indexes after dependency
  checks.
- Never rollback by disabling RLS, broadening grants, using the service role
  for business data, editing applied migration history, or deleting profiles.
- Invitation rollout should be guarded by a server feature flag. Disabling it
  stops new invitations while preserving already-created inactive accounts
  for reconciliation.
- Stale/partial invitation records remain inactive and auditable; do not
  automatically delete Auth users as compensation.

## 26. Risks, blockers, and decisions requiring approval

### Hard blockers

1. Existing profile RPCs lack optimistic concurrency and safe list/detail
   projections; a new migration is required before integration.
2. Employee creation spans Supabase Auth and PostgreSQL and cannot be atomic.
   An idempotent Phase 5B reconciliation design is required.

### Product/security decisions requiring approval

1. Approve email-invitation/self-password setup as the only Add Employee
   creation method; reject temporary-password workflows.
2. Approve employee creation as separate Phase 5B and inactive-by-default
   until explicit activation.
3. Confirm whether the Employees page lists/manages Manager and HR accounts.
   The backend allows it, but the current UI advertises only designers/editors.
4. Approve replacing “Delete Employee” with deactivation; no hard delete.
5. Approve authoritative definitions and reporting window for active,
   completed, review-pending, delayed, progress percentage, workload label,
   and five-day activity. Until then, the weekly graph remains a clearly
   identified fallback/unavailable state.
6. Decide how the existing unsupported location, working-hours, and bio fields
   behave. Recommendation: read-only presentation/fallback; do not persist
   them in Phase 5 because the approved self allowlist excludes them.
7. Approve making profile email read-only and keeping email change out of the
   business profile flow.
8. Decide whether Manager/HR may edit another user’s notification
   preferences. Recommendation: no; preferences remain user-owned.
9. Approve avatar handling for this phase: HTTPS `avatar_url` only, with actual
   upload deferred to Storage. The camera button must remain disabled or show
   “upload coming later” until private avatar Storage exists.
10. Approve keyset pagination and the enumerated sort/filter fields without a
    visual redesign.
11. Approve optimistic concurrency through `updated_at` and no automatic
    write retry.
12. Approve the proposed per-operation rate-limit policy and degraded/fail-
    closed behavior.
13. Confirm the current single-workspace limitation for invitation
    provisioning. Multi-workspace invitation requires replacing the hardcoded
    default workspace provisioning design.

## 27. Final verdict

PARTIALLY SUPPORTED — requires an approved limitation

Self-profile reads/updates and same-workspace management updates are supported
by the existing session, RLS, and protected Phase 4B operations, but safe
employee list/detail projections, optimistic concurrency, workload semantics,
avatar upload, and idempotent invitation provisioning are not yet complete.
The database baseline is reproduced. Implementation is safe only after the
missing protected operations are added and the section 26 limitations are
approved.
