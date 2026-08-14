# Creative Operations

Creative Operations is a Next.js 16 application backed by Supabase Auth, PostgreSQL, Row Level Security, and private Storage. The repository is organized as a single deployable application with explicit frontend, backend, shared-contract, and database boundaries.

## Quick developer map

| Area | Location |
| --- | --- |
| Frontend UI and Next.js routes | `frontend/src/` |
| Backend business logic | `backend/src/modules/` |
| HTTP handlers | `backend/src/api/` |
| Versioned route adapters | `frontend/src/app/api/v1/` |
| Security internals | `backend/src/security/` |
| Supabase clients | `backend/src/supabase/` |
| Shared serializable contracts | `backend/src/shared/` |
| Database and RLS migrations | `backend/supabase/migrations/` |
| Architecture guide | `ARCHITECTURE.md` |
| API documentation | `backend/docs/API.md` |
| Archived code policy | `code-bin/` |

## Commands

Run all commands from the repository root:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Supabase CLI commands use `backend/` as the work directory:

```bash
npm run supabase:migrations
```

Copy `.env.example` to `.env.local` for local development. Never commit credentials. Vercel currently builds from the repository root; the root `build` script delegates to the Next.js app in `frontend/`.
