# Life Calendar — Modernization Plan

## Context

The current app ([index.html](../index.html)) is a single-file static page that visualizes a life in weeks. Three issues to address:

1. **Year-row inaccuracy.** Each row is hardcoded to 52 cells via a 4×13 grid (`year < 72`, `tenth_number < 14`, `week_number < 5` at [index.html:48-56](../index.html)). A year of life averages 52.18 weeks, so cells drift away from real birthday boundaries; over 71 years the last cell is ~13 weeks off.
2. **Crude onboarding UI.** The modal at [index.html:31-40](../index.html) is a minimal `<input type="date">` + button. No life-expectancy control — lifespan is hardcoded to 71 years in JS.
3. **Inline script + script bloat.** All logic lives in a `<script>` tag in `index.html`; moment.js (~70KB) is loaded from a CDN for a single `diff` call. README has "refactor script" as an open TODO.

Goal: keep the project zero-build and dependency-free, but split into clean modules, add a modern onboarding/settings flow, and make each row represent exactly one year of life (with overflow weeks shown as extra cells on the right).

## Decisions (confirmed with user)

- **Year accuracy:** Each row is one year (birthday-to-birthday). Most rows are 52 cells; years that contain 53 week-starts render a 53rd cell that extends past the rectangle on the right. The main grid stays aligned.
- **UI:** Modern redesign — full onboarding flow for first-time users (birthdate + life expectancy), plus a persistent way to edit settings.
- **Refactor:** Extract to plain JS files (no Vite, no build step). Native ES modules via `<script type="module">`. Drop moment.js in favor of native `Date`.

## Target File Layout

```
index.html         # markup only, loads main.js as a module
style.css          # all styles
js/
  main.js          # entry; wires settings → calendar → UI
  calendar.js      # week math + grid rendering (pure, testable)
  settings.js      # birthdate + lifeExpectancy state, localStorage + URL sync
  ui.js            # onboarding modal, settings panel, footer interactions
  dates.js         # tiny date helpers (replaces moment.js)
```

No package.json, no build. Open `index.html` directly.

## Year-accuracy algorithm — `js/calendar.js`

Replace the nested `for year/tenth/week` loops with one that assigns each life-week to a specific year-of-life:

```js
// week K (0-indexed) starts at birthDate + K*7 days
// year N (0-indexed) spans [birthday+N years, birthday+(N+1) years)
// week K belongs to year N if its start date falls in that span
function weeksPerYear(birthDate, lifeYears) {
  const counts = [];
  for (let n = 0; n < lifeYears; n++) {
    const yearStart = addYears(birthDate, n);
    const yearEnd   = addYears(birthDate, n + 1);
    // first week whose start >= yearStart, last week whose start < yearEnd
    const firstWeek = Math.ceil(daysBetween(birthDate, yearStart) / 7);
    const lastWeek  = Math.ceil(daysBetween(birthDate, yearEnd)   / 7) - 1;
    counts.push(lastWeek - firstWeek + 1); // 52 or 53
  }
  return counts;
}
```

Render: for each row, emit `counts[n]` cells. Cells 1–52 sit inside the main flex row (`justify-content: center`); cell 53, when present, is positioned to overflow on the right via a modifier class (`.week--overflow`) and absolute positioning relative to the row, so the 52-cell rectangle stays visually aligned across all rows.

Pass/future classification: `weekIndex < weeksLived ? 'passed' : 'future'`, where `weeksLived = floor(daysSinceBirth / 7)`.

## Date helpers — `js/dates.js`

Replaces moment.js. Native `Date` is enough:

```js
export const addYears = (d, n)  => { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; };
export const daysBetween = (a, b) => Math.round((b - a) / 86_400_000);
export const weeksSince  = (d)    => Math.floor(daysBetween(d, new Date()) / 7);
export const formatDDMMYYYY = (d) => `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}`;
```

Remove the moment.js `<script>` tag from `index.html`.

## State + persistence — `js/settings.js`

```js
// shape: { birthdate: 'YYYY-MM-DD', lifeExpectancy: number }
// precedence: URL params > localStorage > defaults
// writes go to both localStorage and history.replaceState (so URL stays shareable)
export function loadSettings() { ... }
export function saveSettings(partial) { ... }
export const DEFAULT_LIFE_EXPECTANCY = 80;
```

URL schema becomes `?birthdate=YYYY-MM-DD&life=80`. Backwards-compatible: missing `life` → default 80.

## UI redesign — `js/ui.js` + `style.css`

**Onboarding (first visit, no settings):**

A full-screen step flow, not a tiny modal. Two steps, both centered with large typography:
1. **Birthdate** — big heading "When were you born?", a styled `<input type="date">`, a Next button.
2. **Life expectancy** — heading "How long do you plan to live?", a numeric input + range slider (50–110, default 80), a Start button.

Progress dots at the bottom. Smooth slide/fade between steps. Enter key advances.

**Settings panel (returning users):**

A gear icon in the top-right opens a slide-in side panel containing both controls (birthdate + life expectancy) plus a "Reset" link. Changes apply immediately and update the URL. The footer's hover-to-reveal "change" button is removed (discoverability is poor; gear icon replaces it).

**Aesthetic:**

Keep the existing minimalist black/white grid feel, but modernize chrome:
- Switch from `San Francisco Display` (not actually loaded; falls back to default) to a real system stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif`.
- Soften the modal: rounded corners, subtle backdrop-blur, no harsh box-shadow.
- Add CSS custom properties for color tokens so dark mode is a follow-up one-liner.
- The "weeks of my life" header gets a subtle counter below it: `1,772 weeks lived · 2,388 to go`.

## Markup — `index.html`

Stays almost the same structurally, but:
- Remove inline `<script>` and moment.js CDN tag.
- Add `<script type="module" src="./js/main.js"></script>`.
- Replace the old modal with the new onboarding container (`<div id="onboarding">`) and a `<aside id="settings-panel">` for the gear-icon side panel.
- Add a gear button in the header.
- Footer keeps the "you only live once" tag, drops the birthdate-on-hover bit.

## Verification

1. Open `index.html` directly in a browser (no server needed).
2. **Onboarding:** clear localStorage + visit with no URL params → onboarding flow appears, both steps work, finishing renders the grid and updates the URL with both `birthdate` and `life`.
3. **Year accuracy:** spot-check a birthdate of `2000-01-01` with lifespan 80. Manually verify: years 2000→2001, 2004→2005 (leap), etc. produce 52 or 53 cells; the row-by-row total over 80 years equals `floor((addYears(birth, 80) - birth) / (7 days))`.
4. **Overflow visual:** confirm a 53-cell row keeps the first 52 cells aligned with the 52-cell rows and the 53rd cell hangs off the right without shifting the rectangle.
5. **Passed/future shading:** week containing today should be the boundary; the cell for "this week" gets a distinct class (`.week--current`) so we can style it differently later.
6. **Settings panel:** open via gear icon, change birthdate → grid re-renders without page reload; URL updates via `history.replaceState`.
7. **URL sharing:** copy `?birthdate=1990-06-15&life=85` into a fresh incognito window → renders correctly with no localStorage.
8. **Print:** Ctrl-P preview still produces a clean grid (the onboarding/settings chrome should be `@media print { display: none }`).
9. **Mobile:** resize to 375px width; `--vw-scale` still shrinks the grid; onboarding flow is tappable.

## Critical files to modify

- [`index.html`](../index.html) — strip inline script + moment.js, restructure markup
- [`style.css`](../style.css) — modernize, add onboarding/settings panel styles
- **New:** `js/main.js`, `js/calendar.js`, `js/settings.js`, `js/ui.js`, `js/dates.js`

## Out of scope (follow-ups)

- Dark mode (CSS variables make this trivial later)
- Week annotations / life events
- PNG/SVG export
- PWA / offline support
- i18n
