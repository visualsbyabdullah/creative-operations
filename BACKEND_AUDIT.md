# Backend Audit

## Scope and repository state

Audit performed on branch `backend-development` with a clean working tree before documentation was created. `AGENTS.md` and `PROJECT_BACKEND_CONTEXT.md` were read in full. The repository is a Next.js 16.2.11 App Router application using React 19.2.4, TypeScript 5, `@supabase/ssr` 0.12.3, and `@supabase/supabase-js` 2.110.8 (`package.json`). No backend validation, migration, testing, rate-limit, or audit-log framework exists.

## Routes and actual protection

| Route | Implementation | Current behavior | Protection |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Renders `CreativeDashboard` directly | None; exposes mock employee dashboard |
| `/login` | `src/app/login/page.tsx` | Supabase email/password login | Proxy redirects an authenticated claimant to `/dashboard` |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Sends Supabase recovery email | Public |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Exchanges `code` for session, redirects to requested relative `next` or `/reset-password` | Public |
| `/reset-password` | `src/app/reset-password/page.tsx` | Calls `auth.updateUser`, signs out locally | Public route; relies only on Supabase client session |
| `/dashboard` | `src/app/dashboard/page.tsx` | Chooses employee, HR, or manager dashboard | Proxy auth plus `requireAppProfile` |
| `/tasks` | `src/app/tasks/page.tsx` | Employee task UI | Proxy auth plus `requireEmployeeProfile` |
| `/schedule` | `src/app/schedule/page.tsx` | Employee schedule UI | Proxy auth plus `requireEmployeeProfile` |
| `/submissions` | `src/app/submissions/page.tsx` | Role-selects management or employee UI | Proxy auth plus `requireAppProfile` |
| `/notifications` | `src/app/notifications/page.tsx` | Role-selects management or employee UI | Proxy auth plus `requireAppProfile` |
| `/profile` | `src/app/profile/page.tsx` | Role-selects management or employee UI | Proxy auth plus `requireAppProfile` |
| `/settings` | `src/app/settings/page.tsx` | Always renders employee settings | Proxy authentication only; no profile, active-account, or role check |
| `/planner` | `src/app/planner/page.tsx` | Management planner | Proxy auth plus `requireManagementProfile` |
| `/employees` | `src/app/employees/page.tsx` | Management employees | Server-side `requireManagementProfile`; accidentally omitted from proxy protected route list |
| `/brands` | `src/app/brands/page.tsx` | Management brand list | Proxy auth plus `requireManagementProfile` |
| `/brands/[brandId]` | `src/app/brands/[brandId]/page.tsx` | Management brand details | Proxy auth plus `requireManagementProfile` |

`src/proxy.ts` runs `updateSession` from `src/lib/supabase/proxy.ts` for all non-static requests. Its protected list is `/dashboard`, `/tasks`, `/schedule`, `/submissions`, `/notifications`, `/profile`, `/settings`, `/brands`, and `/planner`. Proxy authentication is claim presence only. Real profile, role, and active checks occur only in pages that call `requireAppProfile`.

## Authentication and session implementation

- `src/lib/supabase/client.ts` creates a browser SSR client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `src/lib/supabase/server.ts` creates a cookie-backed server client with the same publishable key. Its `setAll` silently ignores cookie-write failure in Server Components.
- `src/lib/supabase/proxy.ts` refreshes/reads claims with `auth.getClaims()` and copies updated cookies to the request/response.
- No admin or service-role client exists.
- `src/lib/auth/requireAppProfile.ts` reads the authenticated subject from claims, selects `profiles.*` by `id`, validates one of four roles, and requires `is_active`. Missing/invalid/inactive profiles redirect to login query errors. Management means `hr` or `manager`.
- `src/components/layout/EmployeeHeader.tsx` separately calls browser `auth.getUser()`, selects `full_name, role, department`, and signs out with local scope. This duplicates profile lookup and leaves other device sessions intact.
- Login errors expose raw Supabase messages. Forgot/reset errors can also expose raw provider messages.
- There is no server-side login action, validation schema, rate limiting, audit logging, account lockout, or explicit post-login inactive-account rejection before a session is created. The next guarded page catches inactivity.

## Remember Me

`src/components/auth/LoginForm.tsx` uses localStorage key `creativeops-remembered-email`. When selected, it stores the normalized email and pre-fills it on later visits; deselection removes it. It does not alter Supabase cookie/session persistence. Therefore the label and behavior conflict with `AGENTS.md`: it remembers an identifier, not session persistence. It never stores the password.

## Forgot and reset password

`ForgotPasswordForm.tsx` normalizes email and calls `resetPasswordForEmail` with `/auth/callback?next=/reset-password`. A successful call gives a generic success message, but provider errors are displayed and could create enumeration differences.

`src/app/auth/callback/route.ts` accepts any `next` beginning with `/`; this avoids an absolute external redirect but should use a fixed allowlist. It exchanges the code and sends failures to `forgot-password?error=invalid_reset_link`; that page does not read/display this query value.

`ResetPasswordForm.tsx` enforces only minimum length 8 and equality in the browser, calls `updateUser`, then local sign-out. It does not first verify a recovery assurance level/event, distinguish a normal authenticated session from a recovery session, reject an inactive profile, or provide server-side validation/rate limiting. Consequently any signed-in user can visit `/reset-password` and change their password without current-password reauthentication.

## Roles and routing

Canonical roles are defined in `src/types/auth.ts`: `manager`, `hr`, `graphic_designer`, `video_editor`. HR and manager both render `ManagementDashboard` via thin wrappers. Employees share `CreativeDashboard`; their department is inferred from profile role/department.

`EmployeeContext.tsx` initially loads fake Graphic Design identity, optionally restores a localStorage department, then queries the current profile. Its public `setDepartment` can swap between hardcoded Abdullah/Hamza identities in client state. This is a UI simulation and cannot be trusted for ownership. Employee task, submission, schedule, and notification datasets are filtered by department, not authenticated user ID. Two employees in one department would see the same mock set.

## Existing Supabase assumptions

Only `profiles` is queried. `src/types/auth.ts` assumes: `id`, `email`, `full_name`, `role`, `department`, `job_title`, `avatar_url`, `is_active`, `created_at`, and `updated_at`; `profiles.id` is assumed equal to `auth.users.id`. No generated database types exist. No workspace, manager, preferences, or storage model exists.

## Incomplete, duplicated, conflicting, or broken behavior

- `/` bypasses authentication and renders a full mock employee dashboard.
- `/settings` lacks `requireAppProfile`/role dispatch; its password and preference buttons only mutate local state and falsely report success.
- `EmployeeProfileSettings.tsx` profile, avatar, preferences, and password controls are local-only and report success; the password form does not call Supabase.
- `ManagementProfileSettings.tsx` is a static wrapper, not editable management profile functionality.
- `/employees` is missing from proxy protected routes, although the page-level management guard prevents rendering.
- `EmployeeContext`, `EmployeeHeader`, and server pages independently resolve profile/role, creating transient or conflicting identities.
- Remember Me conflicts with the required persistence-only meaning.
- Logout uses `scope: "local"` only.
- Management and employee submissions use different in-file `Submission` shapes and status handling.
- Task/status vocabularies conflict: planner omits `Revision Required`; dashboard omits it; brand history uses `Completed`, `Pending Review`, `Revision`; submission uses another lifecycle.
- Dates are fixed around July 2026 and “today” is hardcoded as Wednesday in task metrics.
- Local mutations disappear on refresh except brands, which persist globally in browser localStorage.
- IDs are numeric/`Date.now()` in mocks, conflicting with the required UUID backend.
- No Zod dependency or equivalent validation implementation exists.
- No API routes beyond auth callback; no Server Actions, business services, migrations, RLS policies, storage policies, tests, or admin client exist.

## Security risks

The highest future risk is treating department filtering or client role state as authorization. All employee reads/writes must be keyed to `auth.uid()` through assignments/ownership, and all management access must be workspace-scoped. Client-supplied assignee, employee, profile role, workspace, creator, or owner values must be ignored. Brand IDs and localStorage object data are fully attacker-controlled. External links require URL validation; future attachments require private storage and signed access. Status transitions require role-aware server enforcement to prevent employees approving their own work or managers attributing actions to another user.

## Questions before implementation

1. Is the product single-workspace now, or must every business row be workspace-scoped from day one?
2. Should `/` redirect to `/login` or `/dashboard`?
3. Should `/settings` exist for management users, employees only, or be merged into `/profile`?
4. Should logout terminate only this browser or all sessions?
5. Must “Remember Me” mean persistent cookies when checked and session-only cookies when unchecked, even though Supabase SSR defaults to persistent auth cookies?
6. Can employees change task status directly to every displayed state, especially Approved/Published?
7. Is publishing performed by employees, management, or both?
8. Are submission URLs sufficient, or are direct file uploads required in the first integration?
9. Are manager and HR permitted to delete employees/brands/tasks, or should records be deactivated/archived?
10. Which profile fields are truly editable, and should email changes invoke Supabase Auth verification?
11. Should brand schedules generate tasks automatically or remain templates only?
12. Are employee-brand assignments access-control boundaries or only planning metadata?

