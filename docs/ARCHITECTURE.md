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
