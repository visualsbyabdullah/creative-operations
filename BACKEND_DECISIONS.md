# Creative Operations — Approved Backend Decisions

These decisions are approved for backend implementation unless the existing frontend has a direct technical conflict. If a conflict exists, stop and report it instead of silently changing the frontend.

## 1. Workspace architecture

The application initially operates as a single organization/workspace.

However, all relevant business tables must include `workspace_id` so that:

- Data is properly isolated.
- Future multi-workspace support remains possible.
- Direct database queries cannot cross workspace boundaries.

Create one default workspace for the current organization.

Workspace is the primary authorization boundary.

## 2. Root route behavior

The `/` route must not expose a dashboard publicly.

Required behavior:

- Unauthenticated user visiting `/` redirects to `/login`.
- Authenticated Manager redirects to the management dashboard.
- Authenticated HR redirects to the management dashboard.
- Authenticated Graphic Designer redirects to the employee dashboard.
- Authenticated Video Editor redirects to the employee dashboard.
- Inactive authenticated users redirect to a dedicated inactive-account page.

## 3. Settings access

All active authenticated users may access their own personal settings.

Employees may update only approved personal fields.

Manager and HR may access separate management settings where present.

Normal employees must never update:

- Role
- Active status
- Department assignment
- Workspace
- Permissions
- Manager relationship
- Ownership fields
- Another user's account

## 4. Editable profile fields

A normal authenticated user may update only frontend-supported safe fields such as:

- Full name
- Avatar
- Phone number
- Timezone
- Notification preferences
- Other non-sensitive personal preferences already present in the UI

Manager and HR may update approved employee-management fields through protected server operations.

Only Manager and HR may update:

- Department
- Role
- Active status
- Management assignment

## 5. Remember Me behavior

Remember Me controls session persistence only.

When checked:

- The session may persist across browser restarts.
- Maximum persistent session lifetime should be configurable.
- Initial target maximum is 30 days.
- Token expiry and refresh-token rotation must remain active.
- Account status and authorization must still be checked on protected requests.

When unchecked:

- Use non-persistent browser-session behavior where supported.
- The session must not intentionally survive the browser session.

Remember Me must never store:

- Passwords
- Raw credentials
- Access tokens in custom localStorage code
- Refresh tokens in custom localStorage code
- Custom permanent login tokens

Storing the user's email may only be a separate convenience feature and must not be treated as Remember Me authentication.

## 6. Logout behavior

Normal Logout ends the current session/device.

The backend should also support a separate explicit Logout All Devices action where Supabase supports it.

Password compromise, password reset, account deactivation, or security-sensitive changes should revoke other sessions where supported.

## 7. Forgot Password and Reset Password

Forgot Password must:

- Use Supabase's supported recovery flow.
- Return the same generic response whether or not an email exists.
- Apply rate limiting.
- Use only allowlisted internal callback URLs.

Reset Password must:

- Require a valid recovery session.
- Reject normal authenticated sessions that do not represent password recovery.
- Reject expired or invalid recovery links.
- Validate and confirm the new password.
- Clear recovery state after success.
- Never log passwords or recovery tokens.

## 8. Management permissions

Manager and HR have identical backend management permissions.

Their UI labels may differ, but backend authorization must treat them as the same management permission group.

## 9. Task lifecycle

Use one canonical task-status model.

Initial approved lifecycle:

- `draft`
- `assigned`
- `in_progress`
- `submitted`
- `revision_requested`
- `completed`
- `archived`

Expected permissions:

- Manager and HR may create drafts.
- Manager and HR may assign and reassign tasks.
- Assigned employees may move a task from assigned to in progress.
- Assigned employees may submit their own work.
- Manager and HR may request revisions.
- Manager and HR may mark work completed.
- Manager and HR may archive or reopen permitted tasks.
- Employees may not assign tasks to themselves or others.
- Invalid status transitions must be rejected on the server.

If the existing frontend uses conflicting status names, map them to this canonical model without redesigning the UI.

## 10. Publishing and approval authority

Only Manager and HR may perform final approval, publishing, completion, or archive actions unless a specific existing frontend workflow clearly delegates limited authority.

Employees may submit work but may not approve or publish their own work.

## 11. Record deletion

Prefer archive or soft deletion for business records.

Tasks, submissions, brands, employee relationships, and other auditable business records should not be permanently deleted through normal frontend operations.

Hard deletion must be limited to explicitly approved administrative or cleanup operations.

## 12. Brand authorization

Brand membership is not the main tenant boundary.

Workspace is the authorization boundary.

Brand assignments may restrict which tasks and brand information an employee can access, but brand membership must not grant organization-wide management permissions.

## 13. Uploads and attachments

Internal creative files must use private Supabase Storage buckets.

Required rules:

- Files must belong to a workspace.
- Files should be linked to an authorized task, submission, brand, or profile.
- Files must not be public by default.
- Downloads should use authenticated access or short-lived signed URLs.
- Object paths must be generated by trusted code.
- Changing a file path must not allow cross-user access.
- Executable and dangerous file types must be blocked.
- MIME type, extension, ownership, and size must be validated.

Exact file-size limits may be configured during the Storage phase based on the project's real image, document, and video requirements.

## 14. Notifications

Users may read and update only their own notifications.

Manager and HR may generate permitted team notifications through protected server operations.

A user must not mark another user's notification as read or delete it.

## 15. Audit and security logging

Create append-only audit records for:

- Authentication events
- Password recovery
- Employee creation and deactivation
- Role changes
- Task assignment and reassignment
- Status changes
- Submission actions
- Brand management
- File uploads and deletion
- Permission denials
- Management operations

Passwords, tokens, secret keys, and sensitive request bodies must never be logged.

## 16. Implementation rule

Backend features must be implemented and validated in this order:

1. Authentication and sessions
2. Route protection
3. Core database schema
4. Row Level Security
5. Profiles and employees
6. Tasks and assignments
7. Submissions
8. Planner and scheduling
9. Notifications
10. Brands
11. Storage and attachments
12. Rate limiting and audit logging
13. Authorization and security testing
14. Production-readiness review

Do not begin the next phase until the current phase passes type checking, build verification, relevant tests, and Git diff review.
