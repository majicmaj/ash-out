# Architecture

## Principles

- **On-device, local-first.** All data lives in IndexedDB; nothing requires a network.
- **Small, atomic files.** One responsibility each; easy to read and replace.
- **Logic separated from UI.** Persistence and pure functions are framework-free and
  unit-tested; components stay thin.
- **DRY.** Shared helpers in `lib/`; reusable primitives in `components/`.
- **Designed for what's next.** The data model carries optional fields the later
  steps fill, so steps 2–4 add code without migrations.

## Layers

```
components/  reusable, presentational UI primitives (Button, Modal, Textarea, icons)
features/    vertical slices — each owns its api (writes), hooks (live reads), and views
  logs/        capture + journal (step 1)
  structure/   pluggable structuring engines + insight chips (step 2)
  insights/    pure aggregation + insights view + leaderboard + body map (steps 3-4)
  data/        export / import / clear
db/          Dexie instance + the EventLog data model
lib/         framework-free helpers (date, id, cn, file)
test/        test bootstrap (fake IndexedDB, jest-dom)
```

Data flows one way: components call a feature's **api** to write, and read through
its **hooks** (Dexie live queries). There is no global state container — IndexedDB
_is_ the store, and `useLiveQuery` re-renders on change.

## Data model

`EventLog` (see `src/db/types.ts`) is the single record type. Step 1 uses
`rawText`, `occurredAt`, and timestamps. The `status`, `structured`, and `modelId`
fields are declared now and populated by step 2 — kept optional so no migration is
needed when structuring lands.

The journal query reads the whole table and sorts in `groupLogsByDay` rather than
relying on an index. At personal-journal scale this is effectively free and makes
the live query observe every record, so edits to any field reliably refresh the UI.

## Structuring engines (step 2)

Structuring sits behind one `Structurer` interface (`structure(rawText) →
StructuredEvent[]` + `isAvailable()`), so the orchestration and UI never know
which engine ran:

- **Heuristic** — pure, rule-based, instant, offline. Splits text into clauses,
  classifies each (workout/meal/note), and extracts measures + muscle groups.
  This is the default and the fully-tested baseline.
- **WebLLM** — optional on-device LLM (WebGPU), dynamically imported so its ~6 MB
  engine chunk never loads unless enabled, with grammar-constrained JSON output
  fed through a defensive normalizer. Selected via a small React context that
  persists the choice and resumes it next visit.

A live-query–driven hook (`useAutoStructure`) processes any `raw` log with the
active engine, so new entries, edits, and imports are all structured without
explicit triggering. The raw text is never mutated — structuring only annotates.

## PWA / offline

`vite-plugin-pwa` (Workbox) precaches the app shell and auto-updates the service
worker. Combined with IndexedDB, the app loads and logs fully offline. The E2E
suite verifies this with an offline reload.

## Testing strategy

- **Unit / integration (Vitest, jsdom + fake-indexeddb):** pure helpers, the Dexie
  data layer, and the full React logging flow. Deterministic and fast.
- **E2E (Playwright, real Chromium):** the built app with real IndexedDB and service
  worker — create, persist-across-reload, edit, delete, and offline. This is the
  authoritative check for behavior that depends on the real browser.

### Note on the one retried test

The jsdom suite enables one retry. Dexie's live-query change notifications run on an
async event system that, under heavy CPU contention with the _fake_ IndexedDB, can
occasionally miss a tick — so a live-query–dependent UI assertion may need a second
attempt. This never happens against a real browser (the Playwright E2E covers that
path with no retry), and the deterministic data-layer tests pass on the first try.

## Why these libraries

Short version; full research with sources in [`RESEARCH.md`](RESEARCH.md).

- **Dexie** over raw `idb`/localForage: typed tables, indexed queries, versioned
  migrations, and `useLiveQuery` for reactive reads without boilerplate.
- **WebLLM** (planned, step 2) over Transformers.js for generation: WebGPU
  performance plus first-class **JSON-schema / grammar-constrained** output, which
  is what makes small on-device models reliable for extraction.
- **Tailwind v4** for atomic, DRY styling with no separate CSS files to drift.
