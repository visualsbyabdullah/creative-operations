# Architecture

## 1. Overall architecture

This repository is one Next.js deployment with three explicit areas. `frontend/` owns rendering and HTTP transport adapters, `backend/` owns server-only behavior and database assets, and `code-bin/` is a documented archive for code proven unused. Root files orchestrate development, validation, and deployment.

## 2. Frontend

`frontend/src/app` contains App Router pages, layouts, Server Actions, auth callbacks, and thin API routes. `frontend/src/components` contains React UI grouped by feature. Context, visual config, and browser-safe utilities stay under `frontend/src`. UI behavior and styling are preserved by moving files without redesigning them.

## 3. Backend

`backend/src/modules/<domain>` groups business services, repositories, schemas, mappers, and domain utilities. Repositories perform persistence operations; services validate permissions and orchestrate workflows. `backend/src/security` contains rate limiting, audit, identifier, and request-context internals. `backend/src/supabase` contains privileged/server Supabase adapters. Applicable modules import `server-only`.

## 4. API architecture

Versioned Next.js adapters live in `frontend/src/app/api/v1`. They call handlers in `backend/src/api/v1/handlers`, then return the normalized response contracts from `backend/src/api/responses`. Route files contain no business rules. Existing Server Actions remain thin adapters where they provide better form and mutation UX; both transports reuse backend services.

## 5. Authentication

Supabase Auth is the only identity provider. Server code derives identity from the authenticated Supabase session. Login persistence, invitation, password recovery, email change, logout, and inactive-account checks retain their existing flows.

## 6. Authorization and RLS

Authorization is deny-by-default. Backend services check active profiles, roles, workspace scope, and ownership. PostgreSQL RLS and security-definer functions remain the database security boundary. Browser-supplied actor, role, workspace, creator, and ownership fields are never trusted.

## 7. Task workflow

Canonical statuses remain `draft`, `assigned`, `in_progress`, `submitted`, `revision_requested`, `completed`, and `archived`. Transitions continue through the audited database function. Employees may start assigned work and submit it for review; management reviews normal assigned work. Direct completion remains restricted to an assignee's self-created personal task.

## 8. Database layer

Repositories and services use the authenticated server Supabase client. Administrative clients remain server-only. SQL errors and internal Supabase details are mapped to safe application result codes before reaching UI or API responses.

## 9. Supabase migrations

All immutable historical migrations live in `backend/supabase/migrations` in their original order and content. Create new timestamped migrations there; never edit a migration already applied. Run the CLI with `--workdir backend` or use the root Supabase scripts.

## 10. Frontend/backend communication

Server-rendered pages and Server Actions call backend services directly, avoiding unnecessary HTTP hops. External or fetch-based consumers use `/api/v1`. Client components import only frontend code, Server Actions, and serializable `@shared/*` contracts—not repositories, privileged clients, or security internals.

## 11. Path aliases

- `@frontend/*` → `frontend/src/*`
- `@backend/*` → `backend/src/*`
- `@shared/*` → `backend/src/shared/*`

Aliases are configured in the root TypeScript and Vitest configuration. `frontend/tsconfig.json` and `backend/tsconfig.json` provide scoped editor views.

## 12. Code-bin rules

Archive only after checking static imports, dynamic imports, routes, tests, scripts, package scripts, and deployment references. Each archived file needs the required header and a manifest row. `code-bin` is excluded from TypeScript, ESLint, and production builds.

## 13. Adding a feature

1. Add shared serializable types only when both sides need them.
2. Add validation and business behavior to the relevant backend module.
3. Keep database access in a repository or focused service.
4. Expose it through an existing Server Action or a thin versioned API route.
5. Add UI under the matching frontend feature directory.
6. Test permissions, ownership, and failure mapping.

## 14. Adding an API

Add a handler under `backend/src/api/v1/handlers`, reuse a domain service, return the standard `{ ok, data }` or `{ ok, error }` contract, and add a thin `route.ts` under `frontend/src/app/api/v1`. Document only implemented endpoints in `backend/docs/API.md` and `backend/openapi.yaml`.

## 15. Adding a migration

Create a new timestamped SQL file under `backend/supabase/migrations`. Preserve fixed `search_path` on security-definer functions, keep RLS enabled, update SQL policy tests where relevant, validate locally/staging, and never rewrite historical files.
