# Ashout

A natural-language workout & meal tracker that runs **entirely on your device**.

Write down what you did in plain words — _"bench press 3x8 at 60kg, then a 5k run"_ —
and Ashout keeps it. No accounts, no server, no network required. It's an installable
PWA, so it works offline and feels like a native app.

> **Status: all four steps are built and tested**, end to end and fully
> on-device. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what's polished next.

## The four steps

1. **Capture** — log anything in free text. _(done)_
2. **Structure** — entries are parsed into workouts/meals on-device: a free
   instant heuristic parser by default, with an optional **WebLLM** (WebGPU)
   model for richer extraction. _(done)_
3. **Insights** — aggregate the structured data into trends (workout days, sets,
   volume, distance, time) over a rolling window. _(done)_
4. **Leaderboard** — rank muscle groups by weekly sets, against the recommended
   training-volume target. _(done)_

Everything stays on-device — no backend, no accounts.

## Tech

| Concern     | Choice                               | Why                                       |
| ----------- | ------------------------------------ | ----------------------------------------- |
| App         | React 19 + Vite + TypeScript         | Fast, predictable, type-safe              |
| Styling     | Tailwind v4                          | Atomic, DRY, no CSS sprawl                |
| Storage     | IndexedDB via Dexie + live queries   | Reactive, offline-first, no global store  |
| Offline/PWA | `vite-plugin-pwa` (Workbox)          | Precached shell, installable, auto-update |
| Tests       | Vitest + Testing Library, Playwright | Logic in jsdom, real-browser E2E          |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the rationale and
[`docs/RESEARCH.md`](docs/RESEARCH.md) for the research behind these choices.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## Quality gates

```bash
npm run typecheck    # tsc, strict
npm run lint         # eslint
npm test             # unit + integration (Vitest, fake-indexeddb)
npm run build        # production build + service worker
```

## End-to-end tests

E2E drives the real built app in headless Chromium (real IndexedDB, real service
worker — including an offline reload check).

```bash
npm run test:e2e:install   # one-time: fetch Chromium (skip if pre-installed)
npm run test:e2e
```

The config auto-builds and serves the app. If your environment sandboxes spawned
browsers, start the server yourself first (`npm run build && npm run preview`) and
re-run — Playwright reuses the running server.

## Project layout

```
src/
  db/            data model + Dexie instance
  features/
    logs/        capture, journal, edit/delete (step 1)
    structure/   structuring engines (heuristic + WebLLM) + insight chips (step 2)
    insights/    aggregation + insights view + muscle leaderboard (steps 3-4)
    data/        export / import / clear
  components/    reusable UI primitives
  lib/           tiny framework-free helpers (dates, ids, files)
  test/          test bootstrap
e2e/             Playwright specs
scripts/         icon + screenshot generation
docs/            roadmap, architecture, research
```

## Privacy

Everything you log lives in your browser's IndexedDB and never leaves the device.
Export a JSON backup any time from **Data & settings**.
