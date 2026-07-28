# Frontend Data Flow Map

## Current data architecture

Only authentication and a partial profile lookup are real. Everything else is static module data, React state, or localStorage. There are no business API calls or Server Actions.

| Module | Actual files | Data required by UI | Current source | User actions |
|---|---|---|---|---|
| Login | `src/components/auth/LoginForm.tsx` | email, password, remembered state, auth error/loading | React state; remembered email in localStorage; Supabase Auth | sign in, toggle password, toggle Remember Me, open recovery |
| Recovery | `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `src/app/auth/callback/route.ts` | email; new password; confirmation; recovery session | Supabase Auth plus React state | request link, exchange code, update password |
| Shared identity/header | `EmployeeContext.tsx`, `EmployeeHeader.tsx`, `src/config/employee.ts` | id, name, initials, role, department, navigation | profile query plus fake employee profiles and localStorage department | switch simulated department, navigation, logout |
| Employee dashboard | `CreativeDashboard.tsx`, `AnimatedWeeklyProgress.tsx`, `WeeklyProgressMeter.tsx` | task counts/list, statuses, deadlines, weekly performance series, employee identity | hardcoded arrays and React state | search, choose/start task, open details, update chosen task to In Progress |
| Management dashboard | `ManagementDashboard.tsx`, role wrappers | metrics, team workload/progress, pending reviews | hardcoded `metrics`, `team`, `reviews` | open employee drawer |
| Tasks | `tasks/MyTasks.tsx` | task UUID-equivalent, brand, title, department, type, platforms, day/deadline, status, priority, assigner, description, reference/submission/published links, delay reason, feedback | hardcoded `initialTasks`, filtered by simulated department | search/filter/open; change status; save delay reason; submit link; save published link |
| Schedule | `schedule/MySchedule.tsx` | same assignment/schedule fields, date/time and links | hardcoded `scheduleTasks`, filtered by simulated department | week navigation, search/filter, open item/link |
| Employee submissions | `submissions/SubmissionsManagement.tsx` | task, brand, department/type, submitted timestamp, status, source/final/published links, feedback, revision number | hardcoded `initialSubmissions`, React state | search/filter/open; create submission with task title, brand, source link, final link, notes |
| Management submissions | `management/ManagementSubmissions.tsx` | title, brand, employee, type, status, submitted time, source link, feedback | four hardcoded items, React state | open review, enter feedback, request revision, approve |
| Planner | `planner/WeeklyPlanner.tsx` | weekly tasks, brand, department, content type, platforms, assignee, weekday/time, status/link/delay reason | hardcoded brands/team/content types/tasks, React state | week/filter/search; add/edit/delete task; change status; record delay |
| Employee notifications | `notifications/NotificationsCenter.tsx` | owner/department, type, title/description, timestamp, task, brand, read state, action URL, feedback | hardcoded `initialNotifications`, React state | search/filter/open, mark one/all read, follow action |
| Management notifications | `management/ManagementNotifications.tsx` | title, text, time, tone | three static notifications | none |
| Employee profile | `profile/EmployeeProfileSettings.tsx` | name, email, phone, department, role, bio, avatar, notification preferences | fake initial form and React state | edit fields, fake avatar change, toggle preferences, fake save, fake password update |
| Employee settings | `profile/EmployeeSettings.tsx` | notification preferences and password fields | React state | toggle/save preferences; fake password update |
| Management profile | `management/ManagementProfileSettings.tsx` | authenticated full name/email/role | server profile prop | display only |
| Employees | `management/ManagementEmployees.tsx`, `EmployeeDetailsDrawer.tsx` | name, email, role, active status, active/completed counts, progress, workload state, weekly series | hardcoded four members, React state | search; add; open; edit; delete |
| Brands | `data/brands.ts`, `BrandsManagement.tsx`, `BrandDetailsPage.tsx` | brand identity, industry, status, accent, description, site, assigned designers/editors, platforms, weekly schedule, generated history | six hardcoded brands; browser-wide localStorage key `creativeops-brands`; generated history | search/filter/add/edit/pause; add schedule slot; open history |

## Forms and fields

- Login: email, password, Remember Me.
- Forgot password: email.
- Reset password: new password, confirm new password.
- Employee add/edit: name, email, role (`Graphic Designer`/`Video Editor`), status (`Active`/`Inactive`).
- Planner task: title, brand, department, content type, platform, assignee, weekday, time; delay reason when delayed.
- Employee task updates: status, delay reason, submission link, published link.
- Submission: assigned task title, brand, optional source link, final link, optional notes.
- Management review: feedback; Revision Required or Approved decision.
- Brand add: name, industry, accent color, description, optional website, graphic-design and video-editing assignees.
- Brand edit: name and description in the current detail modal; status toggle.
- Brand schedule slot: day, department, content type, publishing time (platforms inherit/edit according to component state).
- Employee profile: profile picture control, full name, email, phone, department, role, bio; seven notification toggles; current/new/confirm password.
- Employee settings: seven notification toggles; current/new/confirm password.

## Static and local datasets

- `src/config/employee.ts`: Abdullah Naeem and Hamza Khan fake identities.
- `src/data/brands.ts`: six brands, twelve weekly schedule items, generated May–July 2026 content history.
- `CreativeDashboard.tsx`: graphic and video task lists plus weekly performance values.
- `ManagementDashboard.tsx`: aggregate metrics, four-person team/workload data, three review records.
- `MyTasks.tsx`: department task assignments and task workflow values.
- `MySchedule.tsx`: department schedules.
- `SubmissionsManagement.tsx`: eight employee submissions.
- `ManagementSubmissions.tsx`: four management review items.
- `WeeklyPlanner.tsx`: brands, team members, content-type catalogs, ten planner tasks.
- `NotificationsCenter.tsx`: employee notifications; `ManagementNotifications.tsx`: three management notifications.
- `ManagementEmployees.tsx`: four members and weekly workload arrays.
- Profile/settings initial values and all UI filter option arrays.
- localStorage keys: `creativeops-remembered-email`, `creativeops-employee-department`, and `creativeops-brands`.

## Required server boundary

Reads should occur in authenticated server services/pages where practical. Mutations should use Server Actions or Route Handlers with Zod schemas, `requireAppProfile`, field allowlists, workspace/ownership checks, transactional status transitions, and RLS as the second enforcement layer. Browser Supabase access may remain for realtime and narrowly scoped self-service reads only after policies are tested.

