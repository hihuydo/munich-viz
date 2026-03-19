# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the radial migration chart for phone/tablet (≤768px) with a 3-state snap bottom sheet, chart-first initial view, and tap-friendly interactions.

**Architecture:** The breakpoint drops from 1080px to 768px. On mobile, `Sidebar` becomes a 3-state bottom sheet (`peek` / `controls` / `full`) driven by `sheetState` owned in `App.tsx`. Node taps snap the sheet to `controls` and show district detail; dismiss snaps back to `peek`. The floating `Tooltip` is suppressed on mobile — district detail lives in the sheet instead.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, D3 7, inline styles (no CSS-in-JS library). No automated test framework — verify with `pnpm dev` at each step.

**Spec:** `docs/superpowers/specs/2026-03-19-mobile-optimization-design.md`

---

## Chunk 1: Breakpoint, CSS touch targets, and sheetState wiring

---

### Task 1: Update breakpoint in CSS and App.tsx

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update the media query in index.css**

In `src/index.css`, find the rule at line 198:
```css
@media (max-width: 1080px) {
  .node-inline-label {
    display: none;
  }
}
```
Change to:
```css
@media (max-width: 768px) {
  .node-inline-label {
    display: none;
  }
}
```

- [ ] **Step 2: Add mobile slider thumb size in index.css**

After the `@media (max-width: 768px)` block above, add a new rule:
```css
@media (max-width: 768px) {
  input.viz-slider::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
  }
  input.viz-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
  }
}
```

- [ ] **Step 3: Update the media query string in App.tsx**

In `src/App.tsx`, find:
```ts
const isCompact = useMediaQuery('(max-width: 1080px)')
```
Change to:
```ts
const isCompact = useMediaQuery('(max-width: 768px)')
```

- [ ] **Step 4: Start dev server and verify**

```bash
pnpm dev
```

Open the app, resize browser to 768px wide — node labels should disappear.
Resize to 769px — labels reappear. Confirm slider thumb is larger at ≤768px.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/App.tsx
git commit -m "feat: update compact breakpoint from 1080px to 768px"
```

---

### Task 2: Add sheetState to App.tsx and wire pin/dismiss to snap

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add sheetState state**

In `src/App.tsx`, after the existing `useState` declarations (around line 9–12), add:
```ts
const [sheetState, setSheetState] = useState<'peek' | 'controls' | 'full'>('peek')
```

- [ ] **Step 2: Replace direct setPinnedNode with a wrapper that snaps the sheet**

Find the `handlePin` usage — currently `App.tsx` passes `onPinChange={setPinnedNode}` to `RadialChart`. Replace with a dedicated handler. Add this function inside `App()`, before the `return`:

```ts
function handlePinChange(node: string | null) {
  setPinnedNode(node)
  if (isCompact) {
    if (node !== null) setSheetState('controls')
    else setSheetState('peek')
  }
}
```

- [ ] **Step 3: Pass sheetState + new handler to Sidebar, and update RadialChart**

In the JSX return, update the `<RadialChart>` and `<Sidebar>` props:

On `<RadialChart>`:
- Change `onPinChange={setPinnedNode}` → `onPinChange={handlePinChange}`

On `<Sidebar>`:
- Change `onClearSelection` callback: `setPinnedNode(null)` → `handlePinChange(null)`
- Add two new props: `sheetState={sheetState}` and `onSheetStateChange={setSheetState}`

The updated `<Sidebar>` call should look like:
```tsx
<Sidebar
  years={years}
  activeYear={resolvedYear}
  activeCategory={activeCategory}
  records={filtered}
  allRecords={allRecords}
  activeNodeName={activeNodeName}
  activeNodeData={activeNodeData}
  isCompact={isCompact}
  sheetState={sheetState}
  onSheetStateChange={setSheetState}
  onYearChange={setActiveYear}
  onCategoryChange={setActiveCategory}
  onClearSelection={() => handlePinChange(null)}
/>
```

Also update the existing `onClearSelection` in the Escape key handler (around line 36):
```ts
// Find: setPinnedNode(null)
// Change to:
handlePinChange(null)
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm build
```
Expected: TypeScript errors about Sidebar not yet accepting `sheetState`/`onSheetStateChange` props. That's expected — Task 3 fixes Sidebar. If there are OTHER errors, fix them before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add sheetState to App and wire pin/dismiss to sheet snap"
```

---

## Chunk 2: Sidebar refactor, RadialChart, NodeRing

---

### Task 3: Refactor Sidebar into a 3-state mobile bottom sheet

**Files:**
- Modify: `src/components/Sidebar.tsx`

This is the largest task. The Sidebar needs to accept new props and render two different layouts: desktop (unchanged) and mobile (3-state sheet).

- [ ] **Step 1: Update the Props interface in Sidebar.tsx**

Find the `interface Props` block (line 8–19) and add two new required props:
```ts
sheetState: 'peek' | 'controls' | 'full'
onSheetStateChange: (state: 'peek' | 'controls' | 'full') => void
```

Update the destructured parameters in the function signature to include them:
```ts
export function Sidebar({
  // ...existing params...
  sheetState,
  onSheetStateChange,
}: Props) {
```

- [ ] **Step 2: Add sheet cycle logic at the top of the component**

After the existing computed values (ranking, strongestInflow, etc.), add:
```ts
const SHEET_CYCLE = { peek: 'controls', controls: 'full', full: 'peek' } as const

function cycleSheet() {
  onSheetStateChange(SHEET_CYCLE[sheetState])
}
```

And add snap height mapping:
```ts
const snapHeight = { peek: '12vh', controls: '38vh', full: '72vh' }[sheetState]
```

- [ ] **Step 3: Replace the return statement with split desktop/mobile renders**

The current `return` starts at line 72. Replace the entire `return (...)` block with:

```tsx
if (!isCompact) {
  // ── Desktop layout ── (unchanged, just moved into its own branch)
  return (
    <aside
      style={{
        position: 'fixed',
        right: 16, top: 16, bottom: 16, width: 272,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
        gap: 6,
        overflowY: 'auto',
        fontFamily: 'var(--font-serif)',
        color: 'var(--text-primary)',
        background: 'rgba(var(--bg-primary-rgb), 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 4,
        zIndex: 10,
      }}
    >
      <SectionCard title="Jahr" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="range"
              min={years[0]}
              max={years[years.length - 1]}
              value={activeYear}
              step={1}
              aria-label="Jahr auswählen"
              onChange={e => onYearChange(Number(e.target.value))}
              style={{ width: '100%' }}
              className="viz-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[0]}</span>
              <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[years.length - 1]}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
                style={{
                  flex: 1,
                  background: activeCategory === cat ? '#000000' : 'transparent',
                  border: '1px solid #000000',
                  color: activeCategory === cat ? '#ffffff' : '#000000',
                  fontSize: 9,
                  letterSpacing: 1,
                  padding: '5px 6px',
                  cursor: 'pointer',
                  borderRadius: 999,
                  fontFamily: 'var(--font-serif)',
                  transition: 'all 0.2s',
                }}
              >
                {cat === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Legende">
        <LegendRow color="var(--accent-green)" description="Positiver Saldo" />
        <LegendRow color="var(--accent-orange)" description="Negativer Saldo" />
        <LegendRow color="var(--text-contrast)" description="Kontrast-Linien" shape="line" />
        <LegendRow color="var(--text-primary)" description="Größe = Intensität" shape="rings" />
      </SectionCard>

      <SectionCard title="Lagebild">
        <KpiGrid>
          <KpiCard label="Top Plus" value={strongestInflow ? formatValue(strongestInflow.indikatorwert) : '—'} accent="var(--accent-green)" detail={strongestInflow ? districtLabel(strongestInflow.raumbezug) : 'Keine positive Ausprägung'} note="Saldo je 1.000 Ew." />
          <KpiCard label="Top Minus" value={strongestOutflow ? formatValue(strongestOutflow.indikatorwert) : '—'} accent="var(--accent-orange)" detail={strongestOutflow ? districtLabel(strongestOutflow.raumbezug) : 'Keine negative Ausprägung'} note="Saldo je 1.000 Ew." />
          <KpiCard label="Im Plus" value={`${positives}/${records.length}`} accent="var(--text-contrast)" detail={`${negatives} Bezirke im Minus`} note="Anzahl Bezirke" />
          <KpiCard label="Durchschnitt" value={formatValue(average)} accent="var(--accent-blue)" detail="Saldo je 1.000 Ew." note="Normierter Kennwert" />
        </KpiGrid>
      </SectionCard>

      {focusRecord && (
        <SectionCard title={activeNodeName ? 'Bezirk im Fokus' : 'Spotlight'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, color: '#000000', lineHeight: 1.4 }}>{districtLabel(focusRecord.raumbezug)}</div>
              <div style={{ fontSize: 10, color: '#000000', letterSpacing: 1.6, marginTop: 5 }}>RANG {focusRank ?? '—'} IM JAHR {activeYear}</div>
            </div>
            {activeNodeName && (
              <button onClick={onClearSelection} style={{ border: '1px solid #000000', background: 'transparent', color: '#000000', fontSize: 10, letterSpacing: 1, padding: '6px 10px', borderRadius: 999, cursor: 'pointer' }}>
                LÖSEN
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6, marginTop: 8 }}>
            <MetricPill label="Aktuell" value={formatValue(focusRecord.indikatorwert)} />
            <MetricPill label="Zum Vorjahr" value={delta === null ? '—' : formatValue(delta)} />
            <MetricPill label="Langfr. Schnitt" value={trendAverage === null ? '—' : formatValue(trendAverage)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <TrendSparkline values={focusTrend.map(p => p.indikatorwert)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#000000', letterSpacing: 1.2 }}>
              <span>{focusTrend[0]?.jahr ?? activeYear}</span>
              <span>{focusTrend[focusTrend.length - 1]?.jahr ?? activeYear}</span>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title={activeNodeName ? 'Kontrastlinien' : 'Prägende Kontraste'} defaultOpen={false}>
        <div style={{ display: 'grid', gap: 2 }}>
          {contrastPairs.map(pair => (
            <div key={`${pair.positive.raumbezug}-${pair.negative.raumbezug}`} style={{ display: 'grid', gap: 3, padding: '8px 0', borderBottom: '1px solid var(--border-quiet)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--accent-green)', fontSize: 12, lineHeight: 1.5 }}>{districtLabel(pair.positive.raumbezug)}</span>
                <span style={{ color: 'var(--accent-orange)', fontSize: 12, lineHeight: 1.5, textAlign: 'right' }}>{districtLabel(pair.negative.raumbezug)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11 }}>
                <span style={{ color: 'var(--accent-green)' }}>{formatValue(pair.positive.indikatorwert)}</span>
                <span style={{ color: 'var(--accent-orange)' }}>{formatValue(pair.negative.indikatorwert)}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </aside>
  )
}

// ── Mobile layout ──
return (
  <aside
    style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: snapHeight,
      transition: 'max-height 0.28s ease',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-serif)',
      color: 'var(--text-primary)',
      background: '#ffffff',
      borderTop: '2px solid #000000',
      borderRadius: '12px 12px 0 0',
      zIndex: 10,
      overflowY: sheetState === 'full' ? 'auto' : 'hidden',
    }}
  >
    {/* ── Handle ── */}
    <button
      onClick={cycleSheet}
      aria-label={`Panel ${sheetState === 'peek' ? 'aufklappen' : sheetState === 'full' ? 'einklappen' : 'maximieren'}`}
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 32, height: 3, background: '#cccccc', borderRadius: 2 }} />
      {sheetState === 'peek' && (
        <div style={{ fontSize: 10, letterSpacing: 1.4, color: '#555555' }}>
          {activeYear} · {activeCategory === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
        </div>
      )}
    </button>

    {/* ── Peek: back link ── */}
    {sheetState === 'peek' && (
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'center' }}>
        <a
          href="../../index.html"
          style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          ← Alle Visualisierungen
        </a>
      </div>
    )}

    {/* ── Controls + Full content ── */}
    {(sheetState === 'controls' || sheetState === 'full') && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 12px 16px', flex: 1, minHeight: 0 }}>

        {/* District focus — shown at top when a node is selected */}
        {focusRecord && activeNodeName && (
          <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, color: '#000000', lineHeight: 1.4 }}>{districtLabel(focusRecord.raumbezug)}</div>
                <div style={{ fontSize: 10, color: '#000000', letterSpacing: 1.4, marginTop: 3 }}>RANG {focusRank ?? '—'} · {activeYear}</div>
              </div>
              <button
                onClick={onClearSelection}
                style={{ border: '1px solid #000000', background: 'transparent', color: '#000000', fontSize: 10, letterSpacing: 1, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', flexShrink: 0 }}
              >
                LÖSEN
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
              <MetricPill label="Aktuell" value={formatValue(focusRecord.indikatorwert)} />
              <MetricPill label="Vorjahr" value={delta === null ? '—' : formatValue(delta)} />
              <MetricPill label="Langfr." value={trendAverage === null ? '—' : formatValue(trendAverage)} />
            </div>
          </div>
        )}

        {/* Year slider */}
        <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="range"
            min={years[0]}
            max={years[years.length - 1]}
            value={activeYear}
            step={1}
            aria-label="Jahr auswählen"
            onChange={e => onYearChange(Number(e.target.value))}
            style={{ width: '100%' }}
            className="viz-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[0]}</span>
            <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[years.length - 1]}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
                aria-label={cat === 'deutsch' ? 'Deutsch' : 'Nichtdeutsch'}
                style={{
                  flex: 1,
                  background: activeCategory === cat ? '#000000' : 'transparent',
                  border: '1px solid #000000',
                  color: activeCategory === cat ? '#ffffff' : '#000000',
                  fontSize: 9,
                  letterSpacing: 1,
                  padding: '9px 10px',
                  cursor: 'pointer',
                  borderRadius: 999,
                  fontFamily: 'var(--font-serif)',
                  transition: 'all 0.2s',
                }}
              >
                {cat === 'deutsch' ? 'DEUTSCH' : 'NICHT-DEUTSCH'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <KpiCard label="Top Plus" value={strongestInflow ? formatValue(strongestInflow.indikatorwert) : '—'} accent="var(--accent-green)" detail={strongestInflow ? districtLabel(strongestInflow.raumbezug) : '—'} note="Saldo je 1.000 Ew." />
          <KpiCard label="Top Minus" value={strongestOutflow ? formatValue(strongestOutflow.indikatorwert) : '—'} accent="var(--accent-orange)" detail={strongestOutflow ? districtLabel(strongestOutflow.raumbezug) : '—'} note="Saldo je 1.000 Ew." />
          <KpiCard label="Im Plus" value={`${positives}/${records.length}`} accent="var(--text-contrast)" detail={`${negatives} im Minus`} note="Bezirke" />
          <KpiCard label="Schnitt" value={formatValue(average)} accent="var(--accent-blue)" detail="Saldo je 1.000 Ew." note="Normiert" />
        </div>
      </div>
    )}

    {/* ── Full-only content ── */}
    {sheetState === 'full' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 12px 20px' }}>
        {focusRecord && (
          <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: '#000000', marginBottom: 6 }}>TREND · {districtLabel(focusRecord.raumbezug)}</div>
            <TrendSparkline values={focusTrend.map(p => p.indikatorwert)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#000000', letterSpacing: 1.2 }}>
              <span>{focusTrend[0]?.jahr ?? activeYear}</span>
              <span>{focusTrend[focusTrend.length - 1]?.jahr ?? activeYear}</span>
            </div>
          </div>
        )}

        <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, letterSpacing: 1.2, color: '#000000', marginBottom: 8 }}>KONTRASTE</div>
          {contrastPairs.map(pair => (
            <div key={`${pair.positive.raumbezug}-${pair.negative.raumbezug}`} style={{ display: 'grid', gap: 3, padding: '6px 0', borderBottom: '1px solid var(--border-quiet)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--accent-green)', fontSize: 12 }}>{districtLabel(pair.positive.raumbezug)}</span>
                <span style={{ color: 'var(--accent-orange)', fontSize: 12, textAlign: 'right' }}>{districtLabel(pair.negative.raumbezug)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11 }}>
                <span style={{ color: 'var(--accent-green)' }}>{formatValue(pair.positive.indikatorwert)}</span>
                <span style={{ color: 'var(--accent-orange)' }}>{formatValue(pair.negative.indikatorwert)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </aside>
)
```

Note: The closing brace of `Sidebar` function comes after this mobile return. Make sure the desktop return is inside the function body, followed immediately by the mobile return as the final return. The structure should be:

```ts
export function Sidebar(...) {
  // computed values...
  const SHEET_CYCLE = ...
  function cycleSheet() { ... }
  const snapHeight = ...

  if (!isCompact) {
    return ( /* desktop aside */ )
  }

  return ( /* mobile aside */ )
}
```

- [ ] **Step 4: Run pnpm build to check TypeScript**

```bash
pnpm build
```
Expected: clean build. Fix any TypeScript errors before continuing.

- [ ] **Step 5: Verify in browser at ≤768px**

```bash
pnpm dev
```

At 767px wide:
- Initial state: sheet shows only handle + year label + back link (Peek)
- Tap handle once → sheet expands to Controls (slider + category + KPIs visible)
- Tap handle again → Full state (sparkline + contrasts visible)
- Tap handle again → back to Peek

At 769px wide: desktop sidebar still works correctly.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: refactor Sidebar into 3-state mobile bottom sheet"
```

---

### Task 4: Add isCompact to RadialChart and suppress Tooltip on mobile

**Files:**
- Modify: `src/components/RadialChart.tsx`

- [ ] **Step 1: Add isCompact to Props interface**

In `src/components/RadialChart.tsx`, find the `interface Props` block (around line 14). Add:
```ts
isCompact: boolean
```

Update the destructured parameters in `RadialChart` to include `isCompact`.

- [ ] **Step 2: Pass isCompact to NodeRing**

Find `<NodeRing` in the JSX (around line 122). Add the prop:
```tsx
<NodeRing
  nodes={nodes}
  rScale={rScale}
  phase={phase}
  hoveredNode={hoveredNode}
  pinnedNode={pinnedNode}
  pulseNode={pulseNode}
  onHover={onHoverChange}
  onPin={handlePin}
  isCompact={isCompact}
/>
```

- [ ] **Step 3: Suppress Tooltip on mobile**

Find the `{activeNodeData && (` block (around line 140). Wrap with `!isCompact`:
```tsx
{!isCompact && activeNodeData && (
  <Tooltip
    data={activeNodeData}
    containerWidth={dims.width}
    containerHeight={dims.height}
    rightPad={sidebarWidth}
  />
)}
```

- [ ] **Step 4: Update the call site in App.tsx**

In `src/App.tsx`, add `isCompact={isCompact}` to the `<RadialChart>` JSX:
```tsx
<RadialChart
  records={filtered}
  globalMax={globalMax}
  jahr={resolvedYear}
  phase={phase}
  hoveredNode={hoveredNode}
  pinnedNode={pinnedNode}
  sidebarWidth={isCompact ? 0 : 296}
  isCompact={isCompact}
  onHoverChange={setHoveredNode}
  onPinChange={handlePinChange}
  reducedMotion={reducedMotion}
/>
```

- [ ] **Step 5: Build and verify**

```bash
pnpm build && pnpm dev
```

At ≤768px: tap a node → tooltip should NOT appear. Sheet should expand to Controls and show district detail at top.
At ≥769px: hover/click node → tooltip appears as before.

- [ ] **Step 6: Commit**

```bash
git add src/components/RadialChart.tsx src/App.tsx
git commit -m "feat: suppress Tooltip on mobile, add isCompact to RadialChart"
```

---

### Task 5: Widen node tap target in NodeRing

**Files:**
- Modify: `src/components/NodeRing.tsx`

- [ ] **Step 1: Add isCompact to Props interface**

In `src/components/NodeRing.tsx`, find the `interface Props` block (line 5). Add:
```ts
isCompact: boolean
```

Update the destructured parameters in `NodeRing` to include `isCompact`.

- [ ] **Step 2: Add invisible tap ring as first child inside each node's `<g>`**

Inside the `nodes.map(...)` return, find the `<g key={d.raumbezug} ...>` opening tag (around line 52). Add a transparent larger circle as the **first child** of the `<g>`, before the pulse ring:

```tsx
{/* Invisible tap target — wider hit area on mobile */}
{isCompact && (
  <circle
    r={r + 8}
    fill="transparent"
    style={{ pointerEvents: 'all' }}
  />
)}
```

Place this immediately after the opening `<g ...>` tag, before `{/* Expanding pulse ring */}`.

- [ ] **Step 3: Build and verify**

```bash
pnpm build && pnpm dev
```

On mobile viewport (≤768px) or using browser touch emulation: tap near (but not exactly on) a small node — it should still register the tap.

- [ ] **Step 4: Commit**

```bash
git add src/components/NodeRing.tsx
git commit -m "feat: add wider invisible tap target on nodes for mobile"
```

---

### Task 6: Final check and update task docs

- [ ] **Step 1: Full build**

```bash
pnpm build
```
Expected: no TypeScript errors, no Vite warnings about large chunks.

- [ ] **Step 2: Manual end-to-end verification**

At ≤768px:
1. Page loads with chart filling ~88vh and Peek sheet at bottom ✓
2. Peek shows year + category label + back link ✓
3. Tap handle → Controls state (38vh): slider, category toggle, KPI grid visible ✓
4. Slider is draggable with a 20px thumb ✓
5. Category buttons have comfortable tap area ✓
6. Tap handle again → Full state: sparkline + contrasts visible ✓
7. Tap handle again → back to Peek ✓
8. Tap any district node → sheet snaps to Controls, district detail appears at top ✓
9. No floating tooltip appears ✓
10. Tap LÖSEN → pin clears, sheet snaps to Peek ✓
11. Tap SVG background → same as LÖSEN ✓

At ≥769px:
12. Sidebar is on the right, 272px wide ✓
13. Hover node → tooltip appears ✓
14. Click node → tooltip stays, sidebar shows district detail ✓
15. District labels visible on nodes ✓

- [ ] **Step 3: Update tasks/todo.md**

Mark mobile optimization as completed in `tasks/todo.md`.

- [ ] **Step 4: Final commit**

```bash
git add tasks/todo.md
git commit -m "chore: mark mobile optimization complete"
```
