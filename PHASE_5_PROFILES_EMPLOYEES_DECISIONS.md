# Phase 5 — Approved Profiles and Employees Decisions

## Employee invitation

Employee creation must use Supabase Auth email invitation.

Approved flow:

- Manager/HR initiates invitation.
- Employee establishes their own password.
- Temporary passwords are prohibited.
- Admin credentials remain server-only.
- Invitation links, tokens and passwords must never be returned or logged.
- Invitation result must remain generic where email enumeration is possible.

## Account activation

Newly invited employees remain inactive by default.

Activation is a separate explicit Manager/HR operation after invitation or onboarding approval.

An inactive account receives no business-data access.

## Employee directory roles

The Employees page may list and manage all same-workspace canonical roles:

- manager
- hr
- graphic_designer
- video_editor

Role filters must remain available.

Existing UI layout must not be redesigned.

## Employee deletion

Permanent employee deletion is not supported.

The existing Delete Employee action must be replaced with account deactivation.

Historical task, assignment, submission and audit references must remain intact.

## Workload metrics

Definitions:

- active_task_count:
  assigned, in_progress, revision_requested and submitted tasks

- completed_task_count:
  tasks completed during the trailing 30-day reporting window

- review_pending_count:
  submitted tasks awaiting management review

- delayed_task_count:
  nonterminal tasks whose due date has passed

- progress_percent:
  completed_task_count divided by completed_task_count plus active_task_count,
  multiplied by 100

When the denominator is zero, return null and display an unavailable marker rather than a fabricated zero.

Workload label priority:

1. Delayed, when delayed_task_count is greater than zero
2. Review Pending, when no delayed work exists and review_pending_count is greater than zero
3. On Track otherwise

The five-day activity graph remains unavailable or explicitly marked as fallback until Tasks and reporting integration provides authoritative activity data.

## Unsupported profile fields

The following existing UI fields are not persisted during Phase 5:

- location
- working hours
- bio

They may remain read-only fallback/presentation fields.

They must not be added to writable self-profile inputs.

## Email security

Profile email is read-only.

Email changes require a separate protected Supabase Auth administrative workflow and are outside Phase 5.

## Notification preferences

Notification preferences remain user-owned.

Manager and HR may not modify another user's notification preferences.

## Avatar handling

Phase 5 supports only a validated HTTPS avatar_url.

Actual avatar upload is deferred until private Storage policies are implemented.

Any camera/upload control must remain disabled or display an explicit upload-coming-later state.

## Pagination and sorting

Employee directory uses keyset pagination.

Search, role, department, status, sorting and pagination inputs must be server validated and allowlisted.

No raw SQL may be constructed from client query parameters.

## Concurrency

Profile and employee mutations use optimistic concurrency through expected updated_at values.

Stale writes must fail with a safe conflict response.

No automatic write retry is allowed.

## Rate limiting

Use the existing database-backed rate-limit infrastructure.

Sensitive mutations fail closed when the limiter cannot establish permission.

Provider and database errors must map to safe generic UI responses.

## Workspace limitation

Invitation provisioning supports the current single-workspace release.

The actor's authoritative workspace must be derived from their active profile.

The browser may not choose workspace_id.

The implementation must fail safely rather than silently choosing a workspace when the deployment becomes multi-workspace.

## Phase 5B database additions

Create an additive migration providing:

- get_employee_directory
- get_employee_detail
- update_own_profile_v2
- manage_profile_v2
- update_own_settings_v2
- invitation provisioning/finalization
- idempotent invitation reconciliation
- optimistic concurrency
- safe directory aggregates

Do not edit previously applied migration history.

## Invitation reconciliation

Supabase Auth invitation and profile finalization are not one transaction.

The implementation must:

- retry finalization safely by invited user ID
- detect existing inactive profiles
- prevent blind duplicate invitations
- expose a safe retry state
- use a one-way normalized-email digest provisioning intent when invited user ID is unavailable
- never query Auth by raw email from the browser
