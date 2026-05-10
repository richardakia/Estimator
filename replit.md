# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **cable-estimator** (`/`) — Structured Cabling Labor Estimator (React + Vite). Multi-run estimates with bulk-pull efficiency, low/avg/high range, task-level cost breakdown, and a standalone Pathway Calculator at `/pathways`.
- **api-server** (`/api`) — Express 5 + Drizzle backend. Endpoints for estimates, runs, rates config, and a stateless calculator preview.
- **mockup-sandbox** — Canvas component preview server (template; not user-facing).

## Cabling Estimator Details

- **Pull labor**: `pullMinutesPer10Ft` per cable type. Per-cable pull hours = (min/60) × (lengthFt/10) × condition multipliers × bulk factor.
- **Termination labor**: `terminationMinutesPerEnd` per cable type, doubled (each cable has 2 ends). Per-cable term hours = (min × 2 / 60) × condition multipliers. Termination is NOT subject to bulk discount.
- **Bulk pulling math**: applied to pull portion only, by cables-in-run count: 1=1.0, 2=0.75, 3-4=0.65, 5-8=0.55, 9-12=0.5, 13-24=0.45, 25+=0.4.
- **Condition multipliers** (apply to both pull and termination): install type, ceiling, pathway, building, environment, skill.
- **Range**: low=0.85x, avg=1.0x, high=1.20x of average hours.
- **Task breakdown**: derived from actual computed hours — only Cable Pull (= Σ pull hrs across runs) and Termination & Testing (= Σ term hrs across runs) rows. No fixed percentages.
- **Persistence**: Postgres tables `estimates`, `runs`, `rates_config`. The rates row is JSONB and is validated against the API zod schema each load; if invalid (e.g. after a schema change), defaults are reseeded into the row. On read, the stored row is shallow-merged under `DEFAULT_RATES` (`ratesStore.ts → mergeWithDefaults`) so newly added top-level fields auto-fill with defaults without overwriting prior user edits.
- **Calculator** lives in `artifacts/api-server/src/lib/calculator.ts`; default rates seeded on first load.

## Rate Editor (`/rates`)

The Rate Editor is organized into three sections so each estimator's variables stay grouped:

1. **Common — used by both estimators.** `hourlyRate` (default $/hr). Used as the default for new cabling estimates (prefilled when the New Estimate dialog opens) and as the starting rate in the Pathway Calculator (auto-syncs into `/pathways` until the user manually edits it).
2. **Cabling Estimator.** Pull/termination times per cable type, the 6 condition multipliers (install/ceiling/pathway/building/environment/skill), the bulk pull formula explainer, and the per-step formula card.
3. **Pathway Estimator.** Per-pathway-type rates (labor min/ft, material $/ft, fastener spacing/cost/labor), mounting height multipliers, pathway ceiling multipliers, cable fill multipliers (labor + material), and 90° bend / wall-floor penetration constants. All values are persisted via `/api/rates` and consumed by `/pathways`.

## Pathway Calculator (`/pathways`)

Pathway estimates are now persisted in Postgres and follow the same "Saved Estimates" pattern as the Cabling Estimator: a sidebar dropdown lets you pick a saved pathway estimate (or create a new one), and the detail view shows totals, the segments table, and the formula explainer. Segments are persisted per estimate.

- **Linear-foot pathways**: `labor = (laborMinPerFt × length / 60) × heightMult × ceilingMult × fillLaborMult` + fasteners (`ceil(length / spacing)` × labor & cost) + bends (0.5h × heightMult + $35 ea) + penetrations (0.75h + $50 ea). Material = `matCostPerFt × length × fillMaterialMult` + fastener/bend/penetration material.
- **Per-each pathways** (sleeves & slots): treated as a quantity. Skips ceiling/fill multipliers, fasteners, bends, and the separate penetration adder (the sleeve IS the penetration). Labor = `(laborMinPerFt × qty / 60) × heightMult`.
- **Persistence**: Postgres tables `pathway_estimates` (id, name, hourlyRate, notes, timestamps) and `pathway_segments` (FK cascade on estimate delete; raw segment inputs + sortOrder). Per-segment computed fields and totals are computed server-side on read using the same shared rates from `/api/rates`.
- **Frontend config + live preview**: `artifacts/cable-estimator/src/lib/pathwayConfig.ts` (10 pathway types across Continuous Support, Non-Continuous Support, Enclosed/Protected, and Penetration categories) — used for the segment dialog's live preview only; saved data displays server-computed values.
- **Server calculator**: `artifacts/api-server/src/lib/pathwayCalculator.ts` mirrors the client logic.
- **Routes**: `/api/pathway-estimates` (GET list w/ summary totals, POST create, PUT, DELETE), `/api/pathway-estimates/:id/segments` (POST add segment with auto sortOrder), `/api/pathway-segments/:id` (PUT, DELETE; bumps parent `updatedAt`).

## Material Cost Module (used by both estimators)

The Cabling and Pathway estimators both attach materials to each saved estimate and report a **Project Total = Labor + Materials Total**.

- **Auto-priced lines (cabling)**: each run produces a cable line (`lengthFt × numCables × cableMaterialCostPerFt[type]`) and a termination line (`numCables × 2 × strands × terminationHardwareCostPerEnd[type]`). Aggregated by cable type for display.
- **Auto-priced lines (pathway)**: per-segment material cost (already computed by `pathwayCalculator`) is summed into a `pathwaySubtotal`.
- **Hardware items**: per-estimate rows (`cabling_hardware_items`, `pathway_hardware_items`) holding either a catalog reference (`catalogKey` → entry in `hardwareCatalog`) or a one-off (`name`, `unitCost`, `quantity`, `unit`, `notes`). Edited via the Materials card on the estimate page (Add / Edit / Delete).
- **Catalog**: `rates.hardwareCatalog` (managed in Rate Editor → "Materials — used by both estimators") feeds the Add Item dropdown on every estimate.
- **Math** (`materialCalculator.ts`):
  - `cableWasteAmount = cableSubtotal × materialWastePercent / 100` — waste applied to cable only.
  - `subtotal = cableSubtotal + cableWasteAmount + terminationSubtotal + pathwaySubtotal + hardwareSubtotal`
  - `markupAmount = subtotal × materialMarkupPercent / 100` — markup applied to full materials subtotal.
  - `total = subtotal + markupAmount`
  - **Project total** for cabling = `totals.totalCostAvg + materials.total`. For pathway = `totals.totalCost (labor + segment material) + hardwareSubtotal + markupAmount` (segment material is already in `totals.totalCost`, so we don't double-count it).
- **API**: `POST/PUT/DELETE /api/estimates/:id/hardware-items` and `/api/pathway-estimates/:id/hardware-items`. `GET /api/estimates/:id` and `GET /api/pathway-estimates/:id` return `hardwareItems`, `materials`, and `projectTotal`.
- **Rate Editor adds**: `Cable Material Cost ($/ft)` and `Termination Hardware ($/end)` per cable type (Cabling section); `Waste %`, `Markup %`, and the **Hardware Catalog** table (Materials section, shared by both estimators).
- **PDF export**: includes a Materials section listing all cable/termination/pathway/hardware lines plus a final "Labor / Materials / Project Total" panel.

## Local Install (cross-platform)

- **`pnpm-workspace.yaml` overrides cleanup (root cause fix)**: previously the `overrides` block set every non-linux-x64 native binary for `esbuild`, `lightningcss`, `@tailwindcss/oxide`, and `rollup` to `"-"`, which prevented any local Windows or macOS install from ever resolving its native binary (this was the actual reason all the "Cannot find module" / "Cannot find native binding" errors kept appearing on Windows even after `pnpm add`). Those overrides have been removed; pnpm now uses each package's per-platform `os`/`cpu` metadata to install only the binary that matches the current platform. Replit (linux-x64) is unaffected.
- **One-command setup/start**: root-level `setup.cmd` / `setup.sh` and `start.cmd` / `start.sh` wrap `pnpm setup:local` and `pnpm start:local`, which delegate to `scripts/src/local-setup.ts` and `scripts/src/local-start.ts` (`@workspace/scripts`). Setup strips any `ignore-scripts=true` from `.npmrc`, generates a default `.env` with a random `SESSION_SECRET` if missing, runs `pnpm install` (full — so all optional Windows native binaries for Rollup / esbuild / Lightning CSS / Tailwind Oxide install correctly), and pushes the DB schema. Start spawns the api-server and cable-estimator dev servers in parallel with `[API]` / `[WEB]` prefixed output and shuts both down on Ctrl+C.
- **Root `preinstall`**: cross-platform Node one-liner that just removes any stray `package-lock.json` / `yarn.lock`. The previous version also enforced pnpm via `npm_config_user_agent`, but that check failed on Windows when pnpm ran the install through a nested process (the user agent did not propagate), causing the entire install to exit 1 with `Use pnpm instead`. The enforcement was removed since pnpm is already documented as the required package manager.
- **API server `start`**: uses Node's built-in `--env-file-if-exists=.env --env-file-if-exists=../../.env` so `DATABASE_URL`, `PORT`, etc. are auto-loaded from a `.env` in either the api-server folder or the project root. No `dotenv` dependency, no manual `export`/`set` required.
- **API server `dev`**: uses `cross-env` (devDependency, in lockfile) so `NODE_ENV=development` works in Windows CMD.
- The Local Deploy page (`/local-deploy`) documents fallbacks for older clones (preinstall failure → `pnpm install --ignore-scripts`; missing `.env` → `set`/`export` variables manually; Notepad saving as `.env.txt`).

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
