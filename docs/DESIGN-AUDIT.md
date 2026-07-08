# InternPro Design Audit

Deviations from `DESIGN-CANON.md`, per reachable component, as `file:line — what's there → what canon requires`. Line numbers are from the current source. Read the canon's §0 global table first — most findings are instances of those eight decisions.

**Reachable views audited:** App.tsx, Sidebar, BottomNav, LoginView, DashboardNew, LogTable, EntryForm, CompetencyPicker, SitePicker, CoverageView, ChecklistsView, ArtifactsView, SettingsView, ExportDialog.

**Unreachable / dead (NOT audited — not imported anywhere in App's view switch):**
`components/Dashboard.tsx`, `components/LogsView.tsx`, `components/CompetenciesView.tsx`, `components/SitesView.tsx`. (`components/pdf/LogPdf.tsx` is print-only, out of scope.) Recommend deleting the four dead views.

---

## App.tsx (shell, headers, toasts, modals, login gate)

- `App.tsx:464` — loader label `font-black uppercase tracking-widest text-xs` → calm `text-xs font-semibold text-app-slate` (no font-black, no tracking-widest).
- `App.tsx:474-476` — mobile wordmark `text-lg font-black … bg-gradient-to-r … bg-clip-text text-transparent` → logo may keep `font-black`, but drop the gradient-clip text (glassmorphism-era flourish); use solid `text-app-dark`.
- `App.tsx:480` — Viewer Mode badge `text-[9px] font-black … uppercase tracking-widest` → status-pill recipe `text-[10px] font-bold uppercase tracking-wide bg-app-bright/10 text-app-bright rounded-full` (§8).
- `App.tsx:488-489` — avatar fallback `font-black text-[10px]` → `font-bold`.
- `App.tsx:495` — "Bethel University" `text-[10px] font-black uppercase tracking-widest` → `text-[10px] font-semibold uppercase tracking-wide`.
- `App.tsx:509` — entry modal backdrop `bg-app-dark/40 backdrop-blur-sm` → drop `backdrop-blur-sm` (canon §6: no blur).
- `App.tsx:510` — modal card `md:rounded-3xl` → `md:rounded-2xl` (§0 modal radius).
- `App.tsx:541` — update toast `glass-dark … border border-white/10` → glassmorphism remnant; use solid `bg-app-dark text-white border border-app-slate/15`.
- `App.tsx:548` — toast subtext `text-[10px] uppercase tracking-widest font-black` → `text-[10px] font-medium` (no font-black/widest).
- `App.tsx:553` — "Update Now" button `rounded-xl text-xs font-black uppercase tracking-widest` → primary recipe `rounded-lg text-sm font-bold` (no font-black/uppercase); also uses `bg-app-bright` where a dark primary is canon.
- `App.tsx:564` — save-error toast `bg-red-500/95 backdrop-blur-sm rounded-2xl` → error callout should be `rounded-xl`, drop blur.
- `App.tsx:571,576` — error toast labels `text-[10px] uppercase tracking-widest font-black` / dismiss `font-black uppercase tracking-widest` → `font-semibold`/`font-bold`, no widest.

## components/Sidebar.tsx  ← WORST OFFENDER (wholesale glassmorphism + font-black)

- `Sidebar.tsx:39` — `glass border-r border-white/30` → solid `bg-white border-r border-app-slate/15` (§0 remove glass).
- `Sidebar.tsx:40,90` — dividers `border-white/20` → `border-app-slate/10`.
- `Sidebar.tsx:42` — wordmark `text-2xl font-black … bg-gradient-to-br … bg-clip-text text-transparent tracking-tighter` → logo may keep `font-black`; remove gradient-clip, use solid `text-app-dark`.
- `Sidebar.tsx:60-61` — "Personalized Portfolio" `text-[9px] font-black uppercase tracking-widest` → `text-[10px] font-semibold uppercase tracking-wide`.
- `Sidebar.tsx:65` — "Bethel University" `font-black uppercase tracking-[0.25em]` → `font-semibold`, tracking-wide.
- `Sidebar.tsx:78-82` — nav buttons `rounded-2xl … shadow-xl shadow-[#14293022] … scale-[1.02]` on active → controls are `rounded-lg`/`rounded-xl`; drop the arbitrary hex shadow + scale. Active = `bg-app-dark text-white` only.
- `Sidebar.tsx:81` — inactive `text-app-deep/70 hover:bg-white/50` → `text-app-slate hover:bg-app-slate/5`.
- `Sidebar.tsx:94` — Share button `rounded-2xl text-[10px] font-black uppercase tracking-widest` → secondary recipe `rounded-lg text-sm font-semibold`, no font-black/widest.
- `Sidebar.tsx:101` — Status panel `glass-blue rounded-2xl` → solid `bg-app-bg rounded-xl border border-app-slate/15` (remove glass).
- `Sidebar.tsx:102` — "Status" label `text-[10px] font-black uppercase tracking-widest` → `font-semibold`.
- `Sidebar.tsx:112` — Sign Out `text-[10px] font-black uppercase tracking-widest` → `text-xs font-semibold`.

## components/BottomNav.tsx

- `BottomNav.tsx:43,77,113` — captions `font-black uppercase tracking-tight` → `font-bold` (the tiny bottom-nav caption is the one sanctioned uppercase, but weight is `font-bold`, not black).
- `BottomNav.tsx:55` — More-sheet backdrop `bg-app-dark/30 backdrop-blur-sm` → drop `backdrop-blur-sm`.
- `BottomNav.tsx:57` — sheet `rounded-t-3xl border-t border-slate-200` → `rounded-t-2xl border-app-slate/15` (modal radius + border color).
- `BottomNav.tsx:61` — "More" label `text-[10px] font-black uppercase tracking-widest` → `font-semibold`.
- `BottomNav.tsx:73,86` — `border-slate-200` (two places) → `border-app-slate/15`.
- `BottomNav.tsx:40,110` — active icon chip `bg-app-dark text-white shadow-lg` is fine; inactive `text-slate-400` → prefer `text-app-slate/60` for palette consistency (minor).
- `BottomNav.tsx:86` — bar `bg-white/90 backdrop-blur-2xl` → acceptable as a fixed system bar, but for consistency prefer solid `bg-white border-t border-app-slate/15` (low priority).

## components/LoginView.tsx  ← WORST OFFENDER (oversized radii + glass + font-black)

- `LoginView.tsx:28-29` — decorative blurred blobs (`blur-[100px]`) → glassmorphism-era decor; remove or heavily tone down.
- `LoginView.tsx:32` — card `glass p-12 rounded-[3.5rem]` → `bg-white rounded-2xl border border-app-slate/15` (remove glass; radius ≤ 2xl).
- `LoginView.tsx:38` — `text-4xl font-black` heading → login hero may stay large but use `text-3xl font-bold` max, or keep `font-black` only if treated strictly as the logo wordmark; do not exceed one oversized instance.
- `LoginView.tsx:39,46` — body/CTA `font-bold`/`font-black` + `rounded-[2rem]` → button `rounded-lg` (§0), label `font-bold` not `font-black`.
- `LoginView.tsx:53,61,67` — `uppercase tracking-widest` / `text-[10px] font-black uppercase tracking-[0.2em]` labels → `font-semibold`, tracking-wide, no arbitrary tracking.
- `LoginView.tsx:60` — error box `rounded-2xl` → error callout `rounded-xl`; border `border-red-100` → `border-red-200` (match §8).

## components/DashboardNew.tsx  (reference file — minor only)

- `DashboardNew.tsx:189,211` — stat value `text-2xl font-black tabular-nums` → `font-bold` (canon reserves font-black for the logo; values are bold max).
- `DashboardNew.tsx:205` — Total tile border `border-app-dark/15` → `border-app-slate/15` (§0 single border color).
- Everything else here is canon and is the source for §1/§4/§5/§7/§8.

## components/LogTable.tsx  ← WORST OFFENDER (volume: font-black + border + radius + hover)

- `LogTable.tsx:244,271,302,320,339,350` — inputs/selects use `border-app-dark/10 … focus:border-app-bright` → `border-app-slate/15 … focus:ring-2 focus:ring-app-bright/30` (§0 border + focus).
- `LogTable.tsx:253,364,381` — filter/toggle/clear buttons `border-app-dark/10` → `border-app-slate/15`.
- `LogTable.tsx:388` — Export button `bg-app-dark … hover:bg-black` → `hover:bg-app-deep` (§0 primary hover).
- `LogTable.tsx:402` — desktop table wrapper `rounded-2xl border border-app-dark/10` → `rounded-xl border border-app-slate/15` (container radius + color).
- `LogTable.tsx:405,428(implicit),450,646,764` — table borders `border-app-dark/10`, `border-app-dark/5`, `border-app-dark/20` → standardize to `border-app-slate/10`.
- `LogTable.tsx:408-414,614,651,660,693,716,727,742,746,766,979,992` — pervasive `font-black uppercase tracking-widest` on th labels, level text, expanded section headings, totals, footer, breakdown → `font-bold` + `uppercase tracking-wide` at most; remove `tracking-widest`. Column headers → `font-semibold uppercase tracking-wide text-[10px]`.
- `LogTable.tsx:534,546,669,682,840,851,896,1002` — competency pills `rounded` + `font-black` → `rounded-md` + `font-bold` (§8 pill recipe).
- `LogTable.tsx:740,746,955,962` — expanded/mobile action buttons `font-black uppercase tracking-widest` → `font-bold`, no widest; delete keeps red-outline recipe.
- `LogTable.tsx:955,962` — mobile action buttons `rounded-xl` → `rounded-lg` (controls).
- `LogTable.tsx:978,991` — mobile totals / breakdown containers `rounded-2xl border-2 border-app-dark/15` / `rounded-2xl border border-app-dark/10` → `rounded-xl border border-app-slate/15` (no `border-2`).
- `LogTable.tsx:1000` — breakdown chips `bg-app-bg border border-app-dark/5` → `border-app-slate/15`.
- `LogTable.tsx:1022` — SortableTh `font-black uppercase tracking-widest` → `font-semibold uppercase tracking-wide`.

## components/EntryForm.tsx  (reference shell — fix borders/hover/black)

- `EntryForm.tsx:249,258,285,300,311,330,348,363,400,415,422,444,465,474,498,553,573,590` — all `border-app-dark/10` and `divide-app-dark/10`/`divide-app-dark/5` → `border-app-slate/15` / `divide-app-slate/10` (§0).
- `EntryForm.tsx:256,348` — `md:rounded-2xl` container is fine; note the section container at `:348` `rounded-xl` is canon — keep.
- `EntryForm.tsx:260` — modal title `text-lg font-black` → `text-lg font-bold` (§6).
- `EntryForm.tsx:427,599` — primary buttons `hover:bg-black` → `hover:bg-app-deep` (§0).
- `EntryForm.tsx:400,444` — evidence rows `rounded-xl` inner chips → acceptable as containers, but for tap-row consistency prefer `rounded-lg`; low priority.
- Grouped sections, labels (`text-xs font-semibold`), inputs (`text-base` + `focus:ring`), amber warning list are canon — the source for §3/§4/§8.

## components/CompetencyPicker.tsx

- `CompetencyPicker.tsx:189-201,284,292,300,319,336-411` — all `border-app-dark/10`, `border-app-dark/25`, `divide-app-dark/5`, `border-app-dark/15` → `border-app-slate/15` / `divide-app-slate/10`.
- `CompetencyPicker.tsx:200,509(n/a)` — code label `text-xs font-black tabular-nums` → `font-bold`.
- `CompetencyPicker.tsx:339` — sheet backdrop `bg-app-dark/40 backdrop-blur-sm` → drop blur.
- `CompetencyPicker.tsx:342` — sheet `md:rounded-2xl` is canon-correct — keep.
- `CompetencyPicker.tsx:373,385` — sticky group headers `text-[11px] font-black uppercase tracking-wide` → `font-bold` (tracking-wide OK, drop black).
- `CompetencyPicker.tsx:406` — Done button `hover:bg-app-deep` is canon-correct — keep.
- `CompetencyPicker.tsx:219,242` — selected pills `rounded-xl` → §8 uses `rounded-md`; these larger removable chips may stay `rounded-lg`, but standardize (currently `rounded-xl`). Border `border-app-dark/15` → `border-app-slate/15`.

## components/SitePicker.tsx

- `SitePicker.tsx:65,73-74,83,96,99,108,114,124` — `border-app-dark/10` (inputs/selects/new-site form) → `border-app-slate/15`. Focus rings already canon (`focus:ring-2 focus:ring-app-bright/30`).
- `SitePicker.tsx:129` — Save-site button `hover:bg-black` → `hover:bg-app-deep` (§0).
- Otherwise labels (`text-xs font-semibold`), `min-h-[44px]`, `text-base sm:text-sm` are canon-correct.

## components/CoverageView.tsx

- `CoverageView.tsx:54,70,71,73,78,79-83,95,96` — container/table borders `border-app-dark/10`, `border-app-dark/5` → `border-app-slate/15` / `border-app-slate/10`.
- `CoverageView.tsx:54,73,126` — `text-xs/[11px] font-bold uppercase tracking-wider/widest` labels → keep `font-bold` but standardize to `tracking-wide` (drop `tracking-wider`/`tracking-widest`).
- `CoverageView.tsx:44` — `h2 text-2xl font-bold` header — canon-correct.
- Status pills (`:107-110`) are the §8 reference — keep.

## components/ChecklistsView.tsx

- `ChecklistsView.tsx:88,89,98,167,189,190,199,229` — all `border-app-dark/10`, `divide-app-dark/5`, `border-app-dark/5` → `border-app-slate/15` / `divide-app-slate/10`.
- `ChecklistsView.tsx:92,193` — section headings `text-xs font-bold uppercase tracking-widest` → keep font-bold, `tracking-wide` (drop widest); consider canon §4 `text-sm font-bold` header.
- `ChecklistsView.tsx:229` — deliverable note input uses `focus:ring-2 focus:ring-app-bright/30` — canon-correct; border to `border-app-slate/15`.
- `ChecklistsView.tsx:83` — header `text-2xl font-bold` — canon-correct.

## components/ArtifactsView.tsx  (mostly canon — the slate/15 family)

- `ArtifactsView.tsx:239,247` — shelf-name label `text-[10px] font-black uppercase tracking-widest` → `text-xs font-semibold`; input uses `focus:border-app-bright` → `focus:ring-2 focus:ring-app-bright/30` (§0 focus).
- `ArtifactsView.tsx:196` — Upload button `hover:bg-app-deep` — canon-correct (this is the hover reference).
- `ArtifactsView.tsx:287` — detail modal backdrop `bg-app-dark/60 backdrop-blur-sm` → drop `backdrop-blur-sm`; opacity `/60` → `/40` (§6).
- `ArtifactsView.tsx:288` — modal `rounded-t-2xl sm:rounded-2xl` — canon-correct.
- `ArtifactsView.tsx:293,314,324,357` — small `uppercase tracking-wide/widest` labels `font-bold` → keep, standardize to `tracking-wide`.
- `ArtifactsView.tsx:395` — Done button `rounded-xl` → primary is `rounded-lg`; hover `hover:bg-app-deep` is correct.
- Uses `border-app-slate/15` + `divide-app-slate/10` throughout — this file is the closest to §4/§5 border discipline.

## components/SettingsView.tsx

- `SettingsView.tsx:63` — `animate-in fade-in slide-in-from-bottom-4 duration-500` page entrance → decorative; harmless but inconsistent (no other view animates its whole body). Consider removing.
- `SettingsView.tsx:75,96,193` — section cards `bg-white/60 border border-app-slate/10` → solid `bg-white border border-app-slate/15` (translucent `/60` is a glass remnant; border to `/15`).
- `SettingsView.tsx:104,111,120,128,135,144,148,157,161,170,203` — labels `text-xs font-semibold uppercase tracking-wide` are close but §3 labels are **sentence case, not uppercase** — drop `uppercase tracking-wide`. Selects/inputs border `border-app-slate/20` → `border-app-slate/15`; they lack the canonical `focus:ring-2 focus:ring-app-bright/30` (add it).
- `SettingsView.tsx:78,99,196` — sub-headings `text-lg font-bold` inside sections — acceptable, but note these are section headers; §4 uses `text-sm font-bold`. Given the card layout, `text-lg` is tolerable; flag as minor inconsistency vs list-section headers elsewhere.
- `SettingsView.tsx:180,203` — buttons `px-4 py-2` lack `min-h-[44px]` → add `min-h-[44px]` (tap target). Save button hover missing; add `hover:bg-app-deep transition-colors`.

## components/ExportDialog.tsx  (reference modal — but uses slate-* greys + bright primary)

- `ExportDialog.tsx:176` — backdrop `bg-black/50` → `bg-app-dark/40` (palette + §6 opacity).
- `ExportDialog.tsx:183` — `sm:rounded-xl` modal → `sm:rounded-2xl` (§0 modal radius; mobile `rounded-t-2xl` OK).
- `ExportDialog.tsx:187,200,209,225,228,241,247,259,268,281,299,303` — Tailwind default greys `border-slate-200`, `text-slate-400/500/600`, `hover:bg-slate-100` → palette `border-app-slate/15`, `text-app-slate`, `hover:bg-app-slate/5`.
- `ExportDialog.tsx:190-194` — title `text-lg font-semibold` → `text-lg font-bold` (§6 modal title).
- `ExportDialog.tsx:238` — option label `text-sm font-medium` → fine; mode cards `rounded-lg border` are canon-correct.
- `ExportDialog.tsx:311` — primary "Download PDF" `bg-app-bright … hover:bg-app-deep` → primary should be `bg-app-dark hover:bg-app-deep` (dark primary, not bright). Minor: this is the affirmative export action so bright is defensible, but for one system, use dark.
- `ExportDialog.tsx:200,303` — close/cancel `rounded-md` → `rounded-lg` control radius.

---

## Cross-cutting summary

- **`font-black` outside the logo:** App, Sidebar, BottomNav, LoginView, DashboardNew (stat values), LogTable (dozens), CompetencyPicker, ArtifactsView. Single largest theme.
- **`uppercase tracking-widest` / arbitrary tracking:** App, Sidebar, BottomNav, LoginView, LogTable, CoverageView, ChecklistsView, ArtifactsView.
- **Glassmorphism remnants (`.glass*`, `backdrop-blur`, `bg-white/60|/90`):** Sidebar (glass, glass-blue), App (glass-dark toast), LoginView (glass + blur blobs), BottomNav / CompetencyPicker / ArtifactsView / ExportDialog / App (backdrop-blur), SettingsView (`bg-white/60`).
- **Border color split:** `app-slate/15` family (DashboardNew, ArtifactsView) vs `app-dark/10` family (LogTable, EntryForm, CompetencyPicker, SitePicker, Coverage, Checklists) vs `slate-200` (BottomNav, ExportDialog) vs `app-slate/10|/20` (Settings). Canon = `app-slate/15`.
- **Radii over 2xl / arbitrary:** LoginView `rounded-[3.5rem]`, `rounded-[2rem]`; modals `rounded-3xl` (App, BottomNav, EntryForm md); table `rounded-2xl` containers (LogTable).
- **Primary hover split:** `hover:bg-black` (LogTable, EntryForm, SitePicker) vs canon `hover:bg-app-deep` (Artifacts, CompetencyPicker, Sidebar).
- **Focus split:** `focus:border-app-bright` (LogTable, ArtifactsView shelf) vs canon `focus:ring-2 focus:ring-app-bright/30` (EntryForm, CompetencyPicker, SitePicker, Checklists).
- **Primary color slip:** ExportDialog + App update-toast use `bg-app-bright` for the primary action; canon primary is `bg-app-dark`.

---

## Fix plan — two disjoint, balanced sets

Split by file so two agents never touch the same file. Roughly equal effort (Set A carries the two highest-volume files; Set B carries more files but lighter each).

**Set A — heavy shell + tables (highest line-volume)**
1. `components/LogTable.tsx` — borders→slate/15, focus→ring, hover→app-deep, kill all `font-black`/`tracking-widest`, container radii 2xl→xl, pills `rounded`/black→`rounded-md`/bold.
2. `App.tsx` — loader/toast/badge `font-black`+widest, `glass-dark`→solid, `md:rounded-3xl`→2xl, drop `backdrop-blur`, update-toast bright→dark primary.
3. `components/Sidebar.tsx` — remove `glass`/`glass-blue`, borders, nav radii/shadow, all `font-black`+tracking labels.
4. `components/BottomNav.tsx` — `rounded-t-3xl`→2xl, `border-slate-200`→slate/15, caption `font-black`→bold, drop blur.

**Set B — forms, pickers, secondary views (more files, lighter each)**
5. `components/EntryForm.tsx` — `border-app-dark/*`→slate, title `font-black`→bold, `hover:bg-black`→app-deep.
6. `components/CompetencyPicker.tsx` — borders→slate, header/code `font-black`→bold, drop backdrop-blur, pill radii.
7. `components/SitePicker.tsx` — borders→slate, `hover:bg-black`→app-deep.
8. `components/CoverageView.tsx` + `components/ChecklistsView.tsx` — borders→slate/15, `tracking-wider/widest`→wide.
9. `components/ArtifactsView.tsx` — shelf label `font-black`→semibold, focus→ring, modal backdrop blur/opacity.
10. `components/SettingsView.tsx` — `bg-white/60`→solid, borders→/15, labels sentence-case, add `focus:ring` + `min-h-[44px]` + button hover.
11. `components/LoginView.tsx` — remove `glass`+blur blobs, radii `[3.5rem]`/`[2rem]`→2xl/lg, `font-black`/tracking cleanup.
12. `components/ExportDialog.tsx` — `slate-*`→palette, backdrop→app-dark/40, `sm:rounded-xl`→2xl, title→bold, control radii, primary→dark.

DashboardNew.tsx has only the `font-black`→`font-bold` stat-value fix + one border token; assign it to whichever set finishes first (it borders on both but is trivial — put it in **Set A** with the shell since it's a dashboard concern).
