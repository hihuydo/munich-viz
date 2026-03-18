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
