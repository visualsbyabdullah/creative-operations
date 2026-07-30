# Staging Security Report

## Local committed-code and local-schema review

- No `USING (true)` or `WITH CHECK (true)` pattern found in migrations.
- Three declared Storage buckets are private.
- Storage access uses authenticated policies backed by parent/workspace
  authorization.
- 78 `SECURITY DEFINER` declarations were found; repository scan found fixed
  `search_path` coverage consistent with the completion checkpoint.
- Administrative key names appear only in server-only Supabase modules.
- No `NEXT_PUBLIC_` administrative credential name was found.
- No Client Component imports an administrative module in the static scan.
- Signed Storage URLs use five-minute expiry and are not persisted by the
  inspected service.
- Only `.env.example` is tracked; `.env.local` and `.env.staging.local` remain
  ignored.
- Local RLS/ACL/Storage pgTAP suites pass within the 476-assertion total.

## Findings

### S-01 — Invitation origin configuration mismatch

Status: **Resolved locally; hosted verification remains BLOCKED**

The invitation gateway now reuses the strict server-only `APP_URL` origin
parser already used by password recovery. It constructs the fixed
`/auth/callback` path with the URL API. Malformed origins, credentials,
unexpected paths/queries/hashes, non-HTTPS hosted origins, browser-supplied
origins, Host/Referer values, and `NEXT_PUBLIC_SITE_URL` cannot control the
invitation redirect. Focused Vitest coverage passes.

The correction is uncommitted and undeployed. Staging `APP_URL` presence,
hosted Supabase Auth allowlists, and end-to-end invitation delivery remain
BLOCKED.

### S-02 — Remote security posture unverified

Severity: **Release blocker until tested**

Hosted migration history, grants, RLS enablement, policy inventory, function
ACLs, bucket privacy, Auth redirect allowlists, deployed client assets,
workspace isolation, rate limits, audits, and cleanup jobs are BLOCKED because
the isolated staging identities were not supplied.

## Secret handling

No secret value, password, token, cookie, invitation link, signed URL, or
credential fingerprint was printed or written to these reports.
