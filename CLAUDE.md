# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

InternPro is a mobile-first PWA for education-leadership interns (built for Bethel University principal-licensure candidates) to log internship hours, align activities to state/Bethel leadership competencies, attach evidence artifacts, and export an academic report for accreditation. Stack: React 19 + TypeScript, Vite, Firebase (Auth / Firestore / Storage / Hosting).

## Commands

```bash
npm install          # install dependencies
npm run dev          # Vite dev server on http://localhost:3000 (also bound to 0.0.0.0)
npm run build        # production build to dist/
npm run preview      # serve the production build locally
npm run lint         # ESLint over all .ts/.tsx
npx tsc --noEmit     # type-check (the build uses esbuild and does NOT type-check)
```

- **No test framework is configured** — there is no `test` script and no test files. Verify changes with `npm run lint`, `npx tsc --noEmit`, and by running the app.
- `.env.local` can hold `GEMINI_API_KEY`, but the app runs without it (see Environment).

## Environment

`vite.config.ts` injects `GEMINI_API_KEY` from `.env.local` as `process.env.API_KEY` / `process.env.GEMINI_API_KEY`. **`geminiService.ts` is currently an empty stub** ("Gemini AI integration removed") — there are no live AI features despite the README and `GEMINI.md` describing them. The Firebase web config in `firebase.ts` is hardcoded (public client config, which is expected for a Firebase web app).

## Architecture

**Single source of truth.** The entire user portfolio is one `AppState` object (`types.ts`) held in `useState` in `App.tsx`. There is no Redux, Context, or router. All mutations are handler functions defined in `App.tsx` (`addLog`, `updateProgress`, `addArtifact`, …) and passed down as props. Each screen is a `components/*View.tsx` file; view switching is a `currentView` string + `switch` in `App.tsx`, with navigation in `Sidebar.tsx` (desktop) and `BottomNav.tsx` (mobile).

**Persistence = whole-document sync.** `firestoreService.ts` reads/writes the complete `AppState` as a single document at `intern_data/{userId}`. There are no per-record documents or subcollections. Because a Firestore document is capped at ~1 MB and `Artifact.data` stores base64 file bytes *inline* in that same document, many/large artifacts are a real scaling constraint — `storageService.ts` (Firebase Storage; 10 MB limit; images/PDF only) is the intended offload path, but `types.ts` still models artifacts as inline base64.

**Save strategy (non-obvious, in `App.tsx`).** State is NOT persisted on every change. Saves are debounced: 30 s after the last edit, and also on `visibilitychange` / `pagehide` / `blur` so mobile/PWA users don't lose work when backgrounding the app. Redundant writes are skipped by comparing a JSON snapshot held in a ref.

**Auth.** `authService.ts` — Firebase Google sign-in. Mobile and standalone-PWA sessions use `signInWithRedirect` (a `sessionStorage` "pending" flag is set before redirect and consumed by `checkRedirectResult` on load); desktop uses `signInWithPopup` with a redirect fallback. Firestore is initialized with a persistent multi-tab local cache for offline support (`firebase.ts`).

**Read-only "Viewer Mode".** Loading the app with `?view=<userId>` fetches that user's portfolio read-only (intended for advisors). The `isReadOnly` flag is threaded through every view to disable editing. Security rules (`firestore.rules`, `storage.rules`) enforce the same model at the backend: **public read, owner-only write** on `intern_data/{userId}` and `artifacts/{userId}/…`.

**Domain data.** `constants.tsx` holds `CORE_COMPETENCIES`, the static catalog of leadership-licensure standards (categories A, B, C, …). Logs and artifacts reference these by id via `taggedCompetencyIds`; `AppState.progress` maps competency id → `AttainmentLevel` (Emerging → Developing → Proficient → Exemplary).

**PWA.** `service-worker.js` is hand-written: network-first for navigation and any Google/Firebase/auth request (this avoids OAuth redirect loops in installed PWAs), cache-first for other static assets. `CACHE_NAME` is bumped manually per release. `registerServiceWorker.ts` wires the "New Version Available" update toast rendered in `App.tsx`. `index.tsx` is the React mount point.

**Styling.** Tailwind is loaded at runtime from the CDN in `index.html` — there is no `tailwind.config.js` and no PostCSS build step. The custom palette (`app-dark`, `app-deep`, `app-bright`, `app-slate`, `app-light`, `app-bg`), glassmorphism utilities (`.glass`, `.glass-dark`, `.glass-blue`), and iOS safe-area helpers are all defined inline in `index.html`. **Adjust theme colors or add custom utility classes there, not in a config file.** Icons: `lucide-react`. Charts: `recharts`.

Path alias `@/*` resolves to the repo root (configured in both `vite.config.ts` and `tsconfig.json`).

## Deployment

Firebase Hosting, project `intern-pro-app`, serving `dist/` with an SPA rewrite (all routes → `index.html`); see `firebase.json`. CI is in `.github/workflows/`:

- **Production deploys trigger on pushing a `v*` git tag** (or manual `workflow_dispatch`) → `live` channel. Merging to `main` alone does not deploy.
- Pull requests get an ephemeral preview channel.

Releases are versioned by git tag (semver). When shipping, remember to bump `CACHE_NAME` in `service-worker.js` so clients pick up new static assets.

## Note on GEMINI.md

`GEMINI.md` is an agent-context doc for the Gemini CLI. It is partly stale relative to the code (it describes live AI features and calls `storageService.ts` a placeholder, though that service is now implemented). Trust the source files over it.
