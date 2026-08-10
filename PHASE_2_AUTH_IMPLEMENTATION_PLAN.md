# Phase 2A Authentication Implementation Plan

## Scope and verified baseline

This document plans Phase 2 authentication and route protection only. It does not authorize implementation, package installation, database migration, or Supabase configuration changes.

- Baseline branch: `backend-development`.
- Baseline worktree: clean before this file was created.
- Baseline production build: `npm.cmd run build` passed with Next.js `16.2.11`; the only warning was the existing multiple-lockfile workspace-root inference (`C:\Users\PC\package-lock.json` and this repository's `package-lock.json`).
- Architecture: Next.js App Router, React `19.2.4`, TypeScript `5`, `@supabase/ssr` `0.12.3`, and `@supabase/supabase-js` `2.110.8` (`package.json` and `package-lock.json`).
- Existing test runner, authentication test suite, validation package, rate limiter, and audit-event implementation: none found in `package.json` or the repository.

## 1. Current authentication architecture

`src/components/auth/LoginForm.tsx` is a Client Component that creates the browser client from `src/lib/supabase/client.ts`, calls `supabase.auth.signInWithPassword`, and sends every successful claimant to `/dashboard`. It displays raw provider error messages. Its Remember Me checkbox reads and writes `creativeops-remembered-email` in `localStorage`; it does not control the Supabase session.

`src/lib/supabase/client.ts` uses `createBrowserClient`; `src/lib/supabase/server.ts` and `src/lib/supabase/proxy.ts` use `createServerClient`. All three use the same cookie-oriented `@supabase/ssr` architecture and the public project URL/publishable key. `src/lib/supabase/proxy.ts` refreshes/reads claims with `getClaims`, performs only coarse path authentication, and redirects authenticated `/login` requests to `/dashboard`.

`src/lib/auth/requireAppProfile.ts` is the current final server guard. It uses `getClaims`, queries `profiles` with `select("*")`, validates the four roles from `src/types/auth.ts`, and rejects missing, invalid-role, or inactive profiles. `requireManagementProfile` treats `manager` and `hr` identically; `requireEmployeeProfile` permits `graphic_designer` and `video_editor`.

`src/app/dashboard/page.tsx` uses the active profile to select the existing management or employee dashboard. Management guards already exist on `/employees`, `/planner`, and `/brands/**`; employee guards exist on `/tasks` and `/schedule`; role-dispatch guards exist on `/dashboard`, `/notifications`, `/profile`, and `/submissions`. `src/app/settings/page.tsx` is currently unguarded. `src/app/page.tsx` publicly renders `CreativeDashboard`.

`src/components/auth/ForgotPasswordForm.tsx` directly calls `resetPasswordForEmail` in the browser and builds its redirect from `window.location.origin`. `src/app/auth/callback/route.ts` exchanges a PKCE code, but accepts any string beginning with `/` as `next`. `src/components/auth/ResetPasswordForm.tsx` allows any browser session to call `updateUser({ password })`; it does not prove a `PASSWORD_RECOVERY` context. It signs out locally after success.

`src/components/layout/EmployeeHeader.tsx` implements current-device logout with `signOut({ scope: "local" })`, logs the provider error message to the console, and has no logout-all action. `src/context/EmployeeContext.tsx` stores `creativeops-employee-department` in `localStorage`; that is mock UI state and must never be accepted as authentication or authorization evidence.

## 2. Existing vulnerabilities and incomplete behavior

- Public dashboard exposure: `src/app/page.tsx` has no server guard.
- Incomplete coarse protection: `/employees` and `/` are absent from `protectedRoutes` in `src/lib/supabase/proxy.ts`.
- Settings bypass: `src/app/settings/page.tsx` does not call `requireAppProfile`.
- Claim-versus-user trust: `getClaims` verifies the JWT locally, but Phase 2's sensitive server entry points should use `auth.getUser()` to validate against the Auth server, then load the active profile. Proxy remains an optimistic/coarse layer only.
- Login accepts an Auth user before checking for a valid, active application profile, exposes raw Supabase messages, and always routes to `/dashboard`.
- Remember Me stores an email and does not control session persistence. This is misleading even though it does not store the password or tokens.
- Forgot Password leaks provider-specific failures and allows the browser origin to determine `redirectTo`.
- The callback's `startsWith("/")` check permits protocol-relative destinations such as `//attacker.example`; it also does not distinguish a recovery callback from another PKCE exchange.
- Reset Password accepts an ordinary authenticated session and has no reliable invalid, expired, reused, or wrong-flow state.
- Logout errors are written to the browser console. No password, token, code, session object, or provider error should be logged.
- Profile reads use `select("*")`, increasing exposure as the schema grows.
- No application-level auth rate limits, audit hooks, validation schemas, stable error codes, or automated authorization tests exist.

## 3. Exact existing files Phase 2 implementation will modify

Only the approved implementation phase, after review, should modify:

- `src/app/page.tsx` — make `/` a server-side role/active-profile router.
- `src/app/login/page.tsx` — render approved query-state feedback without changing the existing design.
- `src/components/auth/LoginForm.tsx` — use the server login boundary, typed validation, generic errors, real persistence intent, and existing loading/error UI.
- `src/components/auth/ForgotPasswordForm.tsx` — submit to the server boundary and always show the generic accepted response.
- `src/components/auth/ResetPasswordForm.tsx` — require server-approved recovery state and use the existing loading/error/success styling.
- `src/app/auth/callback/route.ts` — enforce a fixed recovery callback, exchange/verify the supported Supabase recovery flow, create short-lived recovery authorization state, and prevent open redirects.
- `src/proxy.ts` — retain the Next.js 16 proxy entry and its matcher while delegating to hardened session refresh.
- `src/lib/supabase/client.ts` — centralize the supported browser-client options and persistence adapter only if the Remember Me spike succeeds.
- `src/lib/supabase/server.ts` — centralize server client cookie behavior and explicit safe public configuration.
- `src/lib/supabase/proxy.ts` — refresh cookies correctly; coarsely protect `/`, `/employees`, `/settings`, and all existing protected route families.
- `src/lib/auth/requireAppProfile.ts` — use server-verified identity, explicit profile columns, active checks, and shared role routing.
- `src/types/auth.ts` — add narrow auth/profile result and error-code types if needed; retain the four canonical role values.
- `src/app/settings/page.tsx` — require an authenticated active profile.
- `src/components/layout/EmployeeHeader.tsx` — call secure current-session logout, remove provider-error logging, and expose logout-all only through an existing-compatible control.

No other dashboard, employee, profile, provider, navigation, or mock-data component should change unless implementation proves it is strictly necessary and review expands this list.

## 4. Exact files Phase 2 implementation will create

Proposed new files:

- `src/app/inactive-account/page.tsx` — dedicated existing-style inactive state.
- `src/app/auth/actions.ts` — server actions for login, forgot password, reset password, current-session logout, and logout-all.
- `src/lib/auth/authorization.ts` — verified-user/profile and role helpers usable by pages, actions, and route handlers.
- `src/lib/auth/routing.ts` — canonical role-to-route mapping and safe internal-path allowlist.
- `src/lib/auth/recovery-state.ts` — short-lived, signed, HttpOnly recovery-purpose state bound to the verified user; this is not a replacement recovery token.
- `src/lib/auth/schemas.ts` — authentication-specific Zod schemas.
- `src/lib/auth/errors.ts` — stable public auth codes/messages and provider-error redaction.
- `src/lib/auth/audit.ts` — Phase 2 audit interface/integration points, with a safe temporary no-op or structured sink until the approved append-only backend exists.
- `src/lib/auth/rate-limit.ts` — Phase 2 limiter interface and fail-closed/fail-safe policy; production enablement depends on the approved atomic store.
- `src/lib/auth/persistence.ts` — only if the supported per-login cookie-persistence spike succeeds.
- `src/app/auth/__tests__/actions.test.ts`
- `src/app/auth/__tests__/callback.test.ts`
- `src/lib/auth/__tests__/authorization.test.ts`
- `src/lib/auth/__tests__/routing.test.ts`
- `src/lib/auth/__tests__/recovery-state.test.ts`
- `src/lib/auth/__tests__/schemas.test.ts`
- `src/lib/supabase/__tests__/proxy.test.ts`
- `tests/auth/phase-2-auth.e2e.ts`

Test filenames assume the test tooling decision below is approved. Do not create test scaffolding before that decision.

## 5. Packages already available

The exact installed direct dependencies relevant to this phase are Next.js `16.2.11`, React/React DOM `19.2.4`, `@supabase/ssr` `0.12.3`, and `@supabase/supabase-js` `2.110.8`. TypeScript `5`, Node types `20`, ESLint `9`, and `eslint-config-next` `16.2.11` are available as development dependencies. The existing `@supabase/ssr` cookie/PKCE architecture is the correct base and should be retained.

## 6. Packages that may need installation

- `zod`: required by `AGENTS.md` for typed server validation; it is not installed.
- `vitest` plus a DOM environment only if component-level tests are approved: no unit runner exists.
- `@playwright/test`: recommended for browser restart/persistence, cookie, redirect, recovery-link, and protected-route tests; it is not installed.
- An atomic distributed rate-limit client/provider SDK may be needed after deployment infrastructure is chosen. An in-memory `Map` is not safe across Next.js instances and must not be presented as production enforcement.

No package should be installed in Phase 2A. Prefer built-in Node `crypto` for signing recovery-purpose state, so no signing package is required.

## 7. Required environment-variable names

Already referenced, with values intentionally not inspected or displayed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Proposed server-only names:

- `APP_ORIGIN` — canonical HTTPS application origin used to construct recovery redirects; never trust request `Host`/browser origin in production.
- `AUTH_RECOVERY_STATE_SECRET` — high-entropy server-only HMAC secret for short-lived recovery-purpose state.
- `AUTH_PERSISTENT_SESSION_MAX_AGE_SECONDS` — target `2592000` (30 days) only if the persistence adapter is proven.
- Provider-specific rate-limit variables after the store is selected, for example `AUTH_RATE_LIMIT_STORE_URL` and `AUTH_RATE_LIMIT_STORE_TOKEN`; exact names remain blocked on that decision and must never be `NEXT_PUBLIC_`.

No service-role key is required for login, session verification, routing, password recovery, or user-scoped logout. Do not introduce one for this phase.

## 8. Supabase dashboard configuration required later

- Set the Auth Site URL to the canonical `APP_ORIGIN`.
- Add exact development/preview/production recovery callback URLs; do not use broad wildcard production redirects.
- Configure the recovery email template to use Supabase's supported PKCE recovery URL and the exact `/auth/callback` path.
- Confirm email/password Auth is enabled, email delivery/SMTP is production-ready, and recovery email expiry/rate limits meet policy.
- Review JWT expiry and refresh-token rotation/session controls; application active-profile checks still run on every protected server request.
- Ensure the public publishable key, never a secret/service-role key, is used by the existing clients.
- Configure platform/proxy access-log redaction so authorization codes and recovery query parameters are not retained. Application code must never log request URLs, codes, tokens, sessions, or passwords.

## 9. Detailed login flow

1. `LoginForm.tsx` submits normalized email, password, and persistence intent to `src/app/auth/actions.ts`; it never stores credentials.
2. `schemas.ts` rejects unknown fields and validates email, password bounds, and the boolean intent before any provider call.
3. `rate-limit.ts` checks atomic limits by IP plus a one-way account identifier. Initial targets from `SECURITY_MODEL.md`: 5 attempts/15 minutes per IP+account and 30/hour per IP.
4. The action calls `signInWithPassword` through the server cookie client. Public failures collapse to one message such as “Unable to sign in with those credentials.”
5. The action calls `auth.getUser()` and queries only `id, email, full_name, role, department, job_title, avatar_url, is_active, created_at, updated_at` for that user.
6. Missing profile, invalid role, and inactive account are denied. The current session is signed out locally before returning a generic denial; inactive users route to `/inactive-account`.
7. `routing.ts` maps `manager`/`hr` to `/dashboard` (the existing management view) and `graphic_designer`/`video_editor` to `/dashboard` (the existing employee view). `/` uses the same mapping.
8. Emit redacted success/failure/inactive audit events. Never include email plaintext, password, access/refresh token, session, recovery code, or raw provider error.
9. Return a stable result to the form; on success use `router.replace`/refresh or a server redirect.

## 10. Detailed Remember Me flow

Delete all `creativeops-remembered-email` reads/writes from `LoginForm.tsx`. The checkbox is session persistence only.

Checked mode targets a cookie-backed Supabase session that survives browser restart for a configurable maximum of 30 days while normal JWT expiry, refresh rotation, active-profile verification, and role authorization continue.

Unchecked mode targets session cookies without `Max-Age`/`Expires`. It must not use `localStorage`, `sessionStorage`, raw token copying, unload handlers, or a custom permanent token. The persistence choice must be carried through browser, server, and proxy cookie rewrites so refresh does not silently convert the mode.

Current blocker: with `@supabase/ssr` `0.12.3`, the repository has not proven that cookie options can be varied safely per login and preserved across browser-client writes, chunked cookies, proxy refresh, and Server Action responses. Before implementation, build an isolated test/spike using the package's supported `cookieOptions`/cookie adapter and verify both modes with Playwright browser-context restarts and token refresh. If that fails, do not fake unchecked persistence. Document the limitation in the UI/release notes and keep one supported secure persistence mode pending an upstream-supported solution.

## 11. Detailed Forgot Password flow

1. `ForgotPasswordForm.tsx` submits only a normalized email to the server action.
2. Validate it and apply 3/hour per account hash and 10/hour per IP.
3. Construct `redirectTo` exclusively as `${APP_ORIGIN}/auth/callback`; do not accept `redirectTo`, `next`, `returnUrl`, origin, or host from the client.
4. Call `resetPasswordForEmail` using Supabase's supported flow.
5. For every syntactically valid request, return the identical status and existing-style message: “If an account is eligible, a reset link will be sent.” Provider failure details remain server-redacted and do not alter the public response.
6. Emit a redacted `auth.recovery.request_accepted` integration event regardless of account existence. Use only an account hash if correlation is required.

## 12. Detailed recovery callback flow

`src/app/auth/callback/route.ts` becomes recovery-specific for this phase. It must accept only the exact Supabase-supported recovery exchange parameters, never a client-selected destination. The sole success destination is `/reset-password`; the sole failure destination is `/forgot-password?error=invalid_reset_link`.

After a successful server exchange, validate the user with `getUser`, then issue a short-lived signed HttpOnly, `Secure` in production, `SameSite=Lax`, path-scoped recovery-purpose cookie containing only version, user ID, issued/expiry times, and random nonce. Sign it with `AUTH_RECOVERY_STATE_SECRET`. This marker records that this application callback just completed a recovery exchange; it is not a custom password-recovery token and cannot recover an account by itself. Ordinary sessions lack a valid marker. Do not place the marker in a URL or JavaScript storage.

The callback must ignore/reject `next`, `redirectTo`, `returnUrl`, protocol-relative paths, external URLs, duplicate parameters, missing codes, and failed/expired/reused exchanges. Responses should be `private, no-store`. No request URL, code, provider response, cookie, token, or session may be logged.

## 13. Detailed Reset Password flow

The reset page first calls a server helper that requires both a server-validated current Supabase user and a valid, unexpired, correctly signed recovery-purpose marker bound to that user. Failure renders the existing-style invalid-link state and offers a new recovery request; an ordinary signed-in session fails.

The form validates a strong new password and exact confirmation through `schemas.ts`, rate-limits reset attempts, and posts to the server action. The action rechecks user and marker immediately before `auth.updateUser`. On success it consumes/clears the marker, calls global sign-out where the approved password-reset policy requires revoking all sessions, clears the current cookies, emits a redacted success event, and redirects to `/login?password_updated=1`. Invalid, expired, reused, tampered, or wrong-user state returns one safe invalid-link result. Passwords are never logged or included in audit metadata.

## 14. Logout and logout-all flow

Normal logout remains current-session-only using Supabase `signOut({ scope: "local" })`, but moves to the server action so cookies are cleared in the response and error handling is consistent. `EmployeeHeader.tsx` shows its existing loading state and redirects to `/login`; it must not `console.error` the provider message.

Logout All Devices is a separate explicit action with confirmation and uses `signOut({ scope: "global" })`. Supabase supports `local`, `global`, and `others` scopes in `@supabase/supabase-js` `2.110.8`; global is not used by the ordinary Sign Out control. Revoked access JWTs can remain valid until their expiry, so protected requests still perform active-profile checks and server verification. Both actions emit redacted audit events.

## 15. Root and protected-route behavior

`src/app/page.tsx` becomes dynamic server code: unauthenticated users redirect to `/login`; active management and employee roles redirect to `/dashboard`; inactive users redirect to `/inactive-account`; missing/invalid profiles fail safely.

`src/lib/supabase/proxy.ts` adds `/` and `/employees` to coarse handling while retaining `/dashboard`, `/tasks`, `/schedule`, `/submissions`, `/notifications`, `/profile`, `/settings`, `/brands`, and `/planner`. It refreshes cookies and may redirect anonymous claimants early, but it performs no final role authorization.

Every protected page must call the appropriate server helper. `/settings` calls `requireAppProfile`; `/employees`, `/planner`, and `/brands/**` call `requireManagementProfile`; `/tasks` and `/schedule` call `requireEmployeeProfile`; shared pages retain active-profile role dispatch. Direct Server Actions and Route Handlers independently call the same helpers. Proxy is never the final security layer.

## 16. Role and active-profile verification

Use `auth.getUser()` at sensitive server boundaries to validate the current user against Supabase Auth. Load the profile by the returned user ID with explicit columns. Require an existing profile, `is_active === true`, and one of the four values in `src/types/auth.ts`.

`manager` and `hr` share one `isManagementRole` predicate. `graphic_designer` and `video_editor` share one employee predicate. Never accept role, activity, user ID, profile ID, department, workspace, or ownership from the browser, `EmployeeContext`, URL, or form. Re-run this flow on every protected server page/action/handler so deactivation denies an older session.

## 17. Proposed server-side authorization helpers

- `getVerifiedUser()` — `auth.getUser`, generic unauthenticated result.
- `getActiveAppProfile()` — explicit-column self query, role parser, active check.
- `requireAppProfile()` — redirects pages or returns a typed authorization error for actions.
- `requireManagementProfile()` — manager/HR only.
- `requireEmployeeProfile()` — Graphic Designer/Video Editor only.
- `dashboardPathForRole()` — exhaustive role mapping.
- `assertAllowedInternalPath()` — exact allowlist, not prefix parsing; callback does not need arbitrary paths.
- `requireRecoveryContext()` and `consumeRecoveryContext()` — validate user-bound signed marker and clear it.

Keep server-action/route-handler error returns separate from `next/navigation` redirects so authorization failures cannot accidentally become unhandled redirect errors.

## 18. Proposed validation schemas

With Zod:

- `loginSchema`: strict object; normalized email, bounded nonempty password, boolean `rememberMe`.
- `forgotPasswordSchema`: strict object; normalized email only.
- `resetPasswordSchema`: strict object; password with approved length/strength bounds and matching confirmation via refinement.
- `logoutSchema`: no client-controlled user/session identifiers.
- `recoveryCallbackSchema`: exact single supported exchange fields; reject unknown redirect fields.
- `recoveryStateSchema`: version, UUID user ID, integer issued/expiry times, bounded nonce, valid HMAC.

Never echo submitted passwords in validation errors or serialize them to logs/audit events.

## 19. Rate-limit integration plan

Place checks inside server actions/callbacks, before expensive provider calls. Use atomic counters in a deployment-shared store with trusted proxy/IP extraction. Keys should combine action, time window, IP hash, and normalized-account HMAC where relevant. Do not store raw email, password, code, token, or recovery marker.

Targets are those in `SECURITY_MODEL.md`: login 5/15 minutes per IP+account and 30/hour per IP; forgot password 3/hour per account hash and 10/hour per IP; callback/reset 5/15 minutes per session/IP. Supabase's provider limits remain enabled; application limits supplement them. Production release is blocked until the atomic store and trusted client-IP header are selected.

## 20. Audit-log integration plan

Define typed events now: `auth.login.succeeded`, `auth.login.failed`, `auth.login.inactive`, `auth.logout.local`, `auth.logout.global`, `auth.recovery.request_accepted`, `auth.recovery.callback_failed`, `auth.password_reset.succeeded`, `auth.password_reset.failed`, and `auth.authorization.denied`.

Metadata may include event time, actor ID after verification, role, outcome code, route identifier, and hashed network/user-agent identifiers. It must exclude passwords, emails unless separately approved, access/refresh/recovery tokens, authorization codes, cookies, session objects, raw URLs/query strings, provider errors, and request bodies. The eventual append-only store belongs to the later audited database phase; Phase 2 cannot claim durable audit logging until that schema/sink is approved.

## 21. Exact tests to add

Unit/integration tests:

- Each auth schema accepts valid input, normalizes email, rejects unknown fields, and never returns a password value in a public error.
- All four roles map to the correct dashboard; unknown roles deny.
- Missing user/profile, invalid role, and inactive profile deny.
- Manager and HR pass management guards; both employee roles fail them.
- Both employee roles pass employee guards; management roles fail them.
- Explicit profile columns are used; client-supplied identity/role/activity is ignored.
- `/` redirects anonymous, routes each active role correctly, and sends inactive users to the inactive page.
- Proxy includes `/employees` and `/settings`, protects nested paths, and remains only a coarse anonymous guard.
- Callback rejects missing/invalid/reused code, every external/protocol-relative/encoded redirect attempt, and all client-provided next/return URL fields.
- Recovery marker accepts only a valid, unexpired, correctly signed, same-user value; rejects tampering, expiry, reuse, wrong user, and ordinary sessions.
- Forgot Password returns byte-equivalent public outcomes for existing, nonexistent, rate-limited, and provider-error cases.
- Login returns generic credentials/profile errors, clears a denied/inactive session, and never exposes provider errors.
- Reset rejects normal authenticated, anonymous, expired, reused, and wrong-user contexts; valid recovery updates once, clears state, and revokes sessions per policy.
- Local logout affects current session; global logout uses global scope; neither logs provider errors.
- Audit metadata redaction tests reject forbidden keys/values.
- Rate-limit tests cover account/IP keys, window rollover, and concurrency against the selected atomic adapter.

Playwright tests:

- Anonymous direct navigation for every protected route, including `/`, `/settings`, `/employees`, and nested brand routes.
- All four role route matrices plus inactive accounts and deactivation of an already signed-in user.
- Refresh-token/cookie refresh preserves authorization.
- Checked Remember Me survives a real browser-context restart; unchecked does not, only if the spike proves support.
- Recovery success, expired link, reused link, modified link, external redirect injection, and ordinary-session reset rejection.
- Current-device logout leaves a second device active; logout-all invalidates refresh on both devices, allowing for access-JWT expiry semantics.
- No password/token/code appears in captured application logs, error bodies, redirect destinations, or audit payloads.

## 22. Rollback strategy

Implement in small uncommitted/reviewable steps. Preserve existing UI components and route names. Before deployment, keep a tagged/commit baseline outside this planning task. Rollback consists of reverting only the Phase 2 file set, restoring the prior Supabase Auth Site URL/redirect allowlist/email template from recorded configuration, and removing only newly introduced non-secret environment names from deployment configuration.

Do not roll back by disabling authorization, exposing `/`, accepting arbitrary callbacks, restoring raw error messages, or storing tokens/email as Remember Me. If recovery configuration is faulty, disable the recovery entry point with a safe generic unavailable state while login/protected-route enforcement remains active.

## 23. Implementation order

1. Approve unresolved decisions: persistence support, canonical origins, test runner, atomic rate-limit store, trusted IP source, audit sink, recovery-session revocation policy.
2. Install only approved validation/test/limiter packages.
3. Add schemas, stable errors, routing, verified-user/profile authorization helpers, and their unit tests.
4. Add and test recovery-purpose signing/consumption.
5. Harden server/browser/proxy clients and prove cookie refresh behavior.
6. Implement server login and Forgot Password actions with generic results and integration hooks.
7. Harden callback and Reset Password, then run invalid/reuse/ordinary-session tests.
8. Convert `/`, `/settings`, and proxy coverage; re-run the full role/active matrix.
9. Move local/global logout to server actions.
10. Implement Remember Me only if the isolated installed-version test passes.
11. Run typecheck, lint, unit/integration/E2E suites, production build, `git diff --check`, and security-focused diff review.
12. Stop for Phase 2 review; do not begin profiles, schema, RLS, tasks, or other modules.

## 24. Unresolved blockers and decisions

1. **Remember Me support:** exact per-login persistent versus session-cookie behavior is not yet proven with `@supabase/ssr` `0.12.3` across browser, Server Action, chunking, and proxy refresh. This blocks claiming the unchecked mode is implemented securely.
2. **Rate limiting:** no atomic shared store or trusted client-IP header is selected. This blocks production-grade application rate limits.
3. **Durable audit events:** no append-only audit schema or external sink exists, and database work is outside this phase. Integration points can be built, but durable audit completion remains blocked.
4. **Recovery state secret:** `AUTH_RECOVERY_STATE_SECRET` and canonical `APP_ORIGIN` need secure deployment configuration.
5. **Testing:** no unit/E2E runner is installed; Vitest/Playwright (or approved equivalents) must be selected.
6. **Recovery revocation policy:** confirm whether successful password reset must use global sign-out. `BACKEND_DECISIONS.md` says security-sensitive password changes should revoke other sessions where supported, so global is the recommended default.
7. **Production log redaction:** hosting/reverse-proxy configuration must be confirmed because PKCE authorization codes arrive in callback query strings even when application code never logs them.
8. **Existing workspace-root warning:** the production build passes, but Next.js infers `C:\Users\PC` due to an additional parent lockfile. It is not an auth blocker, but should be resolved separately without modifying packages during this phase.

## Official API references used to validate the installed architecture

The plan retains `@supabase/ssr` because Supabase documents it for cookie-backed Next.js sessions and refresh rotation: [Supabase server package selection](https://supabase.com/docs/guides/auth/choosing-a-server-package) and [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Recovery uses the supported `resetPasswordForEmail`/`PASSWORD_RECOVERY` model: [resetPasswordForEmail reference](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail). Local and global logout scopes are supported: [Supabase sign-out guide](https://supabase.com/docs/guides/auth/signout).
