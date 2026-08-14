# Staging Prerequisites

Status: **BLOCKED before remote mutation**

This file contains no secret values. Production resources must not be supplied
or reused.

## Supabase staging identity

Provide these values through a secure local process environment:

- `STAGING_SUPABASE_PROJECT_REF`
- `STAGING_NEXT_PUBLIC_SUPABASE_URL`
- `STAGING_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `STAGING_SUPABASE_SECRET_KEY` (preferred) or the approved server-only
  equivalent
- `STAGING_APP_URL`
- `STAGING_AUTH_RECOVERY_STATE_SECRET`
- `STAGING_AUTH_SECURITY_HMAC_SECRET`

The project reference must be explicitly supplied; it must not be inferred
from `.env.local`, a URL, a filename, or an existing CLI link. Before any link
or push, provide safe project metadata proving that the project name identifies
it as staging, its status and region, and that its URL/host differs from
production. If production identity is unknown, explicitly attest that the
supplied reference is the isolated staging project.

Configure the hosted Supabase Auth site URL and exact redirect allowlist for
the staging/Preview origin. Do not add wildcards.

## Vercel Preview or staging project

Provide either:

1. A separate Vercel staging project identity; or
2. A confirmed Preview deployment path for `backend-development`.

Provide the organization/team, project name, branch behavior, and confirmation
that all variables will be Preview/Staging scoped only. Install/authenticate
the Vercel CLI if CLI deployment is desired. Production scope and `--prod` are
forbidden.

## Staging fixture email aliases

Provide user-controlled, test-only addresses securely:

- `STAGING_MANAGER_EMAIL`
- `STAGING_HR_EMAIL`
- `STAGING_DESIGNER_EMAIL`
- `STAGING_EDITOR_EMAIL`
- `STAGING_INACTIVE_EMAIL`
- `STAGING_WORKSPACE_B_MANAGER_EMAIL`
- `STAGING_WORKSPACE_B_EMPLOYEE_EMAIL`

Users must establish their own credentials through invitation/recovery. Do not
provide or create temporary passwords.

## Configuration contract resolved locally

Invitation and password-recovery redirects now share the strict server-only
`APP_URL` origin parser. `NEXT_PUBLIC_SITE_URL`, browser input, and request
Host/Origin/Referer values are not authoritative. The fixed invitation callback
path is constructed with the URL API.

Staging must still supply `STAGING_APP_URL` securely and map it to `APP_URL`.
It must be the exact reviewed staging/Preview HTTPS origin. This local code
resolution does not verify the hosted Auth redirect allowlist.

## Safe setup sequence

1. Export the required staging variables without writing them to tracked files.
2. Verify only names, presence, scopes, and optional safe fingerprints.
3. Confirm the Supabase project identity independently in its dashboard.
4. Confirm the Vercel project/Preview identity and environment scopes.
5. Re-run the source and local baseline gates.
6. Review remote migration history and a dry-run plan.
7. Only then approve staging link, migration, and Preview deployment actions.
