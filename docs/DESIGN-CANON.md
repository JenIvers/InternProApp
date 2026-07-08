# InternPro Design Canon

The single, prescriptive UI system for InternPro. Derived from the strongest patterns already in the codebase — **DashboardNew** (stat tiles + ranked list), **LogTable** (desktop table + mobile list), **EntryForm** (grouped collapsible sections + pinned modal chrome), and **ExportDialog** (modal shell). When a component disagrees with this document, the component is wrong. See `DESIGN-AUDIT.md` for the concrete deviation list.

Palette (defined in `index.html`, do not add a config file): `app-dark #142930`, `app-deep #305663`, `app-bright #4283A4`, `app-slate #6492A0`, `app-light #9DC3CF`, `app-bg #F0F4F7`. Icons: `lucide-react`. Mobile-first; one user on iPhone + desktop.

---

## 0. Global decisions (resolve the seams)

These are the choices the codebase currently contradicts. Pick these everywhere.

| Concern | CANON | Reject |
|---|---|---|
| Container border | `border border-app-slate/15` | `border-app-dark/10`, `border-app-slate/10`, `border-app-slate/20`, `border-slate-200` |
| Hairline divider | `divide-app-slate/10` / `border-app-slate/10` | `divide-app-dark/5`, `divide-app-dark/10`, `border-app-dark/5` |
| Input focus | `outline-none focus:ring-2 focus:ring-app-bright/30` | `focus:border-app-bright` |
| Primary button hover | `hover:bg-app-deep` | `hover:bg-black` |
| Value/number weight | `font-bold` (max) | `font-black` |
| `font-black` | **Reserved for the wordmark logo only** | anywhere else |
| Micro-label caps | calm `text-xs font-semibold` sentence case | `font-black uppercase tracking-widest`, `tracking-[0.2em]` |
| Glassmorphism (`.glass`, `.glass-dark`, `.glass-blue`, backdrop-blur panels) | **Removed** — solid `bg-white` / `bg-app-dark` | any `.glass*` class |
| Modal radius | `rounded-2xl` (mobile top-only `rounded-t-2xl`) | `rounded-3xl`, `rounded-[2rem]`, `rounded-[3.5rem]` |

**Border-radius scale:** `rounded-md` micro-pills/tag chips · `rounded-lg` all controls (buttons, inputs, selects, small tiles) · `rounded-xl` containers/cards/callouts · `rounded-2xl` modals & sheets · `rounded-full` avatars, progress tracks, status badges. Nothing larger than `rounded-2xl`; no arbitrary `rounded-[…rem]`.

**Font-weight scale:** `font-medium` body/secondary text · `font-semibold` labels, secondary buttons, list titles · `font-bold` primary buttons, headings, emphasized values · `font-black` **logo only**.

**Spacing scale:** page sections `space-y-6` (dashboard-dense may use `space-y-8`); control padding `px-4 py-2.5`; container inner padding `px-4 py-3` (rows) / `px-5 py-4` (headers) / `p-4 sm:p-6` (form cards); grid gaps `gap-3`/`gap-4`. Min tap target `min-h-[44px]` on every interactive control; `min-h-[48px]` for full-width section toggles / primary submit.

**Icon sizes:** `13` inline-with-label · `14`–`16` in buttons/rows · `18`–`20` nav & modal-close · `22` prominent (FAB, header accent). Match `lucide` `size` to context; do not mix `12` and `16` for the same role.

---

## 1. Page header

Every top-level view opens with this. Title is always `text-2xl font-bold` (never `text-3xl`, never `font-black`).

```tsx
<header className="flex flex-wrap items-center justify-between gap-3">
  <div className="min-w-0">
    <h1 className="text-2xl font-bold text-app-dark tracking-tight">Dashboard</h1>
    <p className="text-app-slate text-sm opacity-70">Subtitle in one calm sentence.</p>
  </div>
  {/* optional header action, md+ only when a mobile equivalent exists */}
  <button className="hidden md:flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors shadow-sm">
    <Plus size={16} strokeWidth={2.5} /> Add entry
  </button>
</header>
```

Cite: `components/DashboardNew.tsx:101-106` (title/subtitle), `App.tsx:364-378` (header + md-only action). Use `h1` on standalone views; `h2 text-2xl font-bold` is acceptable for the Activity Log heading nested under the shell.

---

## 2. Buttons

All buttons: `rounded-lg`, `min-h-[44px]`, `transition-colors`, `text-sm`, icon+gap `gap-1.5`/`gap-2`.

**Primary** — one dark action per context.
```tsx
className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-app-dark text-white text-sm font-bold hover:bg-app-deep transition-colors active:scale-[0.99]"
```
Cite: `App.tsx:374` (structure), hover from `components/ArtifactsView.tsx:196` / `components/CompetencyPicker.tsx:406`. Full-width submit uses `w-full min-h-[48px] py-3 … font-bold` (`components/EntryForm.tsx:597-602`).

**Secondary / outline** — neutral.
```tsx
className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg border border-app-slate/15 text-app-slate text-sm font-semibold hover:bg-app-slate/5 transition-colors"
```
Cite: `components/ArtifactsView.tsx:190-192` (New shelf). Toggle-on state: `bg-app-dark text-white border-app-dark` (`components/LogTable.tsx:252-254`, `components/CoverageView.tsx:55-57`).

**Destructive** — outline red default, solid red only for confirm.
```tsx
/* outline */ className="… rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
/* solid confirm */ className="… rounded-lg bg-red-600 text-white font-bold"
```
Cite: `components/LogTable.tsx:744-747` (outline), `components/EntryForm.tsx:583` (solid confirm).

**Icon-only** — square, hover-fill.
```tsx
className="p-1.5 rounded-lg text-app-slate hover:bg-app-bright hover:text-white transition-colors"  /* or hover:bg-red-500 for delete */
```
Cite: `components/LogTable.tsx:625-637`. Modal-close variant: `p-2 rounded-lg text-app-slate hover:bg-app-slate/10` (`components/ArtifactsView.tsx:298-301`). Note: icon-only buttons inside dense table rows may drop below 44px; that is the one sanctioned exception (pointer targets, not touch-primary).

**Tertiary / inline link-button:** `text-xs font-bold text-app-bright hover:text-app-deep` (`components/DashboardNew.tsx:270-274`).

---

## 3. Inputs, selects, labels

**Label** — calm, small, sentence case. Optional leading icon `size={13}`.
```tsx
<label className="flex items-center gap-1.5 text-xs font-semibold text-app-slate mb-1.5">
  <Calendar size={13} /> Date
</label>
```
Cite: `components/EntryForm.tsx:277-279`, `components/LogTable.tsx:265-267`.

**Input / select / textarea** — `text-base` (or `text-base sm:text-sm`) so iOS never zooms; `min-h-[44px]`; canonical focus ring.
```tsx
className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-app-bg border border-app-slate/15 outline-none focus:ring-2 focus:ring-app-bright/30 font-medium text-app-dark text-base"
```
Cite: `components/EntryForm.tsx:280-286` (structure + `focus:ring`), `components/LogTable.tsx:244` (text-base sm:text-sm). Value emphasis uses `font-bold`, not `font-black`. Custom-styled selects add `appearance-none cursor-pointer` + an absolutely-positioned `ChevronDown size={16}` at `right-4` (`components/EntryForm.tsx:307-316`, `components/SitePicker.tsx:62-74`).

---

## 4. Grouped list container + row

The core surface. One container, hairline dividers, no per-row borders.

```tsx
<section className="rounded-xl border border-app-slate/15 bg-white overflow-hidden">
  <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-app-slate/10">
    <h2 className="text-sm font-bold text-app-dark">Section title</h2>
    {/* optional count / action */}
  </div>
  <ul className="divide-y divide-app-slate/10">
    <li>
      <button className="w-full flex items-center gap-3 px-5 py-2 min-h-[44px] text-left hover:bg-app-slate/5 transition-colors">
        …row content…
      </button>
    </li>
  </ul>
</section>
```
Cite: `components/DashboardNew.tsx:261-331` (ranked list, the reference), `components/ArtifactsView.tsx:56-91` (ShelfSection). Section header labels are `text-sm font-bold text-app-dark` — **not** `text-xs font-black uppercase tracking-widest`. Row hover is always `hover:bg-app-slate/5`.

---

## 5. Cards / stat tiles (the ONLY sanctioned free-standing card)

Cards are allowed **only** for numeric stat tiles. Everything else is a grouped list (§4). Never wrap ordinary content in a lone bordered card.

```tsx
<div className="rounded-xl border border-app-slate/15 bg-white px-4 py-4">
  <div className="flex items-center gap-2 text-app-dark mb-3">
    <Icon size={16} /><span className="text-xs font-bold uppercase tracking-wide">High School</span>
  </div>
  <div className="flex items-baseline gap-1 mb-2">
    <span className="text-2xl font-bold text-app-dark tabular-nums">42</span>
    <span className="text-xs font-semibold text-app-slate opacity-60">/ 240h</span>
  </div>
  <div className="w-full h-2 rounded-full bg-app-slate/10 overflow-hidden mb-2">
    <div className="h-full rounded-full bg-app-bright" style={{ width: '30%' }} />
  </div>
  <p className="text-[11px] font-medium text-app-slate opacity-70">198h remaining</p>
</div>
```
Cite: `components/DashboardNew.tsx:173-201`. Inverted "Total" variant: `bg-app-dark text-white border-app-slate/15` with `bg-white/20` track (`components/DashboardNew.tsx:205-231`). Stat value is `font-bold` — the current `font-black` there is a canon violation to fix.

---

## 6. Modals & sheets

Full-screen on mobile (`h-dvh`), centered card on md+. Pinned header + scroll body + pinned footer. Backdrop `bg-app-dark/40` (no blur). Radius `rounded-2xl` (mobile `rounded-t-2xl` for bottom sheets). Respect iOS safe area with `pt-safe` (header) and `pb-safe` (footer).

```tsx
<div className="fixed inset-0 z-[80] bg-app-dark/40 flex md:items-center md:justify-center md:p-6 md:overflow-y-auto">
  <div className="bg-white w-full md:max-w-2xl md:rounded-2xl shadow-2xl flex flex-col h-dvh md:h-auto md:max-h-[90vh] overflow-hidden">
    <div className="shrink-0 border-b border-app-slate/10 px-5 md:px-8 pt-safe">
      <div className="flex items-center justify-between py-4">
        <h3 className="text-lg font-bold text-app-dark">Title</h3>
        <button className="-mr-2 p-2 rounded-lg text-app-slate hover:text-app-dark hover:bg-app-bg transition-colors"><X size={22} /></button>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-8 py-4 md:py-6 space-y-4">…</div>
    <div className="shrink-0 border-t border-app-slate/10 bg-white px-5 md:px-8 py-4 pb-safe">…primary button…</div>
  </div>
</div>
```
Cite: `App.tsx:508-525` + `components/EntryForm.tsx:256-604` (the reference shell — adopt everything except its `md:rounded-3xl`→`rounded-2xl` and `border-app-dark/10`→`border-app-slate/10`). Bottom-sheet pattern: `components/CompetencyPicker.tsx:336-411`. Modal title is `text-lg font-bold` (not `font-black`, not `font-semibold`). Backdrop must not use `backdrop-blur`.

---

## 7. Empty states

A single calm muted row **inside** the relevant container — never a large illustration block.

```tsx
<li className="px-5 py-6 text-center text-xs text-app-slate opacity-60">No hours logged yet.</li>
```
Cite: `components/DashboardNew.tsx:326-330`, `components/ArtifactsView.tsx:77-79`. Mobile list empty state: `rounded-xl border border-app-slate/15 bg-white px-4 py-6 text-center text-sm text-app-slate font-medium` (`components/LogTable.tsx:790-793`). Read-only footnotes and "no gaps" messages follow the same muted `text-app-slate opacity-60` treatment.

---

## 8. Badges, pills, callouts, progress

**Competency code pill (primary):** `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-app-dark text-white text-[10px] font-bold` + `<Star size={9} className="fill-current" />`. **Secondary tag:** `px-1.5 py-0.5 rounded-md bg-app-bright/10 text-app-slate text-[10px] font-bold border border-app-bright/10`. Cite: `components/LogTable.tsx:531-550` (fix `font-black`→`font-bold`, `rounded`→`rounded-md`).

**Status badge (pill):** `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border` + tone classes (`text-emerald-600 bg-emerald-50 border-emerald-200`, amber, rose). Cite: `components/CoverageView.tsx:13-17,107-110`.

**"Primary" chip:** `text-[10px] font-bold uppercase tracking-wide text-app-bright bg-app-bright/10 px-2 py-0.5 rounded-full` (`components/DashboardNew.tsx:183-186`).

**Warning / amber callout:** the one warning pattern.
```tsx
<section className="rounded-xl border border-amber-300 bg-amber-50 px-4 sm:px-5 py-4 flex items-start gap-3">
  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
  <div className="flex-1 min-w-0">
    <h2 className="text-sm font-bold text-amber-800">Heading</h2>
    <p className="text-xs text-amber-700 opacity-80 mb-2">Explanation.</p>
    {/* actions: bg-white border-amber-300 text-amber-800 hover:bg-amber-100 */}
  </div>
</section>
```
Cite: `components/DashboardNew.tsx:141-160`. Inline form-warning list variant: `bg-amber-50 border border-amber-200 … text-amber-700` (`components/EntryForm.tsx:561-568`). Error callouts mirror this in red (`bg-red-50 border-red-200 text-red-600`).

**Progress track:** `w-full h-2 rounded-full bg-app-slate/10 overflow-hidden` with `h-full rounded-full bg-app-bright` fill (`components/DashboardNew.tsx:192-197`).

---

## 9. Navigation (shell)

**Sidebar (md+)** and **BottomNav (mobile)** active item: `bg-app-dark text-white`. Reject `.glass` sidebar background (use solid `bg-white border-r border-app-slate/15`), reject `rounded-2xl` nav buttons in favor of `rounded-lg`/`rounded-xl`, and reject `font-black uppercase tracking-widest` micro-labels. Nav labels: `text-sm font-semibold` (sidebar), `text-[10px] font-bold uppercase` is acceptable only for the tiny bottom-nav captions. The mobile FAB (`+`) stays `bg-app-dark rounded-2xl` — it is a control-sized element, sanctioned at `rounded-2xl`. Cite target intent: `components/DashboardNew.tsx` weight discipline; current `components/Sidebar.tsx` / `components/BottomNav.tsx` are the primary offenders (see audit).
