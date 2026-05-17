# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Life Calendar — a static, zero-build web app that renders a person's life as a grid of weeks. No package manager, no bundler, no tests. Open `index.html` directly in a browser or serve with any static server:

```bash
python -m http.server
```

## File layout

```
index.html        # markup only; loads js/main.js as <script type="module">
style.css         # all styles (CSS custom properties drive theming)
js/
  main.js         # entry point: wires theme, scale, print, settings → draw()
  calendar.js     # week-math + DOM rendering (pure, no side-effects)
  settings.js     # birthdate + lifeExpectancy — localStorage ↔ URL sync
  ui.js           # onboarding flow, settings panel, stats counter
  dates.js        # tiny date helpers replacing moment.js
```

## Architecture

### Data flow
`loadSettings()` → `draw()` → `renderCalendar()` → DOM. Settings changes (from the settings panel or onboarding) call `draw()` in place; there are no page reloads. URL is kept in sync via `history.replaceState`.

**State precedence:** URL params (`?birthdate=YYYY-MM-DD&life=80`) beat `localStorage`, which beats defaults.

### Year-accuracy algorithm (`calendar.js`)
Each row represents one exact birthday-to-birthday year. `weeksPerYear()` computes how many 7-day weeks start within each year span — yielding 52 or 53. The 53rd cell gets `.week--overflow`. Week classification: `weekIndex < weeksLived` → `.week--passed`; `=== weeksLived` → `.week--current`.

### Responsive scaling (`main.js → applyScale`)
`.scale-wrapper` (the calendar content) gets `transform: scale(N)` where `N = min(1, innerWidth/1920 + 0.15)`. Because CSS `transform` doesn't affect layout, `applyScale` also sets a negative `marginBottom` and a `body.style.minHeight` to collapse the phantom whitespace. **Fixed overlays** (onboarding, settings panel, settings overlay) live as direct `<body>` children *outside* `.scale-wrapper` — critical, because a transformed ancestor breaks `position: fixed` layout.

### Theming
Five themes: `light`, `dark`, `aurora`, `sunset`, `ocean`. Active theme is stored as `data-theme="..."` on `<html>` (set synchronously by an inline `<head>` script to avoid FOUC). All colors are CSS custom properties on `:root`/`[data-theme]`. The palette button cycles themes; swatches in the settings panel allow direct selection.

### Print (`main.js + @media print in style.css`)
`beforeprint`: sets `container.style.width = 'fit-content'` (so the container doesn't stretch to viewport width, which would deflate the zoom), measures `scrollWidth`/`scrollHeight`, then applies `container.style.zoom` to fit A4 portrait. `zoom` (unlike `transform`) collapses layout height so the browser page-break engine sees one page. `afterprint` restores everything and calls `applyScale()`.

Print CSS forces light-theme variables, hides UI chrome, and sets `print-color-adjust: exact` so filled cells render without needing "Background graphics" enabled in the print dialog.
