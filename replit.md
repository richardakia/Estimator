# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **cable-estimator** (`/`) — Structured Cabling Labor Estimator (React + Vite). Multi-run estimates with bulk-pull efficiency, low/avg/high range, and task-level cost breakdown.
- **api-server** (`/api`) — Express 5 + Drizzle backend. Endpoints for estimates, runs, rates config, and a stateless calculator preview.
- **mockup-sandbox** — Canvas component preview server (template; not user-facing).

## Cabling Estimator Details

- **Bulk pulling math**: pull-portion (50% of base time) is multiplied by a bulk factor based on cables-in-run count: 1=1.0, 2=0.75, 3-4=0.65, 5-8=0.55, 9-12=0.5, 13-24=0.45, 25+=0.4. Per-cable portion (termination, test, label) stays at 1.0.
- **Range**: low=0.85x, avg=1.0x, high=1.20x of average hours.
- **Task breakdown**: Cable Pull 35%, Termination & Testing 30%, Pathway 15%, Labeling 10%, Cleanup 10%.
- **Persistence**: Postgres tables `estimates`, `runs`, `rates_config`. The rates row is JSONB and is validated against the API zod schema each load (falls back to defaults if invalid).
- **Calculator** lives in `artifacts/api-server/src/lib/calculator.ts`; default rates seeded on first load.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, wouter (routing), TanStack Query, shadcn/ui, Recharts, Tailwind CSS

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
