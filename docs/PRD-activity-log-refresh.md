# PRD: InternPro Whole‑App Refresh — Activity Log, Cross‑Check & Portfolio Tracking

- **Status:** `ready-for-agent`
- **Author:** Paul Ivers (with Claude Code)
- **Date:** 2026-07-07
- **App:** InternPro — React 19 + TypeScript + Vite, Firebase (Auth/Firestore/Storage/Hosting), mobile‑first PWA
- **Primary user:** Jen Ivers, a Bethel University EDUC886 K‑12 Principal Internship candidate
- **Rollout constraint:** Jen is **actively using the app with real data**. All changes ship **phased & safe** — Firebase preview deploys, a data backup before first migrated write, and **additive, non‑destructive migrations**.
- **Delivery constraint:** Hard deadline soon; **scope is not to be cut** — parallelize the build across sub‑agents instead.

---

## Problem Statement

Jen is completing a 320‑hour Minnesota K‑12 principal internship and must maintain a Bethel‑format **Internship Activities Log** and a **Scheduled Meetings Log**, align every activity to the required leadership competencies, gather artifacts, and ultimately submit polished logs and build a licensure portfolio. The current InternPro app makes the day‑to‑day logging painful:

- **Data entry is high‑friction.** Choosing a competency means hunting through a flat wall of ~90 tappable chips (including category headers). There is no Location field at all, even though the official log requires it.
- **The log is an overwhelming "running list."** Entries render as large stacked cards in reverse‑chronological order — impossible to scan or digest at volume (the real logs run dozens of pages).
- **There is no way to sift and sort.** No search, no filtering by competency/level/location/date, no column sorting.
- **Tracking is missing.** She cannot see hours totaled by competency, cannot see progress toward the 320/240/40/40 hour requirements, and there is no automatic totals row like a spreadsheet.
- **Nothing cross‑checks against the Guide.** The app does not tell her which required competencies still lack evidence, which suggested activities remain undone, or which internship deliverables are outstanding.
- **The interface feels "too widgety."** Heavy glassmorphism and oversized cards fight against dense, scannable data.
- **Exports are weak.** The current `window.print()` output is not submission‑grade and cannot produce the separate documents Bethel expects.

## Solution

Refresh the whole app around a **friction‑free capture / spreadsheet‑grade review** workflow, with the **Bethel Principal Internship Guide as the app's spine**:

- **Capture fast on mobile:** a streamlined entry form with a dropdown‑first competency picker (plus recently‑used chips), a Location dropdown sourced from her Sites, and an optional "add meeting notes" section.
- **Review like a spreadsheet on desktop:** a dense, sortable, scannable table with inline quick‑edits, full‑text search, and filters by competency/level/location/date — with a live totals row and per‑competency breakdown that recompute for the current filter.
- **Track progress against the real requirements:** a Dashboard showing hours toward the primary‑level 240, the two 40‑hour levels, and the 320 total (all targets editable), plus hours by competency/category.
- **Cross‑check against the Guide continuously:** competency coverage/gap analysis, the Guide's suggested‑activities checklist, entry‑time validation, and an internship process/deliverables checklist.
- **Produce submission‑grade PDFs:** a generated‑PDF pipeline with three modes — full log (with meeting notes), activities only (no meeting notes), and meeting notes only (in the Guide's meetings‑log format).
- **Declutter the visual language** while keeping the Bethel brand — calmer, table‑first layouts replacing the heavy glass and giant cards.

## User Stories

### Capturing activities (mobile‑first)
1. As an intern, I want to add a log entry in a few taps from my phone right after an activity, so that I capture it before I forget.
2. As an intern, I want to record an entry's Date, Title, Description, Hours, Location, and School Level, so that my log matches the official Bethel Activities Log format.
3. As an intern, I want to pick a competency from a dropdown organized by category (A Leadership, B Organizational Management, …), so that I can find the right one without scanning ~90 chips.
4. As an intern, I want to search the competency picker by code (e.g., "A3"), title, or keyword, so that I can jump straight to what I need.
5. As an intern, I want my recently and frequently used competencies offered as one‑tap chips, so that repeat tagging is instant.
6. As an intern, I want to designate one **primary competency** that "owns" the entry's hours while adding other competencies as coverage tags, so that my per‑competency hours stay accurate.
7. As an intern, I want an optional way to split an entry's hours across competencies for a genuinely divided session, so that unusual entries are represented precisely without adding friction to routine ones.
8. As an intern, I want to choose a Location from my saved Sites and add a new one inline, so that locations stay consistent and I never have to retype them.
9. As an intern, I want to attach evidence to an entry by pasting a link (e.g., a Google Doc) or picking from my Artifacts, so that each activity carries its proof.
10. As an intern, I want to optionally attach "meeting notes" to an entry (competency discussed + reflection on growth), so that a mentor meeting and its reflection live on the same entry.
11. As an intern, I want a warning if I try to save an entry without a competency/primary tag, so that nothing slips through untagged.
12. As an intern, I want to enter decimal hours (e.g., 1.5, 5.5), so that I can record partial‑hour activities.

### Reviewing, sifting, and sorting (desktop)
13. As an intern, I want to see my entries in a dense, scannable table instead of large stacked cards, so that I can digest many entries at a glance.
14. As an intern, I want to sort the table by Date, Hours, or Level by clicking column headers, so that I can organize the view to my need.
15. As an intern, I want to full‑text search across title, description, and location, so that I can find a specific past activity fast.
16. As an intern, I want to filter entries by competency (or category), so that I can review everything I've done for a given standard.
17. As an intern, I want to filter by school level and by Location/Site, so that I can focus on one context at a time.
18. As an intern, I want to filter by a date range, so that I can look at a specific month or term.
19. As an intern, I want to combine filters and search, so that I can answer questions like "High School hours tagged C in April."
20. As an intern, I want to edit small fields (date, hours, level) inline in the table, so that quick corrections don't require opening a form.
21. As an intern, I want to click a row to expand it (or open a side panel) to read/edit the full narrative and competencies, so that detail is available without cluttering the table.
22. As an intern, I want a totals row at the bottom of the table that sums hours like a spreadsheet, so that I always see the arithmetic.
23. As an intern, I want the totals row and competency breakdown to recompute for whatever I've filtered/searched, so that I can total any subset.

### Tracking hours and competencies
24. As an intern, I want to see my total hours and hours per school level, so that I know where I stand.
25. As an intern, I want to see progress toward the 240 hours at my **primary** level (High School), so that I know how close I am to the main requirement.
26. As an intern, I want to see progress toward the 40 hours required at each of the other two levels (Elementary and Middle), so that I don't neglect a level.
27. As an intern, I want my Intermediate‑level hours to count toward the Elementary requirement bucket, so that the math reflects how my district is structured.
28. As an intern, I want to see progress toward the 320 total, so that I know my overall completion.
29. As an intern, I want the hour targets (240/40/40/320) and my primary level to be editable in settings, so that the app stays correct if my situation or the rules differ.
30. As an intern, I want to see hours totaled by competency, so that I can prove breadth of evidence for each standard.
31. As an intern, I want the competency breakdown grouped by category (A–L) and expandable to sub‑competencies, so that I can read it top‑down.
32. As an intern, I want per‑competency hours to reflect the primary‑owns‑hours rule (and any splits), so that the totals reconcile to my real hours.

### Cross‑checking against the Guide
33. As an intern, I want to see which competencies still have no evidence or no hours, so that I know exactly where I'm thin against the required standards.
34. As an intern, I want each competency to show its hours, entry count, and evidence/artifact count, so that I can judge whether it's sufficiently demonstrated.
35. As an intern, I want a checklist of the Guide's ~20 suggested internship activities, so that I can plan and confirm I've hit the recommended experiences.
36. As an intern, I want to mark a suggested activity done and optionally link the entries that satisfy it, so that the checklist ties back to real evidence.
37. As an intern, I want a checklist of internship process deliverables (signed proposal, signed agreement, mid‑internship benchmark, reflection paper, mentor evaluation), so that I don't miss a non‑log requirement.
38. As an intern, I want entry‑time validation to flag missing key fields, so that data quality stays high as I go.

### Meeting notes and exports
39. As an intern, I want meeting notes to be an optional part of an activity entry rather than a separate log I maintain, so that I stay in one place.
40. As an intern, I want to export a **full** PDF of my log including meeting notes, so that I have a complete record.
41. As an intern, I want to export a PDF of **activities only** (no meeting notes), so that I can submit the Activities Log by itself.
42. As an intern, I want to export **just the meeting notes** in the Guide's Scheduled Meetings Log format (Date · Competency · Reflection), so that I can submit the Meetings Log by itself.
43. As an intern, I want exported PDFs to be consistent, well‑paginated, and submission‑grade with a totals page, so that I can hand them to the university with confidence.
44. As an intern, I want exports to reflect the columns of the official log (Date · Activity · Competency · Location · Hours · Level), so that they match what Bethel expects.
45. As an intern, I want the option to export the current filtered view, so that I can produce a focused document when needed.

### Look and feel
46. As an intern, I want a calmer, less "widgety" interface, so that I can focus on my data.
47. As an intern, I want the Bethel colors and logo retained, so that the app still feels like mine and on‑brand.
48. As an intern, I want the app to remain installable/usable as a mobile PWA, so that quick capture keeps working offline and on my phone.

### Data safety (implicit, cross‑cutting)
49. As an intern, I want my existing logged data preserved through the upgrade, so that I never lose work I've already done.
50. As an intern, I want a viewer/advisor to still open a read‑only shared view of my portfolio, so that my mentor can review it.

## Implementation Decisions

### Architecture: deep, pure modules behind a thin shell
Correctness‑critical logic is extracted into **pure, framework‑free modules** (no React, no Firebase) so they are unit‑testable, parallelizable, and stable. The React components and Firebase services are a thin shell over them.

Pure modules (deep, simple interfaces):
- **`progress`** — `computeProgress(logs, settings) → { byBucket: { HighSchool, Elementary, Middle }, total, targets, remainingByBucket, remainingTotal, primaryLevel }`. Folds `Intermediate` hours into the `Elementary` bucket; applies editable targets.
- **`competency-metrics`** — `computeCompetencyHours(logs) → Record<competencyId, hours>` and `computeCoverage(logs, competencies) → Record<competencyId, { hours, entryCount, evidenceCount, status: 'covered'|'thin'|'gap' }>`, plus category rollups. Applies the primary‑owns‑hours rule, honoring an optional per‑entry split.
- **`entry-validation`** — `validateEntry(entry) → Warning[]` (e.g., missing primary competency, missing hours/level). Powers entry‑time cross‑check.
- **`log-query`** — `applyLogQuery(logs, query) → logs` where `query` carries `{ search, competencyIds, levels, siteIds, dateRange, sort }`. The filtered result feeds the filtered totals.
- **`export-model`** — `buildExportModel(logs, settings, mode) → ExportModel` for `mode ∈ { 'full', 'activities', 'meetings' }`. Decides which entries/columns/totals appear; the react‑pdf renderer consumes the model.
- **`state-migration`** — `migrateState(oldState) → newState` — versioned, additive, non‑destructive.

Shell / UI layers (thin): persistence (extend the Firestore service with schema version + pre‑migration backup), mobile **EntryForm**, desktop **LogTable** (hybrid scan + quick‑edit + row panel), **CompetencyPicker** (dropdown‑first + recents), **Location/Sites picker**, **Dashboard** (progress + coverage), **Checklists** (suggested activities + deliverables), **ExportDialog** (generated PDF), **Settings** (targets + primary level).

### Data model / schema (encodes decisions)
Extend `InternshipLog`:

```ts
interface InternshipLog {
  id: string;
  date: string;
  title?: string;
  description: string;               // was `activity`
  hours: number;                     // decimals allowed
  schoolLevel: 'Elementary' | 'Intermediate' | 'Middle' | 'High School';
  siteId?: string;                   // Location as a reference to a Site
  location?: string;                 // free-text fallback label
  taggedCompetencyIds: string[];     // coverage/evidence tags
  primaryCompetencyId?: string;      // owns the entry's hours
  hourSplit?: Record<string, number>;// optional explicit split; overrides primary-owns when present
  evidenceLinks?: { id: string; label: string; url: string }[];
  artifactIds?: string[];            // optional links to Artifacts library
  meetingNotes?: {                   // optional facet
    competencyIds: string[];         // defaults to taggedCompetencyIds, overridable
    reflection: string;
  };
}
```

Extend `AppState`:

```ts
interface AppState {
  schemaVersion: number;             // new; drives migration
  // ...existing: logs, artifacts, progress, shelves, sites, competencyReflections, userProfile
  settings: {
    primaryLevelBucket: 'HighSchool' | 'Elementary' | 'Middle';   // Jen: HighSchool
    intermediateMapsTo: 'Elementary';                             // Jen: Elementary
    targets: { total: number; primary: number; others: number };  // 320 / 240 / 40
  };
  checklists: {
    suggestedActivities: Record<string, { done: boolean; linkedEntryIds?: string[] }>;
    deliverables: Record<string, { done: boolean; note?: string }>;
  };
}
```

Decisions embedded above:
- **Requirement buckets:** three — **High School (primary, 240)**, **Elementary (40; Intermediate folds in)**, **Middle (40)** — total **320**; targets editable.
- **Hours→competency:** the **primary competency owns the hours**; extra tags are coverage only; an **optional split** covers genuinely divided sessions. Per‑competency hours reconcile to real totals.
- **Coverage vs. hours:** coverage (any tag) drives gap analysis; hours (primary/split) drive the breakdown — kept distinct on purpose.
- **Meeting notes** are an optional facet of an entry, not a separate record; they drive the meetings‑only export.

### Migration (data‑safety keystone)
- Detect `schemaVersion` (absent ⇒ v0). Run `migrateState` additively:
  - `activity` → `description` (retain `activity` on read for back‑compat until fully cut over).
  - Best‑effort seed `primaryCompetencyId` from the first `taggedCompetencyId`; flag such entries for a one‑time review rather than guessing silently.
  - Initialize `settings` (primary = High School, Intermediate→Elementary, targets 320/240/40/40) — migrate the old `primarySetting` into `settings.primaryLevelBucket`.
  - Initialize empty `checklists`.
  - Preserve all existing fields; **never delete**; stamp `schemaVersion`.
- **Before the first migrated write**, persist a backup of the live document (a separate backup document/collection keyed by user + timestamp, and/or a downloadable JSON export). The rebuild must not overwrite the live doc until a successful backup exists.

### Competency picker
- **Dropdown‑first**, organized by category, searchable by code/title/keyword; a strip of **recently/frequently used** competencies as one‑tap chips; explicit **primary** selection among the chosen tags.

### Desktop table (hybrid)
- Dense sortable table; **inline quick‑edit** for date/hours/level; **row expand / side panel** for narrative, competencies, evidence, and meeting notes.
- Slicing via `log-query`: search + competency + level + site + date range + column sort.
- **Totals row + competency breakdown recompute for the active query;** the Dashboard's requirement progress (240/40/40/320) always reflects all‑time data.

### Exports
- Generated‑PDF pipeline (react‑pdf/pdf‑lib) driven by `export-model`. Three modes: **full**, **activities‑only**, **meetings‑only** (Guide's Date · Competency · Reflection format). Activities exports use the official columns and a totals page (hours by level + grand total).

### Visual
- Declutter to calmer, table‑first layouts; retain Bethel palette and logo; preserve PWA installability and the existing read‑only viewer mode.

### Rollout
- Branch + Firebase **preview channels**; ship in phases: **(1) schema + migration + entry**, **(2) Dashboard + cross‑check**, **(3) exports**. Migration and cutover are handled sequentially and carefully even though feature build is parallelized.

## Testing Decisions

- **What makes a good test here:** exercise **external behavior** of the pure modules through their public interfaces — given input logs/settings, assert the returned numbers/shapes — never internal implementation details. Tests must survive refactors of the module internals and of the React shell.
- **Tooling:** add **Vitest** (integrates natively with the existing Vite setup). No test framework exists today, so this establishes the first test suite and the prior‑art pattern for the repo.
- **Modules under test (all pure modules):**
  - `progress` — bucket folding (Intermediate→Elementary), target math, remaining calculations, editable‑target variations, edge cases (zero hours, over‑target).
  - `competency-metrics` — primary‑owns attribution, optional split, coverage status thresholds, category rollups; verify per‑competency hours reconcile to totals.
  - `state-migration` — run against captured **real/sample `AppState` shapes** (v0 → current), asserting no data loss, correct defaults, idempotency (re‑running migration is a no‑op).
  - `log-query` — each filter dimension independently and in combination; search matching; sort stability.
  - `entry-validation` — each warning condition and the clean‑entry case.
  - `export-model` — for each of the 3 modes, assert the correct entries, columns, and totals are included/excluded (e.g., meetings‑only excludes hours columns; activities‑only excludes meeting notes).
- **Prior art:** none yet in‑repo; this PRD introduces the pattern. Fixtures should include a small hand‑authored `AppState` plus, where possible, a sanitized copy of Jen's real document shape for migration tests.
- **UI shells** (EntryForm, LogTable, Dashboard, ExportDialog, pickers, checklists) are verified via **manual/preview‑deploy checks**, not unit tests, in this pass.

## Out of Scope

- A full **Artifacts management overhaul** (uploads, shelves rework, per‑competency evidence galleries). This pass only adds **evidence links** on entries and lets entries reference existing artifacts.
- Backend/server changes beyond Firestore (no Cloud Functions); persistence remains the whole‑document model, now versioned.
- Re‑working the base64‑in‑Firestore artifact storage constraint.
- Multi‑user / multi‑intern features; the app remains single‑portfolio per user with read‑only viewer sharing.
- Re‑enabling Gemini/AI features (currently a stub).
- Automated end‑to‑end/UI test automation (manual + preview verification this pass).
- Any change to the auth model or the public‑read / owner‑write security posture.

## Further Notes

- **Competency taxonomy is already complete and correct** in the app (Core A–L with sub‑items, the separate Principal Competencies, and the 6 Program Outcomes) and matches the Guide. No competency data work is required — the problem was purely presentation (the flat chip wall).
- **Guide reference data to add:** the ~20 suggested internship activities and the process deliverables list should be encoded as static reference data (mirroring how competencies are stored) to drive the two checklists.
- **Requirement path:** Jen is on the standard **320‑hour (240 + 40 + 40)** path. The alternate‑level 120‑hour path is supported implicitly via editable targets but is not her configuration.
- **Open design‑phase items** (to be settled during implementation, not blocking): top‑level app navigation/IA, exact Dashboard composition, the precise coverage‑view visualization, and the streamlined mobile entry flow.
- **Known risk:** "hard deadline + full scope + safe migration over live data." Parallel sub‑agents accelerate the *build*; the *migration and staged cutover are the real risk* and are handled deliberately and sequentially. Obtaining a snapshot of Jen's real data early makes the migration tests trustworthy.
- **Source materials** informing this PRD: the Bethel *Principal Internship Guide* (competency framework, 320/240/40/40 requirement, suggested activities, deliverables), the 41‑page *Internship Activities Log Sample* (columns + level‑totals format), and the *Exemplar Meeting Log* (Scheduled Meetings Log format).
