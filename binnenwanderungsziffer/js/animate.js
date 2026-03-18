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

  // Phase 5: Sidebar einblenden (3000→3500ms)
  setTimeout(() => {
    d3.select('#info-col').transition().duration(500).style('opacity', '1');
  }, 3000);
}
