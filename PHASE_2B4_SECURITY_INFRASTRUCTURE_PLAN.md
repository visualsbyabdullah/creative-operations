# Phase 2B4A Security Infrastructure Plan

## Scope and verified baseline

This document is an architecture analysis only. No application source, dependency, environment file, migration, Supabase project, provider, or production resource was changed.

- Branch: `backend-development`.
- Initial worktree: clean.
- Phase 2B3 production build: passed with Next.js `16.2.11`. The existing warning remains: Next.js infers `C:\Users\PC` as the workspace root because both a parent lockfile and this repository's lockfile exist.
- Exact installed direct versions: Next.js `16.2.11`, `@supabase/ssr` `0.12.3`, and `@supabase/supabase-js` `2.110.8`.
- Deployment evidence: a standard Next.js App Router application, a default README suggesting Vercel, no `vercel.json`, Dockerfile, Netlify/Fly/Render configuration, CI deployment workflow, or `.openai/hosting.json`. Vercel is an assumption, not a confirmed production contract.
- Existing environment-variable names, without values: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `APP_URL`, and `AUTH_RECOVERY_STATE_SECRET`. The local environment currently defines only the two `NEXT_PUBLIC_SUPABASE_*` names.

## 1. Current repository capabilities

The current authentication layer has server actions for login, recovery request, password reset, and logout; recovery and sign-out Route Handlers; server-verified Supabase users; active-profile and canonical-role checks; a signed ten-minute recovery-purpose cookie; generic login and recovery UI messages; a fixed recovery callback destination; and the Phase 2B2 cookie-persistence adapters.

`src/lib/auth/recovery-integration.ts` provides useful call sites but deliberately implements no enforcement or persistence: `checkRecoveryRateLimit` always allows and `recordRecoverySecurityEvent` discards every event. Login and logout do not yet call those boundaries. The repository therefore has neither an effective application rate limiter nor durable audit logging.

The existing `@supabase/supabase-js` client is sufficient to call PostgreSQL RPCs and insert trusted audit records. Node's built-in `crypto` is sufficient for HMAC identifiers and request IDs. No additional runtime package is inherently required for the recommended security infrastructure.

## 2. Existing missing infrastructure

- No Redis, Upstash, Vercel KV, or other distributed counter client.
- No application database client other than Supabase JS.
- No Supabase directory, migration directory, generated database types, local Supabase configuration, or pgTAP suite.
- No server-only administrative/service-role Supabase client.
- No durable audit table, retention job, restricted security-administrator database role, or audit query interface.
- No direct application dependency on Zod. Zod `4.4.3` exists only transitively beneath ESLint tooling and must not be treated as a stable application dependency.
- No Vitest, Jest, Playwright, Cypress, test script, test configuration, or authentication test suite.
- No trusted client-IP contract or request-ID propagation contract.
- No hosting firewall or platform rate-limit configuration.
- No operational alerting, dead-letter queue, or independent audit fallback.

## 3. Provider options evaluated

### Option A: Upstash/Redis-compatible provider

Security and atomicity: Redis `INCR` plus conditional expiry or a Lua script can provide atomic, multi-instance counters. A purpose-built rate-limit SDK can correctly implement fixed/sliding windows, but the exact algorithm and key expiry must be verified. TLS and scoped credentials are mandatory.

Requirements: a new provider account, a runtime dependency such as `@upstash/redis` and optionally `@upstash/ratelimit`, and server-only URL/token variables. None exist today.

Deployment and local development: compatible with Vercel/serverless and conventional Node hosting. Local work needs a real development Redis, a compatible container, or a contract-faithful fake used only in tests. It must not silently fall back to process memory.

Cost and operations: adds a second security-critical vendor, billing dimension, secret, network hop, monitoring surface, and cross-region latency consideration. It isolates limiter load from the primary database and is operationally attractive at larger scale.

Failure mode and credentials: no Supabase service role is needed for limiting. Unauthenticated endpoints can safely use Redis only through server code; credentials must never reach the client. Provider failure still requires the per-operation policy in section 9.

Testability: strong adapter and concurrency testability; integration tests require a disposable Redis-compatible instance.

Conclusion: technically strong, but not the smallest repository-compatible primary choice without an approved provider and deployment contract.

### Option B: Supabase PostgreSQL table plus atomic RPC

Security and atomicity: a single PostgreSQL function can atomically upsert a bounded, HMAC-derived key, increment within a fixed bucket, set expiry, and return `allowed`, `remaining`, and `retry_after_seconds`. Row locks and `INSERT ... ON CONFLICT ... DO UPDATE` make enforcement shared across all application instances. A transaction can also append a `rate_limit_exceeded` audit event.

Requirements: version-controlled migrations and the already-installed Supabase JS client. The recommended invocation uses a new server-only service-role client and `SUPABASE_SERVICE_ROLE_KEY`; it grants no limiter table or RPC access to `anon` or `authenticated`.

Deployment and local development: works anywhere the existing Supabase project is reachable. Local development should use Supabase CLI/local PostgreSQL after that tooling is approved. Until then, development may use an explicit disabled adapter only when `NODE_ENV !== "production"`, with a conspicuous warning and no claim of enforcement.

Cost and operations: no second production vendor; consumes database connections, writes, WAL, indexes, and storage. Hot broad-IP keys and abusive key cardinality must be controlled. Database and authentication security controls share one failure domain.

Failure mode and credentials: requires an administrative credential in server code under the recommended grant design. Public unauthenticated requests never receive it. Direct public RPC grants are rejected because an attacker with the public project key could poison arbitrary limiter keys or generate storage load outside the application.

Testability: deterministic unit adapter tests plus PostgreSQL concurrency/integration tests against a disposable local Supabase stack.

Conclusion: recommended primary implementation for the current repository, conditional on approving migrations and narrowly isolated service-role use.

### Option C: hosting-platform edge/firewall limits

Security and atomicity: platform controls can block obvious IP floods before Next.js and Supabase. Their atomicity, identity semantics, preview behavior, and header trust vary by host and plan. They cannot safely implement email-HMAC or recovery-context limits and cannot create the required application audit records.

Requirements: a confirmed host, plan, rule syntax, trusted header contract, infrastructure ownership, and configuration outside this repository. None is confirmed.

Deployment and local development: host-specific and usually absent locally.

Cost and operations: often low application complexity but potentially plan-dependent. Rules require monitoring to avoid blocking NATed offices or accessibility tools.

Failure mode and credentials: no service role. Public auth routes are suitable for coarse IP rules. Platform failure must not replace application enforcement.

Testability: configuration tests and staging load tests are possible, but ordinary unit tests cannot prove platform enforcement.

Conclusion: recommended only as defense in depth after the production host is confirmed.

### Option D: an already-installed provider

No compatible installed rate-limit provider was found. Supabase PostgreSQL accessed through the existing Supabase JS package is the only already-installed distributed persistence path. No repository test or security package provides production rate limiting.

## 4. Recommended atomic rate-limiter architecture

Use Supabase PostgreSQL fixed-window counters behind a narrowly scoped `SECURITY DEFINER` RPC called only by an isolated server-only service-role client.

The application constructs only named policy IDs from a closed enum. It normalizes identifiers, HMACs privacy-sensitive components, and sends a bounded final key digest rather than attacker-controlled key text. The database maps policy IDs to server-owned limits and windows; callers do not supply arbitrary limits, expiry intervals, table names, or SQL fragments.

The RPC performs one atomic upsert per key and fixed bucket:

1. Validate the closed policy ID, 32-byte key digest, and bounded request ID.
2. Obtain database time with `clock_timestamp()`.
3. Derive the bucket start and expiry from the database-owned policy.
4. Insert count `1`, or atomically increment the existing bucket row.
5. Return whether the post-increment count is within the limit and a clamped retry duration.
6. When denied, append the safe `rate_limit_exceeded` event in the same transaction where practical.

Fixed windows are selected initially because the approved limits are expressed as counts per window, the SQL is readily auditable, and storage is bounded by expiry. A two-bucket weighted sliding window may be adopted later only with new concurrency tests and approval. Temporary bounded backoff for login should be derived from repeated failures, capped at 15 minutes, and must never become a permanent account lock.

Login failure counters are incremented only after a failed credential/provider result, while the broader IP gate is checked before the provider call. A successful login may delete or reduce only the exact email-plus-IP failure key; it must not clear the broader IP protection. All recovery validation failures that could otherwise enable guessing are counted.

## 5. Optional defense-in-depth rate-limit layer

After the production host is confirmed, add platform firewall rules for coarse IP bursts on `/auth/callback`, Server Action POST traffic that maps to auth actions, and `/auth/signout`. The platform rule must use the host's verified client-IP primitive, preserve normal office/NAT traffic, and never expose different forgot-password outcomes.

This layer supplements PostgreSQL. It does not replace identifier-based limits, recovery-context limits, audit events, or application `Retry-After` behavior.

## 6. Exact limit matrix

| Operation/policy | Key scope | Limit and window | Count behavior | Public behavior |
|---|---|---:|---|---|
| Login credential failures | operation + email HMAC + IP HMAC | 5 failures / 15 minutes | Increment after failed sign-in; exact key may reset after verified success | Generic credential error; Server Action returns safe retry seconds |
| Login broad IP | operation + IP HMAC | 30 attempts / hour | Check/increment before provider call, including malformed bounded requests | Same generic login error |
| Forgot Password targeted | operation + email HMAC + IP HMAC | 3 requests / hour | Count every syntactically valid submission regardless of account existence/provider outcome | Always the identical accepted message |
| Forgot Password broad IP | operation + IP HMAC | 10 requests / hour | Count before provider call | Always the identical accepted message |
| Recovery callback | operation + IP HMAC | 10 attempts / 15 minutes | Count malformed, duplicate, provider-error, invalid, expired, reused, and failed exchange attempts; successful verification also consumes one attempt | Redirect to the same invalid-link state on denial |
| Reset Password targeted | operation + recovery-user/context HMAC + IP HMAC | 5 attempts / 30 minutes | Count validation failures, invalid state, and provider failures; check before update | Generic invalid-link/reset response |
| Reset Password broad IP | operation + IP HMAC | 20 attempts / hour | Count before provider update | Same safe response |
| Repeated invalid recovery state | operation + recovery-cookie digest prefix HMAC + IP HMAC | 5 invalid submissions / 30 minutes | Never store the state or its raw digest; missing state uses a constant sentinel | Same invalid-link response |
| Logout | actor HMAC + IP HMAC when known | 30 requests / 15 minutes, telemetry-first | Do not prevent local cookie/session cleanup; flag excess and suppress expensive repeat provider calls only after local deletion is prepared | Redirect safely; no provider detail |
| Future MFA verification | factor-context HMAC + user HMAC + IP HMAC | 5 failures / 10 minutes; 30 attempts / hour per IP | Count all verification failures; verified success may clear exact failure key | Generic verification failure |
| Authenticated sensitive account action | actor HMAC + action ID + IP HMAC | 10 attempts / 15 minutes; optional 30/hour IP | Count attempts before mutation; action-specific stricter limits may override | Stable generic denial with retry duration |

Limits must be configuration data under source control or validated server configuration, but production callers must not set arbitrary values. Changes require security review and concurrency tests.

## 7. Key derivation and privacy design

Normalize emails with trim plus lowercase exactly as authentication does. Do not add provider-specific transformations such as Gmail dot removal. Compute identifier components with HMAC-SHA-256 using a dedicated server-only `AUTH_SECURITY_HMAC_SECRET`, not an unkeyed hash. IPs are first parsed and canonicalized as IPv4 or IPv6; invalid/missing IP uses a bounded `unknown` sentinel and a stricter fallback policy.

Recommended conceptual keys:

```text
email_id = HMAC(secret, "email:v1:" + normalized_email)
ip_id = HMAC(secret, "ip:v1:" + canonical_ip)
actor_id = HMAC(secret, "user:v1:" + verified_user_uuid)
limiter_key = SHA-256("rl:v1:" + policy_id + ":" + email_id + ":" + ip_id)
```

Only the final fixed-length digest and closed policy ID enter the limiter table. Include version prefixes so secret rotation can run a bounded dual-read/dual-write transition. Never use password, token, recovery code, recovery-state value, raw email, raw IP, raw user agent, URL query, or request body in a key.

To reduce unbounded creation, reject overlong input before hashing, use closed policy IDs, cap identifier length, use fixed bucket expiry, enforce per-IP broad gates before targeted-key creation, and run scheduled cleanup. Database constraints must bound all text/byte fields.

## 8. IP-source trust design

The repository does not establish a production proxy chain, so no forwarded header is currently trustworthy.

For Vercel, use the platform-documented client-IP header only after deployment ownership confirms which header Vercel overwrites and strips from incoming requests. Do not parse the leftmost arbitrary value of `X-Forwarded-For`. For another host, document the exact trusted reverse-proxy hops and use only a header overwritten at the final trusted ingress. Direct-origin access must be blocked or treated as `unknown`.

The IP helper should accept the request plus a server-configured `AUTH_TRUSTED_PROXY_MODE` closed enum such as `vercel`, `cloudflare`, or `none`. It must reject duplicate/malformed header values, canonicalize the address, and return only an HMAC to callers. In `none` mode, forwarded headers are ignored. Local development may use the socket/loopback identity where exposed, otherwise the `unknown` sentinel.

Before implementation approval, hosting owners must supply the production host, proxy chain, direct-origin policy, and authoritative header documentation.

## 9. Failure-mode policy

| Condition | Policy |
|---|---|
| Limiter unavailable for login, forgot password, callback, reset, MFA, or sensitive account mutation | Fail closed before the provider/mutation, return the same generic UI response, generate a request ID, and alert through secret-free operational telemetry. Do not return a false account-specific signal. |
| Limiter unavailable for logout | Fail open for local cleanup/sign-out because users must be able to end sessions. Avoid repeated expensive calls where possible. |
| Audit sink unavailable before a successful login or sensitive state change | Fail closed. If login already created a session, sign it out locally and return the generic login failure. |
| Audit sink unavailable for a failed credential attempt | Preserve the generic failed result and raise secret-free operational telemetry; do not retry with credentials. |
| Audit sink unavailable during logout | Complete logout and local cookie deletion; raise an operational alert. Availability of sign-out takes precedence, and the audit gap must be incident-visible. |
| Audit sink unavailable during forgot-password request | Do not call the provider; return the normal generic accepted response. |
| Partial database transaction failure | Treat as unavailable; no counter or same-transaction denial audit should be claimed. |
| Missing production configuration | Throw during server initialization/health verification and block production readiness. Never silently use memory or disable enforcement. |

`Retry-After` must be clamped to `1..window_seconds`. Route Handlers return HTTP 429 plus integer `Retry-After`. Next.js Server Actions cannot reliably expose arbitrary response status/headers to the form; they return a typed `retryAfterSeconds` while preserving the same generic message. If strict HTTP 429 is required for login/forgot/reset, a later approved change should move those boundaries to same-origin Route Handlers.

## 10. Required environment-variable names

Existing and retained:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `APP_URL`
- `AUTH_RECOVERY_STATE_SECRET`

New server-only names:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECURITY_HMAC_SECRET`
- `AUTH_TRUSTED_PROXY_MODE`
- `AUTH_AUDIT_RETENTION_DAYS`

Optional operational/deployment names, only if the selected platform needs them:

- `AUTH_RATE_LIMIT_FAIL_MODE` only as a validated environment-specific policy lock; production must reject unsafe values.
- `AUTH_AUDIT_ALERT_WEBHOOK_URL` only if an approved external alerting system is selected.

If Upstash is selected instead of the recommendation:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

No secret may use `NEXT_PUBLIC_`. Do not duplicate secrets into client-readable runtime configuration.

## 11. Required packages

Recommended production runtime:

- No new limiter or database package; reuse `@supabase/supabase-js` `2.110.8`.
- Add `server-only` as a direct dependency only if repository package policy requires explicit declaration; it is currently resolvable through Next.js but should not be relied on accidentally.
- Add Zod as an explicit direct dependency for stable strict server validation. Do not rely on the transitive ESLint copy.

Testing, in the later approved package phase:

- `vitest` for TypeScript unit and server-boundary tests.
- `@playwright/test` for browser E2E.
- Supabase CLI for disposable local PostgreSQL/Auth and later pgTAP execution; prefer the approved CLI installation method rather than a production runtime dependency.

If Redis is chosen, add only the approved provider client and pin/lock it after a separate supply-chain review.

## 12. Required files to create or modify

Proposed creation:

- `src/lib/supabase/admin.ts`
- `src/lib/security/request-context.ts`
- `src/lib/security/identifiers.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/security/rate-limit-policies.ts`
- `src/lib/security/audit.ts`
- `src/lib/security/audit-metadata.ts`
- `supabase/config.toml`
- `supabase/migrations/<timestamp>_auth_security_infrastructure.sql`
- `vitest.config.ts`
- `playwright.config.ts`
- unit tests under `src/lib/**/__tests__/`
- auth boundary tests under `src/app/auth/__tests__/`
- browser tests under `tests/auth/`

Proposed modification:

- `src/app/auth/actions.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/signout/route.ts`
- `src/lib/auth/authorization.ts`
- `src/lib/auth/recovery-integration.ts`
- `src/lib/auth/recovery-state.ts` only if a non-sensitive context identifier is needed
- `src/lib/supabase/server.ts` only for shared request context if necessary
- `src/lib/supabase/proxy.ts` only for request-ID propagation, never final rate-limit enforcement
- `package.json` and `package-lock.json` in the separately approved dependency/test-tool phase
- `.env.example` with names and safe placeholders in the implementation phase
- deployment configuration after the hosting decision

No UI redesign is required. The current generic form messages should be preserved.

## 13. Required database migrations, tables, functions, grants, and RLS

Create `private.auth_rate_limit_buckets` outside the exposed `public` schema where supported:

- `policy_id text not null`
- `key_digest bytea not null`
- `bucket_started_at timestamptz not null`
- `count integer not null check (count > 0)`
- `expires_at timestamptz not null`
- primary key `(policy_id, key_digest, bucket_started_at)`
- index on `expires_at`
- constraints on policy ID and digest length

Create `private.auth_audit_events` as described in section 15, partitioned monthly only if projected volume justifies the operational cost. Start unpartitioned for modest volume with indexes on timestamp, event type, actor user ID, workspace ID, request ID, and result.

Create functions:

- `private.consume_auth_rate_limit(policy_id, key_digest, request_id)` returning an exact typed result.
- `private.append_auth_audit_event(...)` accepting typed scalar arguments and a sanitized bounded JSON object.
- `private.purge_expired_auth_rate_limits(batch_size)` for bounded cleanup.
- `private.purge_expired_auth_audit_events(cutoff, batch_size)` restricted to the retention role/process.

Every `SECURITY DEFINER` function must:

- be owned by a non-login migration owner;
- set `search_path = pg_catalog, private` (or an equally fixed minimal path);
- schema-qualify every object;
- avoid dynamic SQL;
- validate every enum, length, UUID, digest, timestamp, and metadata key;
- revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`;
- grant execute only to `service_role` or a narrower dedicated database role if Supabase operationally supports it.

Enable RLS on both tables as defense in depth, with no ordinary-user policies. Revoke all table privileges from `PUBLIC`, `anon`, and `authenticated`. The application service role may execute the functions; direct table mutation should be minimized. Audit `UPDATE`, `DELETE`, and `TRUNCATE` are denied to normal application paths. Retention deletion occurs only through the restricted function/job.

Schedule cleanup with Supabase Cron/pg_cron only after confirming availability, or run a separately authenticated scheduled job. Counter rows must also expire by query semantics even if cleanup is delayed.

## 14. Durable audit architecture

Use the same Supabase PostgreSQL project as the durable append-only source of record, written through `private.append_auth_audit_event` by the isolated server-only administrative client. The application constructs a closed event object, the sanitizer rejects forbidden or unknown metadata, and the database function validates again.

Operational logs may contain only event ID, request ID, event type, result, and a database-write status. They are for alerting and diagnosis, not the durable audit source. Never log request URLs for recovery callbacks because codes appear in query strings.

Ordinary authenticated users receive no read/write grants or RLS policies. Later, authorized security administrators should query through a separate reviewed server endpoint or read-only database role with workspace/event/time filters and its own audit trail. Manager/HR access is not automatically approved by the current role matrix.

## 15. Audit event schema

`private.auth_audit_events`:

- `event_id uuid primary key` generated server-side with `crypto.randomUUID()`, with database default fallback.
- `event_type private.auth_audit_event_type not null` containing exactly: `login_succeeded`, `login_failed`, `logout_succeeded`, `logout_failed`, `password_reset_requested`, `password_recovery_verified`, `password_recovery_rejected`, `password_reset_succeeded`, `password_reset_failed`, `inactive_account_denied`, `missing_profile_denied`, `invalid_role_denied`, `authentication_verification_failed`, `rate_limit_exceeded`, `recovery_state_invalid`, and `session_cleanup_performed`.
- `actor_user_id uuid null`.
- `target_user_id uuid null`, allowed only for reviewed event types.
- `workspace_id uuid null`.
- `result text not null` from a closed enum such as `succeeded`, `failed`, `denied`, `accepted`, `cleaned`.
- `request_id uuid not null`.
- `occurred_at timestamptz not null default clock_timestamp()`.
- `ip_hash bytea null` fixed at 32 bytes.
- `user_agent_hash bytea null` fixed at 32 bytes, optionally paired with a coarse server-derived family enum.
- `source text not null` from a closed route/action enum.
- `metadata jsonb not null default '{}'::jsonb`.
- `schema_version smallint not null default 1`.

The database timestamp is authoritative. The application may include an observation timestamp only if clock-skew analysis is later required.

Never store passwords, confirmations, access/refresh tokens, authorization codes, recovery codes, recovery-state values or hashes, session contents, cookies, service-role keys, full request bodies, raw provider errors, arbitrary URLs/query strings, raw emails, or unfiltered metadata.

## 16. Metadata allowlist

Use event-specific schemas, not one permissive object. Globally allowed keys:

- `reason_code`: closed internal enum, never provider text.
- `provider`: currently constant `supabase`.
- `persistence_mode`: `session` or `persistent`.
- `limiter_policy`: closed policy ID.
- `retry_after_seconds`: bounded integer.
- `profile_status`: `active`, `inactive`, `missing`, or `invalid_role`.
- `role`: one of the four canonical roles, only after trusted profile lookup.
- `logout_scope`: `local` or `global`.
- `cleanup_kind`: closed enum for recovery, persistence, or session cookies; never names or values.
- `http_method`: closed set.
- `status_code`: bounded integer where a real HTTP response exists.

Each event schema selects only the keys it needs. Reject unknown keys, arrays, nested objects, control characters, values over 128 characters, and total serialized metadata over 2 KiB. Never spread a request body or provider object. Database validation repeats the allowed-key and size checks.

## 17. Audit retention recommendation

Retain authentication security events online for 365 days initially, subject to legal/privacy approval. Retain rate-limit counters only until their window expiry plus a maximum 24-hour cleanup buffer. Security incident holds must be explicit, access-controlled, time-bound, and documented.

After 365 days, purge in bounded batches through the restricted retention path. If longer retention is legally required, export encrypted immutable archives to an approved security log service/object store, validate deletion from the primary table, and document access and key rotation. Do not assume indefinite retention is safer.

## 18. Service-role and RPC security analysis

Using only the public publishable client for a `SECURITY DEFINER` RPC would require granting execution to `anon`. Any internet user who knows the public project URL/key could then invoke the RPC directly. Even if data disclosure is prevented, attackers could poison limiter buckets or create audit/storage load. HMAC-derived keys reduce privacy exposure but do not authenticate the caller. For this reason, a public RPC grant is not recommended.

The recommended service-role client avoids public execution grants and permits unauthenticated login/recovery requests to use the limiter safely through trusted Next.js server code. Consequences:

- The service-role key bypasses RLS and is therefore a high-impact secret.
- It must live only in `src/lib/supabase/admin.ts`, begin with `import "server-only"`, and expose only narrow wrappers rather than a general client to browser-importable modules.
- It must be named `SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_*`.
- It must not enter Client Components, serialized props, error responses, logs, tests, browser storage, source maps, or build artifacts.
- Use it only for limiter consumption and audit append/retention operations requiring trusted access.
- Rotate immediately on suspected exposure and on the organization's approved schedule; document owner, storage location, deployment targets, and rollback.
- Add static import-boundary tests and inspect production client bundles/source maps for the variable name, known prefix, and a canary secret.

An alternative is a direct PostgreSQL role/connection with only execute rights on the two functions. That improves least privilege but adds a database driver, connection secret, pooling requirements, and serverless connection management. It should be preferred later if Supabase supports issuing a narrowly scoped application credential cleanly. It is not currently repository-compatible.

All RPCs remain `SECURITY DEFINER` only where necessary, with fixed `search_path`, schema qualification, no dynamic SQL, revoked public execution, input constraints, statement timeouts where available, and concurrency tests.

## 19. Request-ID architecture

At the first trusted Next.js server boundary, accept an inbound request ID only from a confirmed trusted ingress that overwrites it and validates UUID format. Otherwise generate `crypto.randomUUID()`. Do not accept arbitrary client text.

Use `x-request-id` on Route Handler responses and internal server-to-server calls. Server Actions should return the request ID only on stable support/error results where exposing a correlation ID is useful. Pass the UUID explicitly through limiter and audit calls; do not rely on mutable global state. Propagate it to operational logs without credentials or request bodies.

Proxy may generate/forward the ID for coarse correlation, but actions and handlers must independently ensure a valid ID because they are public boundaries. A single request ID may link several audit events; every event still has its own event ID.

## 20. Unit-test architecture

Adopt Vitest as the smallest TypeScript-friendly unit runner. Use Node environment by default, explicit module aliases matching `tsconfig.json`, and fake timers only for pure time-policy tests. Avoid importing full Next.js runtime where dependency injection can test a pure boundary.

Unit coverage:

- normalization and HMAC version/domain separation;
- canonical IP parsing and trusted-header modes;
- closed limiter policy lookup and safe retry clamping;
- adapter allowed/denied/unavailable results;
- concurrent calls against a real integration database, not an in-memory mock;
- audit event construction and event-specific metadata sanitization;
- forbidden-key/value rejection;
- request-ID validation/generation;
- recovery-state signing, expiry, user binding, tampering, and cookie deletion;
- Phase 2B2 persistence and cookie deletion semantics;
- authorization outcomes and provider-error redaction.

Mocks may prove application branching, but cannot prove PostgreSQL atomicity, grants, RLS, or cookie behavior.

## 21. Browser E2E-test architecture

Adopt Playwright and run Chromium at minimum in pull requests, with Chromium/Firefox/WebKit in scheduled or release gates. Use a disposable local/test Supabase project only. Create users and profiles through test setup that never reaches production.

Run the production Next.js server for release E2E where feasible. Capture response status/headers, cookies by attributes but never values, console output, and server logs through a redaction scanner. Recovery email tests need a local email inbox or Supabase Inbucket equivalent; tests parse links only in isolated test artifacts and must redact them on failure.

Use separate browser contexts for current-device/global logout and real persistence tests. Do not export authenticated storage state into committed artifacts.

## 22. Later Supabase/RLS-test integration

Introduce Supabase CLI configuration and migrations first. Reset only the disposable local database. Run migration lint/diff checks, then SQL tests/pgTAP for:

- no `anon`/`authenticated` table access;
- no public function execution;
- service-role/narrow role can execute only intended functions;
- audit rows cannot be updated, deleted, or truncated through ordinary roles;
- malformed policy IDs, digests, metadata, UUIDs, and oversized values are rejected;
- fixed `search_path` resists object shadowing;
- concurrent RPC calls enforce the exact threshold;
- cleanup deletes only expired/beyond-retention rows in bounded batches.

CI must fail if the Supabase URL resembles the production project reference or if a production credential is present.

## 23. Exact automated test matrix

| Area | Required cases |
|---|---|
| Login | Correct credentials; wrong password; malformed input; enumeration-safe byte-equivalent errors; inactive account; missing profile; invalid role; successful exact-key reset; broad IP retained; audit success/failure; limiter unavailable. |
| Remember Me | Session and persistent policies; refresh preservation; checked/unchecked transitions; all chunks; deletion writes unchanged; logout cleanup; no tokens in custom storage. |
| Forgot Password | Existing/nonexistent/malformed/rate-limited/provider-failed requests have the same public message; 3/hour targeted and 10/hour IP thresholds; no provider call when closed; audit event safe. |
| Callback | Valid recovery; missing, duplicate, malformed, expired, reused, provider-error, tampered and non-recovery data; open/protocol-relative redirect rejection; 10/15-minute IP threshold; HTTP 429/`Retry-After` if exposed directly; recovery cookie safe. |
| Reset Password | Ordinary session rejected; anonymous rejected; valid context; password mismatch/length; tampered/expired/reused/wrong-user state; 5/30-minute context+IP threshold; provider failure; successful global cleanup; limiter state invalidated safely. |
| Logout | Success/failure; local cleanup even when limiter/audit/provider unavailable; repeated requests; recovery and persistence cookie deletions; safe redirect; no raw errors. |
| Authorization | All four roles; Manager/HR equivalence; missing/inactive/invalid profile; direct action/handler calls; client role/ID ignored. |
| Rate limiter | Limit minus one, exact limit, limit plus one; rollover; safe retry duration; fixed keys; broad/targeted interaction; malformed inputs; thousands of concurrent requests across multiple processes; provider timeout/unavailable; cleanup delay; no process-memory fallback. |
| Audit | Every required event type; correct actor/workspace when known; metadata allowlist; unknown/nested/oversized keys rejected; raw provider error rejected; no password/token/code/session/cookie/body; append-only grants; retention job boundaries. |
| Cookies | Remember Me policy; cookie deletion writes; chunk transitions; SameSite/Secure/path; invalid persistence preference; callback/reset no-store behavior. |
| Request context | Trusted platform header; spoofed `X-Forwarded-For`; duplicate/malformed header; direct origin; IPv4/IPv6 canonicalization; unknown fallback; request-ID propagation. |
| HTTP | Route Handler 429 and integer `Retry-After`; generic redirects/messages; private/no-store headers; stable status codes. |
| Secret exposure | No service-role variable/value/canary in client JS, source maps, HTML/RSC payloads, logs, errors, screenshots, traces, or test reports. |
| Database | RPC concurrency/atomicity; grants; RLS; fixed search path; SQL injection attempts; expiry and retention cleanup; transaction rollback. |

## 24. Deployment configuration

Before production:

1. Confirm the host, regions, runtime (Node versus Edge), proxy chain, and authoritative client-IP header.
2. Store `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECURITY_HMAC_SECRET`, and recovery secret only in encrypted server runtime settings, scoped separately for development/preview/production.
3. Prevent secrets from being exposed to preview deployments from untrusted branches.
4. Apply reviewed migrations through CI to a staging project first; never from a browser or application startup.
5. Configure database statement/connection limits, backups, point-in-time recovery as appropriate, cleanup scheduling, and alerts for denial spikes and sink failures.
6. Redact callback query strings in CDN/platform/access logs.
7. Add coarse platform firewall rules only after staging load tests.
8. Run the production build, client-bundle secret scan, full auth E2E suite, and database grants/RLS suite.
9. Resolve or explicitly accept the current parent-lockfile/Turbopack root warning separately.

Edge runtime is not assumed. The administrative client and Node crypto helpers should run only in reviewed server runtimes. If auth actions are moved to Edge, verify package/runtime compatibility and secret isolation first.

## 25. Local-development behavior

The compliant path is a disposable local Supabase stack with the same migrations and RPCs. Seed only synthetic users. Use a local service-role key emitted by the local stack and a local HMAC secret.

Before the local stack is approved, developers may use an explicit `AUTH_SECURITY_DISABLED_FOR_LOCAL_DEVELOPMENT`-style switch only if:

- it is rejected when `NODE_ENV === "production"`;
- the UI/server prints a prominent non-secret warning;
- no test claims rate-limit or audit coverage;
- CI and preview environments do not permit it;
- there is no process-memory implementation presented as equivalent.

Unit tests use deterministic injected HMAC keys and fake adapters. Atomicity and database security tests always use real disposable PostgreSQL/Supabase.

## 26. Rollback strategy

Deploy additively:

1. Apply new private schema objects, grants, and monitoring without routing production auth traffic.
2. Deploy code with a reviewed dark-read/health-check mode that does not make authorization decisions.
3. Enable audit append, verify durability, then enable limiter enforcement policy by policy.
4. Add platform firewall rules last.

Rollback application enforcement by reverting only the Phase 2B4 integration change and disabling the reviewed feature gate. Do not fall back to memory. Keep audit tables and migration history intact for investigation. Revert firewall rules independently. Never drop or truncate audit/counter tables during rollback.

If the service-role key is exposed, rotate it immediately, redeploy all trusted server environments, invalidate old deployment artifacts, inspect audit/access logs, and run the client-bundle exposure check. A migration rollback must be a new forward migration that revokes execution/grants; never edit applied migration history.

## 27. Cost and operational considerations

PostgreSQL primary costs include two or more writes per auth attempt, WAL, indexes, cleanup, backups, and potential contention on broad IP keys. Measure p95 RPC latency, row growth, denial rate, database CPU/IO, cleanup lag, audit insertion failures, and hot-key contention. Use fixed-size digests and short counter retention.

The shared Supabase design minimizes vendors and packages but couples Auth security controls, application data, and audit availability to one provider. Upstash costs an additional service but isolates counter load and may improve globally distributed latency. Re-evaluate Redis if auth volume, regions, or database contention exceed staging thresholds.

Audit retention has direct storage and backup cost. Partition only after measured volume warrants the added migration/retention complexity. Platform firewall pricing and rule limits depend on the unconfirmed host/plan.

## 28. Blockers or decisions requiring approval

1. Approve Supabase PostgreSQL as the primary limiter and audit store, accepting the shared failure domain.
2. Approve adding and securely operating `SUPABASE_SERVICE_ROLE_KEY`, or choose a narrower direct database credential/provider.
3. Confirm the production hosting platform, runtime, region topology, proxy chain, direct-origin protection, and trusted IP header.
4. Approve the exact limit matrix, especially the proposed broader login IP limit of 30/hour, forgot-password IP limit of 10/hour, reset IP limit, logout telemetry limit, future MFA limit, and sensitive-action defaults.
5. Approve fail-closed behavior for login/recovery/reset/MFA/sensitive mutations when limiter or audit storage is unavailable, and fail-open local logout cleanup.
6. Approve `AUTH_SECURITY_HMAC_SECRET`, its rotation process, and a dual-version rotation window.
7. Approve 365-day audit retention, legal/privacy review, security-admin readers, and incident-hold policy.
8. Approve creating the Supabase migration/local-development structure and cleanup scheduler.
9. Approve direct Zod, Vitest, Playwright, and Supabase CLI tooling in a later package/tooling phase.
10. Decide whether strict HTTP 429 is required for Server Action-backed login/forgot/reset; if yes, approve converting them to same-origin Route Handlers while preserving the UI.
11. Approve optional hosting firewall rules after the host is confirmed.
12. Establish operational alerting for limiter/audit failure; console output is not an audit fallback.

## 29. Final recommendation

Implement one cohesive Phase 2B4 change after approval:

- Supabase PostgreSQL atomic fixed-window RPCs as the primary multi-instance limiter.
- A private append-only Supabase audit table written through a narrow validated RPC.
- One isolated `server-only` service-role client used only for those security operations.
- HMAC-SHA-256 privacy identifiers and a documented trusted-ingress IP contract.
- Fail closed for authentication/recovery/sensitive mutations, fail open for local logout cleanup, and keep enumeration-safe responses.
- Vitest for unit/server tests, Playwright for browser auth tests, and Supabase local/pgTAP for database security tests.
- Confirmed hosting firewall rules as optional defense in depth.

Do not implement a process-memory fallback, grant limiter/audit RPCs to public roles, expose raw identifiers, or claim current no-op integration hooks provide protection.

## 30. Final verdict

**PARTIALLY SUPPORTED — requires an approved limitation**

The architecture is safe to implement only after approval of the Supabase service-role security boundary and the resulting shared Supabase failure domain, plus confirmation of the production proxy/IP contract. The current repository can support the design without a new production runtime provider, but it cannot claim production-safe rate limiting or durable auditing until the migration, secret, deployment, and testing decisions above are approved and implemented.
