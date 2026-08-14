# Phase 4 — Approved RLS Decisions

## Management role authority

Manager and HR have equivalent backend management permissions.

Manager and HR may assign any canonical role to another user in the same workspace:

- manager
- hr
- graphic_designer
- video_editor

Restrictions:

- A user cannot change their own role.
- A user cannot change roles across workspaces.
- The last active Manager in a workspace cannot be demoted or deactivated.
- Role and account-status changes must use protected database/server operations.
- Every role, department, manager, and active-status change must create an append-only business audit event.
- Ordinary direct profile updates must not permit sensitive-field changes.

## Archived task reopening

Reopening an archived task returns it to:

- `draft`

It must not automatically restore its previous status.

Only Manager or HR may reopen archived tasks.

## Attachment parent integrity

Every attachment metadata record must reference exactly one approved parent:

- task
- submission
- brand

Zero parents are invalid.

Multiple parents are invalid.

Enforce this using a database CHECK constraint in addition to application validation.

The attachment workspace must match the authorized parent resource workspace.

## Employee brand visibility

Employees may read only brands referenced by tasks currently assigned to them.

They do not receive general visibility of all workspace brands.

Manager and HR may read and manage brands inside their own workspace.

Brand visibility does not grant access to unrelated tasks or workspace-management functionality.

## Profile field security

Normal users may update only their own:

- full_name
- avatar_url
- phone
- timezone
- notification preferences

Normal users may not update:

- role
- is_active
- workspace_id
- department
- manager_id
- ownership fields
- another user's profile

Manager and HR may update, within their own workspace:

- full_name
- avatar_url
- phone
- timezone
- notification preferences
- department
- role
- is_active
- manager_id

Manager and HR may not directly change:

- workspace_id
- email
- auth user identity
- passwords
- another workspace's user

Email changes remain a separate protected Supabase Auth administrative workflow.

Use protected RPC/server operations with explicit input fields for profile mutations.

Do not rely on row-level policies alone for column security.

## Profile reads

Do not expose all base profile columns broadly.

Use the approved least-privilege combination of:

- RLS
- column-level grants
- security-invoker safe views where useful
- protected profile RPCs

Employees may read their own permitted personal fields and only the minimum coworker directory fields required by assigned-work UI.

Manager and HR may read permitted same-workspace team profile data.

## Task transitions

Canonical statuses:

- draft
- assigned
- in_progress
- submitted
- revision_requested
- completed
- archived

Employee transitions:

- assigned → in_progress
- revision_requested → in_progress
- in_progress → submitted

Manager/HR transitions and operations:

- create draft
- assign/reassign
- request revision
- complete
- archive
- reopen archived task to draft

Invalid transitions must be rejected by protected operations and database validation.

Employees cannot directly edit:

- workspace
- brand
- creator
- assignment
- completion
- archive state
- approval state
- management-only fields

## Submission publishing

Final approval/publishing must be atomic.

A successful protected operation must:

1. Validate Manager/HR access in the same workspace.
2. Validate the submission and task relationship.
3. Approve/publish the submission.
4. Mark the task completed.
5. Create relevant notifications.
6. Create a business audit event.

All steps must occur in one database transaction.

If any step fails, no partial state may remain.

Employees cannot approve or publish their own submissions.

## Business audit architecture

Do not extend the authentication-audit enum for business operations.

Create a separate append-only business audit table.

Initial audited operations include:

- profile_updated
- user_role_changed
- user_status_changed
- user_department_changed
- manager_assignment_changed
- brand_created
- brand_updated
- brand_archived
- task_created
- task_assigned
- task_reassigned
- task_status_changed
- task_archived
- task_reopened
- submission_created
- submission_reviewed
- submission_revision_requested
- submission_published
- notification_created
- attachment_created
- attachment_removed
- authorization_denied

Business audit requirements:

- No normal anon/authenticated direct access.
- No UPDATE or DELETE for normal application roles.
- Strict event-type and metadata allowlists.
- No passwords, tokens, raw cookies, secrets, or full request bodies.
- Initial retention recommendation: 180 days.
- Protected RPCs should write audit events atomically with sensitive business changes.
