# Creative Operations — Backend Project Context

## Project state

The frontend for the Creative Operations / Creative Team Management application is complete.

The backend must be implemented against the existing frontend without redesigning or breaking it.

The current application contains routes or interfaces for:

- Login
- Forgot Password
- Reset Password
- Dashboard
- Tasks
- Submissions
- Planner
- Schedule
- Notifications
- Profile
- Settings
- Brand management
- Employee management
- Management dashboards
- Employee dashboards

Codex must inspect the repository to identify the exact routes, components, state, mock data, types, forms, fields, filters, calculations, and workflows.

## Authentication UI already present

The login interface already includes:

- Email
- Password
- Remember Me
- Forgot Password
- Sign In

Existing authentication-related components include:

- Login form
- Forgot Password form
- Reset Password form
- Role routing or role-based dashboard logic

These existing interfaces must be preserved and connected to secure backend functionality.

## Authentication requirements

- Use Supabase Auth.
- Reuse existing Supabase Auth users where applicable.
- Use email/password login.
- Implement secure session handling.
- Implement Remember Me as session persistence only.
- Never store passwords for Remember Me.
- Implement Forgot Password through Supabase email recovery.
- Implement a secure recovery callback.
- Implement a secure Reset Password flow.
- Implement logout.
- Implement account-inactive handling.
- Use generic authentication and password-recovery messages.

## Roles

The application contains four roles:

1. Manager
2. HR
3. Graphic Designer
4. Video Editor

Canonical backend values:

- `manager`
- `hr`
- `graphic_designer`
- `video_editor`

## Role behavior

### Manager and HR

Manager and HR must have identical backend management permissions.

They may manage permitted:

- Employees
- Profiles
- Tasks
- Assignments
- Workload
- Schedules
- Submissions
- Notifications
- Brands
- Management reporting

Their user-facing labels may remain different.

### Graphic Designer and Video Editor

Employees may access only:

- Their own permitted profile fields
- Tasks assigned to them
- Their own submissions
- Their own schedule
- Their own notifications
- Their own permitted activity
- Files explicitly assigned or shared with them

Employees must not access another employee's private data.

## Critical isolation rule

A malicious authenticated user must not gain access to another user's data by changing:

- URL
- UUID
- Route parameter
- Query parameter
- Request body
- Employee ID
- User ID
- Task ID
- Submission ID
- Notification ID
- Brand ID
- Workspace ID
- File path
- Role value
- Ownership field
- Direct Supabase request

Frontend guards alone are not sufficient.

Enforce access at:

1. Server-side authorization.
2. PostgreSQL Row Level Security.
3. Supabase Storage policies.

## Profiles

The expected profile structure contains at least:

- `id`
- `full_name`
- `role`
- `is_active`
- `department`
- `avatar_url`

Codex must verify the actual existing implementation before changing it.

`profiles.id` should correspond to the Supabase Auth user's ID.

Normal users must not modify:

- Role
- Active status
- Workspace
- Permissions
- Manager relationship
- Ownership fields

## Backend objective

Replace frontend mock or static data gradually with real persisted data.

Do not remove mock data from a module until:

- Its schema exists.
- Its RLS policies exist.
- Its API or server service exists.
- Its frontend integration works.
- Its authorization tests pass.
- Its build passes.

## Development safety

- Use the `backend-development` branch.
- Preserve `main`.
- Preserve `backup/frontend-complete`.
- Do not use production Supabase during implementation.
- Do not run destructive database commands.
- Do not disable RLS.
- Do not expose service-role credentials.
- Do not commit secrets.
- Do not redesign the existing UI.

## Required phased implementation

The expected implementation phases are:

1. Repository and frontend audit
2. Authentication and session handling
3. Database schema and migrations
4. Row Level Security
5. Profiles and employee management
6. Tasks and assignments
7. Submissions
8. Planner and schedules
9. Notifications
10. Brand management
11. Private Storage and attachments
12. Audit logging and rate limiting
13. Automated authorization and RLS testing
14. Final integration and production-readiness review

Complete and validate each phase before starting the next one.
