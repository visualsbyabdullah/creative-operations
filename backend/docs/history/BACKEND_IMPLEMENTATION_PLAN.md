# Backend Implementation Plan

This plan stops at planning; no implementation is included.

## Phase 2: authentication and session hardening

Resolve the open decisions on `/`, settings, logout scope, and Remember Me. Add typed server validation and generic errors; make Remember Me control session persistence rather than email storage; validate active profile immediately after login; restrict recovery callback destinations; require a valid recovery session/AAL for reset; protect all intended routes consistently; consolidate profile loading. Add authentication and recovery rate limits/audit events.

Expected areas later: auth components, callback, proxy, profile guard, a server auth service/action, validation schemas, and tests. No source changes should begin until behavior questions are approved.

## Phase 3: schema migrations

Create version-controlled enums/tables from `DATABASE_SCHEMA_PROPOSAL.md` after workspace, status-transition, delete/archive, and upload questions are answered. Add profile provisioning compatible with existing Supabase Auth users. Generate TypeScript database types. Do not remove any module mock yet.

## Phase 4: RLS and authorization tests

Enable RLS on every exposed table. Implement active-profile, role, workspace, assignment, and ownership policies. Build automated tests for anonymous access, inactive profiles, each role, cross-user UUID substitution, cross-workspace IDs, forbidden field changes, and direct Supabase calls.

## Phase 5: profiles and employees

Integrate management employee list/drawer and employee profile/settings. Implement invite/provisioning, safe edits, deactivation, avatar storage if approved, preferences, and real password change with reauthentication. Preserve existing UI.

## Phase 6: brands

Persist brands, platform sets, memberships, schedules, and status changes. Replace `creativeops-brands` only after schema, services, RLS, validation, tests, and build all pass. Decide whether brand membership is an access boundary.

## Phase 7: tasks, assignments, planner, and schedule

Unify task enums and fields currently duplicated across `WeeklyPlanner.tsx`, `MyTasks.tsx`, `MySchedule.tsx`, and dashboards. Implement management CRUD/assignment and employee-owned reads/status transitions. Derive schedules and metrics from real assignments. Use transactions for task plus platform/assignee writes and immutable status events.

## Phase 8: submissions and review

Unify employee and management submission models. Implement create/submit/revise/review/approve/publish transitions, review history, ownership enforcement, and notifications. Determine whether URLs or private uploaded artifacts are authoritative.

## Phase 9: notifications

Generate recipient-specific notifications from business events. Implement own-only list/read operations and preferences. Replace both employee and management static notifications.

## Phase 10: private storage

If confirmed by the frontend/product decision, create private avatar/task/submission buckets, MIME/size allowlists, generated paths, signed URLs, policy tests, and attachment metadata.

## Phase 11: reporting, audit logging, and rate limiting

Replace dashboard metrics and generated brand history with authorized aggregate queries. Add append-only audit records and configurable atomic rate limits. Verify that reporting cannot disclose another workspace/user.

## Phase 12: final integration and readiness

For each module, remove mock data only after its real replacement passes unit/integration/RLS tests, `npx tsc --noEmit`, lint, and production build. Complete IDOR/BOLA, inactive-session, recovery, upload, and role-equivalence testing. Review query indexes with real query plans, retention, backups, observability, secrets, and deployment configuration.

## Safest ordering rationale

Identity/session correctness precedes schema access; schema precedes RLS; RLS tests precede any browser integration. Profiles establish ownership, brands establish planning references, tasks establish assignments, and submissions depend on tasks. Notifications, storage, reporting, and operational controls then attach to already-authorized domain events.

## Approval gates

Stop for review after each phase. Never apply migrations to production, expose a service-role key, weaken RLS, or remove a mock before its complete secure replacement is verified.

