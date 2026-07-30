# Staging Acceptance Matrix

Status values are `PASS`, `FAIL`, `BLOCKED`, and `NOT APPLICABLE`. All remote
and authenticated rows currently remain **BLOCKED** because no explicit
staging identities, staging variables, or approved fixture aliases are
available.

| Actor/context | Required acceptance coverage | Current |
|---|---|---|
| Anonymous | App/login/recovery generic behavior; protected route redirect; no business-table or Storage access; no public object URL; safe errors/cookies/client assets | BLOCKED |
| Manager | Same-workspace dashboards, employees, invitations, activation/deactivation, role/department/manager changes, last-Manager protection, brands, schedules, tasks, Planner, submissions, notifications, attachments, signed reads, immutable published files | BLOCKED |
| HR | Full management equivalence with Manager, except last-Manager-specific cases | BLOCKED |
| Graphic Designer | Own profile/avatar/settings; assigned design tasks only; lifecycle/submission/attachments; own Schedule/notifications; no management, video-discipline, unrelated, or cross-workspace access | BLOCKED |
| Video Editor | Own profile/avatar/settings; assigned video tasks only; lifecycle/submission/attachments; own Schedule/notifications; no management, design-discipline, unrelated, or cross-workspace access | BLOCKED |
| Inactive account | Auth may exist; all business, Storage, and mutation access denied; correct inactive experience | BLOCKED |
| Missing profile | Auth may exist; fail closed without resource-existence disclosure | BLOCKED |
| Workspace B | Separate management/employee fixtures and complete bidirectional isolation from Workspace A | BLOCKED |

## Cross-cutting scenario matrix

| ID | Scenario | Expected result | Current |
|---|---|---|---|
| A01 | Root, login, and protected-route behavior | Safe redirect/render | BLOCKED |
| A02 | Forgot password for existing/non-existing test aliases | Same generic result | BLOCKED |
| A03 | Anonymous business-table reads/writes | Denied | BLOCKED |
| A04 | Anonymous Storage reads/writes/public URLs | Denied | BLOCKED |
| A05 | Secure/HttpOnly/SameSite cookie behavior over HTTPS | Approved attributes | BLOCKED |
| A06 | Rendered HTML/client bundles/source errors | No secrets/internal details | BLOCKED |
| M01 | Manager same-workspace aggregate/list/detail reads | Authorized only | BLOCKED |
| M02 | Invite, activate/deactivate, role/department/manager update | Authorized, audited, rate-limited | BLOCKED |
| M03 | Self-role change and last active Manager change | Denied | BLOCKED |
| M04 | Brand and schedule-slot lifecycle | Authorized, workspace-scoped | BLOCKED |
| M05 | Task create/edit/assign/reassign/archive/reopen | Valid transitions only | BLOCKED |
| M06 | Planner filters/pagination and guessed UUID | Bounded; no disclosure | BLOCKED |
| M07 | Submission review/revision/publish | Atomic; self-approval impossible | BLOCKED |
| M08 | Notification own-list/read/mark-all | Recipient-scoped | BLOCKED |
| M09 | Management attachment list/read/remove | State/workspace constrained | BLOCKED |
| H01 | HR repeats M01–M09 | Equivalent to Manager | BLOCKED |
| D01 | Designer own safe profile/settings/avatar lifecycle | Authorized only | BLOCKED |
| D02 | Designer assigned graphic task and transitions | Authorized valid edges | BLOCKED |
| D03 | Designer unrelated/video/cross-workspace tasks | Denied/no disclosure | BLOCKED |
| D04 | Designer atomic submission and attachments | Own permitted states only | BLOCKED |
| D05 | Designer Schedule and notifications | Own only | BLOCKED |
| D06 | Designer management/review/publish attempts | Denied | BLOCKED |
| V01 | Editor own safe profile/settings/avatar lifecycle | Authorized only | BLOCKED |
| V02 | Editor assigned video task and transitions | Authorized valid edges | BLOCKED |
| V03 | Editor unrelated/design/cross-workspace tasks | Denied/no disclosure | BLOCKED |
| V04 | Editor atomic submission and attachments | Own permitted states only | BLOCKED |
| V05 | Editor Schedule and notifications | Own only | BLOCKED |
| V06 | Editor management/review/publish attempts | Denied | BLOCKED |
| I01 | Inactive user business/Storage/Server Action access | Denied | BLOCKED |
| P01 | Missing-profile business/Storage/Server Action access | Denied | BLOCKED |
| W01 | A→B and B→A profile/brand/task/assignment access | Denied | BLOCKED |
| W02 | A→B and B→A submission/notification/attachment access | Denied | BLOCKED |
| W03 | Cross-workspace dashboards/Planner/Schedule/signed URL | Denied | BLOCKED |
| E01 | Invitation authorization/generic response/inactive default | Safe and generic | BLOCKED |
| E02 | Invitation redirect/self-password/duplicate behavior | Safe and idempotent | BLOCKED |
| E03 | Partial failure reconciliation and safe audit | Retryable; no raw link | BLOCKED |
| S01 | All three buckets private and signed reads expire | Private/short-lived | BLOCKED |
| S02 | Avatar replace/remove/old-object cleanup | Authorized/idempotent | BLOCKED |
| S03 | Task attachment type/size/state/remove/retry | Enforced | BLOCKED |
| S04 | Submission attachment review/immutability/two-phase remove | Enforced | BLOCKED |
| R01 | Auth/profile/employee/invitation rate limits | Actor/resource isolated | BLOCKED |
| R02 | Task/submission/notification/brand/Storage limits | Operation-specific | BLOCKED |
| U01 | Business/auth audit events and metadata | Append-only/sanitized | BLOCKED |
| C01 | Cleanup retry, cap, terminal state, isolation, endpoint exposure | Safe/bounded | BLOCKED |
| Q01 | Staging schema/grants/RLS/functions/policies | Matches approved architecture | BLOCKED |

Current staging acceptance totals: **0 PASS, 0 FAIL, 45 BLOCKED, 0 NOT
APPLICABLE**. Local automated validation is reported separately and does not
convert staging rows to PASS.

