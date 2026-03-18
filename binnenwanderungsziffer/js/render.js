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
