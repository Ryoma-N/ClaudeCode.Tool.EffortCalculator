# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with HMR at http://localhost:5173
npm run build    # Type-check (tsc -b) then build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build
npm run electron # Build + launch as Electron desktop app
npm run dist     # Build + package as Windows portable EXE → release/EffortCalculator1.0.1.exe
```

No test framework is configured.

## Architecture

**工数計算ツール** is a single-user, fully client-side PWA for IT project man-hour estimation and EVM-style progress tracking.

### Data Flow

```
IndexedDB (Dexie) ←→ Zustand Store (appStore.ts) ←→ React Pages/Components
```

- `src/db/database.ts` — Dexie schema (3 versions with migrations). Tables: `projects`, `phases`, `tasks`, `processDefinitions`, `workEntries`
- `src/stores/appStore.ts` — Single Zustand store holding all entities in memory. Exposes CRUD actions and computed selectors (`getProjectWithStats`, `getTaskWithActuals`, `getAlerts`)
- `App.tsx` — wraps all routes in a `DataLoader` component that calls `loadAll()` to populate Zustand from IndexedDB before rendering

### Routing (src/pages/)

| Route | Page |
|---|---|
| `/` | DashboardPage |
| `/projects` | ProjectListPage |
| `/projects/:id` | ProjectDetailPage |
| `/projects/:id/settings` | ProjectSettingsPage |
| `/projects/:id/pdf` | PdfExportPage |
| `/tasks/:id` | TaskDetailPage |
| `/monthly` | MonthlyReportPage |

### Key Domain Concepts

**Progress calculation** (auto, no manual input):
- Per-task `progressRate` = `status === 'done' ? 100 : status === 'in_progress' ? 50 : 0` (auto-derived in `computeTaskActuals`)
- Project/phase progress = `doneCount / totalCount * 100` (count-based, user-friendly)
- `earnedHours` = `estimatedHours × progressRate / 100` (EVM, shown in detail views)
- `variance` = `actualHours - earnedHours` (positive = over budget)

**Multiple assignees**: `Task.assignees: string[]` (migrated from `assignee: string` in DB v4).

**Time unit conversions** (`src/utils/hoursUtils.ts`):
- 1 Man-Day = `project.mdHours` (default 8h)
- 1 Man-Month = `project.mmDays × mdHours` (default 20 × 8 = 160h)

**Alert levels**: Tasks overdue or due within 3 days → warn/danger badges. Projects past `endDate` → danger; within 3 days → warning.

**Electron / EXE**: `electron/main.cjs` is the Electron main process. `vite.config.ts` sets `base: './'` so the built HTML works with `file://` protocol. `npm run dist` creates `release/工数計算ツール.exe` (portable, no installer needed).

### Tech Stack

- **React 19** + **TypeScript** (strict mode, ES2023 target)
- **Vite 8** with PWA plugin (service worker, installable)
- **Tailwind CSS 3** — dark theme with custom palette in `tailwind.config.js` (`surface`, `edge`, `ink`, `brand` color tokens)
- **Zustand 5** — global state
- **Dexie 4** — IndexedDB ORM
- **React Router 7** — SPA routing
- **React Hook Form + Zod** — form validation
- **Recharts** — charts in ProjectDetailPage
- **jsPDF + html2canvas** — PDF export

### Future Roadmap (from design docs)

Phase 2: Supabase migration for team collaboration. Phase 3: Gantt chart. Phase 4: Cost management. Phase 5: Excel/CSV export.

Design documents are in `docs/` (Japanese): basic design, detailed design, UI design, user manual.
