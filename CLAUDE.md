# CLAUDE.md

Guidance for working in this repo.

## What this is

Ashout — a local-first PWA that logs workouts and meals in natural language and
structures/aggregates them **entirely on-device**. No backend, no accounts. React
19 + Vite + TypeScript + Tailwind v4; Dexie (IndexedDB) for storage.

All four product steps are implemented:

1. Capture (`features/logs`)
2. Structure (`features/structure`) — heuristic parser + optional WebLLM
3. Insights (`features/insights`)
4. Muscle-group leaderboard (`features/insights`)

## Conventions

- **Small, atomic files; one responsibility each.** Keep components thin.
- **Separate logic from UI.** Pure functions and persistence live outside
  components and are unit-tested; components read via live-query hooks.
- **No global store** — IndexedDB is the source of truth via Dexie `useLiveQuery`.
- **Pluggable engines** — anything structuring text implements the `Structurer`
  interface (`features/structure/types.ts`).
- Path alias `@/` → `src/`. Tailwind v4 (no config file; theme tokens in
  `src/index.css`). Prettier: no semicolons, single quotes.

## Commands

```bash
npm run dev          # dev server
npm run typecheck    # tsc -b --noEmit (strict)
npm run lint         # eslint
npm test             # Vitest (jsdom + fake-indexeddb)
npm run build        # production build + service worker
npm run test:e2e     # Playwright (auto builds + serves)
```

Always run typecheck + lint + test + build before committing. Add tests with
every change: pure logic → Vitest; UI behavior → an integration test and/or E2E.

## Gotchas

- Vitest enables `retry: 2` and a per-file fresh fake-indexeddb to absorb a known
  live-query notification flake in jsdom (never reproduces in a real browser).
- The WebLLM engine is dynamically imported and excluded from the PWA precache
  (runtime-cached instead) — keep it lazy so the main bundle stays small.
- In sandboxed environments Playwright's spawned browser may be killed; start
  `npm run preview` yourself and re-run, or run E2E unsandboxed. CI runs it
  normally.
- Data model lives in `src/db/types.ts`; add indexed fields via a new Dexie
  `.version()` block, never by editing the existing one.
