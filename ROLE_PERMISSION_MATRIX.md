# Role Permission Matrix

The repository defines four canonical roles in `src/types/auth.ts`. `src/lib/auth/requireAppProfile.ts` deliberately treats HR and manager identically. “Own” means `auth.uid()` ownership or explicit task assignment, never matching department/name from client state.

| Capability | Manager | HR | Graphic Designer | Video Editor |
|---|---:|---:|---:|---:|
| Access role dashboard | Yes | Yes | Own employee view | Own employee view |
| View/update own safe profile fields/preferences | Yes | Yes | Yes | Yes |
| Change own role/activity/workspace/manager | No | No | No | No |
| View employees in workspace | Yes | Yes | No | No |
| Create/invite/edit/deactivate employees | Yes | Yes | No | No |
| Assign management role | Needs confirmation | Needs confirmation | No | No |
| View/manage brands and schedules | Yes | Yes | Only explicitly shared data if UI later exposes it | Same |
| View planner/workspace tasks | Yes | Yes | No | No |
| Create/assign/edit/archive tasks | Yes | Yes | No | No |
| View assigned task/schedule | Yes | Yes | Own assignments only | Own assignments only |
| Update work progress/delay | Yes | Yes | Own assigned design tasks within allowed transitions | Own assigned video tasks within allowed transitions |
| Submit work | Review scope | Review scope | Own assigned tasks | Own assigned tasks |
| View submissions | Same workspace | Same workspace | Own only | Own only |
| Request revision/approve | Yes | Yes | No | No |
| Mark published/add published URL | Needs confirmation | Needs confirmation | Needs confirmation | Needs confirmation |
| View notifications | Own plus justified management events | Same | Own only | Own only |
| Mark notifications read | Own only | Own only | Own only | Own only |
| Access private files | Same-workspace permitted resources | Same | Own/assigned/shared only | Own/assigned/shared only |
| View audit logs | Needs confirmation | Needs confirmation | No | No |

## Current route behavior versus intended permission

- `/dashboard`, `/submissions`, `/notifications`, and `/profile` dispatch by verified role.
- `/tasks` and `/schedule` reject management roles.
- `/planner`, `/employees`, and `/brands/**` require management.
- `/settings` does not dispatch or check role/profile activity and renders the employee UI for everyone with a claim.
- `/` has no protection.
- Navigation definitions are presentation only: employee navigation omits notifications/profile/settings though the header links expose some of them; management navigation omits notifications/profile.

## Required field controls

Employees may update only confirmed self-service profile fields (likely name, phone, bio, avatar), preferences, and permitted task/submission fields. They may never submit `profile_id`, `role`, `is_active`, `workspace_id`, `manager_id`, `created_by`, `assigned_by`, reviewer identity, or ownership values. Management still may not spoof actor/audit fields. Manager and HR equality must be implemented in shared authorization helpers and identical RLS predicates, not duplicated route conditionals.

