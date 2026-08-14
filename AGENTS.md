# Creative Operations — Agent Project Rules

## Project overview

Creative Operations is a Next.js 16 application backed by Supabase Auth, PostgreSQL, Row Level Security, and private Storage. The repository is a single deployable application with explicit frontend, backend, shared-contract, and database boundaries.

- Frontend UI and Next.js routes: `frontend/src/`
- Backend business logic: `backend/src/modules/`
- HTTP handlers: `backend/src/api/`
- Versioned route adapters: `frontend/src/app/api/v1/`
- Security internals: `backend/src/security/`
- Supabase clients: `backend/src/supabase/`
- Shared serializable contracts: `backend/src/shared/`
- Database and RLS migrations: `backend/supabase/migrations/`
- Archived code policy: `code-bin/`
- See `ARCHITECTURE.md` and `backend/docs/API.md` for details.

## Common commands

Run all commands from the repository root:

```bash
npm run dev          # next dev frontend
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest run
npm run build        # next build frontend
npm run supabase:status     # supabase --workdir backend status
npm run supabase:migrations # supabase --workdir backend migration list
```

Environment files live in the Next.js project root `frontend/`:

- `frontend/.env.local` — runtime credentials (never committed).
- `frontend/.env.example` — tracked template with names and safe placeholders only.

## Working branch

- Work only on the active development branch (`refactor/frontend-backend-architecture`).
- Never modify `main` or `backup/frontend-complete`.
- Do not commit, push, merge, or change branches unless explicitly instructed.
- Before every task, run `git status` and confirm the current branch.

## Existing frontend

- The frontend UI is already complete and approved.
- Do not redesign the application.
- Do not replace existing layouts, styling, components, routes, animations, forms, tables, or dashboards.
- Do not rename or delete existing files unless absolutely required and clearly documented.
- Preserve existing responsive behavior.
- Connect the existing UI to backend functionality rather than rebuilding it.
- Do not remove mock data until its real backend replacement is complete and verified.

## Technology

- Inspect the repository before assuming the exact versions or architecture.
- Preserve the existing Next.js App Router and TypeScript architecture.
- Use Supabase PostgreSQL and Supabase Auth.
- Use `@supabase/ssr` for supported server-side authentication.
- Use version-controlled Supabase migrations.
- Use strict TypeScript.
- Use Zod or an equivalent typed server-side validation library.

## Authentication

- Use Supabase Auth as the only authentication system.
- Do not create a duplicate custom authentication system.
- Never store plaintext passwords, encrypted passwords, custom password hashes, access tokens, refresh tokens, or recovery tokens in public application tables.
- Preserve and implement the existing Login, Remember Me, Forgot Password, Reset Password, and Logout interfaces.
- Remember Me must control session persistence only.
- Remember Me must never save passwords or raw credentials.
- Forgot Password must use the supported Supabase email recovery flow.
- Password-reset responses must not reveal whether an email account exists.
- Invalid, expired, or unauthorized recovery sessions must be rejected.
- Inactive users must be denied even when an older session still exists.

## Roles

The existing roles are:

- `manager`
- `hr`
- `graphic_designer`
- `video_editor`

Rules:

- Manager and HR have identical backend management permissions.
- Graphic Designers can access only their own profile, assigned work, permitted notifications, permitted submissions, and explicitly shared resources.
- Video Editors can access only their own profile, assigned work, permitted notifications, permitted submissions, and explicitly shared resources.
- A user must never read, update, delete, download, or take ownership of another unauthorized user's private data.
- Users cannot update their own role, active status, workspace, permissions, manager, or ownership fields.
- Never trust client-supplied role, user ID, employee ID, assigned-to ID, created-by ID, workspace ID, or ownership fields.

## Authorization

- Use deny-by-default authorization.
- Frontend route hiding is not authorization.
- Every protected operation must verify:
  1. Authenticated session.
  2. Existing profile.
  3. Active account.
  4. Permitted role.
  5. Resource ownership or workspace scope.
  6. Allowed writable fields.
- Protect every Server Action and Route Handler as a public-facing endpoint.
- Enforce authorization at both:
  - Next.js server/API layer.
  - PostgreSQL Row Level Security layer.
- Prevent IDOR/BOLA and cross-user or cross-workspace access.
- Direct Supabase queries must remain secure even when the normal UI is bypassed.

## Database and RLS

- Do not make undocumented manual database changes.
- Do not connect to or modify production Supabase during development.
- Generate migrations before applying schema changes.
- Never drop, truncate, reset, or recreate existing tables without explicit approval.
- Enable RLS on every exposed business table.
- Do not disable RLS.
- Do not use unrestricted authenticated policies such as `USING (true)` or `WITH CHECK (true)`.
- Use UUID primary keys, foreign keys, constraints, timestamps, ownership fields, workspace scope, and suitable indexes.
- Use transactions for multi-step business operations.
- Carefully review any `security definer` function and use a fixed safe `search_path`.

## Secrets

- Never expose the Supabase service-role key to the browser.
- Never place secrets in `NEXT_PUBLIC_` variables.
- Never commit `.env`, `.env.local`, production keys, tokens, passwords, or database credentials.
- Server administrative clients must remain in server-only modules.
- Update `frontend/.env.example` with variable names and safe placeholders only.

## API security

- Validate all server inputs.
- Explicitly allow writable fields; do not spread untrusted request bodies into database operations.
- Use safe HTTP status codes and consistent error responses.
- Do not return stack traces, SQL errors, internal Supabase errors, secrets, or authentication tokens.
- Add configurable rate limiting for authentication, password recovery, reads, writes, uploads, and management actions.
- Add audit logging for security-sensitive actions.
- Do not log passwords, tokens, secret keys, or sensitive request bodies.

## Storage

- Internal files must use private Supabase Storage buckets.
- Implement Storage RLS.
- Validate file ownership, task/workspace scope, MIME type, extension, and maximum size.
- Use generated object paths and short-lived signed URLs where appropriate.
- Prevent users from accessing another user's file by changing an object path.

## Code style

- Follow existing patterns and conventions in the files you touch.
- Use strict TypeScript; do not weaken type safety.
- Do not add code comments unless asked.
- Keep server-only logic in server-only modules; never expose secrets to the client.
- Match the repo's existing error-handling and naming conventions.

## Change discipline

Before editing:

1. Inspect all related files.
2. Explain the intended architecture.
3. List files expected to be created or modified.
4. Identify migration and security impact.
5. Stop and report any conflicting requirement rather than guessing.

After editing:

1. Run relevant tests.
2. Run `npm run typecheck`.
3. Run `npm run lint` when configured.
4. Run `npm run build`.
5. Review `git diff`.
6. Report every created, modified, and deleted file.
7. Report tests and exact results.
8. Report assumptions, limitations, and unresolved risks.

## Execution boundaries

- Complete only the specifically requested phase.
- Do not silently begin the next backend phase.
- Do not modify production resources.
- Do not make destructive changes.
- Do not claim completion while tests or builds are failing.