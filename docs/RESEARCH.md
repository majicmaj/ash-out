# Research

Notes and sources behind the technical choices, gathered June 2026. The goal was
a free, fully on-device app, so every choice favors running in the browser with no
server.

## On-device LLM in the browser (for step 2)

- **WebGPU** shipped by default across Chrome, Firefox, Edge, and Safari (late 2025),
  giving ~3–5× over WebGL and ~10–15× over WebAssembly for transformer workloads.
- **WebLLM** is a high-performance in-browser inference engine (WebGPU), with
  **JSON mode and grammar-constrained structured output via XGrammar**, streaming,
  and 30–70 tok/s on laptops. This is the planned engine for structuring because
  schema-constrained decoding is what makes extraction reliable.
- **Transformers.js v4** (Feb 2026, C++/WebGPU backend) is excellent for NLP/vision
  and broad model support; strong alternative, but WebLLM's constrained JSON is the
  better fit for schema extraction.
- **Constrained decoding / XGrammar** forces valid JSON via token masking, near-zero
  per-token overhead — the default structured-output backend for major servers and
  available in-browser.
- **Model choice matters for JSON:** tiny models are unreliable at raw JSON
  (SmolLM2-1.7B ~26% parse rate), while larger ones are solid (Gemma 3 4B ~100%
  parse). Constrained decoding narrows this gap, so the plan is: default to a small
  instruct model (e.g. Qwen2.5-1.5B-Instruct) **with grammar constraints**, and let
  users opt into a larger model for accuracy.

Sources:

- [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) · [WebLLM JSON-schema example](https://github.com/mlc-ai/web-llm/blob/main/examples/json-schema/src/json_schema.ts)
- [Web developer's guide to in-browser LLMs (Intel)](https://www.intel.com/content/www/us/en/developer/articles/technical/web-developers-guide-to-in-browser-llms.html)
- [Run LLMs in the browser: WebGPU, Transformers.js, Chrome built-in AI (Pockit)](https://pockit.tools/blog/run-llms-browser-webgpu-transformers-js-chrome-built-in-ai-guide/)
- [Constrained decoding for structured output (Brenndoerfer)](https://mbrenndoerfer.com/writing/constrained-decoding-structured-llm-output)
- [Specialized SLMs for browser data extraction (SitePoint)](https://www.sitepoint.com/slm-structured-data-extraction-browser/)
- [SmolLM2 paper (arXiv)](https://arxiv.org/pdf/2502.02737) · [We benchmarked 12 small LMs (distil labs)](https://www.distillabs.ai/blog/we-benchmarked-12-small-language-models-across-8-tasks-to-find-the-best-base-model-for-fine-tuning/)
- [Enforce structured JSON with Qwen (Alibaba Cloud)](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)

## Storage — Dexie vs idb vs localForage

- **Dexie** is the recommended default for app-like IndexedDB data in 2026: typed
  tables, rich indexed queries, transactions, **schema versioning**, and
  `dexie-react-hooks` `useLiveQuery` for reactive rendering. Chosen for exactly this.
- `idb` is a thin modern wrapper (more manual migrations); localForage is for simple
  caches/preferences. Neither fits product data as well.

Sources:

- [Dexie.js](https://dexie.org/) · [Dexie vs localForage vs idb 2026 (PkgPulse)](https://www.pkgpulse.com/guides/dexie-vs-localforage-vs-idb-indexeddb-browser-storage-2026)
- [Which IndexedDB library should I use (BSWEN)](https://docs.bswen.com/blog/2026-04-07-indexeddb-libraries-dexie-idb-rxdb/)

## React PWA — Vite + vite-plugin-pwa

- `vite-plugin-pwa` (Workbox) is the zero-config path: precached shell, offline
  support, auto-update, asset/manifest generation. Vite + React gives sub-second cold
  loads. Caching strategies (CacheFirst / NetworkFirst / StaleWhileRevalidate) are
  chosen per request type — here the app is shell + local data, so the shell is
  precached and there are no network data calls.

Sources:

- [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) · [VitePWA offline (CSS-Tricks)](https://css-tricks.com/vitepwa-plugin-offline-service-worker/)
- [Totally offline PWAs with Vite + React](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/)
- [Building an offline-first React app (2026)](https://dalenguyen.me/blog/2026-01-18-building-offline-first-react-app-complete-pwa-guide)

## UX for quick logging

- Natural-language meal/workout entry (type a sentence, it's parsed) is the
  fastest-logging pattern (e.g. Nutritionix). The capture screen should let you log a
  whole entry from one place with minimal friction; depth (details) comes on demand.
- For step 2+: treat dietary constraints/allergies as **hard constraints**, filtered
  before display — safety over suggestion.

Sources:

- [Best food tracking apps 2025 (Fitia)](https://fitia.app/learn/article/best-food-tracking-apps-2025-complete-guide/)
- [Best UX/UI for fitness apps 2025 (Dataconomy)](https://dataconomy.com/2025/11/11/best-ux-ui-practices-for-fitness-apps-retaining-and-re-engaging-users/)
- [Designing a fitness platform (UXmatters)](https://www.uxmatters.com/mt/archives/2025/07/designing-a-fitness-platform-ux-design-challenges-and-solutions.php)

## Testing

- **Vitest** browser-mode/jsdom for fast component and logic tests; **Playwright**
  for real-browser E2E. Treat component tests as behavior tests (what the user sees),
  and run E2E against the built app in headless Chromium.

Sources:

- [Component testing with Playwright 2026 (BrowserStack)](https://www.browserstack.com/guide/component-testing-react-playwright)
- [Vitest browser mode + Playwright](https://vitest.dev/guide/browser/component-testing)
