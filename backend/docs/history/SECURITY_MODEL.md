# Security Model

## Principles

Deny by default. Each operation must verify authenticated subject, existing active profile, canonical role, workspace match, resource ownership/assignment, allowed transition, and an explicit writable-field allowlist. UI hiding and `EmployeeContext` are never authorization.

## RLS policy requirements

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | management: same workspace; employee: self | trusted employee-invite/provisioning flow only | management: permitted same-workspace fields; employee: allowlisted self fields only | no client delete; deactivate/admin workflow |
| notification_preferences | self; management only if product requires | self row | self row | self reset only |
| brands/schedules/platforms | management same workspace; employees only brands explicitly shared/assigned if exposed | management | management | management, preferably archive |
| brand_members | management same workspace; employee may read own memberships | management | management | management |
| tasks/platforms | management same workspace; employee only assigned tasks | management | management; employees only permitted status/link operations on assigned tasks through server transition service | management only, preferably archive |
| task_assignees | management same workspace; employee only rows where `profile_id=auth.uid()` | management | management | management |
| task_status_events | management same workspace; assigned employee for own task | trusted service/controlled RPC | never | never |
| submissions | management same workspace; employee own rows for assigned tasks | assigned active employee with `submitted_by=auth.uid()` | management review fields via service; employee own allowed fields before/after permitted states | management only or no hard delete |
| submission_reviews | management same workspace; submitting employee for own submission | management | no mutation after creation | no client delete |
| notifications | recipient self; management only operationally justified | trusted service | recipient may only set own `read_at` | recipient own optional; otherwise retention job |
| attachments | management same workspace/resource; employees only own or explicitly shared assigned resource | active permitted resource participant | owner/management under state rules | owner/management under state rules |
| audit_logs | restricted management/security role; not ordinary employees | trusted server only | never | retention process only |

RLS helper functions may resolve the caller’s active profile and management status, but any `security definer` function must set a fixed safe `search_path`, avoid user-controlled dynamic SQL, and be narrowly executable.

## Storage

No Storage code exists today. If uploads are enabled, use private buckets:

- `avatars`: user may read/update own object; management may read same-workspace avatars; image MIME/extension/size validation.
- `task-attachments`: management uploads; assigned employees and same-workspace management read through authorized signed URLs.
- `submission-files`: submitting employee uploads to generated paths; submitter and same-workspace management can read; overwrite/delete constrained by submission state.

Object keys should contain non-guessable workspace/resource/owner UUIDs generated server-side. Storage policies must join object metadata/path segments back to profile, assignment, or submission ownership. Never authorize merely because a user knows a path.

## Validation and endpoint controls

Create Zod schemas per command, not per database row. Normalize email/URLs, enforce lengths/enums, accept UUIDs only where unavoidable, and derive actor/workspace/ownership fields server-side. Reject unknown fields. Enforce task/submission transition state machines in a transaction. Return generic auth/recovery errors and stable application error codes without provider/SQL details.

## Rate limits

Initial configurable limits, subject to operational review:

- Login: 5 attempts/15 minutes per IP+normalized account, plus 30/hour per IP.
- Forgot password: 3/hour per account hash and 10/hour per IP; always generic response.
- Recovery callback/reset: 5 attempts/15 minutes per session/IP.
- Authenticated reads/search: 120/minute/user; expensive reporting 20/minute.
- Writes/status changes: 30/minute/user; management bulk actions 10/minute.
- Employee invites/deactivation: 10/hour/manager.
- Upload initiation: 20/hour/user with byte quotas; signed URL creation 60/minute/user.

Use atomic counters and trusted proxy/IP configuration. Rate limiting supplements, not replaces, Auth provider controls.

## Audit events

Record login success/failure (without credentials), logout, recovery request accepted, password reset success/failure, profile update, role/status/manager change, employee invite/create/deactivate/delete request, brand create/update/status/member/schedule change, task create/update/assign/unassign/status/delay/archive, submission create/update/submit/review/revision/approve/publish, notification bulk-read if needed, upload/delete/download-link issuance for sensitive files, authorization denial, and administrative export/report access.

## Specific current risks

- Root dashboard is public.
- Settings does not verify an active profile.
- Local department switching impersonates fake identities in UI.
- Browser-local brands can be tampered with.
- Employee datasets are department-scoped, not user-scoped.
- Reset password accepts any authenticated session, not demonstrably recovery-only.
- Raw Supabase errors are shown.
- No rate limits, audit logs, CSRF-oriented Server Action design, business RLS, storage policies, or authorization tests exist.
- Profile `select("*")` increases accidental data exposure as schema grows.

