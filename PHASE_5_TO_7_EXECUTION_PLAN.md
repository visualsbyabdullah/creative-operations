# Phase 5B–7 Execution Plan

## Baseline

- Branch: `backend-development`.
- Initial worktree: clean.
- Local reset: passed.
- pgTAP baseline: 357 assertions passed across three files.
- Vitest baseline: 26 tests passed across six files.
- TypeScript, ESLint, and production build: passed.
- Only `.env.example` is tracked; administrative keys are server-only and no
  administrative key uses a `NEXT_PUBLIC_` name.

## Actual files discovered

- Database: four migrations under `supabase/migrations` and three pgTAP suites
  under `supabase/tests`.
- Security/auth: `src/lib/auth/**`, `src/lib/security/**`,
  `src/lib/supabase/{client,server,admin}.ts`, `src/proxy.ts`, and auth actions
  and routes.
- Profiles/employees: profile, settings, employees pages; profile components;
  `ManagementEmployees`, `EmployeeDetailsDrawer`, `EmployeeHeader`,
  `EmployeeContext`, `src/config/employee.ts`, and `src/types/auth.ts`.
- Tasks: tasks page and `src/components/tasks/MyTasks.tsx`; task references also
  exist in dashboard, planner, schedule, and brand modules but those unrelated
  modules remain outside this integration.
- Submissions: submissions page, `SubmissionsManagement`, and
  `ManagementSubmissions`.
- Notifications: notifications page, `NotificationsCenter`,
  `ManagementNotifications`, and the shared header notification affordance.

## Expected additive migrations

1. Phase 5B profile directory, versioned profile/settings mutations,
   invitation intent/finalization/reconciliation, and safe aggregates.
2. Phase 6 task list/detail, versioned/idempotent task mutations, assignment,
   transition, notification, and audit operations missing from Phase 4B.
3. Phase 7 submission list/detail/versioned lifecycle and notification
   list/read/unread/mark-all operations missing from Phase 4B.

Previously applied migration history will not be edited.

## Expected server modules

- Shared strict validation and safe action-result helpers.
- Profile repository/service/schema/types/mappers and profile actions.
- Employee repository/service/schema/types/mappers, employee actions,
  server-only admin-auth gateway, and invitation service/action.
- Task repository/service/schema/types/mappers and actions.
- Submission repository/service/schema/types/mappers and actions.
- Notification repository/service/schema/types/mappers and actions.
- Database-backed business rate-limit adapter.

All business repositories use the caller's normal cookie-backed client.
Administrative credentials are limited to the narrow Auth invitation gateway.

## Expected frontend modules

- Profiles/employees: the three domain pages, both employee profile/settings
  components, management employee list/drawer, shared header/context, and
  related types/config only where required.
- Tasks: tasks page and `MyTasks`.
- Submissions: submissions page, employee submissions, and management
  submissions.
- Notifications: notifications page, both notification components, and header
  affordances where required.

Existing structure, styling, responsive behavior, and truthful fallback states
will be preserved. Planner, Schedule, dashboard reporting, Brands, and Storage
remain out of scope.

## Expected tests

- Extend pgTAP for every new RPC ACL, role/ownership/workspace denial,
  optimistic-concurrency conflict, idempotency path, projection, notification,
  audit, and atomic lifecycle requirement.
- Add Vitest coverage for strict schemas, mappings, cursors, safe errors,
  transition allowlists, idempotency, email digests, and admin import
  boundaries.
- Run reset, pgTAP, Vitest, TypeScript, ESLint, production build,
  `git diff --check`, and `git status --short` after each stage.

## Stage boundaries

1. Stage 1 ends only after profiles/employees/invitations pass the complete
   validation suite.
2. Stage 2 begins only with Stage 1 green and ends only after tasks and
   assignments pass the complete suite.
3. Stage 3 begins only with Stage 2 green and ends only after submissions and
   notifications pass the complete suite.
4. A real authorization failure, destructive migration issue, or unresolved
   approved-product conflict stops progression.

## Rollback strategy

- Migrations are additive and transactional. Rollback is a reviewed forward
  migration that revokes new execution and removes only new functions,
  indexes, or tables after dependency checks.
- Never disable RLS, broaden base-table grants, edit applied history, delete
  employee/business history, or use the administrative client for business
  data.
- Frontend integration remains adapter-based; retain a mock only until its
  exact real replacement is verified.
- Invitation failures preserve inactive profiles/intents for idempotent
  reconciliation rather than deleting Auth users.

## Resolved and remaining mismatches

- Approved decisions resolve all Phase 5A gates: invitation-only creation,
  inactive-by-default accounts, all canonical directory roles, deactivation,
  workload definitions, read-only unsupported fields, HTTPS avatar URLs,
  keyset pagination, optimistic concurrency, and single-workspace invitation.
- Existing UI labels must map to canonical database statuses without adding
  enums.
- Five-day employee activity, avatar/file uploads, Planner, Schedule, and
  reporting remain truthful unavailable/fallback states.
- Existing Phase 4 task/submission RPCs are safe foundations but lack complete
  list/detail, expected-timestamp, idempotency, and notification-read coverage;
  they will be versioned or supplemented, not weakened.
