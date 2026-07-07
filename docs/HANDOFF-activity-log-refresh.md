# Handoff: InternPro Whole‑App Refresh

**For:** a fresh Claude Code session that will run the **multi‑sub‑agent orchestrated implementation**.
**From:** discovery/spec session on 2026‑07‑07.
**Read these first (do not re‑derive):**
- **PRD:** [docs/PRD-activity-log-refresh.md](PRD-activity-log-refresh.md) — the authoritative spec (problem, 50 user stories, deep‑module architecture, schema with decisions encoded, migration plan, testing plan, scope, risks).
- **Repo guide:** [CLAUDE.md](../CLAUDE.md) — build/lint commands, architecture, gotchas (whole‑document Firestore save model, debounced saves, CDN Tailwind config in `index.html`, viewer mode, `geminiService.ts` is a stub).

Everything design‑ and decision‑level is in the PRD. This doc only carries **context, standing directives, and the recommended path** that aren't in the PRD.

## Situation

- The user (**Paul**, `paul.ivers@orono.k12.mn.us`, GitHub `OPS-PIvers`, has push) is improving his **wife Jen's** internship‑portfolio app for her Bethel EDUC886 K‑12 Principal Internship.
- Repo: `github.com/JenIvers/InternProApp` (Paul is a collaborator). Cloned locally at the working directory; branch `main`, clean.
- This session cloned the repo, wrote `CLAUDE.md`, grilled Paul through the full design tree, and produced the PRD. **No application code has been changed yet.**

## Standing directives (carry these forward)

1. **NEVER use `superpowers:*` skills.** Explicit user instruction. (Non‑superpowers skills like `to-issues`, `to-prd`, `handoff`, `code-review`, `run`, `verify` are fine.)
2. **Build via multi‑sub‑agent orchestration.** Paul explicitly opted into parallel agent orchestration to ship fast — use the **Workflow** tool (fan‑out across the independent modules/workstreams). This is a standing opt‑in for this project's build.
3. **Do not cut scope** to hit the deadline — parallelize instead.
4. **Live data is sacred.** Jen is actively using the app with real data. Migrations must be **additive and non‑destructive**; **back up her live Firestore document before the first migrated write**; roll out through **Firebase preview channels** in phases (schema+entry → dashboard/cross‑check → exports). Do **not** touch her live Firestore record without Paul's explicit go‑ahead.
5. **Brand:** declutter the UI but keep Bethel colors/logo; keep the PWA installable and the read‑only viewer mode working.

## Open items to resolve with Paul early

- **Exact deadline date** (he said "hard deadline soon" but didn't give a date) — needed to sequence phases.
- **A snapshot of Jen's real `AppState` document** (sanitized) — needed to make the `state-migration` tests trustworthy. Ask Paul to export it or authorize a read (Firestore rules allow public read of `intern_data/{userId}`, but do not access it unprompted).
- Design‑phase details deferred in the PRD: top‑level app IA/navigation, Dashboard composition, coverage‑view visualization, mobile entry flow.

## Recommended next steps

1. Read the PRD + CLAUDE.md.
2. Confirm the deadline and get the data snapshot (above).
3. **Phase 1 — foundation (highly parallelizable):** add **Vitest**; build the six pure modules with tests — `progress`, `competency-metrics`, `entry-validation`, `log-query`, `export-model`, `state-migration`. These have no React/Firebase deps and can each be a separate sub‑agent. Add the schema changes + Guide reference data (suggested activities, deliverables).
4. **Phase 1 — persistence:** extend the Firestore service with `schemaVersion`, backup‑before‑migrate, and wire `state-migration` on load.
5. **Phase 1 — entry:** mobile EntryForm, dropdown‑first CompetencyPicker (+recents), Sites‑backed Location picker, optional meeting‑notes section, entry‑time validation.
6. **Phase 2:** desktop hybrid LogTable (scan + inline quick‑edit + row panel) with `log-query`, filtered totals; Dashboard (progress + competency breakdown); cross‑check views (coverage/gaps, suggested‑activities checklist, deliverables checklist).
7. **Phase 3:** generated‑PDF exports (react‑pdf/pdf‑lib) driven by `export-model` — the three modes (full / activities‑only / meetings‑only).
8. Verify each phase on a **preview channel** before promoting; keep migration/cutover sequential and deliberate.

## Suggested skills for the next session

- **Workflow** (the tool, not a skill) for the parallel build — this is the main vehicle.
- **`to-issues`** — optional, if Paul wants the PRD broken into grabbable issues first (note: no issue tracker is currently configured in this repo).
- **`code-review`** — after each phase's changes land.
- **`run`** / **`verify`** — to drive the app on a preview deploy and confirm changes work end‑to‑end.
- (Explicitly **not** any `superpowers:*` skill.)

## Guardrails / gotchas the next agent will hit

- **Tailwind is CDN‑based** with its config inlined in `index.html` — add theme colors/custom utilities there, not in a config file.
- **State is one `AppState` object** in `App.tsx` synced as a single Firestore doc; there's no router (view is a `currentView` string + switch).
- **Artifacts are base64 inline** in that same doc (~1MB Firestore cap) — out of scope to fix now, but don't make it worse; prefer evidence **links** on entries.
- The competency taxonomy in `constants.tsx` is already **complete and correct** (A–L core + Principal + Outcomes) — no competency data work needed; the problem was presentation only.
