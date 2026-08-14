# Phase 2B2 Remember Me Decision

The approved implementation follows the architecture verified in PHASE_2B2_REMEMBER_ME_COMPATIBILITY.md.

## Approved architecture

Use the existing hybrid SSR/browser Supabase architecture.

Do not redesign authentication around server-only token refresh during Phase 2B2.

The persistence-preference cookie will be:

- Name: `creative_ops_auth_persistence`
- Allowed values: `session` or `persistent`
- HttpOnly: false
- SameSite: lax
- Path: /
- Secure: true in production
- Secure: false only for localhost HTTP development
- Domain: unset unless a future deployment requirement explicitly requires it

## Reason

The installed `@supabase/ssr` browser client performs browser-side cookie refresh operations. The browser cookie adapter must therefore be able to read the persistence preference.

The preference cookie is not an authentication credential and contains no:

- Password
- Email
- User ID
- Access token
- Refresh token
- Session contents
- Role
- Permission
- Secret

It only selects one of two approved browser-cookie persistence policies.

## Security boundary

The preference cookie must never be used for:

- Authentication
- Authorization
- Role selection
- Profile selection
- Workspace access
- Session validity
- Redirect authorization

All protected access continues to require:

- Trusted Supabase user verification
- Active profile verification
- Canonical role verification
- Server-side route authorization
- Database RLS in later phases

Missing, malformed, or unexpected preference values must default to `session`.

## Approved lifetime

Persistent mode:

- Maximum browser-cookie lifetime: 2,592,000 seconds
- Equivalent to 30 days

Session mode:

- No persistent Max-Age
- No persistent Expires

Supabase token expiration, refresh-token rotation, session revocation, inactivity timeout, and server-side session limits remain authoritative.

## Deletion behavior

Supabase cookie deletion writes must pass through unchanged.

The implementation must never replace:

- Max-Age 0
- Negative Max-Age
- Past Expires
- Other verified deletion instructions

with a persistent or session-cookie policy.

Logout and denied-session cleanup must delete the preference cookie.
