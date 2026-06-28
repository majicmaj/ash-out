# Roadmap

Thin, high-level goals. Step 1 is built; 2–4 are designed-for, not yet built.
Everything stays **on-device** — no backend.

## Step 1 — Capture ✅

Log anything in free text; persist locally; browse, edit, delete; export/import.

- Freeform composer, ⌘/Ctrl+Enter to save.
- Journal grouped by day, newest first.
- IndexedDB (Dexie) + live queries; offline PWA.

## Step 2 — Structure ✅

Turn each clause of a raw log into structured events (workout / meal / note).

- **Heuristic parser (default, built):** free, instant, offline — no download, no
  GPU. Parses sets/reps/weight, cardio distance/duration, maps exercises to
  muscle groups, computes volume. Runs automatically in the background.
- **On-device LLM (optional, built):** **WebLLM** (WebGPU) with
  **grammar-constrained JSON** output, behind the same `Structurer` interface.
  WebGPU-gated, model downloaded once and cached, with progress + model choice in
  settings; falls back to the heuristic when unavailable.
- Derived insight chips (muscle tags, volume, distance, duration, meal) show
  under each entry. Results written to `EventLog.structured` with `modelId`.

Next here: re-structure existing entries when AI is enabled; per-event editing.

## Step 3 — Insights ✅

Aggregate structured events into trends.

- Pure aggregation over the structured store (`computeInsights`): workout days,
  total sets, volume, cardio distance/duration, meals — for a rolling window.
- Insights tab with a 7-day / 30-day / all-time selector and stat cards.
- Next: macros rollup once the LLM fills them; PRs; activity sparkline.

## Step 4 — Muscle-group leaderboard ✅

Rank muscle groups by contribution over a time window.

- Ranks groups by **sets per muscle group** (the standard hypertrophy volume
  metric), anchored to the recommended ≈10–20 sets/week; bars turn green on
  target. Cardio summarized separately.
- Next: highlight neglected groups; opt-in compare — still local-first.

## Cross-cutting

- Keep files small and atomic; logic separated from UI; DRY helpers in `lib/`.
- Every new capability ships with unit tests and, where it touches the UI, an E2E.
- Accessibility and one-handed mobile use stay first-class.
