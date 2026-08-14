# Phase 2B4 — Approved Security Infrastructure Decisions

## Deployment platform

The approved production deployment platform is Vercel.

The current architecture assumes traffic reaches the application directly through Vercel without an additional external reverse proxy or CDN in front of Vercel.

If Cloudflare, another CDN, or a custom reverse proxy is added later, the trusted-client-IP design must be reviewed again before deployment.

## Distributed security storage

Use Supabase PostgreSQL as the primary shared store for:

- Atomic application rate limiting
- Durable authentication security audit events

Do not use process memory as the production security boundary.

All database changes must be delivered through version-controlled Supabase migrations.

## Trusted administrative database access

Approve one isolated server-only Supabase administrative client.

Preferred key:

- `SUPABASE_SECRET_KEY`

Legacy fallback only when the project has not migrated to new Supabase keys:

- `SUPABASE_SERVICE_ROLE_KEY`

Rules:

- Never prefix either variable with `NEXT_PUBLIC_`
- Never import the administrative client into Client Components
- Never reuse the SSR user-session client
- Never attach browser session cookies to the administrative client
- Disable session persistence, automatic token refresh, and URL session detection
- Use it only for explicitly approved limiter and audit operations
- Never return its errors or credentials to the client
- Include client-bundle exposure checks

The administrative key must not be used for normal user-facing business queries that should remain protected by RLS.

## Shared failure domain

The application accepts Supabase PostgreSQL as the shared failure domain for:

- Supabase Auth-related backend operations
- Application rate limiting
- Authentication audit events

This is accepted for the current project stage.

The architecture should keep clean adapters so the limiter or audit sink can be moved to Redis or an external logging provider later without rewriting authentication business logic.

## Vercel client IP trust

In production on Vercel:

1. Prefer `x-vercel-forwarded-for`
2. Fall back to `x-forwarded-for`
3. Fall back to `x-real-ip`
4. Validate the resulting value as a single valid IP address
5. Never use an arbitrary comma-separated client-selected entry without normalization
6. Never store the raw IP in limiter or audit records

Only trust these forwarding headers when the deployment environment proves it is running on Vercel, using trusted deployment environment indicators such as `VERCEL` or `VERCEL_ENV`.

Outside Vercel production:

- Do not blindly trust forwarded headers
- Use a deterministic local-development identifier
- Document proxy requirements before deploying elsewhere

If an additional proxy or CDN is introduced later, stop and redesign the trusted proxy chain.

## Privacy-minimized identifiers

Create a server-only HMAC secret:

- `AUTH_SECURITY_HMAC_SECRET`

Requirements:

- At least 32 securely random characters
- Never exposed through `NEXT_PUBLIC_`
- Used to create stable privacy-minimized hashes for:
  - IP address
  - normalized email
  - normalized user-agent where required
  - composite limiter keys
- Raw email and raw IP must not be stored in rate-limit records
- Secret rotation must be documented

## Approved rate limits

### Login

Per normalized-email-hash plus IP-hash:

- 5 failed attempts
- 15-minute window

Additional IP-only limit:

- 30 attempts
- 15-minute window

Successful login may clear or reduce the exact email-plus-IP failure bucket.

No permanent account lockout.

### Forgot Password

Per normalized-email-hash plus IP-hash:

- 3 requests
- 1-hour window

Additional IP-only limit:

- 10 requests
- 1-hour window

The user-visible response remains identical whether:

- The email exists
- The limit is exceeded
- The limiter is unavailable
- The provider rejects the request

When blocked or unavailable, do not send a recovery email.

### Recovery callback

Per IP hash:

- 10 attempts
- 15-minute window

Malformed, duplicate, invalid, expired, and rejected callbacks count toward the limit.

### Reset Password

Per recovery-user/context hash plus IP hash:

- 5 attempts
- 30-minute window

Additional IP-only limit:

- 15 attempts
- 30-minute window

Successful password reset may invalidate the relevant limiter buckets.

### Logout

Logout must remain available even if the limiter or audit sink is unavailable.

Do not prevent a user from ending their own session.

## Limiter failure policy

Fail closed for:

- Login
- Forgot Password email dispatch
- Recovery callback
- Reset Password
- Future MFA verification
- Future sensitive account changes

Behavior:

- Do not perform the sensitive operation when the distributed limiter cannot make an atomic decision
- Return a safe fixed response
- Do not reveal whether the failure was account-related, rate-limit-related, or infrastructure-related
- Route Handlers may use 429 with Retry-After for genuine limits
- Provider failure should use a safe temporary-unavailable result where HTTP semantics permit

Fail open for:

- Logout and session cleanup

## Durable audit policy

Use a Supabase PostgreSQL append-only audit table written only through the isolated server-only administrative client.

Normal `anon` and `authenticated` users must have:

- No SELECT access
- No INSERT access
- No UPDATE access
- No DELETE access

Do not expose audit records through ordinary application APIs.

Initial retention:

- 180 days

Retention cleanup must use a separately reviewed trusted scheduled operation.

Manager and HR do not automatically receive direct audit-table access.

Future security-administrator audit viewing must use a separately protected server-only interface and explicit permission.

## Audit failure policy

Authentication should generally continue when the limiter succeeds but writing a non-critical audit record fails.

Requirements:

- Emit a sanitized server operational error
- Never include passwords, tokens, cookie values, raw email, or raw IP
- Never expose the audit failure to normal users
- Critical security logic must not depend on audit persistence

Rate-limit decisions must never be skipped merely because audit logging failed.

## Approved audit events

Include:

- login_succeeded
- login_failed
- logout_succeeded
- logout_failed
- password_reset_requested
- password_recovery_verified
- password_recovery_rejected
- password_reset_succeeded
- password_reset_failed
- inactive_account_denied
- missing_profile_denied
- invalid_role_denied
- authentication_verification_failed
- rate_limit_exceeded
- recovery_state_invalid
- session_cleanup_performed
- security_dependency_unavailable

## Audit metadata

Allowed fields include:

- Event UUID
- Event type
- Actor user UUID when known
- Target user UUID only when necessary
- Workspace UUID when known
- Result
- Request UUID
- Timestamp
- HMAC IP identifier
- Sanitized or hashed user-agent identifier
- Source route/action
- Strict allowlisted metadata

Never store:

- Password
- Password confirmation
- Access token
- Refresh token
- Recovery code
- Recovery token hash
- Recovery cookie
- Session contents
- Cookie values
- Raw email
- Raw IP
- Service or secret key
- Full request body
- Raw provider error
- Arbitrary client metadata

## Request IDs

Generate a cryptographically random UUID for each security-sensitive operation.

Use the same request ID across:

- Rate-limit decision
- Audit event
- Sanitized server error
- Safe response metadata where useful

Do not accept a client-provided request ID as authoritative.

## Database requirements

Create migrations for:

- Atomic rate-limit bucket storage
- Atomic limiter database function
- Authentication audit-event storage
- Constraints and indexes
- Expiration and cleanup support
- Grants and revocations
- RLS
- Append-only protections

Any SECURITY DEFINER function must:

- Have a fixed safe search_path
- Use fully qualified object names
- Validate all inputs
- Revoke execution from unauthorized roles
- Avoid dynamic SQL
- Avoid returning sensitive table contents

## Vercel defense in depth

Application-level Supabase rate limiting remains mandatory.

Vercel WAF rate limiting may later be configured as an additional outer layer for:

- Login routes
- Forgot Password routes
- Auth callback routes
- Reset Password routes

Vercel WAF must not replace account-aware application limits.

## Testing approval

Approve later installation/configuration of:

- Vitest for unit and server-module tests
- Playwright for browser authentication E2E tests
- Supabase CLI/local development for migration and integration testing
- pgTAP for later RLS tests

Packages must be installed only when required by the approved implementation batch.

## Completion requirement

Phase 2B4 is complete only when:

- Atomic database rate limiting works
- Audit logging is durable and append-only
- Vercel client-IP extraction is tested
- Privacy hashing is tested
- Authentication actions use the limiter
- Authentication events use audit integration
- Failure behavior is tested
- No administrative secret enters the client bundle
- TypeScript, lint, tests, and production build pass
- Migrations are generated and tested only against local or development Supabase
