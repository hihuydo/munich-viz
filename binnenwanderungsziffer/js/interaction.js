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
      showTooltip(d, d.x, d.y);
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
        showTooltip(d, d.x, d.y);
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
