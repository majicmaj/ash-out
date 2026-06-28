# Roadmap

Thin, high-level goals. Step 1 is built; 2–4 are designed-for, not yet built.
Everything stays **on-device** — no backend.

## Step 1 — Capture ✅

Log anything in free text; persist locally; browse, edit, delete; export/import.

- Freeform composer, ⌘/Ctrl+Enter to save.
- Journal grouped by day, newest first.
- IndexedDB (Dexie) + live queries; offline PWA.

## Step 2 — Structure (on-device LLM)

Turn each line of a raw log into structured events (workout / meal / note).

- Run a small instruct model in-browser via **WebLLM** (WebGPU), with
  **grammar-constrained JSON** (XGrammar) so output always matches the schema.
- Process per line; write results into `EventLog.structured` with the `modelId`.
- Graceful path when WebGPU is unavailable (queue as `raw`, offer retry).
- Model is downloaded once and cached; show progress + let the user pick model size.
- Target fields already declared in `src/db/types.ts` (exercise, sets, muscle
  groups, macros).

## Step 3 — Insights

Aggregate structured events into trends.

- Per-period rollups: training volume, sessions, calories/macros, PRs.
- Pure, testable aggregation functions over the structured store.
- Lightweight charts; all computed on-device from local data.

## Step 4 — Muscle-group leaderboard

Rank muscle groups by contribution over a time window.

- Sum estimated volume per `MuscleGroup`; rank and visualize.
- Time filters (week / month / all-time); highlight neglected groups.
- Optional, later: opt-in sharing/compare — still local-first by default.

## Cross-cutting

- Keep files small and atomic; logic separated from UI; DRY helpers in `lib/`.
- Every new capability ships with unit tests and, where it touches the UI, an E2E.
- Accessibility and one-handed mobile use stay first-class.
