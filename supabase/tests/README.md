# Authentication security database tests

These tests require a disposable local or isolated development Supabase
project. They must never target production.

After installing and starting the approved Supabase CLI:

```powershell
supabase start
supabase db reset
psql "$env:LOCAL_SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/auth_security.sql
psql "$env:LOCAL_SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/core_schema.sql
```

Before running, confirm that `LOCAL_SUPABASE_DB_URL` points to localhost or
an explicitly approved disposable project. The SQL exercises policy
thresholds, retry values, grants, append-only enforcement, and retention
boundaries. The core-schema suite verifies required tables, deny-by-default
RLS, default workspace provisioning, and restricted trigger functions. Add a
multi-process concurrency harness when the local CLI is approved; unit mocks
do not prove PostgreSQL atomicity.

The audit retention function is intentionally not executable by
`service_role`. Scheduling it requires a separately reviewed trusted
database operation. Authentication audit rows are retained online for 180
days.
