# Mobile Optimization — Binnenwanderungsziffer München

**Date:** 2026-03-19
**Status:** Approved

---

## Goal

Optimize the visualization for phone and tablet screens (≤768px). The chart should be the primary focus on initial load; controls and data panels are accessible but not dominant.

---

## Breakpoint Change

The `isCompact` state is driven by `useMediaQuery` called in `App.tsx`. The query string changes from `'(max-width: 1080px)'` to `'(max-width: 768px)'`.

```ts
// App.tsx — change this line
const isCompact = useMediaQuery('(max-width: 768px)')
```

The `@media (max-width: 1080px)` rule in `src/index.css` (which hides `.node-inline-label`) is updated to `@media (max-width: 768px)` accordingly. The slider thumb size increase (see Touch Targets) is also added here.

---

## Bottom Sheet — 3 Snap States

The sidebar becomes a bottom sheet with three snap heights. `sheetState` is owned by `App.tsx` so that node-tap interactions can imperatively snap the sheet.

```ts
// App.tsx
const [sheetState, setSheetState] = useState<'peek' | 'controls' | 'full'>('peek')
```

`sheetState` and `setSheetState` are passed as props to `Sidebar`.

| State | Sheet height | Chart visible | Default on load |
|-------|-------------|---------------|-----------------|
| **Peek** | 12vh | 88vh | ✓ yes |
| **Controls** | 38vh | 62vh | — |
| **Full** | 72vh | 28vh | — |

Heights are applied as inline `maxHeight` on the `<aside>` (consistent with the existing `maxHeight: '52vh'` pattern). Use `max-height` with a CSS transition — not `height` — to avoid the "transitioning from auto" problem.

```ts
// Sidebar.tsx
const snapHeight = { peek: '12vh', controls: '38vh', full: '72vh' }[sheetState]
// applied as: style={{ maxHeight: snapHeight, transition: 'max-height 0.28s ease' }}
```

### Peek state content
- Drag handle bar (visual affordance, `<button>` for accessibility)
- Current year + category summary, e.g. `2024 · DEUTSCH`
- Back link: `← Alle Visualisierungen` (rendered here instead of the desktop `<header>` in `App.tsx`; the desktop header remains for `!isCompact`)

### Controls state content
- Drag handle
- Year slider + year range labels
- Category toggle buttons
- KPI grid (Top Plus, Top Minus, Im Plus, Durchschnitt)
- If a district is selected: district focus section at top (see Tap Interaction)

### Full state content
- Everything in Controls
- Trend sparkline for focused district (or strongest inflow as default)
- Contrast pairs section

### Handle interaction
Tap the handle to cycle: Peek → Controls → Full → Peek. No drag gesture.

---

## Tap Interaction on Mobile

**Desktop:** hover shows `Tooltip`, click to pin.
**Mobile (isCompact):** no floating `Tooltip`. Tapping a node:

1. Calls `onPinChange(raumbezug)` (existing logic)
2. Calls `setSheetState('controls')` — always snaps to Controls regardless of current sheet state
3. District detail is rendered at the top of the Controls section in `Sidebar`

**Dismissing** (tap SVG background or "LÖSEN" button):
1. Calls `onPinChange(null)` + `onHoverChange(null)`
2. Calls `setSheetState('peek')` — always snaps to Peek regardless of prior state

The `Tooltip` component is not rendered when `isCompact` is true. `RadialChart` receives `isCompact` as a new prop and conditionally skips the `<Tooltip>` render.

---

## `sidebarWidth` on Mobile

`RadialChart` currently uses `sidebarWidth` to offset tooltip positioning. On mobile `Tooltip` is not rendered, so the value is irrelevant — pass `sidebarWidth={0}` when `isCompact` (already the case: `App.tsx` passes `isCompact ? 0 : 296`). No change needed here.

---

## Touch Target Improvements

| Element | Desktop | Mobile |
|---------|---------|--------|
| Slider thumb | 12×12px | 20×20px (via `@media (max-width: 768px)` in `index.css`) |
| Category buttons | `padding: 5px 6px` | `padding: 9px 10px` |
| Node hit area | existing circle | additional transparent `<circle>` with `r = existingR + 8`, `fill="transparent"`, `pointerEvents="all"`, `onClick/onPointerEnter` forwarded — rendered only when `isCompact` |
| Handle bar | — | full-width `<button>`, `minHeight: 44px` |

The invisible tap ring is implemented as a second `<circle>` element in `NodeRing.tsx`, sibling to the visible node circle, with `opacity={0}` and `pointerEvents="all"`. It shares the same `onClick` and `onPointerEnter` handlers. This approach is more reliable than expanding the existing circle's fill because it doesn't interfere with the visible node's styling or animations.

---

## `isCompact` in `RadialChart`

`isCompact` is not currently a prop on `RadialChart`. Add it:

```ts
// RadialChart.tsx props interface
isCompact: boolean
```

Used to:
- Conditionally skip rendering `<Tooltip>`
- Pass down to `NodeRing` to render the wider invisible tap ring

---

## Title / Navigation on Mobile

The desktop `<header>` in `App.tsx` is already hidden on compact (`{!isCompact && <header>…</header>}`). On mobile, the back link and current selection summary are rendered inside the Peek state of `Sidebar` instead. No separate header element on mobile.

---

## Label Truncation

Category button labels on mobile: `DEUTSCH` stays as-is. `NICHTDEUTSCH` → `NICHT-DEUTSCH` (adds a soft hyphenation opportunity). `aria-label` and `aria-pressed` remain unchanged.

---

## Files to Change

| File | Change |
|------|--------|
| `src/App.tsx` | `useMediaQuery` query `'(max-width: 1080px)'` → `'(max-width: 768px)'`; add `sheetState` / `setSheetState`; pass both to `Sidebar`; on pin → `setSheetState('controls')`; on dismiss → `setSheetState('peek')`; pass `isCompact` to `RadialChart` |
| `src/components/Sidebar.tsx` | Accept `sheetState` + `setSheetState` props; render 3-state sheet with handle button; `max-height` transition; Peek / Controls / Full content split; relocate back link into Peek |
| `src/components/RadialChart.tsx` | Add `isCompact` prop; skip `<Tooltip>` render when `isCompact` |
| `src/components/NodeRing.tsx` | Add transparent wider `<circle>` as tap ring when `isCompact` |
| `src/index.css` | `1080px` → `768px` in media query; add `.viz-slider` thumb 20px rule inside `@media (max-width: 768px)` |
| `src/components/Tooltip.tsx` | No changes |

---

## Out of Scope

- Drag gesture on the sheet handle
- Landscape phone layout
- PWA / installability
- District label overlay on nodes
