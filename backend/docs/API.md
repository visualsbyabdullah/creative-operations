# Application API

All endpoints are versioned under `/api/v1`, require the normal Supabase cookie session, and return JSON. Errors never include SQL messages, stack traces, tokens, or Supabase internals.

## Response format

Success: `{ "ok": true, "data": ... }`

Failure: `{ "ok": false, "error": { "code": "forbidden", "message": "You do not have permission to perform this action." } }`

## Implemented endpoints

| Method | Endpoint | Access | Request | Important errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/auth/me` | Any active authenticated role | None | `unauthenticated` |
| GET | `/api/v1/tasks` | Active management or creative employee | None | `unauthenticated`, `forbidden`, `temporarily_unavailable` |
| POST | `/api/v1/tasks/{taskId}/start` | Authorized assignee; management where existing workflow permits | UUID path parameter | `validation_failed`, `not_found`, `forbidden`, `stale_update` |
| POST | `/api/v1/tasks/{taskId}/complete` | Assignee of an in-progress self-created personal task | UUID path parameter | `validation_failed`, `not_found`, `forbidden`, `stale_update` |

`GET /api/v1/auth/me` returns safe profile fields: ID, email, display name, role, department, and timezone.

`GET /api/v1/tasks` is scoped by the same backend service and RLS rules used by the application. It never accepts actor or workspace identity from the request.

Task transitions derive the current task and status server-side. The database transition function remains the final authorization and concurrency boundary.

## Evaluated but intentionally not duplicated

Profile mutations, task creation/edit/submission/revision/approval, planner, schedule, submissions, employees, brands, notifications, attachments, invitation, and recovery operations currently use server-rendered reads or Server Actions. Creating parallel HTTP endpoints would duplicate transport without a current client need. Their Server Actions are thin adapters over the same backend services. Add a versioned route when an external/fetch consumer actually requires it, then document it here.
