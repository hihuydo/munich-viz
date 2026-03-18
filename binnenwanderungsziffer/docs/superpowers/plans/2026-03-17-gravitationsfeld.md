# Gravitationsfeld — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Interaktive D3.js-Visualisierung der Binnenwanderungsziffer aller 25 Münchner Stadtbezirke als leuchtendes Kreisdiagramm mit Bézier-Verbindungskurven, Intro-Animation und vollständiger Interaktivität.

**Architecture:** Vanilla JS (ES Modules via `<script type="module">`), D3 v7 per CDN. Sieben fokussierte JS-Module (data, scales, render, animate, interaction, tooltip, main). Kein Build-Step, direkt servierfähig via `python3 -m http.server`.

**Tech Stack:** D3.js v7 (CDN), Vanilla JS ES Modules, SVG, CSS Custom Properties

---

## Dateistruktur

```
index.html              — HTML-Wrapper, Controls-Markup, Script-Tags
css/
  style.css             — Layout, Typografie, Controls, Tooltip-Overlay
js/
  data.js               — JSON laden, parsen, filtern, globalMax berechnen
  scales.js             — d3.scaleSqrt (Radius), colorScale, angleScale
  render.js             — SVG aufbauen: Hintergrund, Knoten, Kurven, Zentrums-Label
  animate.js            — Intro-Sequenz (setTimeout + D3 Transitions)
  interaction.js        — Hover/Klick-Logik, Highlight-Zustand
  tooltip.js            — Tooltip-Daten rendern und positionieren
  main.js               — Init, Event-Listener für Slider/Toggle, Re-render
data/
  binnenwanderung.json  — Symlink oder Kopie der Rohdatei
```

---

## Chunk 1: Scaffold + Datenschicht

### Task 1: Projektstruktur anlegen und D3 einbinden

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`

- [ ] **Step 1: Verzeichnisse anlegen**

```bash
mkdir -p css js data
```

- [ ] **Step 2: Rohdaten verlinken**

```bash
ln -s "../13660905-e6ed-404b-99c2-894712373d28.json" data/binnenwanderung.json
```

Prüfen: `ls -la data/` — Symlink muss sichtbar sein.

- [ ] **Step 3: `index.html` erstellen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Binnenwanderung München</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <header id="header">
      <div id="title-block">
        <div class="eyebrow">BINNENWANDERUNG</div>
        <div class="location">MÜNCHEN · STADTBEZIRKE</div>
      </div>
      <div id="controls">
        <div id="category-toggle">
          <button class="toggle-btn active" data-category="deutsch">DEUTSCH</button>
          <!-- data-category muss "nichtdeutsch" sein — so heißt das Feld im JSON -->
          <button class="toggle-btn" data-category="nichtdeutsch">AUSLÄNDISCH</button>
        </div>
      </div>
    </header>

    <div id="viz-container">
      <svg id="viz"></svg>
      <div id="tooltip" class="hidden"></div>
    </div>

    <footer id="footer">
      <div id="slider-block">
        <span class="slider-label" id="year-label">2024</span>
        <!-- min/max werden dynamisch in main.js aus den Daten gesetzt -->
        <input type="range" id="year-slider" min="2000" max="2024" value="2024" step="1">
      </div>
      <div id="kpi-row">
        <div class="kpi">
          <span class="kpi-value" id="kpi-max-val">—</span>
          <span class="kpi-label">MAX ZUZUG</span>
        </div>
        <div class="kpi">
          <span class="kpi-value kpi-orange" id="kpi-min-val">—</span>
          <span class="kpi-label">MAX WEGZUG</span>
        </div>
      </div>
    </footer>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: `css/style.css` Grundgerüst erstellen**

```css
:root {
  --bg: #080e1a;
  --bg-structure: #0e1e30;
  --green-strong: #4ade80;
  --green-mid: #86efac;
  --green-dim: #166534;
  --orange-strong: #fb923c;
  --orange-mid: #fdba74;
  --orange-dim: #7c2d12;
  --text-primary: #8aa0b8;
  --text-dim: #2a4060;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%; height: 100%;
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Georgia', serif;
  overflow: hidden;
}

#app {
  display: grid;
  grid-template-rows: 48px 1fr 72px;
  height: 100vh;
  width: 100vw;
}

#header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--bg-structure);
}

.eyebrow {
  font-size: 10px;
  letter-spacing: 4px;
  color: var(--text-primary);
}
.location {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin-top: 2px;
}

#viz-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

#viz { width: 100%; height: 100%; }

#footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-top: 1px solid var(--bg-structure);
  gap: 24px;
}

#slider-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.slider-label {
  font-size: 13px;
  color: var(--green-strong);
  font-family: Georgia, serif;
  min-width: 36px;
}

input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  height: 2px;
  background: var(--bg-structure);
  border-radius: 1px;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--green-strong);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
}

#category-toggle { display: flex; gap: 4px; }
.toggle-btn {
  background: var(--bg-structure);
  border: 1px solid var(--bg-structure);
  color: var(--text-dim);
  font-size: 8px;
  letter-spacing: 2px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 2px;
  font-family: Georgia, serif;
  transition: all 0.2s;
}
.toggle-btn.active {
  background: var(--green-strong);
  border-color: var(--green-strong);
  color: var(--bg);
}

#kpi-row { display: flex; gap: 24px; }
.kpi { text-align: right; }
.kpi-value { font-size: 18px; color: var(--green-strong); font-family: Georgia, serif; }
.kpi-value.kpi-orange { color: var(--orange-strong); }
.kpi-label { display: block; font-size: 7px; letter-spacing: 2px; color: var(--text-dim); margin-top: 2px; }

/* Tooltip */
#tooltip {
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(10, 21, 37, 0.95);
  border: 1px solid var(--bg-structure);
  border-radius: 3px;
  padding: 12px 16px;
  min-width: 160px;
  pointer-events: none;
  transition: opacity 0.15s;
}
#tooltip.hidden { opacity: 0; }
.tt-name { font-size: 13px; color: var(--text-primary); margin-bottom: 6px; font-family: Georgia, serif; }
.tt-value { font-size: 20px; font-family: Georgia, serif; margin-bottom: 8px; }
.tt-value.positive { color: var(--green-strong); }
.tt-value.negative { color: var(--orange-strong); }
.tt-row { display: flex; justify-content: space-between; gap: 12px; font-size: 9px; color: var(--text-dim); letter-spacing: 1px; margin-top: 3px; }
.tt-row span:last-child { color: var(--text-primary); }
```

- [ ] **Step 5: `js/main.js` Stub erstellen (noch keine Imports)**

```js
// main.js — Orchestrierung (Stub, Imports folgen in Task 2)
console.log('Gravitationsfeld — bereit');
```

- [ ] **Step 6: Lokalen Server starten und Seite öffnen**

```bash
python3 -m http.server 8080
```

Öffne `http://localhost:8080`. Erwartung: schwarze Seite mit Header/Footer-Struktur, Konsole zeigt `Gravitationsfeld — bereit`, keine JS-Fehler.

- [ ] **Step 7: Commit**

```bash
git add index.html css/style.css js/main.js
git commit -m "feat: project scaffold with HTML/CSS structure"
```

---

### Task 2: Datenschicht — `data.js`

**Files:**
- Create: `js/data.js`

- [ ] **Step 1: `data.js` schreiben**

Feldindizes im JSON-Array:
- `r[0]` = _id, `r[2]` = Auspragung, `r[3]` = Jahr, `r[4]` = Raumbezug
- `r[5]` = Indikatorwert, `r[6]` = Zugezogene, `r[7]` = Weggezogene, `r[8]` = Bevölkerung

```js
// data.js — JSON laden, parsen, filtern

/**
 * Lädt und parst die Binnenwanderungsdaten.
 * @returns {Promise<{records: object[], globalMax: number, years: number[]}>}
 *
 * globalMax: max |Indikatorwert| über ALLE Jahre und ALLE Auspragungen kombiniert.
 * Wird einmalig berechnet und bleibt fixiert — Knotengrößen bleiben beim
 * Jahres-/Kategorienwechsel auf derselben Skala (kein visuelles "Springen").
 * Erwarteter Bereich: ~90 (Ausreißer nichtdeutsch), typisch 20-30 (deutsch).
 */
export async function loadData(url) {
  const raw = await d3.json(url);

  // JSON hat records als Arrays; in Objekte umwandeln
  const records = raw.records
    .map(r => ({
      id:            r[0],
      auspragung:    r[2],   // "deutsch" | "nichtdeutsch" | "insgesamt"
      jahr:          +r[3],  // numerisch
      raumbezug:     r[4],   // z.B. "03 Maxvorstadt"
      indikatorwert: +r[5],  // normierte Rate pro 1.000 EW
      zugezogene:    r[6] === 'NA' ? null : +r[6],
      weggezogene:   r[7] === 'NA' ? null : +r[7],
      bevoelkerung:  r[8] === 'NA' ? null : +r[8],
    }))
    // Gesamtstädtischen Wert ausschließen (Saldo immer 0)
    .filter(r => r.raumbezug !== 'Stadt München');

  // globalMax über alle Jahre UND alle Auspragungen — bleibt fixiert
  const globalMax = d3.max(records, r => Math.abs(r.indikatorwert));

  // Verfügbare Jahre (aufsteigend sortiert, dynamisch aus Daten)
  const years = [...new Set(records.map(r => r.jahr))].sort((a, b) => a - b);

  return { records, globalMax, years };
}

/**
 * Filtert den Datensatz nach Jahr und Kategorie.
 * @returns {object[]} — 25 Bezirksdatensätze
 */
export function filterData(records, jahr, auspragung) {
  return records.filter(r => r.jahr === jahr && r.auspragung === auspragung);
}

/**
 * Gibt Top-5 Zuzug (höchste positive Werte) und Top-5 Wegzug (niedrigste negative Werte) zurück.
 *
 * Kein Overlap möglich: Zuzug-Liste enthält nur Einträge mit indikatorwert > 0,
 * Wegzug-Liste nur Einträge mit indikatorwert < 0. Ein Bezirk kann strukturell
 * nicht gleichzeitig Netto-Zuzug und Netto-Wegzug haben.
 *
 * @returns {{ top5zuzug: object[], top5wegzug: object[] }}
 */
export function getTop5(filteredRecords) {
  const sorted = [...filteredRecords].sort((a, b) => b.indikatorwert - a.indikatorwert);
  const top5zuzug  = sorted.filter(r => r.indikatorwert > 0).slice(0, 5);
  const top5wegzug = sorted.filter(r => r.indikatorwert < 0).slice(-5);

  // Overlap-Guard: sollte nie eintreten, aber explizit prüfen
  const zuzugNames  = new Set(top5zuzug.map(r => r.raumbezug));
  const wegzugNames = new Set(top5wegzug.map(r => r.raumbezug));
  const overlap = [...zuzugNames].filter(n => wegzugNames.has(n));
  console.assert(overlap.length === 0, 'Kein Overlap zwischen Top5 Zuzug und Wegzug erwartet', overlap);

  return { top5zuzug, top5wegzug };
}
```

- [ ] **Step 2: `main.js` aktualisieren und Parsing prüfen**

```js
// main.js — Imports jetzt hinzufügen
import { loadData, filterData, getTop5 } from './data.js';

async function init() {
  const { records, globalMax, years } = await loadData('data/binnenwanderung.json');

  console.assert(records.length > 0, 'records nicht leer');
  console.assert(!records.find(r => r.raumbezug === 'Stadt München'), 'Gesamtstadt gefiltert');
  console.assert(globalMax > 0, 'globalMax > 0');
  // globalMax ist über ALLE Jahre und Auspragungen, erwartet deutlich > 28.5
  console.log('globalMax (alle Jahre, alle Kategorien):', globalMax);
  console.log('Jahresbereich:', years[0], '–', years[years.length - 1]);

  // Nur 'deutsch' hat exakt 25 Bezirke pro Jahr (andere Auspragungen ggf. abweichend)
  const filtered = filterData(records, years[years.length - 1], 'deutsch');
  console.assert(filtered.length === 25, `25 Bezirke erwartet, erhalten: ${filtered.length}`);

  const { top5zuzug, top5wegzug } = getTop5(filtered);
  console.assert(top5zuzug.length === 5, '5 Zuzug-Bezirke');
  console.assert(top5wegzug.length === 5, '5 Wegzug-Bezirke');
  console.assert(top5zuzug.every(r => r.indikatorwert > 0), 'Alle Zuzug positiv');
  console.assert(top5wegzug.every(r => r.indikatorwert < 0), 'Alle Wegzug negativ');

  console.log('✓ Datenschicht OK', { globalMax, years: `${years[0]}–${years[years.length-1]}`, top5zuzug, top5wegzug });
}

init();
```

- [ ] **Step 3: Browser-Konsole prüfen**

Erwartung: `✓ Datenschicht OK`. `globalMax` ist der höchste absolute Indikatorwert über alle Jahre und alle Auspragungen (erwartet >> 28.5). Jahresbereich vermutlich 2000–2024. Keine Assertion-Fehler.

- [ ] **Step 4: Commit**

```bash
git add js/data.js js/main.js
git commit -m "feat: data layer — load, parse, filter, top5"
```

---

## Chunk 2: Visualisierungskern

### Task 3: Scales — `scales.js`

**Files:**
- Create: `js/scales.js`

- [ ] **Step 1: `scales.js` schreiben**

```js
// scales.js — D3 Scales und Winkelberechnung

/**
 * Radius-Scale: |indikatorwert| → Knotenradius in px
 * Domain fixiert über alle Jahre/Kategorien (globalMax).
 */
export function makeRadiusScale(globalMax) {
  return d3.scaleSqrt()
    .domain([0, globalMax])
    .range([3, 14]);
}

/**
 * Kurven-Opazitäts-Scale: |wertA| + |wertB| → opacity
 */
export function makeCurveOpacityScale(globalMax) {
  return d3.scaleLinear()
    .domain([0, globalMax * 2])
    .range([0.12, 0.55]);
}

/**
 * Kurvenbreiten-Scale: |wertA| + |wertB| → stroke-width in px
 */
export function makeCurveWidthScale(globalMax) {
  return d3.scaleLinear()
    .domain([0, globalMax * 2])
    .range([0.6, 2.2]);
}

/**
 * Knotenfarbe aus Indikatorwert.
 * >0  → Grün-Palette, <0 → Orange-Palette, =0 → neutral
 */
export function nodeColor(value) {
  if (value > 10)  return '#4ade80';  // starker Zuzug — leuchtendes Grün
  if (value > 0)   return '#86efac';  // schwacher Zuzug — helles Grün
  if (value === 0) return '#3a5070';  // neutral
  if (value > -10) return '#fdba74';  // schwacher Wegzug — helles Orange
  return '#fb923c';                   // starker Wegzug — leuchtendes Orange
}

/**
 * Gibt die (x, y) Position eines Knotens auf dem Ring zurück.
 * @param {number} index  — 0..24
 * @param {number} total  — 25
 * @param {number} cx     — SVG-Mittelpunkt x
 * @param {number} cy     — SVG-Mittelpunkt y
 * @param {number} r      — Ringradius
 */
export function nodePosition(index, total, cx, cy, r) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
    angle,
  };
}
```

- [ ] **Step 2: Scales in main.js testen**

```js
import { makeRadiusScale, nodeColor, nodePosition } from './scales.js';

// Nach loadData():
const rScale = makeRadiusScale(globalMax);
console.assert(rScale(0) === 3, 'Radius 0→3');
console.assert(rScale(globalMax) === 14, `Radius globalMax→14`);
console.assert(nodeColor(28.5) === '#4ade80', 'Starker Zuzug grün');
console.assert(nodeColor(-11.4) === '#fb923c', 'Starker Wegzug orange');
const pos = nodePosition(0, 25, 200, 200, 150);
console.assert(Math.abs(pos.x - 200) < 1, 'Index 0 → oben, x≈cx');
console.assert(pos.y < 200, 'Index 0 → oberhalb Mittelpunkt');
console.log('✓ Scales OK');
```

- [ ] **Step 3: Browser-Konsole prüfen**

Erwartung: `✓ Scales OK`, keine Assertions fehlgeschlagen.

- [ ] **Step 4: Commit**

```bash
git add js/scales.js js/main.js
git commit -m "feat: d3 scales — radius, color, curve opacity/width, position"
```

---

### Task 4: SVG-Rendering — `render.js`

**Files:**
- Create: `js/render.js`

- [ ] **Step 1: `render.js` schreiben**

```js
// render.js — SVG aufbauen und aktualisieren

import { makeRadiusScale, makeCurveOpacityScale, makeCurveWidthScale,
         nodeColor, nodePosition } from './scales.js';
import { getTop5 } from './data.js';

const TOTAL = 25;
const RING_RATIO = 0.78; // Ring bei 78% des halben SVG

/**
 * Berechnet Dimensionen aus dem SVG-Container.
 */
export function getDimensions(svgEl) {
  const { width, height } = svgEl.getBoundingClientRect();
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const ringR = (size / 2) * RING_RATIO;
  return { width, height, cx, cy, ringR, size };
}

/**
 * Initialisiert die SVG-Struktur (einmalig).
 * Erzeugt: Hintergrundringe, Kurven-Gruppe, Knoten-Gruppe, Zentrumslabel.
 */
export function initSVG(svgEl, dims) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // SVG-Filter: Glow
  const defs = svg.append('defs');
  addGlowFilter(defs, 'glow-soft', 3);
  addGlowFilter(defs, 'glow-strong', 6);

  // Hintergrundstruktur
  const bg = svg.append('g').attr('class', 'bg');
  [0.35, 0.55, 0.78].forEach(ratio => {
    bg.append('circle')
      .attr('cx', dims.cx).attr('cy', dims.cy)
      .attr('r', (dims.size / 2) * ratio)
      .attr('fill', 'none')
      .attr('stroke', '#0e1e30')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', ratio < 0.78 ? '1,4' : null);
  });

  // Kurven-Gruppe (unter den Knoten)
  svg.append('g').attr('class', 'curves');

  // Knoten-Gruppe
  svg.append('g').attr('class', 'nodes');

  // Zentrumslabel
  const center = svg.append('g').attr('class', 'center-label');
  center.append('circle')
    .attr('cx', dims.cx).attr('cy', dims.cy)
    .attr('r', dims.size * 0.065)
    .attr('fill', '#0a1525')
    .attr('stroke', '#1a3050')
    .attr('stroke-width', 0.5);
  center.append('text').attr('class', 'center-year')
    .attr('x', dims.cx).attr('y', dims.cy - 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8aa0b8')
    .attr('font-size', dims.size * 0.035)
    .attr('font-family', 'Georgia, serif');
  center.append('text')
    .attr('x', dims.cx).attr('y', dims.cy + dims.size * 0.025)
    .attr('text-anchor', 'middle')
    .attr('fill', '#2a4060')
    .attr('font-size', dims.size * 0.017)
    .attr('letter-spacing', 2)
    .text('MÜNCHEN');
}

function addGlowFilter(defs, id, stdDev) {
  const filter = defs.append('filter').attr('id', id);
  filter.append('feGaussianBlur')
    .attr('stdDeviation', stdDev).attr('result', 'blur');
  const merge = filter.append('feMerge');
  merge.append('feMergeNode').attr('in', 'blur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');
}

/**
 * Rendert Knoten und Kurven für den aktiven Datensatz.
 * Wird bei Jahres-/Kategoriewechsel mit Transition aufgerufen.
 */
export function renderData(svgEl, filteredRecords, globalMax, dims, Jahr) {
  const svg = d3.select(svgEl);
  const rScale = makeRadiusScale(globalMax);
  const opScale = makeCurveOpacityScale(globalMax);
  const wScale  = makeCurveWidthScale(globalMax);
  const { top5zuzug, top5wegzug } = getTop5(filteredRecords);

  // Bezirke mit Position anreichern (stabile Reihenfolge: alphabetisch nach Raumbezug)
  const sorted = [...filteredRecords].sort((a, b) => a.raumbezug.localeCompare(b.raumbezug));
  const withPos = sorted.map((d, i) => ({
    ...d,
    ...nodePosition(i, TOTAL, dims.cx, dims.cy, dims.ringR),
  }));

  // Lookup: raumbezug → position
  const posMap = Object.fromEntries(withPos.map(d => [d.raumbezug, d]));

  // ── Kurven ──────────────────────────────────────────────────
  const curvePairs = [];
  top5zuzug.forEach(z => {
    top5wegzug.forEach(w => {
      const pZ = posMap[z.raumbezug];
      const pW = posMap[w.raumbezug];
      if (pZ && pW) curvePairs.push({ z, w, pZ, pW });
    });
  });

  const curves = svg.select('.curves')
    .selectAll('path.curve')
    .data(curvePairs, d => `${d.z.raumbezug}—${d.w.raumbezug}`);

  curves.join(
    enter => enter.append('path').attr('class', 'curve')
      .attr('fill', 'none')
      .attr('d', d => bezierPath(d.pZ, d.pW, dims))
      .attr('stroke', 'rgba(255,255,255,0)')
      .call(e => e.transition().duration(600)
        .attr('stroke', d => `rgba(255,255,255,${opScale(Math.abs(d.z.indikatorwert) + Math.abs(d.w.indikatorwert))})`)
        .attr('stroke-width', d => wScale(Math.abs(d.z.indikatorwert) + Math.abs(d.w.indikatorwert)))),
    update => update
      .transition().duration(500).ease(d3.easeCubicInOut)
      .attr('d', d => bezierPath(d.pZ, d.pW, dims))
      .attr('stroke', d => `rgba(255,255,255,${opScale(Math.abs(d.z.indikatorwert) + Math.abs(d.w.indikatorwert))})`)
      .attr('stroke-width', d => wScale(Math.abs(d.z.indikatorwert) + Math.abs(d.w.indikatorwert))),
    exit => exit.transition().duration(300).attr('stroke', 'rgba(255,255,255,0)').remove()
  );

  // ── Knoten ──────────────────────────────────────────────────
  const nodes = svg.select('.nodes')
    .selectAll('g.node')
    .data(withPos, d => d.raumbezug);

  const nodeEnter = nodes.enter().append('g').attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer');

  // Glow-Halo (nur für Top-5)
  nodeEnter.append('circle').attr('class', 'halo')
    .attr('r', 0).attr('fill', 'none');

  // Hauptknoten
  nodeEnter.append('circle').attr('class', 'dot')
    .attr('r', 0);

  // Merge + Update
  const nodeMerge = nodeEnter.merge(nodes);

  nodeMerge.transition().duration(500).ease(d3.easeCubicInOut)
    .attr('transform', d => `translate(${d.x},${d.y})`);

  nodeMerge.select('.dot')
    .attr('data-r', d => rScale(Math.abs(d.indikatorwert))) // für resetHighlight in interaction.js
    .transition().duration(500).ease(d3.easeCubicInOut)
    .attr('r', d => rScale(Math.abs(d.indikatorwert)))
    .attr('fill', d => nodeColor(d.indikatorwert))
    .attr('opacity', 0.9);

  // Glow für Top-5
  const top5names = new Set([...top5zuzug, ...top5wegzug].map(d => d.raumbezug));
  nodeMerge.select('.halo')
    .attr('r', d => top5names.has(d.raumbezug) ? rScale(Math.abs(d.indikatorwert)) * 2.2 : 0)
    .attr('fill', d => top5names.has(d.raumbezug) ? nodeColor(d.indikatorwert) : 'none')
    .attr('opacity', 0.12)
    .attr('filter', 'url(#glow-soft)');

  // Zentrumslabel
  svg.select('.center-year').text(Jahr);

  nodes.exit().remove();

  return withPos; // für interaction.js
}

function bezierPath(pA, pB, dims) {
  return `M${pA.x},${pA.y} Q${dims.cx},${dims.cy} ${pB.x},${pB.y}`;
}
```

- [ ] **Step 2: `main.js` aktualisieren — erster Render-Test**

```js
import { loadData, filterData } from './data.js';
import { initSVG, renderData, getDimensions } from './render.js';

async function init() {
  const { records, globalMax, years } = await loadData('data/binnenwanderung.json');
  const svgEl = document.getElementById('viz');
  const dims = getDimensions(svgEl);
  initSVG(svgEl, dims);

  const defaultYear = years[years.length - 1];
  const filtered = filterData(records, defaultYear, 'deutsch');
  renderData(svgEl, filtered, globalMax, dims, defaultYear);

  console.log('✓ Erster Render OK');
}

init();
```

- [ ] **Step 3: Browser-Sichtprüfung**

Erwartung: 25 leuchtende Knoten auf einem Kreisring, Bézier-Kurven zwischen Top-5-Bezirken, Zentrumslabel `2024`. Grüne Knoten = Zuzug, orange = Wegzug.

- [ ] **Step 4: Commit**

```bash
git add js/render.js js/main.js
git commit -m "feat: SVG render — nodes, curves, center label"
```

---

## Chunk 3: Animation + Interaktion

### Task 5: Intro-Animation — `animate.js`

**Files:**
- Create: `js/animate.js`

- [ ] **Step 1: `animate.js` schreiben**

```js
// animate.js — Intro-Sequenz

/**
 * Spielt die Intro-Sequenz ab (~3.5s).
 * Voraussetzung: SVG ist bereits via initSVG + renderData bestückt,
 * aber alle Elemente sind opacity:0 zu Beginn.
 */
export function playIntro(svgEl, withPos) {
  const svg = d3.select(svgEl);

  // 0. Alles ausblenden
  svg.selectAll('.bg circle, .curves path, .nodes .node, .center-label')
    .attr('opacity', 0);

  // Phase 1: Hintergrundstruktur (0→500ms)
  svg.selectAll('.bg circle')
    .transition().delay((_, i) => i * 80).duration(400)
    .attr('opacity', 1);

  // Phase 2: Knoten staggered (500→1500ms, 40ms je Knoten)
  svg.selectAll('.nodes .node')
    .transition().delay((_, i) => 500 + i * 40).duration(350)
    .attr('opacity', 1);

  // Zentrumslabel
  svg.select('.center-label')
    .transition().delay(600).duration(500)
    .attr('opacity', 1);

  // Phase 3: Kurven (1500→2500ms)
  svg.selectAll('.curves path')
    .each(function() {
      const len = this.getTotalLength ? this.getTotalLength() : 300;
      d3.select(this)
        .attr('stroke-dasharray', len)
        .attr('stroke-dashoffset', len)
        .attr('opacity', 1)
        .transition().delay(1500).duration(800).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);
    });

  // Phase 4: Highlight-Puls — Knoten mit höchstem |indikatorwert|
  const topNode = withPos.reduce((a, b) =>
    Math.abs(b.indikatorwert) > Math.abs(a.indikatorwert) ? b : a);

  setTimeout(() => {
    svg.selectAll('.nodes .node')
      .filter(d => d.raumbezug === topNode.raumbezug)
      .select('.halo')
      .transition().duration(400).attr('opacity', 0.35)
      .transition().duration(400).attr('opacity', 0.12)
      .transition().duration(400).attr('opacity', 0.3)
      .transition().duration(400).attr('opacity', 0.12);
  }, 2500);

  // Phase 5: Controls einblenden (3000→3500ms)
  // Kein inline-Set nötig — header/footer starten bereits bei opacity:0 (via CSS)
  setTimeout(() => {
    d3.select('#header').transition().duration(500).style('opacity', '1');
    d3.select('#footer').transition().duration(500).style('opacity', '1');
  }, 3000);
}
```

- [ ] **Step 2: `index.html` — Controls initial ausblenden**

In `<style>` im `<head>` ergänzen:
```html
<style>
  #header, #footer { opacity: 0; }
</style>
```

- [ ] **Step 3: `main.js` — Intro integrieren**

```js
import { playIntro } from './animate.js';

// Nach renderData():
const withPos = renderData(svgEl, filtered, globalMax, dims, defaultYear);
playIntro(svgEl, withPos);
```

- [ ] **Step 4: Browser-Sichtprüfung**

Erwartung: Ring erscheint → Knoten materialisieren → Kurven zeichnen sich → Top-Knoten pulsiert → Header/Footer eingeblendet. Gesamtdauer ~3.5s.

- [ ] **Step 5: Commit**

```bash
git add js/animate.js js/main.js index.html
git commit -m "feat: intro animation sequence"
```

---

### Task 6: Tooltip — `tooltip.js`

**Files:**
- Create: `js/tooltip.js`

- [ ] **Step 1: `tooltip.js` schreiben**

```js
// tooltip.js — Tooltip anzeigen/ausblenden

const el = document.getElementById('tooltip');

/**
 * Zeigt den Tooltip mit Bezirksdaten.
 */
export function showTooltip(d) {
  const sign = d.indikatorwert > 0 ? '+' : '';
  const cls  = d.indikatorwert >= 0 ? 'positive' : 'negative';
  el.innerHTML = `
    <div class="tt-name">${d.raumbezug}</div>
    <div class="tt-value ${cls}">${sign}${d.indikatorwert.toFixed(1)}</div>
    <div class="tt-row"><span>ZUGEZOGENE</span><span>${d.zugezogene?.toLocaleString('de-DE') ?? '—'}</span></div>
    <div class="tt-row"><span>WEGGEZOGENE</span><span>${d.weggezogene?.toLocaleString('de-DE') ?? '—'}</span></div>
    <div class="tt-row"><span>PRO 1.000 EW</span><span>normiert</span></div>
  `;
  el.classList.remove('hidden');
}

export function hideTooltip() {
  el.classList.add('hidden');
}
```

- [ ] **Step 2: Browser-Test (manuell via Konsole)**

```js
// In Browser-Konsole einfügen:
import('/js/tooltip.js').then(m => m.showTooltip({
  raumbezug: '22 Aubing - Lochhausen - Langwied',
  indikatorwert: 28.5,
  zugezogene: 1892,
  weggezogene: 771
}));
```

Erwartung: Tooltip erscheint oben rechts mit korrekten Daten.

- [ ] **Step 3: Commit**

```bash
git add js/tooltip.js
git commit -m "feat: tooltip component"
```

---

### Task 7: Interaktion — `interaction.js`

**Files:**
- Create: `js/interaction.js`

- [ ] **Step 1: `interaction.js` schreiben**

```js
// interaction.js — Hover, Klick, Highlight

import { showTooltip, hideTooltip } from './tooltip.js';

let pinnedNode = null; // geklickter Knoten (fixierte Auswahl)

/**
 * Bindet Hover- und Klick-Events an alle Knoten.
 * @param {d3.Selection} svgSel — d3.select(svgEl)
 */
export function bindInteraction(svgSel) {
  svgSel.selectAll('.nodes .node')
    .on('mouseenter', function(event, d) {
      if (pinnedNode && pinnedNode !== d.raumbezug) return;
      highlightNode(svgSel, d.raumbezug);
      showTooltip(d);
    })
    .on('mouseleave', function(event, d) {
      if (pinnedNode) return;
      resetHighlight(svgSel);
      hideTooltip();
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      if (pinnedNode === d.raumbezug) {
        pinnedNode = null;
        resetHighlight(svgSel);
        hideTooltip();
      } else {
        pinnedNode = d.raumbezug;
        highlightNode(svgSel, d.raumbezug);
        showTooltip(d);
      }
    });

  // Klick auf Hintergrund: Auswahl aufheben
  svgSel.on('click', () => {
    pinnedNode = null;
    resetHighlight(svgSel);
    hideTooltip();
  });
}

function highlightNode(svgSel, raumbezug) {
  // Alle Knoten verblassen
  svgSel.selectAll('.nodes .node')
    .transition().duration(150)
    .attr('opacity', d => d.raumbezug === raumbezug ? 1 : 0.15);

  // Alle Kurven verblassen
  svgSel.selectAll('.curves path')
    .transition().duration(150)
    .attr('opacity', d =>
      (d.z.raumbezug === raumbezug || d.w.raumbezug === raumbezug) ? 1 : 0.06);

  // Aktiver Knoten vergrößern
  svgSel.selectAll('.nodes .node')
    .filter(d => d.raumbezug === raumbezug)
    .select('.dot')
    .transition().duration(150)
    .attr('r', function() { return +d3.select(this).attr('r') * 1.25; });
}

function resetHighlight(svgSel) {
  svgSel.selectAll('.nodes .node')
    .transition().duration(200)
    .attr('opacity', 1);
  svgSel.selectAll('.curves path')
    .transition().duration(200)
    .attr('opacity', null); // Zurück zum gesetzten stroke-Opazitätswert
  // Radius aus data-r Attribut lesen — wird von render.js gesetzt (siehe Task 4)
  svgSel.selectAll('.nodes .node .dot')
    .transition().duration(200)
    .attr('r', function() { return +d3.select(this).attr('data-r'); });
}

export function resetPinnedNode() {
  pinnedNode = null;
}
```

- [ ] **Step 2: `main.js` — Interaktion binden**

```js
import { bindInteraction } from './interaction.js';

// Nach playIntro() (mit 3500ms Delay, damit Intro abgeschlossen):
setTimeout(() => {
  bindInteraction(d3.select(svgEl));
}, 3500);
```

- [ ] **Step 4: Browser-Test**

- Hovere über einen Bezirksknoten → er leuchtet auf, andere verblassen, Tooltip erscheint
- Klick fixiert → Hover über anderen Knoten ändert nichts
- Zweiter Klick auf selben Knoten → Auswahl aufgehoben
- Klick auf Hintergrund → Auswahl aufgehoben

- [ ] **Step 5: Commit**

```bash
git add js/interaction.js js/render.js js/main.js
git commit -m "feat: hover/click interaction with highlight and tooltip"
```

---

### Task 8: Controls — Slider + Toggle + KPIs

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: `main.js` vollständig schreiben**

```js
// main.js — Orchestrierung

import { loadData, filterData } from './data.js';
import { initSVG, renderData, getDimensions } from './render.js';
import { playIntro } from './animate.js';
import { bindInteraction, resetPinnedNode } from './interaction.js';

async function init() {
  const { records, globalMax, years } = await loadData('data/binnenwanderung.json');

  const svgEl = document.getElementById('viz');
  let dims = getDimensions(svgEl);

  let activeYear = years[years.length - 1];
  let activeCategory = 'deutsch';

  // Slider initialisieren
  const slider = document.getElementById('year-slider');
  const yearLabel = document.getElementById('year-label');
  slider.min = years[0];
  slider.max = years[years.length - 1];
  slider.value = activeYear;
  yearLabel.textContent = activeYear;

  // Erster Render
  initSVG(svgEl, dims);
  let withPos = renderData(svgEl, filterData(records, activeYear, activeCategory), globalMax, dims, activeYear);
  updateKPIs(filterData(records, activeYear, activeCategory));
  playIntro(svgEl, withPos);

  // Interaktion nach Intro binden
  setTimeout(() => bindInteraction(d3.select(svgEl)), 3500);

  // ── Slider ────────────────────────────────────────────────
  // Debounce: verhindert dass schnelles Ziehen N bindInteraction-Timeouts aufstapelt
  let bindTimer = null;
  slider.addEventListener('input', () => {
    activeYear = +slider.value;
    yearLabel.textContent = activeYear;
    resetPinnedNode();
    const filtered = filterData(records, activeYear, activeCategory);
    withPos = renderData(svgEl, filtered, globalMax, dims, activeYear);
    updateKPIs(filtered);
    clearTimeout(bindTimer);
    bindTimer = setTimeout(() => bindInteraction(d3.select(svgEl)), 650);
  });

  // ── Toggle ────────────────────────────────────────────────
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      resetPinnedNode();
      const filtered = filterData(records, activeYear, activeCategory);
      // Guard: falls Kategorie keine Daten liefert (z.B. Unicode-Mismatch bei Umlauten)
      console.assert(filtered.length > 0,
        `Keine Daten für Kategorie "${activeCategory}" im Jahr ${activeYear}. Umlaut-Encoding prüfen.`);
      withPos = renderData(svgEl, filtered, globalMax, dims, activeYear);
      updateKPIs(filtered);
      clearTimeout(bindTimer);
      bindTimer = setTimeout(() => bindInteraction(d3.select(svgEl)), 650);
    });
  });

  // ── Resize ────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    dims = getDimensions(svgEl);
    initSVG(svgEl, dims);
    withPos = renderData(svgEl, filterData(records, activeYear, activeCategory), globalMax, dims, activeYear);
    bindInteraction(d3.select(svgEl));
  });
}

function updateKPIs(filtered) {
  const sorted = [...filtered].sort((a, b) => b.indikatorwert - a.indikatorwert);
  const max = sorted[0];
  const min = sorted[sorted.length - 1];
  document.getElementById('kpi-max-val').textContent =
    max ? `+${max.indikatorwert.toFixed(1)}` : '—';
  document.getElementById('kpi-min-val').textContent =
    min ? min.indikatorwert.toFixed(1) : '—';
}

init();
```

- [ ] **Step 2: Browser-Test — vollständiger Ablauf**

Checklist:
- [ ] Intro-Animation läuft durch (~3.5s)
- [ ] Slider von 2024 → 2022 → Knoten und Kurven aktualisieren sich mit Tween
- [ ] KPI-Werte (max Zuzug / max Wegzug) aktualisieren sich beim Schieben
- [ ] Toggle DEUTSCH → AUSLÄNDISCH → Daten wechseln
- [ ] Hover: Bezirk leuchtet auf, Tooltip erscheint
- [ ] Klick: Auswahl fixiert; zweiter Klick oder Hintergrund → Reset
- [ ] Fenster verkleinern → SVG passt sich an

- [ ] **Step 3: Finaler Commit**

```bash
git add js/main.js
git commit -m "feat: controls — slider, toggle, kpi, resize"
```

---

## Abschluss

- [ ] **Finales Review:** Alle Browser-Tests aus Task 8 Step 2 bestanden
- [ ] **Dokumentation:** `README.md` mit Startbefehl (`python3 -m http.server 8080`) anlegen
- [ ] **Finaler Commit**

```bash
git add README.md
git commit -m "docs: add README with startup instructions"
```
