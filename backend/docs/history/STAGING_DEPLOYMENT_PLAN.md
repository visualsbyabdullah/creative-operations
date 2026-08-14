# Staging Deployment Plan

## Source

- Branch: `backend-development`
- Approved source commit:
  `fe5aab7a277258b84994fb2f946620a3629fc0c9`
- Commit subject: `feat(backend): complete secured local operations backend`
- Local/origin checkpoint: matched at initial verification

## Staging identities

- Supabase project: **BLOCKED — explicit staging reference and metadata missing**
- Vercel project/environment: **BLOCKED — staging/Preview identity missing**
- Environment scope: Preview/Staging only; Production is excluded

No identity is inferred from `.env.local`, current links, URLs, or filenames.

## Environment strategy

Use process injection, Vercel Preview-scoped variables, or ignored
`.env.staging.local`. Never overwrite `.env.local`. Verify names and presence
only. Administrative credentials remain server-only and never use a
`NEXT_PUBLIC_` prefix.

Required application mappings:

- `STAGING_NEXT_PUBLIC_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `STAGING_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` →
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `STAGING_SUPABASE_SECRET_KEY` → `SUPABASE_SECRET_KEY`
- `STAGING_APP_URL` → `APP_URL`
- staging recovery/HMAC secrets → their non-public application names

Invitation and recovery redirects use the same strict server-only `APP_URL`
origin parser. The local `NEXT_PUBLIC_SITE_URL` dependency has been removed.
Hosted Auth redirect allowlists still require staging verification.

## Migration strategy

The repository contains 21 chronological migration files: three files dated
`20260728`, one workspace/RLS file dated `20260729`, and seventeen Phase 5–7
files dated `20260730`. The Phase 5–7 suffix range is `001`–`017`, with the
workspace/RLS file occupying a separate date/version. Remote comparison must
use the complete 21-file chronological history.

Before mutation:

1. List remote migration history from the explicitly approved staging project.
2. Compare version, order, and committed SHA-256 content for every local file.
3. Stop on remote-only versions, altered applied content, duplicates, or
   ambiguous project identity.
4. Review a dry run.
5. Apply forward migrations only; never reset staging.

## Rollback strategy

Migrations are additive and transactional. Rollback is a reviewed forward
migration that revokes newly exposed execution and removes only proven-safe
new objects after dependency review. Do not rewrite history, disable RLS,
broaden grants, reset a hosted database, or delete business history.

Application rollback is a prior saved Preview deployment/version, never a
Production promotion. Fixture cleanup must use reviewed staging-only,
workspace-scoped operations.

## Fixture strategy

Create synthetic Workspace A and B data with visibly staging/test names,
brands, tasks, assignments, submissions, notifications, and attachments.
Provision only the user-supplied email aliases. New profiles remain inactive
until explicitly activated. No real personal data and no temporary passwords.

## Invitation and Storage strategy

Invitations use the approved email/self-password flow, generic responses,
inactive-by-default finalization, safe digest intents, and reconciliation.
Mailbox delivery may be classified BLOCKED; links must never be captured.

Storage testing uses only the private `avatars`, `task-attachments`, and
`submission-attachments` buckets. Test signed reads, expiry, lifecycle,
cross-workspace denial, two-phase deletion, and bounded reconciliation without
persisting signed URLs.

## Acceptance gates

- Local baseline fully green
- Explicit staging identities proven
- Complete migration history aligned
- Preview/Staging variables verified by presence and scope
- Anonymous denial and private Storage confirmed
- Manager/HR equivalence and employee least privilege confirmed
- Inactive/missing-profile and cross-workspace isolation confirmed
- No administrative secret in client assets
- Invitation, rate-limit, audit, and cleanup behavior classified

## Production exclusions

No production Supabase access, Vercel Production deployment, production
variables, production domains, main-branch merge, Preview promotion, force
push, destructive database reset, or report commit is authorized.
