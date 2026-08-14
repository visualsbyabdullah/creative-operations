# Phase 2B2A Remember Me Compatibility Analysis

## Scope and verified baseline

This is a read-only compatibility analysis for Phase 2B2A. No Remember Me implementation, source edit, package change, migration, environment change, Supabase configuration change, or production connection was performed.

- Branch: `backend-development`.
- Initial worktree: clean (`git status --short` returned no entries).
- Production build: passed with Next.js `16.2.11`. The existing warning remains: Next.js infers `C:\Users\PC` as the workspace root because it finds both the parent lockfile and this repository's lockfile.
- Exact declared/locked/runtime versions:
  - `next`: `16.2.11`
  - `@supabase/supabase-js`: `2.110.8`
  - `@supabase/ssr`: `0.12.3`
- Installed `@supabase/ssr` source and TypeScript declarations were inspected in read-only mode. `node_modules` was not edited.

## 1. Exact installed package behavior

### Default cookie policy

In `@supabase/ssr` `0.12.3`, `DEFAULT_COOKIE_OPTIONS` is:

- `path: "/"`
- `sameSite: "lax"`
- `httpOnly: false`
- `maxAge: 400 * 24 * 60 * 60` (400 days)

No default `secure` or `domain` is supplied. The package uses `base64url` cookie encoding by default.

The installed `CookieOptions` type is `Partial<SerializeOptions>` from the `cookie` package, so it accepts `maxAge`, `expires`, `path`, `domain`, `sameSite`, `secure`, and `httpOnly`. This type-level support does **not** mean that a caller-provided `maxAge` controls auth cookie writes.

Both browser `setItem` and server `applyServerStorage` construct normal write options in this order:

1. package defaults;
2. caller `cookieOptions`;
3. `maxAge: DEFAULT_COOKIE_OPTIONS.maxAge`.

Therefore, the installed implementation forcibly restores 400 days for every normal auth-cookie write. A supplied `cookieOptions.maxAge` of 30 days, `undefined`, or another value is overwritten. Removal writes similarly force `maxAge: 0`, which is correct.

Conclusion: `cookieOptions` supports the shape of `maxAge`, but `@supabase/ssr` `0.12.3` does not directly support selecting a 30-day versus session-cookie lifetime through `cookieOptions`.

### Cookie storage and names

`@supabase/supabase-js` derives the default storage key as:

`sb-<first hostname label of the Supabase project URL>-auth-token`

For a normal hosted project this is the non-secret pattern:

`sb-<project-ref>-auth-token`

The exact project reference is intentionally not reproduced. The principal stored auth item contains the Supabase session data and is cookie-backed by `@supabase/ssr`. PKCE operations may additionally use:

`sb-<project-ref>-auth-token-code-verifier`

When the experimental `tokens-only` encoding is used, a `-user` storage item can also exist. The current application does not enable `tokens-only`, so it uses the default `user-and-tokens` mode and does not intentionally create the separate `-user` item.

No token values were inspected or recorded.

### Chunking

Cookies can be chunked. The installed package:

- uses a maximum encoded chunk size of 3180 characters;
- writes an unchunked value as the base storage name when it fits;
- otherwise writes `.0`, `.1`, `.2`, and so on;
- treats both the base name and any numeric suffix as belonging to the storage item;
- combines sequential chunks when reading;
- removes stale extra chunks when a newly written value uses fewer chunks;
- treats malformed or mixed-generation base64/JSON chunks as absent rather than propagating them.

Relevant patterns are therefore:

- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token.0`
- `sb-<project-ref>-auth-token.1`
- further numeric chunks as required
- the same base-or-numeric-chunk pattern for the PKCE code-verifier item

The modern `getAll`/`setAll` adapter is necessary for reliable arbitrary chunk counts. The deprecated single-cookie `get` fallback probes only the base name and five possible chunks and is not suitable for this design.

### `createServerClient`

`createServerClient` requires the server cookie adapter to read all request cookies and, wherever response mutation is allowed, write all returned cookie operations. It:

- uses PKCE;
- disables browser-style background auto-refresh;
- disables URL session detection;
- enables `persistSession`;
- lazily loads the session;
- records storage changes and flushes them on `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, `PASSWORD_RECOVERY`, `SIGNED_OUT`, and `MFA_CHALLENGE_VERIFIED`;
- immediately applies PKCE code-verifier writes because no later auth event is guaranteed for that write;
- emits all chunk removals and replacements in one `setAll` batch;
- supplies no-cache response headers alongside auth-cookie writes.

The application adapters currently ignore the second `headers` argument. The proxy should preserve those headers in Phase 2B2 implementation, especially `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0`, and `Pragma: no-cache`.

### `createBrowserClient`

The current call supplies no custom cookies or options. In a browser, `createBrowserClient` therefore:

- returns a singleton client;
- uses `document.cookie` as the storage implementation;
- uses PKCE;
- enables `autoRefreshToken`, URL detection, and `persistSession`;
- reads, combines, encodes, chunks, replaces, and removes session cookies through the package's cookie storage;
- refreshes auth cookies using the package's forced 400-day normal-write lifetime.

It does not store the current default `user-and-tokens` session in `localStorage`. `localStorage` is used by this package only for separate user storage when the experimental `tokens-only` cookie mode is selected without a custom `userStorage`; the application does not select that mode. The application must continue to avoid it for authentication.

### Direct per-login support

There is no sign-in API parameter that selects cookie lifetime per login. `createBrowserClient` is singleton by default, and each server client receives one static `cookieOptions` object for its lifetime. More importantly, the installed write code overwrites normal-write `maxAge` with 400 days.

Secure per-login behavior is nevertheless technically possible without editing the package: supply modern custom `getAll`/`setAll` adapters that preserve the package's values, names, chunk batches, deletion operations, and safe attributes while applying the validated persistence policy to normal writes. This is application adapter behavior, not direct SDK support.

## 2. Current application cookie flow

### Server login

`LoginForm.tsx` sends email, password, and `rememberMe` to the `login` Server Action. The action strictly validates the three keys and the boolean but intentionally ignores `rememberMe` pending this analysis. It creates the request-scoped server client and calls `signInWithPassword`.

On success, `createServerClient` receives the auth state change and the server adapter writes the returned auth cookies through Next.js `cookies().set`. Those cookies currently receive the installed 400-day `maxAge`.

The action then verifies the Auth user against the server, loads the profile, validates the canonical role and active state, and denies invalid/missing/inactive profiles. Denial calls local `signOut`, causing removal of the known auth cookie chunks with `maxAge: 0`.

### Server pages and actions

`src/lib/supabase/server.ts` creates a new request-scoped client over `cookies().getAll()` and `cookies().set()`. It silently catches cookie-write failures because Server Components may be unable to mutate cookies. Proxy refresh is therefore essential. Server Actions and Route Handlers can write.

### Proxy refresh

`src/lib/supabase/proxy.ts` creates a request-scoped server client, reads request cookies, and calls `getClaims()` early. If an expired or nearly expired access token triggers refresh, `@supabase/ssr` produces replacement chunks. The adapter updates both the mutable request cookie view and the outgoing response.

Today it forwards the package-provided cookie options unchanged. Consequently any refresh writes 400-day persistent cookies, regardless of the original login intent. Merely changing login writes would be insecure/incomplete because proxy refresh would restore persistence.

The current proxy adapter also drops the no-cache headers passed as `setAll`'s second argument. Phase 2B2 should copy those headers to the response.

### Browser refresh and auth changes

The browser client uses the package's implicit `document.cookie` adapter. Its background refresh and browser auth changes also use 400-day writes. A server/proxy-only policy would therefore be incomplete unless browser auth-cookie writes are prevented or wrapped by the same policy.

### Auth callback

`src/app/auth/callback/route.ts` uses the normal server client and calls `exchangeCodeForSession`. A successful exchange can create/replace the auth-cookie chunks with the 400-day default. It currently does not carry or enforce a persistence preference.

For password recovery, the safest default is session mode. An existing valid preference may be honored only after strict validation and only if product policy explicitly wants recovery-created sessions to inherit it. A callback must never accept persistence duration or mode from its URL.

### Logout and denied-session cleanup

Logout exists in the `logout` Server Action, the `/auth/signout` Route Handler, and browser reset-password flow. Server sign-out removes every currently discoverable base/chunk cookie for the auth storage items by emitting empty values with `maxAge: 0`. The installed package can also emit both host-only and domain-scoped deletions when a domain is configured.

The application currently has no persistence-preference cookie, so nothing clears it. Phase 2B2 logout and every denied-session cleanup path must clear that cookie in addition to allowing Supabase to clear all discovered auth chunks.

Deletion operations must pass through unchanged. A policy layer must identify at least `options.maxAge === 0` and an already-expired `options.expires` as deletions, and must not replace either with a positive lifetime or strip the expiry. Empty values generated for known removals must likewise remain removals. Blindly overriding every `maxAge` would resurrect or fail to delete sessions.

## 3. Compatibility findings

### Can the login action select persistence before sign-in?

Yes, with an application adapter. The Server Action is a trusted boundary and validates `rememberMe` as a boolean. It can:

1. map that boolean to the closed enum `session | persistent`;
2. set the preference cookie through the server response;
3. construct a Supabase client whose `setAll` policy uses that explicit validated mode for the sign-in writes.

Passing the mode explicitly to client construction is safer than assuming a just-written cookie will always be visible through every framework cookie snapshot.

### Will proxy refresh preserve the mode?

Not currently. It will do so only after its `setAll` is wrapped by the shared policy and it reads a strictly validated preference. Missing, malformed, duplicated, or unsupported preference values must fail to `session`, never to persistent.

### Will browser refresh preserve the mode?

Not currently. Because the application uses a hybrid browser/server client and browser background refresh, the browser adapter must use the same policy. A browser cannot read an HttpOnly preference cookie. With the current architecture, the non-sensitive preference cookie therefore needs to be readable by JavaScript (`HttpOnly` omitted/false), or browser auth refresh/writes would need to be completely redesigned around server-only operations.

The value is not an authorization claim. Browser tampering can at most choose between the two already approved persistence modes for that browser; it cannot create, validate, extend the server-side validity of, or change the role of a Supabase session. Both browser and server adapters must accept only the exact enum values and enforce the fixed 30-day ceiling themselves.

### Does replacing persistent with session cookies work?

Yes, under normal cookie semantics, if name, domain, path, `Secure`, and `SameSite` scope are identical. A `Set-Cookie` with the same name and scope but without `Max-Age`/`Expires` replaces the persistent cookie with a browser-session cookie. The reverse works by adding the approved positive `maxAge`.

This must be done for every current chunk. Supabase writes the current chunk set and deletes obsolete chunks. Scope changes require explicit cleanup at old scopes; the installed package includes `clearAuthCookiesAtScopes` for one-shot migrations. Phase 2B2 must not change domain/path as part of normal mode switching.

### Can cookies alone enforce an absolute 30-day session?

No. A 30-day cookie lifetime controls browser retention, not Supabase server-side session validity. Refresh writes can roll the cookie's expiry forward, and a copied or otherwise retained refresh token is governed by Supabase Auth, not by the browser cookie expiry.

The Supabase Auth session time-box must also be set to 30 days (720 hours) if 30 days is the approved absolute authentication maximum. Supabase enforces the time-box on the next refresh, so effective invalidation can lag by up to the access-token JWT lifetime. Protected sensitive operations should continue using server-validated identity and active-profile/role authorization.

### Inactivity and refresh-token rotation

Refresh-token rotation must remain enabled. Refresh tokens are single-use with supported reuse exceptions; the documented default reuse interval is 10 seconds and should not be weakened or disabled. The proxy and browser can race around refresh, so complete atomic cookie batches and the normal reuse interval matter.

An inactivity timeout is independent of Remember Me. If configured, it may end a persistent session before 30 days, which is safe and should be disclosed. It is checked on refresh, also with possible JWT-lifetime lag. Product/security owners must approve the duration; this analysis does not invent one.

### Browser-close limitation

No web application can guarantee exact “close browser = logout” behavior using session cookies. Browsers may restore session cookies after crash recovery, “continue where you left off,” profile/session restore, mobile suspension, or vendor-specific lifecycle behavior. A browser may also remain running in the background after all visible windows close.

Unchecked mode can correctly avoid intentional persistence by omitting `Max-Age` and `Expires`, but its accurate user-visible promise is “does not intentionally persist across a browser session,” not “closing a window immediately revokes the server session.” Exact revocation requires explicit logout or an approved short inactivity/server time-box policy.

## 4. Recommended architecture

The proposed architecture is safe and compatible only with the following precise implementation.

1. Add one non-sensitive preference cookie named `creative_ops_auth_persistence`.
2. Accept only exact values `session` and `persistent`. Missing, malformed, duplicated, or unknown values resolve to `session`.
3. The trusted login Server Action maps the validated boolean to the enum and sets the preference. It also passes the resolved mode explicitly to the server-client cookie adapter before `signInWithPassword`.
4. Centralize auth-cookie policy in one helper used by server clients, proxy, callback routes, and browser client.
5. Do not attempt to implement the policy with `cookieOptions.maxAge`; installed version `0.12.3` overwrites it.
6. Wrap `setAll`:
   - preserve names, values, batch ordering, chunk operations, domain, path, `SameSite`, `Secure`, `HttpOnly`, and package-supplied no-cache headers;
   - pass deletions through unchanged, including `maxAge: 0` and expired dates;
   - for normal writes in `session` mode, remove both `maxAge` and `expires`;
   - for normal writes in `persistent` mode, remove any conflicting `expires` and set `maxAge` to exactly `2592000` seconds;
   - never accept a duration from the browser or cookie.
7. Use the same scope attributes for both modes so a same-name write replaces the prior mode.
8. Browser `getAll`/`setAll` must use the package-compatible `cookie` parse/serialize behavior or an equally correct implementation and apply the same validated enum policy. It must not decode or edit Supabase token contents.
9. Proxy refresh must apply the shared policy and forward the package's no-cache headers.
10. Callback routes must apply the shared policy. Password-recovery callback defaults to session when no valid preference exists and must not read a mode from the URL.
11. Normal logout, inactive-profile cleanup, missing-profile cleanup, invalid-role cleanup, expired/invalid-session cleanup, and reset-password sign-out must clear all Supabase chunks they can discover and delete the preference cookie.
12. Retain token expiration, auto/server refresh, refresh-token rotation, `getUser`/`getClaims` verification as appropriate, active-profile checks, role validation, route/action authorization, and later RLS enforcement.
13. Configure Supabase's 30-day time-box as the server-side absolute maximum. Cookie lifetime is only the browser retention layer.

The adapter must be tested against actual headers/cookies because this is a deliberate override of installed package output. It does not modify or parse Supabase auth data and stays within the public `getAll`/`setAll` APIs.

## 5. Proposed helper functions

Proposed `src/lib/auth/persistence.ts` responsibilities:

- `AUTH_PERSISTENCE_COOKIE_NAME` — the one preference-cookie name.
- `AUTH_PERSISTENT_MAX_AGE_SECONDS` — fixed/config-validated ceiling of 2,592,000 seconds; reject non-integer, non-positive, or over-approved configuration and fail to session mode.
- `parseAuthPersistence(value)` — exact closed-enum parser; fallback `session`.
- `modeFromRememberMe(boolean)` — trusted login mapping.
- `readServerAuthPersistence(cookieStore)` — read and validate the request preference.
- `readBrowserAuthPersistence()` — parse the non-sensitive preference from `document.cookie`; fallback session.
- `authPersistenceCookieOptions(mode, environment)` — produce preference-cookie attributes.
- `isCookieDeletion(value, options)` — recognize `maxAge <= 0`, an expired `expires`, and explicit Supabase empty-value removals without relying on token contents.
- `applyAuthCookiePersistence(cookiesToSet, mode)` — transform only normal writes and preserve removals, scopes, chunk names, and ordering.
- `clearAuthPersistenceCookie()` — emit a matching-scope deletion.

Proposed Supabase adapter responsibilities:

- `createServerCookieAdapter(cookieStore, explicitMode?)` — modern `getAll`/`setAll`, shared transformation, and header propagation where the response API permits.
- `createProxyCookieAdapter(request, response)` — update request and response cookies, apply shared policy, and forward no-cache headers.
- `createBrowserCookieAdapter()` — document-cookie `getAll`/`setAll` using the shared policy; no local/session storage and no token parsing.

The server and proxy must derive auth cookie names from Supabase's operations rather than hard-coding a fixed chunk count. A storage-key helper may derive the non-secret `sb-<project-ref>-auth-token` pattern only for targeted stale-cookie cleanup; it must never inspect values.

## 6. Preference-cookie attributes

Recommended attributes:

- Name: `creative_ops_auth_persistence`
- Value: exact `session` or `persistent`
- Path: `/`
- Domain: omit (host-only) unless a reviewed cross-subdomain requirement exists
- SameSite: `Lax`
- Secure: `true` in production HTTPS; omit/false for local HTTP development
- HttpOnly: `false` with the current hybrid browser-client architecture, because browser auth refresh must read the policy
- Value sensitivity: non-sensitive; never contains identity, role, email, duration, token, or credential
- Session mode: no `Max-Age` or `Expires`
- Persistent mode: `Max-Age=2592000`; no conflicting `Expires` is required

Although JavaScript can alter this cookie, adapters validate the closed enum and independently enforce the maximum. It is not trusted for identity or authorization. If a future architecture removes all browser-side auth-cookie writes, the cookie should become HttpOnly and server-only.

Auth cookies remain `httpOnly: false` in this installed hybrid SSR/browser architecture because the browser Supabase client must read them. Setting them HttpOnly would break that client; a server-only application architecture would be required to change this safely.

## 7. Development and production behavior

### Development HTTP

- Use host-only cookies on `localhost`.
- Do not set `Secure`, because browsers will not reliably send a Secure cookie over ordinary HTTP.
- Keep `SameSite=Lax` and `Path=/`.
- Session mode omits persistence attributes; persistent mode uses the same 30-day maximum.
- Browser-close behavior remains browser-dependent.

### Production HTTPS

- Set `Secure=true`.
- Keep host-only scope unless cross-subdomain sharing is explicitly required and threat-modeled.
- Keep `SameSite=Lax` and `Path=/`.
- Apply the same scope to auth chunks and all mode replacements.
- Forward private/no-store headers on responses that write auth cookies.
- Do not deploy across mixed HTTP/HTTPS origins.

Environment detection must be trusted server configuration, not a browser-supplied flag. Production must fail safely if secure cookie configuration is ambiguous.

## 8. Required Supabase Dashboard Auth session settings

Before production approval:

- Set **Time-box user sessions** to 30 days / 720 hours as the absolute server-side maximum.
- Keep the access-token JWT expiry at the normal short duration; Supabase recommends the default one hour for most applications and discourages going below five minutes.
- Keep refresh-token rotation enabled.
- Keep the refresh-token reuse interval at the supported default of 10 seconds unless Supabase support and a separate security review approve a change.
- Do not enable non-expiring sessions.
- Decide and document an inactivity timeout. It may be shorter than 30 days; a positive value causes inactive sessions to fail on a later refresh. No duration is approved by this phase.
- Decide separately whether “single session per user” is desired; it changes multi-device behavior and is not required for Remember Me.
- Confirm the plan supports these session controls; Supabase documents time-box, inactivity timeout, and single-session controls as Pro-plan-and-up features.

Supabase does not proactively terminate a time-boxed or inactive session at the exact boundary. Enforcement occurs on refresh, so the practical maximum can be the configured timeout plus the JWT expiry. This limitation must be included in acceptance criteria.

Official references: [Supabase Auth user sessions](https://supabase.com/docs/guides/auth/sessions) and [Supabase CLI Auth configuration reference](https://supabase.com/docs/guides/local-development/cli/config).

## 9. Required edge-case behavior

### Checked to unchecked login

Before the new sign-in, clear/replace any previous session as required by login policy. Write the preference as session and write every new auth chunk without `Max-Age`/`Expires`. Same-name/same-scope writes replace persistent chunks; stale surplus chunks receive unchanged deletions.

### Unchecked to checked login

Write the validated persistent preference and every new normal auth chunk with exactly 30-day `maxAge`. Same scope replaces session cookies. Supabase time-box still limits server validity.

### Token refresh

Browser and proxy refreshes use the validated preference and the shared adapter. Session stays session; persistent stays capped at 30 days per cookie write. Rotation remains enabled. Partial cookie batches must be treated as failure, not silently accepted.

### Browser restart

Persistent cookies may survive and permit refresh only while the Supabase session remains valid and the profile remains active/authorized. Session cookies are not intentionally retained, but browser restore behavior prevents an exact guarantee.

### Logout

Use supported Supabase sign-out. Preserve all SDK deletion operations and clear the preference cookie at the identical scope. Redirect only after the response carries deletions. Logout never relies on client-only UI state.

### Denied inactive account

After server-verified identity and profile lookup, deny access, locally sign out, preserve every auth deletion, clear the preference, and route to the inactive page. An old persistent cookie never overrides the active-profile check.

### Expired or revoked session

Refresh/getUser failure results in unauthenticated handling and cleanup of discoverable stale chunks plus preference. Cookie presence alone never authenticates.

### Invalid role or missing profile

Deny by default, sign out the local session, preserve deletion writes, clear the preference, and never route based on a browser role.

### Cookie chunking

Apply identical persistence attributes to every normal chunk in one batch. Preserve deletion operations for removed chunks. Test both unchunked-to-chunked and chunked-to-fewer-chunks transitions.

### Stale cookies

Normal stale chunks at the current scope are deleted by the SDK. Scope migrations require explicit one-shot cleanup for old paths/domains using known names/patterns; never parse token contents. Duplicated preference cookies or ambiguous scopes fail to session mode and should be cleared/reissued at the canonical scope.

## 10. Security risks and explicitly rejected designs

Primary implementation risks:

- treating the typed `cookieOptions.maxAge` as effective when the installed source overwrites it;
- applying the policy only at login while proxy or browser refresh restores 400-day cookies;
- converting `maxAge: 0` deletions into positive writes;
- missing one or more chunks;
- using different path/domain/Secure/SameSite scope when replacing modes;
- allowing browser-written persistence duration rather than a closed enum and server ceiling;
- considering cookie expiry an absolute server-session limit;
- dropping auth response no-cache headers;
- allowing recovery callbacks to select persistence through a URL;
- promising exact close-window logout;
- setting auth cookies HttpOnly while retaining a browser Supabase client.

Explicitly rejected:

- saving passwords or email as authentication persistence;
- copying access or refresh tokens into custom `localStorage` or `sessionStorage`;
- custom JWTs, permanent login tokens, or non-expiring sessions;
- authentication state, persistence duration, or tokens in URLs/query parameters;
- manually parsing or editing Supabase auth-token contents;
- client-only logout simulation or a `useEffect` logout after protected content renders;
- trusting browser-supplied roles, identity, duration, or authorization state;
- disabling access-token expiration or refresh-token rotation;
- blindly overriding all cookie `maxAge` values;
- changing only login-cookie behavior;
- treating the preference cookie or the existence of auth cookies as proof of a valid session.

## 11. Exact implementation file set proposed for the next approved phase

No files below were changed in this analysis.

Create:

- `src/lib/auth/persistence.ts`
- `src/lib/supabase/cookie-adapters.ts`
- `src/lib/auth/__tests__/persistence.test.ts`
- `src/lib/supabase/__tests__/cookie-adapters.test.ts`
- `tests/auth/remember-me.e2e.ts`

Modify:

- `src/app/auth/actions.ts`
- `src/app/auth/signout/route.ts`
- `src/app/auth/callback/route.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/proxy.ts`
- `src/components/auth/LoginForm.tsx` only if implementation feedback/state needs a minimal wiring change; the boolean is already submitted
- `src/components/auth/ResetPasswordForm.tsx` so its browser sign-out cleanup cannot leave the preference cookie
- the approved test-runner configuration/package files only in a separately approved package-install phase, because no unit/E2E runner is currently installed

No migration is required. Supabase Dashboard session settings are an external reviewed configuration change and must be recorded separately before production deployment.

## 12. Exact automated and browser test matrix

### Unit tests for policy transformation

For both modes, test:

- exact enum parsing; missing, empty, mixed-case, whitespace, duplicate, and arbitrary values fail to session;
- one unchunked normal write;
- two and more chunked normal writes;
- mixed batch containing normal writes and `maxAge: 0` deletions;
- expired-date deletion;
- empty-value SDK removal;
- preservation of path, domain, SameSite, Secure, HttpOnly, priority, and ordering;
- removal of both `maxAge` and `expires` in session mode;
- exact 2,592,000-second persistent ceiling despite caller values of 400 days, negative, huge, string-like, or browser-supplied duration;
- no token decoding or value mutation;
- preference-cookie write and identical-scope deletion;
- development versus production Secure behavior;
- package no-cache headers forwarded unchanged.

### Adapter integration tests

- server sign-in emits preference and all auth chunks in the selected mode;
- server `getUser`/`getClaims` refresh preserves mode;
- proxy refresh updates request and response cookies and preserves mode;
- browser auto-refresh preserves mode;
- callback exchange defaults safely and preserves only a validated policy;
- sign-out passes all SDK deletion cookies unchanged and clears preference;
- denied inactive, missing-profile, and invalid-role cleanup does the same;
- transition from base cookie to chunks and chunks to base removes stale names;
- corrupted/missing chunk fails unauthenticated and is not re-saved;
- same name/path/domain/SameSite/Secure replaces persistent with session and session with persistent;
- old-domain/path cleanup test covers scoped stale-cookie migration;
- invalid/revoked refresh token never becomes valid because a cookie exists.

### Real-browser matrix

Run in current Chromium, Firefox, and WebKit, in development HTTP and production-like HTTPS:

1. Checked login; close the entire browser process; relaunch with the same profile; protected request succeeds only when Supabase session/profile remain valid.
2. Unchecked login; close the entire browser process without storage-state export; relaunch; verify no intentional persistent auth cookie. Record browser session-restore exceptions.
3. Checked-to-unchecked login in the same profile; inspect every auth chunk and restart.
4. Unchecked-to-checked login; inspect every auth chunk and restart.
5. Force access-token expiry/refresh; verify cookie mode and rotated refresh token behavior without recording token values.
6. Exercise simultaneous browser/proxy refresh within the supported reuse interval.
7. Logout; verify all base/chunk auth cookies and preference are gone and direct protected navigation redirects.
8. Logout with multiple chunks and stale surplus chunks.
9. Deactivate an already signed-in persistent user; next protected request denies and cleans up.
10. Change profile role to invalid in a controlled test project; next protected request denies and cleans up.
11. Expire/revoke the server session while persistent cookies remain; next protected request denies.
12. Recovery callback/reset flow; verify no URL controls persistence and logout cleanup is complete.
13. Crash/restore and “continue where left off” scenarios; document that session-cookie restoration is browser-controlled.
14. Assert no password, access token, refresh token, code verifier, session object, or cookie value appears in logs, errors, URLs, screenshots, or test artifacts.

Use an isolated local/test Supabase project only. Do not connect the test suite to production.

## 13. Rollback strategy

Implement the later phase as one isolated, reviewable change set. Before rollout, record current Supabase session settings and deploy behind a controlled release.

Rollback:

1. Revert only the Phase 2B2 persistence helper, adapters, integrations, and tests.
2. Restore the previous client factories and recorded Dashboard session settings through an approved configuration rollback.
3. Explicitly clear `creative_ops_auth_persistence` and all known auth-cookie chunks at every scope used by the attempted deployment, using SDK-supported deletion/`clearAuthCookiesAtScopes`.
4. Require users to sign in again if cookie scope or policy state is ambiguous.
5. Fall back to one documented secure supported cookie mode; do not fake unchecked behavior, retain stale cookies, disable rotation, or create permanent sessions.

Because the current package default is 400-day persistent cookies, rollback to the current behavior must be treated as a known product/security limitation, not as compliant Remember Me behavior.

## 14. Final verdict

**SUPPORTED — safe to implement**

The exact requested behavior is technically achievable with Next.js `16.2.11`, `@supabase/supabase-js` `2.110.8`, and `@supabase/ssr` `0.12.3`, but only through a centralized, tested modern cookie adapter that transforms every normal `setAll` write and preserves every deletion. `cookieOptions.maxAge` alone is not compatible: the installed package forces 400 days.

Approval is conditional on:

- applying the policy to server login, every server client, proxy refresh, browser refresh, and callbacks;
- using the non-sensitive, strictly validated, browser-readable preference cookie required by the current hybrid client;
- preserving deletion cookies and complete chunk batches;
- configuring the Supabase Auth 30-day time-box as the server-side maximum;
- retaining short access-token expiry, refresh-token rotation, server session validation, and per-request active-profile/authorization checks;
- accepting the unavoidable browser limitation that session cookies cannot guarantee exact “close browser = logout.”

