# Repository Structure Audit — 2026-08-14

## Scope and method

The audit covered every tracked application, test, configuration, documentation, and Supabase file. Classification used static and dynamic import searches, App Router conventions, test references, package scripts, configuration references, Git history, and successful TypeScript/test/build resolution. A filename alone was never treated as proof of dead code.

## Runtime inventory

- Pages/layouts: the root layout plus login, invitation, recovery, inactive account, dashboard, planner, tasks, schedule, submissions, employees, brands, notifications, profile, and settings routes are under `frontend/src/app`.
- Route handlers: existing auth callback/sign-out handlers remain under their routes; versioned application APIs are under `frontend/src/app/api/v1`.
- Server Actions: feature-local adapters remain in `frontend/src/app/**/actions.ts` and delegate to backend services.
- UI: feature components are grouped under `frontend/src/components/{auth,brands,dashboard,layout,management,notifications,planner,profile,schedule,submissions,tasks,ui}`.
- Client state/config: `frontend/src/context`, `frontend/src/config`, and browser-safe utilities under `frontend/src/utils`.
- Backend domains: auth, brands, dashboard, employees, notifications, profiles, storage, submissions, and tasks under `backend/src/modules`.
- Repositories: employee and profile persistence are isolated in explicit repository files. Other compact modules retain focused service-level Supabase RPC calls; no ceremonial empty repositories were introduced.
- Validation: domain schemas and file validation remain colocated with their backend modules.
- Security: audit, request context, identifiers, rate limiting, and auth security are under `backend/src/security`.
- Supabase adapters: browser creation is frontend-only; authenticated server, proxy, and administrative clients are isolated under `backend/src/supabase`.
- Contracts: action results and serializable auth, brand, dashboard, employee, notification, profile, storage, submission, and task types are under `backend/src/shared/contracts`.
- Database: Supabase config, 32 ordered migrations, and SQL policy/workflow tests are under `backend/supabase`.
- Tests: TypeScript tests remain beside the frontend or backend feature they verify; SQL tests remain beside Supabase assets.
- Scripts/config: root npm scripts orchestrate Next.js, TypeScript, ESLint, Vitest, and Supabase. Root Vercel configuration remains unchanged.
- Audit/generated/user files: ignored local `audit-output`, `backups`, maintenance scripts, environment files, build output, and status reports were preserved in place and not committed or archived.

## Duplicate and legacy review

The audit found no duplicate active implementation safe to remove. `EmployeeSettings.tsx` is a small compatibility wrapper referenced by the application structure, not an abandoned replacement. Auth callback and invitation variants serve distinct flows. Existing historical planning and staging documents were moved to `backend/docs/history` rather than treated as executable legacy code.

## Code-bin decision

No tracked source file met the evidence threshold for archival. `code-bin/MANIFEST.md` therefore records no moves. Applied migrations, active tests, auth callbacks, security code, configuration, and user-generated reports were explicitly excluded from archival.

## Boundary findings

- Client Components contain no privileged Supabase key references.
- Client Components do not import `@backend/*`; they use `@frontend/*`, Server Actions, and `@shared/*` contracts.
- Server services, repositories, server Supabase adapters, API handlers, and applicable auth modules are marked `server-only`.
- Historical migration blob hashes match `backend-development`; only paths changed.
